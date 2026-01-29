-- Create business_coupons table
-- Stores discount coupons offered by businesses

CREATE TABLE IF NOT EXISTS public.business_coupons (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

    -- Coupon details
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,

    -- Discount
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_item')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    max_discount_amount NUMERIC(10, 2), -- For percentage discounts

    -- Conditions
    min_purchase_amount NUMERIC(10, 2) CHECK (min_purchase_amount >= 0),
    applicable_products TEXT[], -- Product IDs if coupon applies to specific products
    applicable_categories TEXT[], -- Categories if coupon applies to specific categories

    -- Limits
    max_uses_total INTEGER CHECK (max_uses_total > 0),
    max_uses_per_user INTEGER CHECK (max_uses_per_user > 0),
    current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),

    -- Unlock requirements
    requires_route_completion BOOLEAN NOT NULL DEFAULT false,
    required_route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    requires_minimum_points INTEGER CHECK (requires_minimum_points >= 0),

    -- Validity period
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,

    -- Days of week (if applicable)
    valid_days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday, 6=Saturday

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_business_coupon_code UNIQUE (business_id, code),
    CONSTRAINT valid_date_range CHECK (valid_until > valid_from),
    CONSTRAINT valid_days CHECK (
        valid_days_of_week IS NULL OR
        (array_length(valid_days_of_week, 1) > 0 AND
         valid_days_of_week <@ ARRAY[0,1,2,3,4,5,6])
    )
);

-- Add table comment
COMMENT ON TABLE public.business_coupons IS 'Discount coupons offered by businesses';

-- Add column comments
COMMENT ON COLUMN public.business_coupons.discount_type IS 'Type of discount: percentage, fixed_amount, or free_item';
COMMENT ON COLUMN public.business_coupons.discount_value IS 'Discount value (percentage or amount)';
COMMENT ON COLUMN public.business_coupons.max_discount_amount IS 'Maximum discount for percentage coupons';
COMMENT ON COLUMN public.business_coupons.min_purchase_amount IS 'Minimum purchase required to use coupon';
COMMENT ON COLUMN public.business_coupons.max_uses_total IS 'Total number of times coupon can be used';
COMMENT ON COLUMN public.business_coupons.max_uses_per_user IS 'Maximum uses per user';
COMMENT ON COLUMN public.business_coupons.valid_days_of_week IS 'Days of week when coupon is valid (0=Sunday)';

-- Create unlocked_coupons table
-- Tracks coupons unlocked by users

CREATE TABLE IF NOT EXISTS public.unlocked_coupons (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.business_coupons(id) ON DELETE CASCADE,

    -- Usage tracking
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),

    -- Order reference (if used)
    used_in_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

    -- Timestamps
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT unique_user_coupon UNIQUE (user_id, coupon_id)
);

-- Add table comment
COMMENT ON TABLE public.unlocked_coupons IS 'Coupons unlocked and redeemed by users';

-- Add column comments
COMMENT ON COLUMN public.unlocked_coupons.is_used IS 'Whether coupon has been used at least once';
COMMENT ON COLUMN public.unlocked_coupons.used_count IS 'Number of times coupon has been used';
COMMENT ON COLUMN public.unlocked_coupons.unlocked_at IS 'When user unlocked this coupon';
COMMENT ON COLUMN public.unlocked_coupons.expires_at IS 'When coupon expires for this user';

-- Create sponsored_segments table
-- Tracks sponsored route segments for businesses

CREATE TABLE IF NOT EXISTS public.sponsored_segments (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,

    -- Sponsorship details
    segment_type TEXT NOT NULL CHECK (segment_type IN ('start', 'middle', 'end', 'detour')),
    priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0),

    -- Location
    segment_geometry GEOMETRY(LINESTRING, 4326),
    highlight_radius INTEGER DEFAULT 100 CHECK (highlight_radius > 0), -- in meters

    -- Display
    title TEXT NOT NULL,
    description TEXT,
    call_to_action TEXT,

    -- Media
    banner_image TEXT,

    -- Campaign details
    campaign_name TEXT,
    budget_spent NUMERIC(10, 2) DEFAULT 0 CHECK (budget_spent >= 0),

    -- Performance metrics
    impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
    clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    conversions INTEGER NOT NULL DEFAULT 0 CHECK (conversions >= 0),

    -- Schedule
    active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_until TIMESTAMPTZ NOT NULL,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_campaign_dates CHECK (active_until > active_from)
);

-- Add table comment
COMMENT ON TABLE public.sponsored_segments IS 'Sponsored segments on routes for business promotion';

-- Add column comments
COMMENT ON COLUMN public.sponsored_segments.segment_type IS 'Position of sponsored segment in route';
COMMENT ON COLUMN public.sponsored_segments.priority IS 'Display priority (higher = more prominent)';
COMMENT ON COLUMN public.sponsored_segments.segment_geometry IS 'Geographic area of sponsored segment';
COMMENT ON COLUMN public.sponsored_segments.highlight_radius IS 'Radius to highlight business in meters';
COMMENT ON COLUMN public.sponsored_segments.impressions IS 'Number of times segment was shown';
COMMENT ON COLUMN public.sponsored_segments.clicks IS 'Number of clicks on segment';
COMMENT ON COLUMN public.sponsored_segments.conversions IS 'Number of visits/purchases from segment';

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_coupons
    BEFORE UPDATE ON public.business_coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sponsored
    BEFORE UPDATE ON public.sponsored_segments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to track coupon usage
CREATE OR REPLACE FUNCTION public.track_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_used = true AND (OLD.is_used IS NULL OR OLD.is_used = false) THEN
        NEW.used_at = NOW();
        NEW.used_count = NEW.used_count + 1;

        -- Increment coupon usage count
        UPDATE public.business_coupons
        SET current_uses = current_uses + 1
        WHERE id = NEW.coupon_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_usage
    BEFORE UPDATE ON public.unlocked_coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.track_coupon_usage();

-- Create function to auto-unlock coupons on route completion
CREATE OR REPLACE FUNCTION public.auto_unlock_route_coupons()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Unlock coupons that require this route completion
        INSERT INTO public.unlocked_coupons (user_id, coupon_id, expires_at)
        SELECT
            NEW.user_id,
            bc.id,
            bc.valid_until
        FROM public.business_coupons bc
        WHERE bc.requires_route_completion = true
        AND bc.required_route_id = NEW.route_id
        AND bc.is_active = true
        AND bc.valid_until > NOW()
        ON CONFLICT (user_id, coupon_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unlock_coupons_on_completion
    AFTER INSERT OR UPDATE ON public.route_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_unlock_route_coupons();
