/**
 * Route Creation Service
 * Handles creating and saving routes to Supabase
 */

import { supabase } from '@/lib/supabase';
import type { Coordinate, Difficulty, TerrainType, WaypointType } from '@/types';

// ============================================
// Types for Route Creation
// ============================================

export interface CreateRouteData {
    name: string;
    description: string;
    difficulty: Difficulty;
    terrainType: TerrainType;
    price: number;
    isFree: boolean;
    municipality?: string;
    tags?: string[];
}

export interface CreateWaypointData {
    name: string;
    description?: string;
    waypointType: WaypointType;
    coordinate: Coordinate;
    imageUrl?: string;
}

export interface RouteCreationPayload {
    routeData: CreateRouteData;
    coordinates: Coordinate[];
    waypoints: CreateWaypointData[];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert coordinates array to PostGIS LINESTRING format
 */
function coordinatesToLineString(coordinates: Coordinate[]): string {
    if (coordinates.length < 2) {
        throw new Error('A route must have at least 2 points');
    }

    const points = coordinates
        .map(coord => `${coord.longitude} ${coord.latitude}`)
        .join(', ');

    return `LINESTRING(${points})`;
}

/**
 * Convert single coordinate to PostGIS POINT format
 */
function coordinateToPoint(coord: Coordinate): string {
    return `POINT(${coord.longitude} ${coord.latitude})`;
}

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(name: string): string {
    const baseSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
}

/**
 * Calculate distance in km from coordinates (approximation)
 */
function calculateDistance(coordinates: Coordinate[]): number {
    if (coordinates.length < 2) return 0;

    let totalDistance = 0;

    for (let i = 1; i < coordinates.length; i++) {
        const lat1 = coordinates[i - 1].latitude;
        const lon1 = coordinates[i - 1].longitude;
        const lat2 = coordinates[i].latitude;
        const lon2 = coordinates[i].longitude;

        // Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalDistance += R * c;
    }

    return Math.round(totalDistance * 100) / 100; // Round to 2 decimals
}

/**
 * Estimate duration based on distance and difficulty
 */
function estimateDuration(distanceKm: number, difficulty: Difficulty): number {
    // Average cycling speeds by difficulty (km/h)
    const speeds: Record<Difficulty, number> = {
        facil: 18,
        moderada: 15,
        dificil: 12,
        experto: 10,
    };

    const speed = speeds[difficulty] || 15;
    return Math.round((distanceKm / speed) * 60); // Return in minutes
}

// ============================================
// API Functions
// ============================================

/**
 * Create a new route with waypoints
 */
export async function createRoute(payload: RouteCreationPayload): Promise<string> {
    const { routeData, coordinates, waypoints } = payload;

    if (coordinates.length < 2) {
        throw new Error('La ruta debe tener al menos 2 puntos');
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error('Debes iniciar sesión para crear una ruta');
    }

    // Calculate route metrics
    const distanceKm = calculateDistance(coordinates);
    const estimatedDuration = estimateDuration(distanceKm, routeData.difficulty);
    const startPoint = coordinates[0];
    const endPoint = coordinates[coordinates.length - 1];

    // Generate slug
    const slug = generateSlug(routeData.name);

    // Insert route
    const { data: route, error: routeError } = await supabase
        .from('routes')
        .insert({
            creator_id: user.id,
            name: routeData.name,
            description: routeData.description,
            slug,
            route_path: coordinatesToLineString(coordinates),
            start_point: coordinateToPoint(startPoint),
            end_point: coordinateToPoint(endPoint),
            distance_km: distanceKm,
            elevation_gain_m: 0, // TODO: Calculate from elevation data
            estimated_duration_min: estimatedDuration,
            difficulty: routeData.difficulty,
            terrain_type: routeData.terrainType,
            status: 'borrador', // Start as draft
            price: routeData.isFree ? 0 : routeData.price,
            is_free: routeData.isFree,
            municipality: routeData.municipality,
            tags: routeData.tags || [],
        })
        .select('id')
        .single();

    if (routeError) {
        console.error('Error creating route:', routeError);
        throw new Error('Error al crear la ruta: ' + routeError.message);
    }

    const routeId = route.id;

    // Insert waypoints if any
    if (waypoints.length > 0) {
        const waypointsToInsert = waypoints.map((wp, index) => ({
            route_id: routeId,
            location: coordinateToPoint(wp.coordinate),
            name: wp.name,
            description: wp.description || null,
            waypoint_type: wp.waypointType,
            image_url: wp.imageUrl || null,
            order_index: index,
        }));

        const { error: waypointsError } = await supabase
            .from('route_waypoints')
            .insert(waypointsToInsert);

        if (waypointsError) {
            console.error('Error creating waypoints:', waypointsError);
            // Don't throw - route is created, waypoints can be added later
        }
    }

    return routeId;
}

/**
 * Publish a draft route (change status to 'en_revision')
 */
export async function publishRoute(routeId: string): Promise<void> {
    const { error } = await supabase
        .from('routes')
        .update({
            status: 'publicado', // For MVP, auto-publish without review
            published_at: new Date().toISOString(),
        })
        .eq('id', routeId);

    if (error) {
        console.error('Error publishing route:', error);
        throw new Error('Error al publicar la ruta');
    }
}

/**
 * Save route as draft
 */
export async function saveRouteDraft(payload: RouteCreationPayload): Promise<string> {
    const routeId = await createRoute(payload);
    // Route is already saved as draft
    return routeId;
}

/**
 * Create and immediately publish a route
 */
export async function createAndPublishRoute(payload: RouteCreationPayload): Promise<string> {
    const routeId = await createRoute(payload);
    await publishRoute(routeId);
    return routeId;
}

/**
 * Update user profile to mark as creator
 */
export async function markUserAsCreator(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('profiles')
        .update({ is_creator: true })
        .eq('id', user.id);
}

/**
 * Delete a draft route
 */
export async function deleteRoute(routeId: string): Promise<void> {
    const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId)
        .eq('status', 'borrador'); // Only allow deleting drafts

    if (error) {
        console.error('Error deleting route:', error);
        throw new Error('Error al eliminar la ruta');
    }
}
