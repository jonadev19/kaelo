/**
 * Metrics Service
 * Handles fetching user metrics, achievements, goals, and activity history
 */

import { supabase } from "@/lib/supabase";

// ============================================
// Types
// ============================================

export interface AllTimeStats {
  total_distance_km: number;
  total_rides: number;
  total_duration_min: number;
  total_calories: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  total_elevation_m: number;
}

export interface MonthlyStats {
  total_distance_km: number;
  total_rides: number;
  total_duration_min: number;
  total_calories: number;
  avg_speed_kmh: number;
  distance_change_percent: number | null;
  rides_change_percent: number | null;
  speed_change_percent: number | null;
}

export interface UserMetricsStats {
  all_time: AllTimeStats;
  current_month: MonthlyStats | null;
  unique_routes_completed: number;
}

export type AchievementType =
  | "first_ride"
  | "speed_demon"
  | "distance_10km"
  | "distance_50km"
  | "distance_100km_total"
  | "distance_500km_total"
  | "distance_1000km_total"
  | "routes_completed_10"
  | "routes_completed_50"
  | "streak_7_days"
  | "streak_30_days"
  | "early_bird"
  | "night_rider"
  | "explorer"
  | "supporter"
  | "socialite"
  | "cenote_hunter"
  | "elevation_master"
  | "all_weather"
  | "route_creator";

export interface Achievement {
  id: string;
  achievement_type: AchievementType;
  progress_current: number;
  progress_target: number;
  progress_percentage: number;
  is_unlocked: boolean;
  points_awarded: number;
  badge_icon: string | null;
  unlocked_at: string | null;
}

export interface PersonalRecord {
  id: string;
  route_id: string;
  route_name: string;
  route_distance_km: number;
  record_type: "fastest_time" | "highest_avg_speed" | "lowest_time" | "most_distance";
  best_time_min: number | null;
  best_avg_speed_kmh: number | null;
  improvement_percentage: number | null;
  achieved_at: string;
}

export interface ActivityItem {
  id: string;
  route_id: string;
  route_name: string;
  route_cover_image: string | null;
  started_at: string;
  completed_at: string | null;
  duration_min: number;
  distance_km: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  calories_burned: number;
  elevation_gain_m: number | null;
  status: "en_progreso" | "completado" | "abandonado";
}

export type GoalType =
  | "distance_monthly"
  | "distance_weekly"
  | "routes_count"
  | "streak_days"
  | "avg_speed"
  | "elevation_total"
  | "calories"
  | "custom";

export type GoalUnit = "km" | "routes" | "days" | "kmh" | "meters" | "calories" | "other";

export interface UserGoal {
  id: string;
  goal_type: GoalType;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  unit: GoalUnit;
  status: "active" | "completed" | "abandoned" | "expired";
  deadline: string | null;
  started_at: string;
  completed_at: string | null;
  reward_points: number;
}

// ============================================
// Achievement Metadata
// ============================================

export const ACHIEVEMENT_INFO: Record<
  AchievementType,
  {
    title: string;
    description: string;
    icon: string;
  }
> = {
  first_ride: {
    title: "Primera Ruta",
    description: "Completa tu primera ruta",
    icon: "flag",
  },
  speed_demon: {
    title: "Demonio de la Velocidad",
    description: "Alcanza 40 km/h promedio en una ruta",
    icon: "flash",
  },
  distance_10km: {
    title: "Corredor 10K",
    description: "Completa una ruta de 10+ km",
    icon: "walk",
  },
  distance_50km: {
    title: "Medio Siglo",
    description: "Completa una ruta de 50+ km",
    icon: "bicycle",
  },
  distance_100km_total: {
    title: "Centurion",
    description: "Acumula 100 km totales",
    icon: "ribbon",
  },
  distance_500km_total: {
    title: "Explorador Epico",
    description: "Acumula 500 km totales",
    icon: "star",
  },
  distance_1000km_total: {
    title: "Leyenda del Camino",
    description: "Acumula 1,000 km totales",
    icon: "trophy",
  },
  routes_completed_10: {
    title: "Explorador",
    description: "Completa 10 rutas",
    icon: "map",
  },
  routes_completed_50: {
    title: "Experto Local",
    description: "Completa 50 rutas",
    icon: "compass",
  },
  streak_7_days: {
    title: "Semana Perfecta",
    description: "Pedalea 7 dias seguidos",
    icon: "flame",
  },
  streak_30_days: {
    title: "Mes Imparable",
    description: "Pedalea 30 dias seguidos",
    icon: "bonfire",
  },
  early_bird: {
    title: "Madrugador",
    description: "Completa una ruta antes de las 7am",
    icon: "sunny",
  },
  night_rider: {
    title: "Ciclista Nocturno",
    description: "Completa una ruta despues de las 8pm",
    icon: "moon",
  },
  explorer: {
    title: "Descubridor",
    description: "Visita 5 rutas diferentes",
    icon: "earth",
  },
  supporter: {
    title: "Apoyador Local",
    description: "Compra en 3 comercios afiliados",
    icon: "heart",
  },
  socialite: {
    title: "Influencer",
    description: "Comparte 5 rutas con amigos",
    icon: "share-social",
  },
  cenote_hunter: {
    title: "Cazador de Cenotes",
    description: "Visita 5 cenotes en rutas",
    icon: "water",
  },
  elevation_master: {
    title: "Rey de la Montana",
    description: "Acumula 1,000m de elevacion",
    icon: "trending-up",
  },
  all_weather: {
    title: "Todo Clima",
    description: "Pedalea en 3 condiciones climaticas diferentes",
    icon: "partly-sunny",
  },
  route_creator: {
    title: "Creador",
    description: "Crea y publica tu primera ruta",
    icon: "create",
  },
};

// ============================================
// API Functions
// ============================================

/**
 * Get comprehensive user statistics
 */
export async function getUserStats(): Promise<UserMetricsStats | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc("get_user_stats", {
      p_user_id: user.id,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
}

/**
 * Get all user achievements with progress
 */
export async function getUserAchievements(): Promise<Achievement[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc("get_user_achievements", {
      p_user_id: user.id,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }
}

/**
 * Get user personal records
 */
export async function getUserPersonalRecords(): Promise<PersonalRecord[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc("get_user_personal_records", {
      p_user_id: user.id,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching personal records:", error);
    return [];
  }
}

/**
 * Get user activity history
 */
export async function getUserActivityHistory(
  limit: number = 20,
  offset: number = 0
): Promise<ActivityItem[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc("get_user_activity_history", {
      p_user_id: user.id,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching activity history:", error);
    return [];
  }
}

/**
 * Get user goals
 */
export async function getUserGoals(): Promise<UserGoal[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc("get_user_goals", {
      p_user_id: user.id,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching goals:", error);
    return [];
  }
}

/**
 * Create a new user goal
 */
export async function createGoal(goal: {
  goal_type: GoalType;
  title: string;
  description?: string;
  target_value: number;
  unit: GoalUnit;
  deadline?: string;
  reward_points?: number;
}): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("user_goals").insert({
      user_id: user.id,
      goal_type: goal.goal_type,
      title: goal.title,
      description: goal.description || null,
      target_value: goal.target_value,
      current_value: 0,
      unit: goal.unit,
      status: "active",
      deadline: goal.deadline || null,
      reward_points: goal.reward_points || 0,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error creating goal:", error);
    return false;
  }
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  goalId: string,
  currentValue: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_goals")
      .update({
        current_value: currentValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating goal:", error);
    return false;
  }
}

/**
 * Mark goal as completed
 */
export async function completeGoal(goalId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_goals")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error completing goal:", error);
    return false;
  }
}

/**
 * Abandon a goal
 */
export async function abandonGoal(goalId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_goals")
      .update({
        status: "abandoned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error abandoning goal:", error);
    return false;
  }
}

// ============================================
// Route-specific Stats Types
// ============================================

export interface RouteHistoryItem {
  id: string;
  completed_at: string;
  duration_min: number;
  distance_km: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  calories_burned: number;
  is_best_time: boolean;
}

export interface UserRouteStats {
  has_completed: boolean;
  completion_count: number;
  best_time_min: number | null;
  last_time_min: number | null;
  time_improvement_percent: number | null;
  best_speed_kmh: number | null;
  last_speed_kmh: number | null;
  speed_improvement_percent: number | null;
  is_personal_best: boolean;
  history: RouteHistoryItem[];
}

/**
 * Get user's personal stats for a specific route
 */
export async function getUserRouteStats(routeId: string): Promise<UserRouteStats | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc("get_user_route_stats", {
      p_user_id: user.id,
      p_route_id: routeId,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user route stats:", error);
    return null;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format duration from minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format distance with appropriate precision
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Format calories
 */
export function formatCalories(cal: number): string {
  if (cal >= 1000) return `${(cal / 1000).toFixed(1)}k`;
  return Math.round(cal).toString();
}

/**
 * Format speed
 */
export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`;
}

/**
 * Get trend indicator
 */
export function getTrendIndicator(percent: number | null): {
  direction: "up" | "down" | "neutral";
  value: number;
} {
  if (percent === null || percent === 0) {
    return { direction: "neutral", value: 0 };
  }
  return {
    direction: percent > 0 ? "up" : "down",
    value: Math.abs(percent),
  };
}

/**
 * Calculate percentage for progress
 */
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}
