/**
 * Routes Service
 * Handles all route-related API calls to Supabase
 */

import { supabase } from '@/lib/supabase';
import type {
    BusinessForMap,
    Coordinate,
    GeoJSONLineString,
    GeoJSONPoint,
    NearbyBusinessResult,
    NearbyRouteResult,
    Route,
    RouteForMap,
    RouteWaypoint,
} from '@/types';

// ============================================
// Helper Functions
// ============================================

/**
 * Convert GeoJSON Point to Coordinate
 */
function geoJSONPointToCoordinate(point: GeoJSONPoint | null): Coordinate | null {
    if (!point || !point.coordinates) return null;
    return {
        longitude: point.coordinates[0],
        latitude: point.coordinates[1],
    };
}

/**
 * Convert GeoJSON LineString to array of Coordinates
 */
function geoJSONLineToCoordinates(line: GeoJSONLineString | null): Coordinate[] {
    if (!line || !line.coordinates) return [];
    return line.coordinates.map(([lng, lat]) => ({
        longitude: lng,
        latitude: lat,
    }));
}

/**
 * Transform raw route from Supabase to map-friendly format
 */
function transformRouteForMap(route: Route): RouteForMap | null {
    const startPoint = geoJSONPointToCoordinate(route.start_point);
    const endPoint = geoJSONPointToCoordinate(route.end_point);
    const coordinates = geoJSONLineToCoordinates(route.route_path);

    if (!startPoint || !endPoint || coordinates.length === 0) {
        console.warn(`Route ${route.id} has invalid geometry`);
        return null;
    }

    return {
        id: route.id,
        name: route.name,
        description: route.description,
        slug: route.slug,
        coordinates,
        startPoint,
        endPoint,
        distanceKm: route.distance_km,
        elevationGainM: route.elevation_gain_m,
        estimatedDurationMin: route.estimated_duration_min,
        difficulty: route.difficulty,
        terrainType: route.terrain_type,
        price: route.price,
        isFree: route.is_free,
        coverImageUrl: route.cover_image_url,
        averageRating: route.average_rating,
        totalReviews: route.total_reviews,
        creatorName: route.creator?.full_name || null,
    };
}

// ============================================
// API Functions
// ============================================

/**
 * Fetch all published routes
 */
export async function getPublishedRoutes(): Promise<RouteForMap[]> {
    const { data, error } = await supabase
        .from('routes')
        .select(`
      *,
      creator:profiles!creator_id (
        id,
        full_name,
        avatar_url
      )
    `)
        .eq('status', 'publicado')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching routes:', error);
        throw error;
    }

    if (!data) return [];

    // Transform and filter out invalid routes
    return data
        .map(transformRouteForMap)
        .filter((route): route is RouteForMap => route !== null);
}

/**
 * Fetch routes near a location using PostGIS function
 */
export async function getRoutesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
): Promise<NearbyRouteResult[]> {
    const { data, error } = await supabase.rpc('find_routes_near_point', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
    });

    if (error) {
        console.error('Error fetching nearby routes:', error);
        throw error;
    }

    return data || [];
}

/**
 * Fetch a single route by ID with full details
 */
export async function getRouteById(routeId: string): Promise<RouteForMap | null> {
    const { data, error } = await supabase
        .from('routes')
        .select(`
      *,
      creator:profiles!creator_id (
        id,
        full_name,
        avatar_url
      )
    `)
        .eq('id', routeId)
        .single();

    if (error) {
        console.error('Error fetching route:', error);
        throw error;
    }

    if (!data) return null;

    return transformRouteForMap(data);
}

/**
 * Fetch a route by slug
 */
export async function getRouteBySlug(slug: string): Promise<RouteForMap | null> {
    const { data, error } = await supabase
        .from('routes')
        .select(`
      *,
      creator:profiles!creator_id (
        id,
        full_name,
        avatar_url
      )
    `)
        .eq('slug', slug)
        .eq('status', 'publicado')
        .single();

    if (error) {
        console.error('Error fetching route by slug:', error);
        throw error;
    }

    if (!data) return null;

    return transformRouteForMap(data);
}

/**
 * Fetch waypoints for a route
 */
export async function getRouteWaypoints(routeId: string): Promise<RouteWaypoint[]> {
    const { data, error } = await supabase
        .from('route_waypoints')
        .select('*')
        .eq('route_id', routeId)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching waypoints:', error);
        throw error;
    }

    return data || [];
}

/**
 * Fetch businesses near a route using PostGIS function
 */
export async function getBusinessesNearRoute(
    routeId: string,
    radiusMeters: number = 500
): Promise<BusinessForMap[]> {
    const { data, error } = await supabase.rpc('find_businesses_near_route', {
        target_route_id: routeId,
        radius_m: radiusMeters,
    });

    if (error) {
        console.error('Error fetching nearby businesses:', error);
        throw error;
    }

    if (!data) return [];

    // Transform to BusinessForMap format
    return data.map((business: NearbyBusinessResult) => ({
        id: business.business_id,
        name: business.name,
        type: business.business_type,
        coordinate: {
            latitude: business.location_lat,
            longitude: business.location_lng,
        },
        address: '',
        phone: null,
        logoUrl: null,
        averageRating: 0,
    }));
}

/**
 * Fetch all active businesses (for showing on map)
 */
export async function getActiveBusinesses(): Promise<BusinessForMap[]> {
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'activo');

    if (error) {
        console.error('Error fetching businesses:', error);
        throw error;
    }

    if (!data) return [];

    return data.map((business) => {
        const coord = geoJSONPointToCoordinate(business.location);
        return {
            id: business.id,
            name: business.name,
            type: business.business_type,
            coordinate: coord || { latitude: 0, longitude: 0 },
            address: business.address,
            phone: business.phone,
            logoUrl: business.logo_url,
            averageRating: business.average_rating,
        };
    }).filter((b) => b.coordinate.latitude !== 0);
}

/**
 * Search routes by name or description
 */
export async function searchRoutes(query: string): Promise<RouteForMap[]> {
    const { data, error } = await supabase
        .from('routes')
        .select(`
      *,
      creator:profiles!creator_id (
        id,
        full_name,
        avatar_url
      )
    `)
        .eq('status', 'publicado')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,municipality.ilike.%${query}%`)
        .limit(20);

    if (error) {
        console.error('Error searching routes:', error);
        throw error;
    }

    if (!data) return [];

    return data
        .map(transformRouteForMap)
        .filter((route): route is RouteForMap => route !== null);
}

/**
 * Get the nearest route to a location
 */
export async function getNearestRoute(
    latitude: number,
    longitude: number
): Promise<RouteForMap | null> {
    const nearbyRoutes = await getRoutesNearLocation(latitude, longitude, 100);

    if (nearbyRoutes.length === 0) return null;

    // Get the closest one
    const closestRouteId = nearbyRoutes[0].route_id;
    return getRouteById(closestRouteId);
}
