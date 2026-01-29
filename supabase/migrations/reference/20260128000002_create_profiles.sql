-- Create profiles table
-- Stores user profile information and preferences

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic information
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,

    -- Contact information
    phone TEXT,

    -- User type and status
    user_type TEXT NOT NULL DEFAULT 'tourist' CHECK (user_type IN ('tourist', 'local_business', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Gamification and engagement
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    badges JSONB DEFAULT '[]'::jsonb,

    -- Privacy settings
    privacy_settings JSONB DEFAULT '{
        "show_profile": true,
        "show_routes": true,
        "show_reviews": true
    }'::jsonb,

    -- User preferences
    preferences JSONB DEFAULT '{
        "language": "es",
        "notifications_enabled": true,
        "theme": "light"
    }'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_username CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- Add table comment
COMMENT ON TABLE public.profiles IS 'User profiles with settings and gamification data';

-- Add column comments
COMMENT ON COLUMN public.profiles.user_type IS 'Type of user: tourist, local_business, or admin';
COMMENT ON COLUMN public.profiles.points IS 'Gamification points earned by user';
COMMENT ON COLUMN public.profiles.level IS 'User level based on points and activity';
COMMENT ON COLUMN public.profiles.badges IS 'Array of earned badges';
COMMENT ON COLUMN public.profiles.privacy_settings IS 'User privacy preferences';
COMMENT ON COLUMN public.profiles.preferences IS 'User app preferences and settings';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
