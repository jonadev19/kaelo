-- Create route_completions table
-- Tracks detailed completion of routes by users

CREATE TABLE IF NOT EXISTS public.route_completions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,

    -- Completion details
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'completed', 'abandoned')
    ),
    completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (
        completion_percentage >= 0 AND completion_percentage <= 100
    ),

    -- Tracking data
    waypoints_visited JSONB DEFAULT '[]'::jsonb,
    businesses_visited JSONB DEFAULT '[]'::jsonb,

    -- Path tracking
    actual_path GEOMETRY(LINESTRING, 4326),
    total_distance_traveled NUMERIC(10, 2), -- in kilometers

    -- Time tracking
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    abandoned_at TIMESTAMPTZ,
    total_duration INTEGER, -- in minutes

    -- Gamification
    points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    badges_earned JSONB DEFAULT '[]'::jsonb,

    -- Statistics
    total_spent NUMERIC(10, 2) DEFAULT 0 CHECK (total_spent >= 0),
    businesses_count INTEGER NOT NULL DEFAULT 0 CHECK (businesses_count >= 0),
    photos_taken INTEGER NOT NULL DEFAULT 0 CHECK (photos_taken >= 0),

    -- User experience
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_waypoints CHECK (jsonb_typeof(waypoints_visited) = 'array'),
    CONSTRAINT valid_businesses CHECK (jsonb_typeof(businesses_visited) = 'array'),
    CONSTRAINT valid_badges CHECK (jsonb_typeof(badges_earned) = 'array')
);

-- Add table comment
COMMENT ON TABLE public.route_completions IS 'Detailed tracking of route completions by users';

-- Add column comments
COMMENT ON COLUMN public.route_completions.status IS 'Current status of route completion';
COMMENT ON COLUMN public.route_completions.completion_percentage IS 'Percentage of route completed (0-100)';
COMMENT ON COLUMN public.route_completions.waypoints_visited IS 'Array of visited waypoint IDs with timestamps';
COMMENT ON COLUMN public.route_completions.businesses_visited IS 'Array of visited business IDs with timestamps';
COMMENT ON COLUMN public.route_completions.actual_path IS 'Actual path taken by user (GPS tracking)';
COMMENT ON COLUMN public.route_completions.total_distance_traveled IS 'Total distance traveled in kilometers';
COMMENT ON COLUMN public.route_completions.total_duration IS 'Total time spent on route in minutes';
COMMENT ON COLUMN public.route_completions.points_earned IS 'Total points earned from this completion';
COMMENT ON COLUMN public.route_completions.badges_earned IS 'Badges earned during this completion';

-- Create index on user and route
CREATE INDEX IF NOT EXISTS idx_route_completions_user_route
ON public.route_completions(user_id, route_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_route_completions_status
ON public.route_completions(status);

-- Create index on started_at for analytics
CREATE INDEX IF NOT EXISTS idx_route_completions_started_at
ON public.route_completions(started_at DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.route_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to update route completion count
CREATE OR REPLACE FUNCTION public.update_route_completions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Increment route completion count
        UPDATE public.routes
        SET total_completions = total_completions + 1
        WHERE id = NEW.route_id;

        -- Set completed timestamp
        NEW.completed_at = NOW();

        -- Calculate duration if not set
        IF NEW.total_duration IS NULL THEN
            NEW.total_duration = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60;
        END IF;

        -- Award base completion points
        NEW.points_earned = NEW.points_earned + 100;

        -- Award points to user
        UPDATE public.profiles
        SET points = points + NEW.points_earned
        WHERE id = NEW.user_id;

    ELSIF NEW.status = 'abandoned' AND (OLD.status IS NULL OR OLD.status != 'abandoned') THEN
        NEW.abandoned_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_completion_status
    BEFORE UPDATE ON public.route_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_route_completions();

-- Create function to update completion percentage
CREATE OR REPLACE FUNCTION public.calculate_completion_percentage()
RETURNS TRIGGER AS $$
DECLARE
    total_waypoints INTEGER;
    total_businesses INTEGER;
    visited_waypoints INTEGER;
    visited_businesses INTEGER;
    percentage INTEGER;
BEGIN
    -- Count total waypoints and businesses in route
    SELECT COUNT(*) INTO total_waypoints
    FROM public.route_waypoints
    WHERE route_id = NEW.route_id;

    SELECT COUNT(*) INTO total_businesses
    FROM public.route_businesses
    WHERE route_id = NEW.route_id AND is_required = true;

    -- Count visited items
    visited_waypoints := jsonb_array_length(NEW.waypoints_visited);
    visited_businesses := jsonb_array_length(NEW.businesses_visited);

    -- Calculate percentage
    IF (total_waypoints + total_businesses) > 0 THEN
        percentage := ROUND(
            ((visited_waypoints::NUMERIC + visited_businesses::NUMERIC) /
             (total_waypoints::NUMERIC + total_businesses::NUMERIC)) * 100
        )::INTEGER;
        NEW.completion_percentage = LEAST(percentage, 100);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_percentage
    BEFORE INSERT OR UPDATE ON public.route_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_completion_percentage();
