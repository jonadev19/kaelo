/**
 * Profile Service
 * Handles user profile data and stats
 */

import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  walletBalance: number;
  isCreator: boolean;
  isBusinessOwner: boolean;
  creatorRating: number;
  totalRoutesSold: number;
  totalEarnings: number;
  createdAt: string;
}

export interface UserStats {
  totalRoutes: number; // Rutas compradas + creadas
  totalKilometers: number; // Km recorridos
  totalOrders: number; // Pedidos realizados
  savedRoutes: number; // Rutas guardadas
}

/**
 * Get the current user's profile
 */
export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      phone: data.phone,
      bio: data.bio,
      walletBalance: data.wallet_balance || 0,
      isCreator: data.is_creator || false,
      isBusinessOwner: data.is_business_owner || false,
      creatorRating: data.creator_rating || 0,
      totalRoutesSold: data.total_routes_sold || 0,
      totalEarnings: data.total_earnings || 0,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

/**
 * Get user statistics
 */
export async function getMyStats(): Promise<UserStats> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalRoutes: 0,
        totalKilometers: 0,
        totalOrders: 0,
        savedRoutes: 0,
      };
    }

    // Fetch stats in parallel
    const [purchasedRoutes, createdRoutes, orders, savedRoutes] =
      await Promise.all([
        // Purchased routes
        supabase
          .from("route_purchases")
          .select("id, route:routes!route_id(distance_km)")
          .eq("buyer_id", user.id)
          .eq("payment_status", "completado"),

        // Created routes
        supabase
          .from("routes")
          .select("id, distance_km")
          .eq("creator_id", user.id),

        // Orders
        supabase.from("orders").select("id").eq("customer_id", user.id),

        // Saved routes
        supabase.from("saved_routes").select("id").eq("user_id", user.id),
      ]);

    // Calculate total kilometers from purchased routes
    const purchasedKm = (purchasedRoutes.data || []).reduce((sum, p) => {
      const route = p.route as any;
      return sum + (route?.distance_km || 0);
    }, 0);

    // Calculate total kilometers from created routes
    const createdKm = (createdRoutes.data || []).reduce(
      (sum, r) => sum + (r.distance_km || 0),
      0,
    );

    return {
      totalRoutes:
        (purchasedRoutes.data?.length || 0) + (createdRoutes.data?.length || 0),
      totalKilometers: Math.round(purchasedKm + createdKm),
      totalOrders: orders.data?.length || 0,
      savedRoutes: savedRoutes.data?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalRoutes: 0,
      totalKilometers: 0,
      totalOrders: 0,
      savedRoutes: 0,
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: {
  fullName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: updates.fullName,
        phone: updates.phone,
        bio: updates.bio,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    return false;
  }
}

/**
 * Get user badge based on stats
 */
export function getUserBadge(stats: UserStats): {
  label: string;
  icon: string;
} {
  if (stats.totalKilometers >= 1000) {
    return { label: "CICLISTA LEGENDARIO", icon: "medal" };
  } else if (stats.totalKilometers >= 500) {
    return { label: "CICLISTA EXPERTO", icon: "trophy" };
  } else if (stats.totalKilometers >= 100) {
    return { label: "CICLISTA AVENTURERO", icon: "bicycle" };
  } else if (stats.totalRoutes >= 5) {
    return { label: "EXPLORADOR", icon: "compass" };
  } else {
    return { label: "CICLISTA NOVATO", icon: "leaf" };
  }
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(imageUri: string): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Get the file extension and determine correct MIME type
    const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    // jpg should use jpeg as MIME type
    const mimeType = ext === "jpg" ? "jpeg" : ext;
    const fileName = `${user.id}-${Date.now()}.${ext}`;
    const filePath = `avatars/${fileName}`;

    // Fetch the image as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Convert blob to ArrayBuffer
    const arrayBuffer = await new Response(blob).arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        contentType: `image/${mimeType}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return null;
  }
}
