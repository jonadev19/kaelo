-- Create route_waypoints table
-- Stores ordered points of interest along a route

CREATE TABLE IF NOT EXISTS public.route_waypoints (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,

    -- Waypoint information
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL CHECK (order_index >= 0),

    -- Location
    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT,

    -- Waypoint details
    waypoint_type TEXT NOT NULL DEFAULT 'point_of_interest' CHECK (
        waypoint_type IN ('start', 'end', 'point_of_interest', 'rest_stop', 'photo_spot', 'warning', 'information')
    ),

    -- Media
    images JSONB DEFAULT '[]'::jsonb,

    -- Time and navigation
    estimated_time_from_previous INTEGER, -- in minutes
    distance_from_previous NUMERIC(10, 2), -- in kilometers

    -- Additional information
    tips TEXT,
    accessibility_info TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_route_order UNIQUE (route_id, order_index),
    CONSTRAINT valid_images CHECK (jsonb_typeof(images) = 'array'),
    CONSTRAINT valid_time CHECK (estimated_time_from_previous IS NULL OR estimated_time_from_previous >= 0),
    CONSTRAINT valid_distance CHECK (distance_from_previous IS NULL OR distance_from_previous >= 0)
);

-- Add table comment
COMMENT ON TABLE public.route_waypoints IS 'Points of interest and stops along routes';

-- Add column comments
COMMENT ON COLUMN public.route_waypoints.order_index IS 'Order of waypoint in the route (0-based)';
COMMENT ON COLUMN public.route_waypoints.location IS 'Geographic location of the waypoint';
COMMENT ON COLUMN public.route_waypoints.waypoint_type IS 'Type of waypoint (start, end, POI, etc.)';
COMMENT ON COLUMN public.route_waypoints.estimated_time_from_previous IS 'Travel time from previous waypoint in minutes';
COMMENT ON COLUMN public.route_waypoints.distance_from_previous IS 'Distance from previous waypoint in kilometers';

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.route_waypoints
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to reorder waypoints after deletion
CREATE OR REPLACE FUNCTION public.reorder_waypoints_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.route_waypoints
    SET order_index = order_index - 1
    WHERE route_id = OLD.route_id
    AND order_index > OLD.order_index;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reorder_after_delete
    AFTER DELETE ON public.route_waypoints
    FOR EACH ROW
    EXECUTE FUNCTION public.reorder_waypoints_after_delete();
