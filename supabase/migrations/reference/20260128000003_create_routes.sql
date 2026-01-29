-- Create routes table
-- Stores curated routes with geospatial data

CREATE TABLE IF NOT EXISTS public.routes (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Creator information
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Route metadata
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('gastronomica', 'cultural', 'artesanal', 'naturaleza', 'aventura', 'historica', 'familiar', 'nocturna')),
    difficulty TEXT NOT NULL DEFAULT 'facil' CHECK (difficulty IN ('facil', 'moderado', 'dificil')),

    -- Route characteristics
    estimated_duration INTEGER NOT NULL CHECK (estimated_duration > 0), -- in minutes
    distance NUMERIC(10, 2) CHECK (distance >= 0), -- in kilometers

    -- Geospatial data
    route_geometry GEOMETRY(LINESTRING, 4326) NOT NULL,
    start_location GEOMETRY(POINT, 4326) NOT NULL,
    end_location GEOMETRY(POINT, 4326) NOT NULL,

    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    cover_image TEXT,

    -- Engagement metrics
    rating NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
    total_completions INTEGER NOT NULL DEFAULT 0 CHECK (total_completions >= 0),
    total_saves INTEGER NOT NULL DEFAULT 0 CHECK (total_saves >= 0),

    -- Status and visibility
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_verified BOOLEAN NOT NULL DEFAULT false,

    -- Tags and search
    tags TEXT[] DEFAULT '{}',

    -- Additional metadata
    recommended_for TEXT[] DEFAULT '{}', -- e.g., ['families', 'couples', 'solo', 'groups']
    best_time_to_visit TEXT, -- e.g., 'morning', 'afternoon', 'evening', 'weekend'
    accessibility_info TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_duration CHECK (estimated_duration >= 15 AND estimated_duration <= 1440),
    CONSTRAINT valid_distance CHECK (distance IS NULL OR (distance >= 0.1 AND distance <= 100)),
    CONSTRAINT valid_images CHECK (jsonb_typeof(images) = 'array')
);

-- Add table comment
COMMENT ON TABLE public.routes IS 'Curated tourism routes with geospatial data';

-- Add column comments
COMMENT ON COLUMN public.routes.route_geometry IS 'Full route path as a LineString geometry';
COMMENT ON COLUMN public.routes.start_location IS 'Starting point of the route';
COMMENT ON COLUMN public.routes.end_location IS 'Ending point of the route';
COMMENT ON COLUMN public.routes.estimated_duration IS 'Estimated time to complete route in minutes';
COMMENT ON COLUMN public.routes.distance IS 'Total route distance in kilometers';
COMMENT ON COLUMN public.routes.category IS 'Main category of the route';
COMMENT ON COLUMN public.routes.difficulty IS 'Difficulty level: facil, moderado, dificil';
COMMENT ON COLUMN public.routes.is_featured IS 'Whether route is featured on homepage';
COMMENT ON COLUMN public.routes.is_verified IS 'Whether route has been verified by admin';

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.routes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to set published_at when route is published
CREATE OR REPLACE FUNCTION public.handle_route_published()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = true AND OLD.is_published = false THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_published_at
    BEFORE UPDATE ON public.routes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_route_published();
