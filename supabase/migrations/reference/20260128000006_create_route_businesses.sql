-- Create route_businesses junction table
-- Links businesses to routes with ordering and additional metadata

CREATE TABLE IF NOT EXISTS public.route_businesses (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

    -- Order and position
    order_index INTEGER NOT NULL CHECK (order_index >= 0),

    -- Visit information
    is_required BOOLEAN NOT NULL DEFAULT false,
    estimated_visit_duration INTEGER CHECK (estimated_visit_duration > 0), -- in minutes

    -- Recommendations
    recommended_time TEXT, -- e.g., 'morning', 'afternoon', 'evening'
    special_notes TEXT,

    -- Distance from previous point
    distance_from_previous NUMERIC(10, 2) CHECK (distance_from_previous >= 0), -- in kilometers

    -- Highlights
    highlights TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_route_business UNIQUE (route_id, business_id),
    CONSTRAINT unique_route_business_order UNIQUE (route_id, order_index)
);

-- Add table comment
COMMENT ON TABLE public.route_businesses IS 'Junction table linking businesses to routes with ordering';

-- Add column comments
COMMENT ON COLUMN public.route_businesses.order_index IS 'Order of business visit in the route';
COMMENT ON COLUMN public.route_businesses.is_required IS 'Whether visiting this business is required for route completion';
COMMENT ON COLUMN public.route_businesses.estimated_visit_duration IS 'Recommended time to spend at business in minutes';
COMMENT ON COLUMN public.route_businesses.distance_from_previous IS 'Distance from previous stop in kilometers';
COMMENT ON COLUMN public.route_businesses.highlights IS 'Special features or items to experience at this business';

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.route_businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to increment business visits when added to route
CREATE OR REPLACE FUNCTION public.increment_business_visits()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.businesses
    SET total_visits = total_visits + 1
    WHERE id = NEW.business_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_visits_on_add
    AFTER INSERT ON public.route_businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_business_visits();

-- Create function to reorder route businesses after deletion
CREATE OR REPLACE FUNCTION public.reorder_route_businesses_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.route_businesses
    SET order_index = order_index - 1
    WHERE route_id = OLD.route_id
    AND order_index > OLD.order_index;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reorder_after_delete
    AFTER DELETE ON public.route_businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.reorder_route_businesses_after_delete();
