-- Enable Row Level Security (RLS) on all tables
-- Policies will be defined in separate migration files

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Routes
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_completions ENABLE ROW LEVEL SECURITY;

-- Businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_businesses ENABLE ROW LEVEL SECURITY;

-- Products and Orders
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Purchases
ALTER TABLE public.route_purchases ENABLE ROW LEVEL SECURITY;

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Coupons and Promotions
ALTER TABLE public.business_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_segments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY COMMENTS
-- ============================================

COMMENT ON TABLE public.profiles IS
'User profiles with RLS enabled. Policies will control read/write access.';

COMMENT ON TABLE public.routes IS
'Routes with RLS enabled. Published routes are public, drafts are private to creator.';

COMMENT ON TABLE public.businesses IS
'Businesses with RLS enabled. Active businesses are public, drafts are private to owner.';

COMMENT ON TABLE public.orders IS
'Orders with RLS enabled. Users can only see their own orders, businesses see orders placed with them.';

COMMENT ON TABLE public.notifications IS
'Notifications with RLS enabled. Users can only see their own notifications.';

-- ============================================
-- GRANT AUTHENTICATED USER PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on all tables to authenticated users
-- (RLS policies will control actual access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant insert, update, delete on tables to authenticated users
-- (RLS policies will control actual access)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- SECURITY FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND user_type = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS
'Check if a user has admin privileges';

-- Function to check if user is business owner
CREATE OR REPLACE FUNCTION public.is_business_owner(user_id UUID, business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.businesses
        WHERE id = business_id AND owner_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_business_owner IS
'Check if a user owns a specific business';

-- Function to check if user is route creator
CREATE OR REPLACE FUNCTION public.is_route_creator(user_id UUID, route_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.routes
        WHERE id = route_id AND creator_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_route_creator IS
'Check if a user created a specific route';

-- Function to get current user ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_current_user_id IS
'Get the ID of the currently authenticated user';

-- ============================================
-- SECURITY DEFINER FUNCTIONS FOR SAFE OPERATIONS
-- ============================================

-- Safe function to increment view count
CREATE OR REPLACE FUNCTION public.increment_route_view(route_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.routes
    SET total_completions = total_completions + 1
    WHERE id = route_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe function to increment business visit count
CREATE OR REPLACE FUNCTION public.increment_business_visit(business_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.businesses
    SET total_visits = total_visits + 1
    WHERE id = business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TABLE OWNERSHIP
-- ============================================

-- Set table owners to postgres (default)
-- This ensures proper RLS enforcement

ALTER TABLE public.profiles OWNER TO postgres;
ALTER TABLE public.routes OWNER TO postgres;
ALTER TABLE public.route_waypoints OWNER TO postgres;
ALTER TABLE public.businesses OWNER TO postgres;
ALTER TABLE public.route_businesses OWNER TO postgres;
ALTER TABLE public.products OWNER TO postgres;
ALTER TABLE public.orders OWNER TO postgres;
ALTER TABLE public.order_items OWNER TO postgres;
ALTER TABLE public.route_purchases OWNER TO postgres;
ALTER TABLE public.reviews OWNER TO postgres;
ALTER TABLE public.review_helpfulness OWNER TO postgres;
ALTER TABLE public.saved_routes OWNER TO postgres;
ALTER TABLE public.route_completions OWNER TO postgres;
ALTER TABLE public.notifications OWNER TO postgres;
ALTER TABLE public.notification_preferences OWNER TO postgres;
ALTER TABLE public.business_coupons OWNER TO postgres;
ALTER TABLE public.unlocked_coupons OWNER TO postgres;
ALTER TABLE public.sponsored_segments OWNER TO postgres;

-- ============================================
-- READY FOR POLICIES
-- ============================================

-- RLS is now enabled on all tables
-- Next step: Create RLS policies in separate migration files
-- Policies should define:
--   - Public read access for published content
--   - Owner-only write access
--   - Admin override capabilities
--   - Privacy controls based on user preferences
