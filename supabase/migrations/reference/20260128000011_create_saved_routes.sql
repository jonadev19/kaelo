-- Create saved_routes table
-- Tracks routes saved/bookmarked by users

CREATE TABLE IF NOT EXISTS public.saved_routes (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,

    -- Organization
    collection_name TEXT, -- Optional: user can organize saves into collections
    notes TEXT,

    -- Status
    is_completed BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT unique_user_saved_route UNIQUE (user_id, route_id)
);

-- Add table comment
COMMENT ON TABLE public.saved_routes IS 'Routes bookmarked by users';

-- Add column comments
COMMENT ON COLUMN public.saved_routes.collection_name IS 'Optional collection/folder name for organization';
COMMENT ON COLUMN public.saved_routes.notes IS 'User notes about the saved route';
COMMENT ON COLUMN public.saved_routes.is_completed IS 'Whether user has completed this saved route';

-- Create index on user_id for user's saved routes
CREATE INDEX IF NOT EXISTS idx_saved_routes_user
ON public.saved_routes(user_id);

-- Create index on route_id for route popularity
CREATE INDEX IF NOT EXISTS idx_saved_routes_route
ON public.saved_routes(route_id);

-- Create index on collection for filtering
CREATE INDEX IF NOT EXISTS idx_saved_routes_collection
ON public.saved_routes(user_id, collection_name)
WHERE collection_name IS NOT NULL;

-- Create function to update route save count
CREATE OR REPLACE FUNCTION public.update_route_saves()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.routes
        SET total_saves = total_saves + 1
        WHERE id = NEW.route_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.routes
        SET total_saves = total_saves - 1
        WHERE id = OLD.route_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saves_count
    AFTER INSERT OR DELETE ON public.saved_routes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_route_saves();

-- Create function to set completed_at timestamp
CREATE OR REPLACE FUNCTION public.handle_saved_route_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
        NEW.completed_at = NOW();
    ELSIF NEW.is_completed = false THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_completed_at
    BEFORE UPDATE ON public.saved_routes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_saved_route_completion();
