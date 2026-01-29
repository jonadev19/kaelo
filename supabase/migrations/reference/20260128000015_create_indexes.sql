-- Create comprehensive indexes for performance optimization
-- Geospatial indexes, foreign key indexes, and query optimization indexes

-- ============================================
-- GEOSPATIAL INDEXES (PostGIS GIST)
-- ============================================

-- Routes geospatial indexes
CREATE INDEX IF NOT EXISTS idx_routes_route_geometry
ON public.routes USING GIST (route_geometry);

CREATE INDEX IF NOT EXISTS idx_routes_start_location
ON public.routes USING GIST (start_location);

CREATE INDEX IF NOT EXISTS idx_routes_end_location
ON public.routes USING GIST (end_location);

COMMENT ON INDEX idx_routes_route_geometry IS 'Spatial index for route geometry queries';
COMMENT ON INDEX idx_routes_start_location IS 'Spatial index for route start locations';
COMMENT ON INDEX idx_routes_end_location IS 'Spatial index for route end locations';

-- Route waypoints geospatial index
CREATE INDEX IF NOT EXISTS idx_route_waypoints_location
ON public.route_waypoints USING GIST (location);

COMMENT ON INDEX idx_route_waypoints_location IS 'Spatial index for waypoint locations';

-- Businesses geospatial index
CREATE INDEX IF NOT EXISTS idx_businesses_location
ON public.businesses USING GIST (location);

COMMENT ON INDEX idx_businesses_location IS 'Spatial index for business locations';

-- Route purchases geospatial index
CREATE INDEX IF NOT EXISTS idx_route_purchases_location
ON public.route_purchases USING GIST (purchase_location);

COMMENT ON INDEX idx_route_purchases_location IS 'Spatial index for purchase locations';

-- Route completions geospatial index
CREATE INDEX IF NOT EXISTS idx_route_completions_path
ON public.route_completions USING GIST (actual_path);

COMMENT ON INDEX idx_route_completions_path IS 'Spatial index for completion paths';

-- Sponsored segments geospatial index
CREATE INDEX IF NOT EXISTS idx_sponsored_segments_geometry
ON public.sponsored_segments USING GIST (segment_geometry);

COMMENT ON INDEX idx_sponsored_segments_geometry IS 'Spatial index for sponsored segment geometry';

-- ============================================
-- PROFILES INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_username
ON public.profiles(username) WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_user_type
ON public.profiles(user_type);

CREATE INDEX IF NOT EXISTS idx_profiles_points
ON public.profiles(points DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_level
ON public.profiles(level DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_active
ON public.profiles(is_active, last_active_at DESC) WHERE is_active = true;

-- ============================================
-- ROUTES INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_routes_creator
ON public.routes(creator_id);

CREATE INDEX IF NOT EXISTS idx_routes_category
ON public.routes(category);

CREATE INDEX IF NOT EXISTS idx_routes_difficulty
ON public.routes(difficulty);

CREATE INDEX IF NOT EXISTS idx_routes_published
ON public.routes(is_published, published_at DESC) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_routes_featured
ON public.routes(is_featured, rating DESC) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_routes_rating
ON public.routes(rating DESC, total_reviews DESC);

CREATE INDEX IF NOT EXISTS idx_routes_popular
ON public.routes(total_completions DESC, total_saves DESC);

CREATE INDEX IF NOT EXISTS idx_routes_tags
ON public.routes USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_routes_search
ON public.routes(is_published, category, difficulty, rating DESC)
WHERE is_published = true;

-- ============================================
-- ROUTE WAYPOINTS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_waypoints_route
ON public.route_waypoints(route_id, order_index);

CREATE INDEX IF NOT EXISTS idx_waypoints_type
ON public.route_waypoints(waypoint_type);

-- ============================================
-- BUSINESSES INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_owner
ON public.businesses(owner_id) WHERE owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_category
ON public.businesses(category);

CREATE INDEX IF NOT EXISTS idx_businesses_city
ON public.businesses(city, category);

CREATE INDEX IF NOT EXISTS idx_businesses_active
ON public.businesses(is_active, is_verified) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_businesses_verified
ON public.businesses(is_verified, rating DESC) WHERE is_verified = true;

CREATE INDEX IF NOT EXISTS idx_businesses_sponsored
ON public.businesses(is_sponsored, rating DESC) WHERE is_sponsored = true;

CREATE INDEX IF NOT EXISTS idx_businesses_rating
ON public.businesses(rating DESC, total_reviews DESC);

CREATE INDEX IF NOT EXISTS idx_businesses_tags
ON public.businesses USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_businesses_amenities
ON public.businesses USING GIN (amenities);

-- ============================================
-- ROUTE BUSINESSES INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_route_businesses_route
ON public.route_businesses(route_id, order_index);

CREATE INDEX IF NOT EXISTS idx_route_businesses_business
ON public.route_businesses(business_id);

-- ============================================
-- PRODUCTS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_business
ON public.products(business_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_category
ON public.products(category, is_available) WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_products_featured
ON public.products(is_featured, rating DESC) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_products_price
ON public.products(price, discount_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_products_tags
ON public.products USING GIN (tags);

-- ============================================
-- ORDERS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_user
ON public.orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_business
ON public.orders(business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON public.orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
ON public.orders(payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_number
ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_orders_scheduled
ON public.orders(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- ============================================
-- ORDER ITEMS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_order_items_order
ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product
ON public.order_items(product_id);

-- ============================================
-- REVIEWS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reviews_user
ON public.reviews(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_route
ON public.reviews(route_id, is_visible, created_at DESC)
WHERE route_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_business
ON public.reviews(business_id, is_visible, created_at DESC)
WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_rating
ON public.reviews(rating DESC, helpful_count DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_verified
ON public.reviews(is_verified_visit, rating DESC)
WHERE is_verified_visit = true;

-- ============================================
-- REVIEW HELPFULNESS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review
ON public.review_helpfulness(review_id);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_user
ON public.review_helpfulness(user_id);

-- ============================================
-- COUPONS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_coupons_business
ON public.business_coupons(business_id, is_active, valid_until)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coupons_code
ON public.business_coupons(code, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coupons_route_requirement
ON public.business_coupons(required_route_id)
WHERE requires_route_completion = true;

CREATE INDEX IF NOT EXISTS idx_coupons_validity
ON public.business_coupons(valid_from, valid_until, is_active)
WHERE is_active = true;

-- ============================================
-- UNLOCKED COUPONS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_unlocked_coupons_user
ON public.unlocked_coupons(user_id, is_used, expires_at);

CREATE INDEX IF NOT EXISTS idx_unlocked_coupons_coupon
ON public.unlocked_coupons(coupon_id);

-- ============================================
-- SPONSORED SEGMENTS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sponsored_business
ON public.sponsored_segments(business_id, is_active);

CREATE INDEX IF NOT EXISTS idx_sponsored_route
ON public.sponsored_segments(route_id, is_active, priority DESC);

CREATE INDEX IF NOT EXISTS idx_sponsored_active
ON public.sponsored_segments(is_active, active_from, active_until)
WHERE is_active = true;

-- ============================================
-- COMPOSITE TEXT SEARCH INDEXES
-- ============================================

-- Full text search for routes
CREATE INDEX IF NOT EXISTS idx_routes_fts
ON public.routes USING GIN (
    to_tsvector('spanish',
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(array_to_string(tags, ' '), '')
    )
);

-- Full text search for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_fts
ON public.businesses USING GIN (
    to_tsvector('spanish',
        COALESCE(name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(array_to_string(tags, ' '), '')
    )
);

-- Full text search for products
CREATE INDEX IF NOT EXISTS idx_products_fts
ON public.products USING GIN (
    to_tsvector('spanish',
        COALESCE(name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(array_to_string(tags, ' '), '')
    )
);

COMMENT ON INDEX idx_routes_fts IS 'Full text search index for routes';
COMMENT ON INDEX idx_businesses_fts IS 'Full text search index for businesses';
COMMENT ON INDEX idx_products_fts IS 'Full text search index for products';

-- ============================================
-- ANALYTICS AND REPORTING INDEXES
-- ============================================

-- Time-based analytics indexes
CREATE INDEX IF NOT EXISTS idx_route_completions_analytics
ON public.route_completions(route_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_route_purchases_analytics
ON public.route_purchases(route_id, business_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_analytics
ON public.orders(business_id, status, created_at DESC, total);

-- User activity tracking
CREATE INDEX IF NOT EXISTS idx_profiles_activity
ON public.profiles(last_active_at DESC) WHERE is_active = true;

-- Performance monitoring
CREATE INDEX IF NOT EXISTS idx_sponsored_performance
ON public.sponsored_segments(business_id, impressions DESC, clicks DESC, conversions DESC);
