-- Route Reviews Table
-- This creates the reviews table if it doesn't exist

-- Create route_reviews table
CREATE TABLE IF NOT EXISTS route_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- One review per user per route
    UNIQUE(route_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_route_reviews_route ON route_reviews(route_id);
CREATE INDEX IF NOT EXISTS idx_route_reviews_user ON route_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_route_reviews_rating ON route_reviews(rating);

-- Enable RLS
ALTER TABLE route_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can read reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON route_reviews;
CREATE POLICY "Anyone can read reviews"
    ON route_reviews FOR SELECT
    USING (true);

-- Users can create their own reviews
DROP POLICY IF EXISTS "Users can create their own reviews" ON route_reviews;
CREATE POLICY "Users can create their own reviews"
    ON route_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON route_reviews;
CREATE POLICY "Users can update their own reviews"
    ON route_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete their own reviews" ON route_reviews;
CREATE POLICY "Users can delete their own reviews"
    ON route_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update route's average rating when reviews change
CREATE OR REPLACE FUNCTION update_route_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE routes 
        SET 
            average_rating = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 1)
                FROM route_reviews
                WHERE route_id = OLD.route_id
            ), 0),
            total_reviews = (
                SELECT COUNT(*)
                FROM route_reviews
                WHERE route_id = OLD.route_id
            ),
            updated_at = now()
        WHERE id = OLD.route_id;
        RETURN OLD;
    ELSE
        UPDATE routes 
        SET 
            average_rating = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 1)
                FROM route_reviews
                WHERE route_id = NEW.route_id
            ), 0),
            total_reviews = (
                SELECT COUNT(*)
                FROM route_reviews
                WHERE route_id = NEW.route_id
            ),
            updated_at = now()
        WHERE id = NEW.route_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_route_rating ON route_reviews;
CREATE TRIGGER trigger_update_route_rating
    AFTER INSERT OR UPDATE OR DELETE ON route_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_route_rating();

-- Trigger to update updated_at on review update
CREATE OR REPLACE FUNCTION update_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_review_timestamp ON route_reviews;
CREATE TRIGGER trigger_update_review_timestamp
    BEFORE UPDATE ON route_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_review_timestamp();
