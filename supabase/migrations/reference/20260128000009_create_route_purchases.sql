-- Create route_purchases table
-- Tracks purchases made during route completion

CREATE TABLE IF NOT EXISTS public.route_purchases (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

    -- Purchase information
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'MXN',

    -- Verification
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_method TEXT CHECK (
        verification_method IN ('qr_code', 'receipt', 'business_confirmation', 'manual')
    ),
    receipt_image TEXT,

    -- Location verification
    purchase_location GEOMETRY(POINT, 4326),
    distance_from_business NUMERIC(10, 2), -- in meters

    -- Gamification
    points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),

    -- Timestamps
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_currency CHECK (currency IN ('MXN', 'USD', 'EUR'))
);

-- Add table comment
COMMENT ON TABLE public.route_purchases IS 'Purchases made by users during route completion';

-- Add column comments
COMMENT ON COLUMN public.route_purchases.amount IS 'Total purchase amount';
COMMENT ON COLUMN public.route_purchases.is_verified IS 'Whether purchase has been verified';
COMMENT ON COLUMN public.route_purchases.verification_method IS 'Method used to verify purchase';
COMMENT ON COLUMN public.route_purchases.purchase_location IS 'Location where purchase was made';
COMMENT ON COLUMN public.route_purchases.distance_from_business IS 'Distance from business location in meters';
COMMENT ON COLUMN public.route_purchases.points_earned IS 'Gamification points earned from this purchase';

-- Create index on route and user for analytics
CREATE INDEX IF NOT EXISTS idx_route_purchases_route_user
ON public.route_purchases(route_id, user_id);

-- Create index on business for analytics
CREATE INDEX IF NOT EXISTS idx_route_purchases_business
ON public.route_purchases(business_id);

-- Create index on purchased_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_route_purchases_purchased_at
ON public.route_purchases(purchased_at DESC);

-- Create function to calculate and award points on verified purchase
CREATE OR REPLACE FUNCTION public.award_purchase_points()
RETURNS TRIGGER AS $$
DECLARE
    base_points INTEGER;
    bonus_points INTEGER;
    total_points INTEGER;
BEGIN
    IF NEW.is_verified = true AND OLD.is_verified = false THEN
        -- Calculate base points (1 point per 10 MXN)
        base_points := FLOOR(NEW.amount / 10)::INTEGER;

        -- Calculate bonus points (20% bonus)
        bonus_points := FLOOR(base_points * 0.2)::INTEGER;

        -- Total points
        total_points := base_points + bonus_points;

        -- Update purchase record
        NEW.points_earned = total_points;
        NEW.verified_at = NOW();

        -- Award points to user
        UPDATE public.profiles
        SET points = points + total_points
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_points_on_verification
    BEFORE UPDATE ON public.route_purchases
    FOR EACH ROW
    EXECUTE FUNCTION public.award_purchase_points();

-- Create function to calculate distance from business
CREATE OR REPLACE FUNCTION public.calculate_purchase_distance()
RETURNS TRIGGER AS $$
DECLARE
    business_location GEOMETRY(POINT, 4326);
BEGIN
    IF NEW.purchase_location IS NOT NULL THEN
        -- Get business location
        SELECT location INTO business_location
        FROM public.businesses
        WHERE id = NEW.business_id;

        -- Calculate distance in meters
        NEW.distance_from_business = ST_Distance(
            business_location::geography,
            NEW.purchase_location::geography
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_distance
    BEFORE INSERT OR UPDATE ON public.route_purchases
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_purchase_distance();
