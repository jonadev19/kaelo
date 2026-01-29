-- Create reviews table
-- Stores user reviews for routes and businesses

CREATE TABLE IF NOT EXISTS public.reviews (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,

    -- Rating and content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,

    -- Detailed ratings (optional)
    detailed_ratings JSONB DEFAULT '{}'::jsonb,

    -- Media
    images JSONB DEFAULT '[]'::jsonb,

    -- Review metadata
    is_verified_visit BOOLEAN NOT NULL DEFAULT false,
    visit_date DATE,

    -- Engagement
    helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
    not_helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (not_helpful_count >= 0),

    -- Status
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_flagged BOOLEAN NOT NULL DEFAULT false,
    flagged_reason TEXT,

    -- Response from business/route owner
    owner_response TEXT,
    owner_response_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT review_target_check CHECK (
        (route_id IS NOT NULL AND business_id IS NULL) OR
        (route_id IS NULL AND business_id IS NOT NULL)
    ),
    CONSTRAINT unique_user_route_review UNIQUE NULLS NOT DISTINCT (user_id, route_id),
    CONSTRAINT unique_user_business_review UNIQUE NULLS NOT DISTINCT (user_id, business_id),
    CONSTRAINT valid_images CHECK (jsonb_typeof(images) = 'array'),
    CONSTRAINT valid_detailed_ratings CHECK (jsonb_typeof(detailed_ratings) = 'object')
);

-- Add table comment
COMMENT ON TABLE public.reviews IS 'User reviews for routes and businesses';

-- Add column comments
COMMENT ON COLUMN public.reviews.rating IS 'Overall rating from 1 to 5 stars';
COMMENT ON COLUMN public.reviews.detailed_ratings IS 'Breakdown of ratings by category';
COMMENT ON COLUMN public.reviews.is_verified_visit IS 'Whether user visit has been verified';
COMMENT ON COLUMN public.reviews.helpful_count IS 'Number of users who found review helpful';
COMMENT ON COLUMN public.reviews.owner_response IS 'Response from business/route owner';

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to update route/business ratings
CREATE OR REPLACE FUNCTION public.update_target_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(3, 2);
    review_count INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Update ratings after deletion
        IF OLD.route_id IS NOT NULL THEN
            SELECT AVG(rating)::NUMERIC(3, 2), COUNT(*)
            INTO avg_rating, review_count
            FROM public.reviews
            WHERE route_id = OLD.route_id AND is_visible = true;

            UPDATE public.routes
            SET rating = COALESCE(avg_rating, 0),
                total_reviews = review_count
            WHERE id = OLD.route_id;
        ELSIF OLD.business_id IS NOT NULL THEN
            SELECT AVG(rating)::NUMERIC(3, 2), COUNT(*)
            INTO avg_rating, review_count
            FROM public.reviews
            WHERE business_id = OLD.business_id AND is_visible = true;

            UPDATE public.businesses
            SET rating = COALESCE(avg_rating, 0),
                total_reviews = review_count
            WHERE id = OLD.business_id;
        END IF;
        RETURN OLD;
    ELSE
        -- Update ratings after insert or update
        IF NEW.route_id IS NOT NULL THEN
            SELECT AVG(rating)::NUMERIC(3, 2), COUNT(*)
            INTO avg_rating, review_count
            FROM public.reviews
            WHERE route_id = NEW.route_id AND is_visible = true;

            UPDATE public.routes
            SET rating = COALESCE(avg_rating, 0),
                total_reviews = review_count
            WHERE id = NEW.route_id;
        ELSIF NEW.business_id IS NOT NULL THEN
            SELECT AVG(rating)::NUMERIC(3, 2), COUNT(*)
            INTO avg_rating, review_count
            FROM public.reviews
            WHERE business_id = NEW.business_id AND is_visible = true;

            UPDATE public.businesses
            SET rating = COALESCE(avg_rating, 0),
                total_reviews = review_count
            WHERE id = NEW.business_id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_target_rating();

-- Create review_helpfulness table to track user feedback on reviews
CREATE TABLE IF NOT EXISTS public.review_helpfulness (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Helpfulness
    is_helpful BOOLEAN NOT NULL,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_review_helpfulness UNIQUE (user_id, review_id)
);

-- Add table comment
COMMENT ON TABLE public.review_helpfulness IS 'User feedback on review helpfulness';

-- Create function to update helpfulness counts
CREATE OR REPLACE FUNCTION public.update_review_helpfulness()
RETURNS TRIGGER AS $$
DECLARE
    helpful INTEGER;
    not_helpful INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT
            COUNT(*) FILTER (WHERE is_helpful = true),
            COUNT(*) FILTER (WHERE is_helpful = false)
        INTO helpful, not_helpful
        FROM public.review_helpfulness
        WHERE review_id = OLD.review_id;

        UPDATE public.reviews
        SET helpful_count = helpful,
            not_helpful_count = not_helpful
        WHERE id = OLD.review_id;

        RETURN OLD;
    ELSE
        SELECT
            COUNT(*) FILTER (WHERE is_helpful = true),
            COUNT(*) FILTER (WHERE is_helpful = false)
        INTO helpful, not_helpful
        FROM public.review_helpfulness
        WHERE review_id = NEW.review_id;

        UPDATE public.reviews
        SET helpful_count = helpful,
            not_helpful_count = not_helpful
        WHERE id = NEW.review_id;

        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_helpfulness_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.review_helpfulness
    FOR EACH ROW
    EXECUTE FUNCTION public.update_review_helpfulness();
