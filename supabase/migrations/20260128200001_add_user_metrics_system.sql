-- ============================================
-- USER METRICS SYSTEM - COMPREHENSIVE TRACKING
-- ============================================
-- Version: 1.0
-- Created: 2026-01-28
-- Purpose: Complete personal metrics system with achievements, goals, records, and analytics
-- Impact: Enables detailed performance tracking, gamification, and personalized recommendations

-- ============================================
-- A) ALTER TABLE route_completions
-- Add detailed performance metrics
-- ============================================

-- Add performance tracking columns
ALTER TABLE public.route_completions
    ADD COLUMN IF NOT EXISTS distance_actual_km NUMERIC(6,2) CHECK (distance_actual_km >= 0),
    ADD COLUMN IF NOT EXISTS avg_speed_kmh NUMERIC(4,1) CHECK (avg_speed_kmh >= 0 AND avg_speed_kmh <= 100),
    ADD COLUMN IF NOT EXISTS max_speed_kmh NUMERIC(4,1) CHECK (max_speed_kmh >= 0 AND max_speed_kmh <= 150),
    ADD COLUMN IF NOT EXISTS calories_burned INTEGER CHECK (calories_burned >= 0),
    ADD COLUMN IF NOT EXISTS elevation_gain_actual_m INTEGER CHECK (elevation_gain_actual_m >= 0),
    ADD COLUMN IF NOT EXISTS weather_conditions JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;

-- Add comments for new columns
COMMENT ON COLUMN public.route_completions.distance_actual_km IS 'Actual distance traveled (GPS-tracked), may differ from planned route distance';
COMMENT ON COLUMN public.route_completions.avg_speed_kmh IS 'Average speed during ride (km/h)';
COMMENT ON COLUMN public.route_completions.max_speed_kmh IS 'Maximum speed reached (km/h)';
COMMENT ON COLUMN public.route_completions.calories_burned IS 'Estimated calories burned using MET formula';
COMMENT ON COLUMN public.route_completions.elevation_gain_actual_m IS 'Actual elevation gain from GPS data (meters)';
COMMENT ON COLUMN public.route_completions.weather_conditions IS 'Weather data at completion time: {temp_celsius, wind_speed_kmh, humidity_percent, conditions}';
COMMENT ON COLUMN public.route_completions.device_info IS 'Device used for tracking: {brand, model, os_version, gps_accuracy_meters}';

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_route_completions_metrics
ON public.route_completions(user_id, completed_at DESC)
WHERE status = 'completed';

-- Add index for speed-based queries (leaderboards)
CREATE INDEX IF NOT EXISTS idx_route_completions_speed
ON public.route_completions(route_id, avg_speed_kmh DESC NULLS LAST)
WHERE status = 'completed' AND avg_speed_kmh IS NOT NULL;

-- ============================================
-- B) CREATE TABLE user_achievements
-- Gamification system for unlocking achievements
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Achievement details
    achievement_type TEXT NOT NULL CHECK (achievement_type IN (
        'first_ride',           -- Complete first route
        'speed_demon',          -- Reach 40+ km/h average
        'distance_10km',        -- Complete 10km in one ride
        'distance_50km',        -- Complete 50km in one ride
        'distance_100km_total', -- Total 100km accumulated
        'distance_500km_total', -- Total 500km accumulated
        'distance_1000km_total',-- Total 1000km accumulated
        'routes_completed_10',  -- Complete 10 different routes
        'routes_completed_50',  -- Complete 50 different routes
        'streak_7_days',        -- Ride 7 consecutive days
        'streak_30_days',       -- Ride 30 consecutive days
        'early_bird',           -- Complete ride before 7am
        'night_rider',          -- Complete ride after 8pm
        'explorer',             -- Visit 20 different waypoints
        'supporter',            -- Purchase 5 premium routes
        'socialite',            -- Leave 10 reviews
        'cenote_hunter',        -- Visit 10 cenotes
        'elevation_master',     -- Climb 1000m cumulative
        'all_weather',          -- Ride in 3+ weather conditions
        'route_creator'         -- Create and publish first route
    )),

    -- Achievement metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Example: {"value": 42.5, "route_id": "uuid", "details": "Reached 42.5 km/h on Route X"}

    -- Progress tracking
    progress_current INTEGER DEFAULT 0 CHECK (progress_current >= 0),
    progress_target INTEGER NOT NULL CHECK (progress_target > 0),
    is_unlocked BOOLEAN DEFAULT FALSE,

    -- Rewards
    points_awarded INTEGER DEFAULT 0 CHECK (points_awarded >= 0),
    badge_icon TEXT, -- URL to badge image

    -- Timestamps
    unlocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, achievement_type),
    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object'),
    CONSTRAINT unlocked_consistency CHECK (
        (is_unlocked = TRUE AND unlocked_at IS NOT NULL) OR
        (is_unlocked = FALSE AND unlocked_at IS NULL)
    )
);

-- Add table comment
COMMENT ON TABLE public.user_achievements IS 'User achievement tracking system for gamification and engagement';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user
ON public.user_achievements(user_id, is_unlocked, unlocked_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_type
ON public.user_achievements(achievement_type, is_unlocked)
WHERE is_unlocked = TRUE;

-- Add trigger for updated_at
CREATE TRIGGER set_user_achievements_updated_at
    BEFORE UPDATE ON public.user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- C) CREATE TABLE user_goals
-- Personal goal setting and tracking
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_goals (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Goal details
    goal_type TEXT NOT NULL CHECK (goal_type IN (
        'distance_monthly',     -- Ride X km this month
        'distance_weekly',      -- Ride X km this week
        'routes_count',         -- Complete X routes
        'streak_days',          -- Maintain X day streak
        'avg_speed',            -- Achieve X km/h average
        'elevation_total',      -- Climb X meters total
        'calories',             -- Burn X calories
        'custom'                -- User-defined goal
    )),

    title TEXT NOT NULL,
    description TEXT,

    -- Progress tracking
    target_value NUMERIC(10,2) NOT NULL CHECK (target_value > 0),
    current_value NUMERIC(10,2) DEFAULT 0 CHECK (current_value >= 0),
    unit TEXT NOT NULL DEFAULT 'km' CHECK (unit IN ('km', 'routes', 'days', 'kmh', 'meters', 'calories', 'other')),

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active',      -- In progress
        'completed',   -- Successfully completed
        'abandoned',   -- User gave up
        'expired'      -- Deadline passed without completion
    )),

    -- Timing
    deadline TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Rewards
    reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT progress_within_target CHECK (current_value <= target_value * 1.5), -- Allow 50% overshoot
    CONSTRAINT completed_consistency CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    )
);

-- Add table comment
COMMENT ON TABLE public.user_goals IS 'User-defined goals for personal motivation and tracking';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user_status
ON public.user_goals(user_id, status, deadline DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_user_goals_active
ON public.user_goals(user_id, updated_at DESC)
WHERE status = 'active';

-- Add trigger for updated_at
CREATE TRIGGER set_user_goals_updated_at
    BEFORE UPDATE ON public.user_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- D) CREATE TABLE user_personal_records
-- Track personal bests for each route
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_personal_records (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    completion_id UUID NOT NULL REFERENCES public.route_completions(id) ON DELETE CASCADE,

    -- Record details
    record_type TEXT NOT NULL CHECK (record_type IN (
        'fastest_time',        -- Best completion time
        'highest_avg_speed',   -- Best average speed
        'lowest_time',         -- Shortest duration (same as fastest_time but explicit)
        'most_distance'        -- Longest distance variant of route
    )),

    -- Metrics
    best_time_min INTEGER CHECK (best_time_min > 0),
    best_avg_speed_kmh NUMERIC(4,1) CHECK (best_avg_speed_kmh > 0),
    best_distance_km NUMERIC(6,2) CHECK (best_distance_km > 0),

    -- Previous record reference (for improvement tracking)
    previous_record_id UUID REFERENCES public.user_personal_records(id) ON DELETE SET NULL,
    improvement_percentage NUMERIC(5,2), -- How much better than previous (%)

    -- Timestamps
    achieved_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, route_id, record_type),
    CONSTRAINT valid_record_metrics CHECK (
        (record_type = 'fastest_time' AND best_time_min IS NOT NULL) OR
        (record_type = 'highest_avg_speed' AND best_avg_speed_kmh IS NOT NULL) OR
        (record_type = 'lowest_time' AND best_time_min IS NOT NULL) OR
        (record_type = 'most_distance' AND best_distance_km IS NOT NULL)
    )
);

-- Add table comment
COMMENT ON TABLE public.user_personal_records IS 'Personal best records for each user-route combination';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_personal_records_user_route
ON public.user_personal_records(user_id, route_id, record_type);

CREATE INDEX IF NOT EXISTS idx_user_personal_records_achieved
ON public.user_personal_records(user_id, achieved_at DESC);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_personal_records_leaderboard
ON public.user_personal_records(route_id, record_type, best_time_min ASC NULLS LAST);

-- ============================================
-- E) CREATE TABLE user_stats_monthly
-- Pre-aggregated monthly statistics for performance
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_stats_monthly (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Time period
    year INTEGER NOT NULL CHECK (year >= 2026 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),

    -- Ride metrics
    total_distance_km NUMERIC(10,2) DEFAULT 0 CHECK (total_distance_km >= 0),
    total_rides INTEGER DEFAULT 0 CHECK (total_rides >= 0),
    total_duration_min INTEGER DEFAULT 0 CHECK (total_duration_min >= 0),
    total_elevation_gain_m INTEGER DEFAULT 0 CHECK (total_elevation_gain_m >= 0),

    -- Performance metrics
    avg_speed_kmh NUMERIC(4,1) CHECK (avg_speed_kmh >= 0),
    max_speed_kmh NUMERIC(4,1) CHECK (max_speed_kmh >= 0),
    avg_distance_per_ride_km NUMERIC(6,2) CHECK (avg_distance_per_ride_km >= 0),

    -- Health metrics
    total_calories_burned INTEGER DEFAULT 0 CHECK (total_calories_burned >= 0),

    -- Engagement metrics
    routes_completed INTEGER DEFAULT 0 CHECK (routes_completed >= 0),
    unique_routes_completed INTEGER DEFAULT 0 CHECK (unique_routes_completed >= 0),
    waypoints_visited INTEGER DEFAULT 0 CHECK (waypoints_visited >= 0),
    businesses_visited INTEGER DEFAULT 0 CHECK (businesses_visited >= 0),

    -- Favorites
    favorite_route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    favorite_route_rides INTEGER DEFAULT 0,

    -- Gamification
    achievements_unlocked INTEGER DEFAULT 0 CHECK (achievements_unlocked >= 0),
    total_points_earned INTEGER DEFAULT 0 CHECK (total_points_earned >= 0),

    -- Comparisons (vs previous month)
    distance_change_percent NUMERIC(5,2),
    rides_change_percent NUMERIC(5,2),
    speed_change_percent NUMERIC(5,2),

    -- Timestamps
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, year, month)
);

-- Add table comment
COMMENT ON TABLE public.user_stats_monthly IS 'Pre-aggregated monthly statistics for dashboard performance optimization';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_monthly_user_period
ON public.user_stats_monthly(user_id, year DESC, month DESC);

CREATE INDEX IF NOT EXISTS idx_user_stats_monthly_calculated
ON public.user_stats_monthly(calculated_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER set_user_stats_monthly_updated_at
    BEFORE UPDATE ON public.user_stats_monthly
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- F) FUNCTIONS AND TRIGGERS
-- Auto-update metrics and calculate derived values
-- ============================================

-- Function: Calculate calories burned using MET formula
-- Formula: Calories = MET × weight_kg × duration_hours
-- MET values: 8.0 (moderate 20-25 km/h), 10.0 (vigorous 25-30 km/h), 12.0 (racing >30 km/h)
CREATE OR REPLACE FUNCTION public.calculate_calories_burned()
RETURNS TRIGGER AS $$
DECLARE
    user_weight_kg NUMERIC;
    duration_hours NUMERIC;
    met_value NUMERIC;
    calculated_calories INTEGER;
BEGIN
    -- Only calculate if completion is successful and duration exists
    IF NEW.status = 'completed' AND NEW.total_duration IS NOT NULL AND NEW.total_duration > 0 THEN

        -- Get user weight from preferences (default 70kg if not set)
        SELECT COALESCE((preferences->>'weight_kg')::NUMERIC, 70)
        INTO user_weight_kg
        FROM public.profiles
        WHERE id = NEW.user_id;

        -- Convert duration to hours
        duration_hours := NEW.total_duration / 60.0;

        -- Determine MET value based on average speed
        IF NEW.avg_speed_kmh IS NULL THEN
            met_value := 8.0; -- Default moderate effort
        ELSIF NEW.avg_speed_kmh < 20 THEN
            met_value := 6.0; -- Light effort (<20 km/h)
        ELSIF NEW.avg_speed_kmh < 25 THEN
            met_value := 8.0; -- Moderate effort (20-25 km/h)
        ELSIF NEW.avg_speed_kmh < 30 THEN
            met_value := 10.0; -- Vigorous effort (25-30 km/h)
        ELSE
            met_value := 12.0; -- Racing effort (>30 km/h)
        END IF;

        -- Calculate calories
        calculated_calories := ROUND(met_value * user_weight_kg * duration_hours);

        -- Update if not already set
        IF NEW.calories_burned IS NULL THEN
            NEW.calories_burned := calculated_calories;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_calories_on_completion
    BEFORE INSERT OR UPDATE ON public.route_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_calories_burned();

COMMENT ON FUNCTION public.calculate_calories_burned IS 'Auto-calculate calories burned using MET formula based on speed and duration';

-- Function: Calculate speed metrics from GPS data
CREATE OR REPLACE FUNCTION public.calculate_speed_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate average speed if distance and duration are present
    IF NEW.status = 'completed' AND
       NEW.distance_actual_km IS NOT NULL AND
       NEW.total_duration IS NOT NULL AND
       NEW.total_duration > 0 THEN

        -- Average speed = distance (km) / duration (hours)
        NEW.avg_speed_kmh := ROUND(
            (NEW.distance_actual_km / (NEW.total_duration / 60.0))::NUMERIC,
            1
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_speed_on_completion
    BEFORE INSERT OR UPDATE ON public.route_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_speed_metrics();

COMMENT ON FUNCTION public.calculate_speed_metrics IS 'Auto-calculate average speed from distance and duration';

-- Function: Check and update personal records
CREATE OR REPLACE FUNCTION public.update_personal_records()
RETURNS TRIGGER AS $$
DECLARE
    current_fastest_time INTEGER;
    current_best_speed NUMERIC;
    previous_pr_id UUID;
    improvement NUMERIC;
BEGIN
    -- Only process completed rides with valid metrics
    IF NEW.status = 'completed' AND NEW.total_duration IS NOT NULL THEN

        -- Check fastest time record
        SELECT best_time_min, id INTO current_fastest_time, previous_pr_id
        FROM public.user_personal_records
        WHERE user_id = NEW.user_id
          AND route_id = NEW.route_id
          AND record_type = 'fastest_time';

        IF current_fastest_time IS NULL OR NEW.total_duration < current_fastest_time THEN
            -- Calculate improvement
            IF current_fastest_time IS NOT NULL THEN
                improvement := ROUND(
                    ((current_fastest_time::NUMERIC - NEW.total_duration::NUMERIC) / current_fastest_time::NUMERIC * 100)::NUMERIC,
                    2
                );
            ELSE
                improvement := NULL; -- First record
            END IF;

            -- Insert or update record
            INSERT INTO public.user_personal_records (
                user_id, route_id, completion_id, record_type,
                best_time_min, previous_record_id, improvement_percentage, achieved_at
            ) VALUES (
                NEW.user_id, NEW.route_id, NEW.id, 'fastest_time',
                NEW.total_duration, previous_pr_id, improvement, NEW.completed_at
            )
            ON CONFLICT (user_id, route_id, record_type)
            DO UPDATE SET
                best_time_min = NEW.total_duration,
                completion_id = NEW.id,
                previous_record_id = previous_pr_id,
                improvement_percentage = improvement,
                achieved_at = NEW.completed_at;
        END IF;

        -- Check highest average speed record
        IF NEW.avg_speed_kmh IS NOT NULL THEN
            SELECT best_avg_speed_kmh, id INTO current_best_speed, previous_pr_id
            FROM public.user_personal_records
            WHERE user_id = NEW.user_id
              AND route_id = NEW.route_id
              AND record_type = 'highest_avg_speed';

            IF current_best_speed IS NULL OR NEW.avg_speed_kmh > current_best_speed THEN
                -- Calculate improvement
                IF current_best_speed IS NOT NULL THEN
                    improvement := ROUND(
                        ((NEW.avg_speed_kmh - current_best_speed) / current_best_speed * 100)::NUMERIC,
                        2
                    );
                ELSE
                    improvement := NULL;
                END IF;

                INSERT INTO public.user_personal_records (
                    user_id, route_id, completion_id, record_type,
                    best_avg_speed_kmh, previous_record_id, improvement_percentage, achieved_at
                ) VALUES (
                    NEW.user_id, NEW.route_id, NEW.id, 'highest_avg_speed',
                    NEW.avg_speed_kmh, previous_pr_id, improvement, NEW.completed_at
                )
                ON CONFLICT (user_id, route_id, record_type)
                DO UPDATE SET
                    best_avg_speed_kmh = NEW.avg_speed_kmh,
                    completion_id = NEW.id,
                    previous_record_id = previous_pr_id,
                    improvement_percentage = improvement,
                    achieved_at = NEW.completed_at;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_personal_records_on_completion
    AFTER INSERT OR UPDATE ON public.route_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_personal_records();

COMMENT ON FUNCTION public.update_personal_records IS 'Automatically update personal records when completing routes';

-- Function: Update user achievements
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS TRIGGER AS $$
DECLARE
    total_distance NUMERIC;
    total_rides INTEGER;
    achievement_record RECORD;
BEGIN
    -- Only check for completed rides
    IF NEW.status = 'completed' THEN

        -- Get user totals
        SELECT
            COALESCE(SUM(distance_actual_km), 0),
            COUNT(*)
        INTO total_distance, total_rides
        FROM public.route_completions
        WHERE user_id = NEW.user_id
          AND status = 'completed';

        -- Check first ride achievement
        IF total_rides = 1 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, progress_current, progress_target, is_unlocked, unlocked_at, points_awarded)
            VALUES (NEW.user_id, 'first_ride', 1, 1, TRUE, NOW(), 50)
            ON CONFLICT (user_id, achievement_type) DO NOTHING;
        END IF;

        -- Check distance milestones
        IF total_distance >= 100 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, progress_current, progress_target, is_unlocked, unlocked_at, points_awarded, metadata)
            VALUES (NEW.user_id, 'distance_100km_total', total_distance, 100, TRUE, NOW(), 100, jsonb_build_object('total_distance', total_distance))
            ON CONFLICT (user_id, achievement_type) DO UPDATE SET progress_current = total_distance, is_unlocked = TRUE, unlocked_at = COALESCE(user_achievements.unlocked_at, NOW());
        END IF;

        IF total_distance >= 500 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, progress_current, progress_target, is_unlocked, unlocked_at, points_awarded, metadata)
            VALUES (NEW.user_id, 'distance_500km_total', total_distance, 500, TRUE, NOW(), 250, jsonb_build_object('total_distance', total_distance))
            ON CONFLICT (user_id, achievement_type) DO UPDATE SET progress_current = total_distance, is_unlocked = TRUE, unlocked_at = COALESCE(user_achievements.unlocked_at, NOW());
        END IF;

        -- Check speed demon (40+ km/h average)
        IF NEW.avg_speed_kmh IS NOT NULL AND NEW.avg_speed_kmh >= 40 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, progress_current, progress_target, is_unlocked, unlocked_at, points_awarded, metadata)
            VALUES (NEW.user_id, 'speed_demon', NEW.avg_speed_kmh, 40, TRUE, NOW(), 200, jsonb_build_object('speed', NEW.avg_speed_kmh, 'route_id', NEW.route_id))
            ON CONFLICT (user_id, achievement_type) DO NOTHING;
        END IF;

        -- Check 10 routes completed
        IF total_rides >= 10 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, progress_current, progress_target, is_unlocked, unlocked_at, points_awarded)
            VALUES (NEW.user_id, 'routes_completed_10', total_rides, 10, TRUE, NOW(), 150)
            ON CONFLICT (user_id, achievement_type) DO UPDATE SET progress_current = total_rides, is_unlocked = TRUE, unlocked_at = COALESCE(user_achievements.unlocked_at, NOW());
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_achievements_on_completion
    AFTER INSERT OR UPDATE ON public.route_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_achievements();

COMMENT ON FUNCTION public.check_achievements IS 'Automatically check and unlock achievements on route completion';

-- Function: Update monthly statistics
-- This should be called by a scheduled job (cron/pg_cron) at month end
CREATE OR REPLACE FUNCTION public.aggregate_monthly_stats(target_year INTEGER, target_month INTEGER)
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    start_date TIMESTAMPTZ;
    end_date TIMESTAMPTZ;
BEGIN
    -- Calculate period boundaries
    start_date := make_timestamptz(target_year, target_month, 1, 0, 0, 0, 'UTC');
    end_date := start_date + INTERVAL '1 month';

    -- Aggregate for each user
    FOR user_record IN
        SELECT DISTINCT user_id
        FROM public.route_completions
        WHERE completed_at >= start_date
          AND completed_at < end_date
          AND status = 'completed'
    LOOP
        INSERT INTO public.user_stats_monthly (
            user_id, year, month,
            total_distance_km, total_rides, total_duration_min, total_elevation_gain_m,
            avg_speed_kmh, max_speed_kmh, avg_distance_per_ride_km,
            total_calories_burned,
            routes_completed, unique_routes_completed,
            waypoints_visited, businesses_visited,
            achievements_unlocked, total_points_earned,
            calculated_at
        )
        SELECT
            user_record.user_id,
            target_year,
            target_month,
            COALESCE(SUM(distance_actual_km), 0),
            COUNT(*),
            COALESCE(SUM(total_duration), 0),
            COALESCE(SUM(elevation_gain_actual_m), 0),
            ROUND(AVG(avg_speed_kmh)::NUMERIC, 1),
            MAX(max_speed_kmh),
            ROUND(AVG(distance_actual_km)::NUMERIC, 2),
            COALESCE(SUM(calories_burned), 0),
            COUNT(*),
            COUNT(DISTINCT route_id),
            COALESCE(SUM(jsonb_array_length(waypoints_visited)), 0),
            COALESCE(SUM(businesses_count), 0),
            (SELECT COUNT(*) FROM public.user_achievements
             WHERE user_id = user_record.user_id
               AND unlocked_at >= start_date
               AND unlocked_at < end_date),
            COALESCE(SUM(points_earned), 0),
            NOW()
        FROM public.route_completions
        WHERE user_id = user_record.user_id
          AND completed_at >= start_date
          AND completed_at < end_date
          AND status = 'completed'
        ON CONFLICT (user_id, year, month) DO UPDATE SET
            total_distance_km = EXCLUDED.total_distance_km,
            total_rides = EXCLUDED.total_rides,
            total_duration_min = EXCLUDED.total_duration_min,
            total_elevation_gain_m = EXCLUDED.total_elevation_gain_m,
            avg_speed_kmh = EXCLUDED.avg_speed_kmh,
            max_speed_kmh = EXCLUDED.max_speed_kmh,
            avg_distance_per_ride_km = EXCLUDED.avg_distance_per_ride_km,
            total_calories_burned = EXCLUDED.total_calories_burned,
            routes_completed = EXCLUDED.routes_completed,
            unique_routes_completed = EXCLUDED.unique_routes_completed,
            waypoints_visited = EXCLUDED.waypoints_visited,
            businesses_visited = EXCLUDED.businesses_visited,
            achievements_unlocked = EXCLUDED.achievements_unlocked,
            total_points_earned = EXCLUDED.total_points_earned,
            calculated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.aggregate_monthly_stats IS 'Aggregate monthly statistics for all users (run via cron at month end)';

-- ============================================
-- G) ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats_monthly ENABLE ROW LEVEL SECURITY;

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
    ON public.user_achievements
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view all achievements for public profiles"
    ON public.user_achievements
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_achievements.user_id
        AND (preferences->>'profile_visibility')::TEXT = 'public'
    ));

CREATE POLICY "System can manage achievements"
    ON public.user_achievements
    FOR ALL
    USING (auth.uid() = user_id);

-- Policies for user_goals
CREATE POLICY "Users can manage their own goals"
    ON public.user_goals
    FOR ALL
    USING (auth.uid() = user_id);

-- Policies for user_personal_records
CREATE POLICY "Users can view their own records"
    ON public.user_personal_records
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view records for public leaderboards"
    ON public.user_personal_records
    FOR SELECT
    USING (true); -- Leaderboards are public

CREATE POLICY "System can manage personal records"
    ON public.user_personal_records
    FOR ALL
    USING (auth.uid() = user_id);

-- Policies for user_stats_monthly
CREATE POLICY "Users can view their own stats"
    ON public.user_stats_monthly
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public stats for comparisons"
    ON public.user_stats_monthly
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_stats_monthly.user_id
        AND (preferences->>'profile_visibility')::TEXT = 'public'
    ));

-- ============================================
-- H) INITIAL DATA SEEDING
-- Seed default achievement definitions
-- ============================================

-- Note: In production, achievements would be seeded for users as they sign up
-- This is a template showing achievement structure

COMMENT ON TABLE public.user_achievements IS
$doc$
Achievement Types and Point Values:
- first_ride (50 pts): Complete first route
- speed_demon (200 pts): Reach 40+ km/h average
- distance_10km (30 pts): Complete 10km in one ride
- distance_50km (100 pts): Complete 50km in one ride
- distance_100km_total (100 pts): Total 100km accumulated
- distance_500km_total (250 pts): Total 500km accumulated
- distance_1000km_total (500 pts): Total 1000km accumulated
- routes_completed_10 (150 pts): Complete 10 different routes
- routes_completed_50 (400 pts): Complete 50 different routes
- streak_7_days (100 pts): Ride 7 consecutive days
- streak_30_days (300 pts): Ride 30 consecutive days
- early_bird (50 pts): Complete ride before 7am
- night_rider (50 pts): Complete ride after 8pm
- explorer (75 pts): Visit 20 different waypoints
- supporter (200 pts): Purchase 5 premium routes
- socialite (100 pts): Leave 10 reviews
- cenote_hunter (150 pts): Visit 10 cenotes
- elevation_master (200 pts): Climb 1000m cumulative
- all_weather (100 pts): Ride in 3+ weather conditions
- route_creator (150 pts): Create and publish first route
$doc$;

-- ============================================
-- I) UTILITY VIEWS FOR ANALYTICS
-- ============================================

-- View: User dashboard summary
CREATE OR REPLACE VIEW public.user_dashboard_summary AS
SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_url,

    -- Overall stats
    COUNT(DISTINCT rc.id) FILTER (WHERE rc.status = 'completed') AS total_rides,
    COUNT(DISTINCT rc.route_id) FILTER (WHERE rc.status = 'completed') AS unique_routes,
    COALESCE(SUM(rc.distance_actual_km) FILTER (WHERE rc.status = 'completed'), 0) AS total_distance_km,
    COALESCE(SUM(rc.total_duration) FILTER (WHERE rc.status = 'completed'), 0) AS total_duration_min,
    COALESCE(SUM(rc.calories_burned) FILTER (WHERE rc.status = 'completed'), 0) AS total_calories,
    COALESCE(SUM(rc.elevation_gain_actual_m) FILTER (WHERE rc.status = 'completed'), 0) AS total_elevation_m,

    -- Performance stats
    ROUND(AVG(rc.avg_speed_kmh) FILTER (WHERE rc.status = 'completed' AND rc.avg_speed_kmh IS NOT NULL), 1) AS avg_speed_kmh,
    MAX(rc.max_speed_kmh) FILTER (WHERE rc.status = 'completed') AS max_speed_kmh,

    -- Achievements
    COUNT(DISTINCT ua.id) FILTER (WHERE ua.is_unlocked = TRUE) AS achievements_unlocked,
    COALESCE(SUM(ua.points_awarded) FILTER (WHERE ua.is_unlocked = TRUE), 0) AS total_achievement_points,

    -- Goals
    COUNT(DISTINCT ug.id) FILTER (WHERE ug.status = 'active') AS active_goals,
    COUNT(DISTINCT ug.id) FILTER (WHERE ug.status = 'completed') AS completed_goals,

    -- Recent activity
    MAX(rc.completed_at) FILTER (WHERE rc.status = 'completed') AS last_ride_at

FROM public.profiles p
LEFT JOIN public.route_completions rc ON p.id = rc.user_id
LEFT JOIN public.user_achievements ua ON p.id = ua.user_id
LEFT JOIN public.user_goals ug ON p.id = ug.user_id
GROUP BY p.id, p.full_name, p.avatar_url;

COMMENT ON VIEW public.user_dashboard_summary IS 'Complete user stats for dashboard display';

-- View: Route leaderboards
CREATE OR REPLACE VIEW public.route_leaderboards AS
SELECT
    r.id AS route_id,
    r.name AS route_name,
    r.slug AS route_slug,

    -- Fastest time leaderboard
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'user_id', p.id,
                'user_name', p.full_name,
                'avatar_url', p.avatar_url,
                'time_min', pr.best_time_min,
                'achieved_at', pr.achieved_at,
                'rank', ROW_NUMBER() OVER (ORDER BY pr.best_time_min ASC)
            )
            ORDER BY pr.best_time_min ASC
        )
        FROM public.user_personal_records pr
        JOIN public.profiles p ON pr.user_id = p.id
        WHERE pr.route_id = r.id
          AND pr.record_type = 'fastest_time'
        LIMIT 10
    ) AS fastest_times_top10,

    -- Highest speed leaderboard
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'user_id', p.id,
                'user_name', p.full_name,
                'avatar_url', p.avatar_url,
                'avg_speed_kmh', pr.best_avg_speed_kmh,
                'achieved_at', pr.achieved_at,
                'rank', ROW_NUMBER() OVER (ORDER BY pr.best_avg_speed_kmh DESC)
            )
            ORDER BY pr.best_avg_speed_kmh DESC
        )
        FROM public.user_personal_records pr
        JOIN public.profiles p ON pr.user_id = p.id
        WHERE pr.route_id = r.id
          AND pr.record_type = 'highest_avg_speed'
        LIMIT 10
    ) AS highest_speeds_top10

FROM public.routes r
WHERE r.status = 'publicado';

COMMENT ON VIEW public.route_leaderboards IS 'Pre-computed leaderboards for each route (fastest times and highest speeds)';

-- ============================================
-- J) GRANTS AND PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT ON public.user_dashboard_summary TO authenticated;
GRANT SELECT ON public.route_leaderboards TO authenticated;
GRANT SELECT ON public.route_leaderboards TO anon; -- Public leaderboards

GRANT ALL ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_goals TO authenticated;
GRANT ALL ON public.user_personal_records TO authenticated;
GRANT ALL ON public.user_stats_monthly TO authenticated;

-- ============================================
-- END OF MIGRATION
-- ============================================

-- Summary of changes:
-- - Extended route_completions with 7 new performance tracking columns
-- - Created user_achievements table (19 achievement types)
-- - Created user_goals table (7 goal types)
-- - Created user_personal_records table (4 record types)
-- - Created user_stats_monthly table (pre-aggregated stats)
-- - Added 5 automatic triggers (calories, speed, records, achievements, timestamps)
-- - Created 2 views for analytics (dashboard, leaderboards)
-- - Enabled RLS with appropriate policies
-- - Added comprehensive indexes for performance
