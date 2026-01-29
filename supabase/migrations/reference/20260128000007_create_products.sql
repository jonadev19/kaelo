-- Create products table
-- Stores products offered by businesses

CREATE TABLE IF NOT EXISTS public.products (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

    -- Product information
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,

    -- Pricing
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'MXN',
    discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discounted_price NUMERIC(10, 2) CHECK (discounted_price >= 0),

    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    primary_image TEXT,

    -- Inventory
    stock_quantity INTEGER CHECK (stock_quantity >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,

    -- Product details
    variants JSONB DEFAULT '[]'::jsonb, -- e.g., sizes, colors, options
    specifications JSONB DEFAULT '{}'::jsonb,

    -- Engagement metrics
    rating NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
    total_sales INTEGER NOT NULL DEFAULT 0 CHECK (total_sales >= 0),

    -- Tags and search
    tags TEXT[] DEFAULT '{}',

    -- Status
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_currency CHECK (currency IN ('MXN', 'USD', 'EUR')),
    CONSTRAINT valid_images CHECK (jsonb_typeof(images) = 'array'),
    CONSTRAINT valid_variants CHECK (jsonb_typeof(variants) = 'array'),
    CONSTRAINT valid_specifications CHECK (jsonb_typeof(specifications) = 'object'),
    CONSTRAINT valid_discount_price CHECK (discounted_price IS NULL OR discounted_price < price)
);

-- Add table comment
COMMENT ON TABLE public.products IS 'Products and services offered by businesses';

-- Add column comments
COMMENT ON COLUMN public.products.price IS 'Base price in specified currency';
COMMENT ON COLUMN public.products.discount_percentage IS 'Percentage discount if applicable';
COMMENT ON COLUMN public.products.discounted_price IS 'Final price after discount';
COMMENT ON COLUMN public.products.stock_quantity IS 'Available stock quantity';
COMMENT ON COLUMN public.products.variants IS 'Product variants (sizes, colors, etc.)';
COMMENT ON COLUMN public.products.specifications IS 'Product specifications and details';
COMMENT ON COLUMN public.products.total_sales IS 'Total number of sales';

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to calculate discounted price
CREATE OR REPLACE FUNCTION public.calculate_discounted_price()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.discount_percentage IS NOT NULL AND NEW.discount_percentage > 0 THEN
        NEW.discounted_price = NEW.price * (1 - NEW.discount_percentage::NUMERIC / 100);
    ELSE
        NEW.discounted_price = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_discounted_price
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_discounted_price();
