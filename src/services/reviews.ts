/**
 * Reviews Service
 * Handles fetching and creating reviews for routes
 */

import { supabase } from "@/lib/supabase";

// ============================================
// Types
// ============================================

export interface RouteReview {
  id: string;
  routeId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  // Joined
  userName: string;
  userAvatar: string | null;
}

export interface CreateReviewData {
  routeId: string;
  rating: number;
  comment?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get reviews for a specific route
 */
export async function getRouteReviews(routeId: string): Promise<RouteReview[]> {
  // First, get the reviews
  const { data: reviewsData, error: reviewsError } = await supabase
    .from("route_reviews")
    .select("id, route_id, user_id, rating, comment, created_at")
    .eq("route_id", routeId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    console.error("Error fetching reviews:", reviewsError);
    return [];
  }

  if (!reviewsData || reviewsData.length === 0) {
    return [];
  }

  // Get unique user IDs
  const userIds = [...new Set(reviewsData.map((r) => r.user_id))];

  // Fetch profiles for these users
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  // Create a map of user profiles
  const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

  // Combine the data
  return reviewsData.map((review) => {
    const profile = profilesMap.get(review.user_id);
    return {
      id: review.id,
      routeId: review.route_id,
      userId: review.user_id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      userName: profile?.full_name || "Usuario",
      userAvatar: profile?.avatar_url || null,
    };
  });
}

/**
 * Check if user has already reviewed a route
 */
export async function hasUserReviewedRoute(routeId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("route_reviews")
    .select("id")
    .eq("route_id", routeId)
    .eq("user_id", user.id)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Get user's review for a route
 */
export async function getUserReview(
  routeId: string,
): Promise<RouteReview | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get the review
  const { data, error } = await supabase
    .from("route_reviews")
    .select("id, route_id, user_id, rating, comment, created_at")
    .eq("route_id", routeId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;

  // Get the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    id: data.id,
    routeId: data.route_id,
    userId: data.user_id,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.created_at,
    userName: profile?.full_name || "Usuario",
    userAvatar: profile?.avatar_url || null,
  };
}

/**
 * Create a new review
 */
export async function createReview(
  reviewData: CreateReviewData,
): Promise<{ success: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "Debes iniciar sesión para dejar una reseña",
    };
  }

  // Check if user has completed the route (optional but recommended)
  const { data: completion } = await supabase
    .from("route_completions")
    .select("id")
    .eq("route_id", reviewData.routeId)
    .eq("user_id", user.id)
    .eq("status", "completado")
    .single();

  // For now, we'll allow reviews without completion, but you could enforce it
  // if (!completion) {
  //   return { success: false, error: "Debes completar la ruta para dejar una reseña" };
  // }

  // Check for existing review
  const hasReviewed = await hasUserReviewedRoute(reviewData.routeId);
  if (hasReviewed) {
    return { success: false, error: "Ya has dejado una reseña para esta ruta" };
  }

  const { error } = await supabase.from("route_reviews").insert({
    route_id: reviewData.routeId,
    user_id: user.id,
    rating: reviewData.rating,
    comment: reviewData.comment?.trim() || null,
  });

  if (error) {
    console.error("Error creating review:", error);
    return { success: false, error: "No se pudo crear la reseña" };
  }

  // Update route's average rating (trigger should handle this, but we can do it manually too)
  await updateRouteRating(reviewData.routeId);

  return { success: true };
}

/**
 * Update a review
 */
export async function updateReview(
  reviewId: string,
  updates: { rating?: number; comment?: string },
): Promise<{ success: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  const { data: review } = await supabase
    .from("route_reviews")
    .select("route_id")
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .single();

  if (!review) {
    return { success: false, error: "Reseña no encontrada" };
  }

  const { error } = await supabase
    .from("route_reviews")
    .update({
      rating: updates.rating,
      comment: updates.comment?.trim() || null,
    })
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating review:", error);
    return { success: false, error: "No se pudo actualizar la reseña" };
  }

  await updateRouteRating(review.route_id);

  return { success: true };
}

/**
 * Delete a review
 */
export async function deleteReview(
  reviewId: string,
): Promise<{ success: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  const { data: review } = await supabase
    .from("route_reviews")
    .select("route_id")
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .single();

  if (!review) {
    return { success: false, error: "Reseña no encontrada" };
  }

  const { error } = await supabase
    .from("route_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting review:", error);
    return { success: false, error: "No se pudo eliminar la reseña" };
  }

  await updateRouteRating(review.route_id);

  return { success: true };
}

/**
 * Update route's average rating and total reviews
 */
async function updateRouteRating(routeId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("route_reviews")
      .select("rating")
      .eq("route_id", routeId);

    if (error || !data) return;

    const totalReviews = data.length;
    const averageRating =
      totalReviews > 0
        ? data.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    await supabase
      .from("routes")
      .update({
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: totalReviews,
      })
      .eq("id", routeId);
  } catch (error) {
    console.error("Error updating route rating:", error);
  }
}

/**
 * Get review stats for a route
 */
export async function getRouteReviewStats(routeId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}> {
  const { data, error } = await supabase
    .from("route_reviews")
    .select("rating")
    .eq("route_id", routeId);

  if (error || !data) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  const totalReviews = data.length;
  const averageRating =
    totalReviews > 0
      ? data.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    distribution,
  };
}
