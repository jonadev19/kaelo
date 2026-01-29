-- Create orders table
-- Stores customer orders

CREATE TABLE IF NOT EXISTS public.orders (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,

    -- Order information
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'refunded')
    ),

    -- Pricing
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    currency TEXT NOT NULL DEFAULT 'MXN',

    -- Payment
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'digital_wallet')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded')
    ),
    paid_at TIMESTAMPTZ,

    -- Delivery/Pickup
    delivery_method TEXT NOT NULL DEFAULT 'pickup' CHECK (
        delivery_method IN ('pickup', 'delivery', 'dine_in')
    ),
    delivery_address TEXT,
    delivery_notes TEXT,

    -- Timing
    scheduled_for TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Additional information
    special_instructions TEXT,
    cancellation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_currency CHECK (currency IN ('MXN', 'USD', 'EUR')),
    CONSTRAINT valid_total CHECK (total = subtotal + tax - discount)
);

-- Add table comment
COMMENT ON TABLE public.orders IS 'Customer orders from businesses';

-- Add column comments
COMMENT ON COLUMN public.orders.order_number IS 'Unique human-readable order number';
COMMENT ON COLUMN public.orders.status IS 'Current order status';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status';
COMMENT ON COLUMN public.orders.delivery_method IS 'How order will be fulfilled';
COMMENT ON COLUMN public.orders.scheduled_for IS 'When customer wants to receive order';

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

    -- Item details
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),

    -- Customization
    variant_selection JSONB,
    special_instructions TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_subtotal CHECK (subtotal = quantity * unit_price),
    CONSTRAINT valid_variant CHECK (variant_selection IS NULL OR jsonb_typeof(variant_selection) = 'object')
);

-- Add table comment
COMMENT ON TABLE public.order_items IS 'Individual items in an order';

-- Add column comments
COMMENT ON COLUMN public.order_items.quantity IS 'Quantity ordered';
COMMENT ON COLUMN public.order_items.unit_price IS 'Price per unit at time of order';
COMMENT ON COLUMN public.order_items.variant_selection IS 'Selected variant options';

-- Create trigger to automatically update updated_at on orders
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION public.generate_order_number();

-- Create function to update order totals
CREATE OR REPLACE FUNCTION public.update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    order_subtotal NUMERIC(10, 2);
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(subtotal), 0)
    INTO order_subtotal
    FROM public.order_items
    WHERE order_id = NEW.order_id;

    -- Update order subtotal and total
    UPDATE public.orders
    SET
        subtotal = order_subtotal,
        total = order_subtotal + tax - discount
    WHERE id = NEW.order_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_order_totals();

-- Create function to update product sales count
CREATE OR REPLACE FUNCTION public.update_product_sales()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.products
        SET total_sales = total_sales + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_product_sales
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_sales();

-- Create function to set timestamp when order status changes
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
        NEW.ready_at = NOW();
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at = NOW();
    END IF;

    IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
        NEW.paid_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_timestamps
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_status_change();
