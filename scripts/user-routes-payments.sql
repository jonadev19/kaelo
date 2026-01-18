-- ================================================
-- User Routes & Payments Schema
-- Run this in your Supabase SQL Editor
-- ================================================

-- Ensure user_routes table has payment columns
-- If table exists, just add the columns
DO $$
BEGIN
    -- Add payment_amount column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_routes' AND column_name = 'payment_amount'
    ) THEN
        ALTER TABLE user_routes ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add payment_reference column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_routes' AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE user_routes ADD COLUMN payment_reference TEXT;
    END IF;

    -- Add purchased_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_routes' AND column_name = 'purchased_at'
    ) THEN
        ALTER TABLE user_routes ADD COLUMN purchased_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create function to increment route purchases (optional, for analytics)
CREATE OR REPLACE FUNCTION increment_route_purchases(route_id UUID)
RETURNS void AS $$
BEGIN
    -- This function can be extended to update purchase counters on routes table
    -- For now, it's a no-op since we track purchases in user_routes
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_route_purchases(UUID) TO authenticated;

-- Ensure RLS policies allow inserting purchases
-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their own route access" ON user_routes;

-- Create policy for inserting route purchases
CREATE POLICY "Users can insert their own route access"
ON user_routes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure users can read their own routes
DROP POLICY IF EXISTS "Users can view their own routes" ON user_routes;

CREATE POLICY "Users can view their own routes"
ON user_routes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ================================================
-- Verify the setup
-- ================================================
-- Run this to verify columns exist:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_routes';
