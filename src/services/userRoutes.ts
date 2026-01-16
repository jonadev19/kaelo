/**
 * User Routes Service
 * Handles fetching user's purchased, created, and saved routes
 */

import { supabase } from "@/lib/supabase";
import type { Difficulty, TerrainType } from "@/types";

// ============================================
// Types
// ============================================

export interface UserRoute {
  id: string;
  name: string;
  slug: string;
  distanceKm: number;
  difficulty: Difficulty;
  terrainType: TerrainType;
  estimatedDurationMin: number | null;
  price: number;
  isFree: boolean;
  coverImageUrl: string | null;
  averageRating: number;
  totalReviews: number;
  status: string;
  createdAt: string;
  creatorName?: string;
  purchaseDate?: string;
  savedAt?: string;
}

// ============================================
// Helper Functions
// ============================================

function transformRoute(
  route: any,
  extra?: { purchaseDate?: string; savedAt?: string },
): UserRoute {
  return {
    id: route.id,
    name: route.name,
    slug: route.slug,
    distanceKm: route.distance_km,
    difficulty: route.difficulty,
    terrainType: route.terrain_type,
    estimatedDurationMin: route.estimated_duration_min,
    price: route.price,
    isFree: route.is_free,
    coverImageUrl: route.cover_image_url,
    averageRating: route.average_rating,
    totalReviews: route.total_reviews,
    status: route.status,
    createdAt: route.created_at,
    creatorName: route.creator?.full_name || route.profiles?.full_name,
    purchaseDate: extra?.purchaseDate,
    savedAt: extra?.savedAt,
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get routes created by the current user
 */
export async function getMyCreatedRoutes(): Promise<UserRoute[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching created routes:", error);
    return [];
  }

  return (data || []).map((route) => transformRoute(route));
}

/**
 * Get routes purchased by the current user
 */
export async function getMyPurchasedRoutes(): Promise<UserRoute[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("route_purchases")
    .select(
      `
      purchased_at,
      route:routes (
        *,
        creator:profiles!creator_id (
          full_name
        )
      )
    `,
    )
    .eq("buyer_id", user.id)
    .eq("payment_status", "completado")
    .order("purchased_at", { ascending: false });

  if (error) {
    console.error("Error fetching purchased routes:", error);
    return [];
  }

  return (data || [])
    .filter((item) => item.route)
    .map((item) =>
      transformRoute(item.route, { purchaseDate: item.purchased_at }),
    );
}

/**
 * Get routes saved/favorited by the current user
 */
export async function getMySavedRoutes(): Promise<UserRoute[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_routes")
    .select(
      `
      created_at,
      route:routes (
        *,
        creator:profiles!creator_id (
          full_name
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved routes:", error);
    return [];
  }

  return (data || [])
    .filter((item) => item.route)
    .map((item) => transformRoute(item.route, { savedAt: item.created_at }));
}

/**
 * Save a route to favorites
 */
export async function saveRoute(routeId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("saved_routes").insert({
    user_id: user.id,
    route_id: routeId,
  });

  if (error) {
    // Might already be saved (unique constraint)
    console.error("Error saving route:", error);
    return false;
  }

  return true;
}

/**
 * Remove a route from favorites
 */
export async function unsaveRoute(routeId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("saved_routes")
    .delete()
    .eq("user_id", user.id)
    .eq("route_id", routeId);

  if (error) {
    console.error("Error unsaving route:", error);
    return false;
  }

  return true;
}

/**
 * Check if a route is saved by the current user
 */
export async function isRouteSaved(routeId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("saved_routes")
    .select("id")
    .eq("user_id", user.id)
    .eq("route_id", routeId)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Get user's route stats
 */
export async function getMyRouteStats(): Promise<{
  created: number;
  purchased: number;
  saved: number;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { created: 0, purchased: 0, saved: 0 };

  const [createdRes, purchasedRes, savedRes] = await Promise.all([
    supabase
      .from("routes")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("route_purchases")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", user.id)
      .eq("status", "completado"),
    supabase
      .from("saved_routes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return {
    created: createdRes.count || 0,
    purchased: purchasedRes.count || 0,
    saved: savedRes.count || 0,
  };
}
