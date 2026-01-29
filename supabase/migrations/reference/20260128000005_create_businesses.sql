-- Create businesses table
-- Stores local businesses and points of interest

CREATE TABLE IF NOT EXISTS public.businesses (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Owner information
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Business information
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (
        category IN ('restaurante', 'cafe', 'bar', 'tienda', 'artesania', 'museo', 'galeria', 'hotel', 'hostal', 'tour', 'transporte', 'otro')
    ),
    subcategory TEXT,

    -- Location
    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'Mexico',

    -- Contact information
    phone TEXT,
    email TEXT,
    website TEXT,

    -- Social media
    social_media JSONB DEFAULT '{}'::jsonb,

    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    logo_url TEXT,
    cover_image TEXT,

    -- Business hours
    opening_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "18:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
        "thursday": {"open": "09:00", "close": "18:00", "closed": false},
        "friday": {"open": "09:00", "close": "18:00", "closed": false},
        "saturday": {"open": "10:00", "close": "14:00", "closed": false},
        "sunday": {"open": "00:00", "close": "00:00", "closed": true}
    }'::jsonb,

    -- Pricing and features
    price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    amenities TEXT[] DEFAULT '{}',
    payment_methods TEXT[] DEFAULT '{}',

    -- Engagement metrics
    rating NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
    total_visits INTEGER NOT NULL DEFAULT 0 CHECK (total_visits >= 0),

    -- Status and verification
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_sponsored BOOLEAN NOT NULL DEFAULT false,

    -- Tags and search
    tags TEXT[] DEFAULT '{}',

    -- Additional information
    accessibility_info TEXT,
    special_features TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT valid_website CHECK (website IS NULL OR website ~* '^https?://'),
    CONSTRAINT valid_images CHECK (jsonb_typeof(images) = 'array'),
    CONSTRAINT valid_social_media CHECK (jsonb_typeof(social_media) = 'object'),
    CONSTRAINT valid_opening_hours CHECK (jsonb_typeof(opening_hours) = 'object')
);

-- Add table comment
COMMENT ON TABLE public.businesses IS 'Local businesses and points of interest';

-- Add column comments
COMMENT ON COLUMN public.businesses.location IS 'Geographic location of the business';
COMMENT ON COLUMN public.businesses.category IS 'Main category of business';
COMMENT ON COLUMN public.businesses.opening_hours IS 'Weekly schedule with open/close times';
COMMENT ON COLUMN public.businesses.price_range IS 'Price range indicator ($-$$$$)';
COMMENT ON COLUMN public.businesses.amenities IS 'Available amenities (wifi, parking, etc.)';
COMMENT ON COLUMN public.businesses.is_verified IS 'Whether business has been verified by admin';
COMMENT ON COLUMN public.businesses.is_sponsored IS 'Whether business has sponsored placement';
COMMENT ON COLUMN public.businesses.total_visits IS 'Number of visits via app';

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to set verified_at when business is verified
CREATE OR REPLACE FUNCTION public.handle_business_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_verified = true AND OLD.is_verified = false THEN
        NEW.verified_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_verified_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_business_verified();
