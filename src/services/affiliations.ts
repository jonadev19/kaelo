/**
 * Route Affiliation Service
 * Handles business affiliation requests to routes
 */

import { supabase } from "@/lib/supabase";

// ============================================
// Types
// ============================================

export interface NearbyRoute {
  routeId: string;
  routeName: string;
  routeSlug: string;
  creatorName: string;
  distanceKm: number;
  alreadyAffiliated: boolean;
  affiliationStatus: "pendiente" | "aprobado" | "rechazado" | null;
}

export interface AffiliationRequest {
  affiliationId: string;
  routeId: string;
  routeName: string;
  businessId: string;
  businessName: string;
  businessType: string;
  businessLogo: string | null;
  distanceM: number;
  requestMessage: string | null;
  requestedAt: string;
}

export interface BusinessAffiliation {
  id: string;
  routeId: string;
  routeName: string;
  routeSlug: string;
  status: "pendiente" | "aprobado" | "rechazado";
  distanceM: number;
  requestedAt: string;
  approvedAt: string | null;
}

// ============================================
// API Functions
// ============================================

/**
 * Find routes near a business that it can affiliate with
 */
export async function findRoutesNearBusiness(
  businessId: string,
  radiusKm: number = 5,
): Promise<NearbyRoute[]> {
  try {
    const { data, error } = await supabase.rpc("find_routes_near_business", {
      p_business_id: businessId,
      p_radius_km: radiusKm,
    });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      routeId: row.route_id,
      routeName: row.route_name,
      routeSlug: row.route_slug,
      creatorName: row.creator_name || "Usuario",
      distanceKm: row.distance_km,
      alreadyAffiliated: row.already_affiliated,
      affiliationStatus: row.affiliation_status,
    }));
  } catch (error) {
    console.error("Error finding nearby routes:", error);
    return [];
  }
}

/**
 * Request affiliation to a route
 */
export async function requestRouteAffiliation(
  businessId: string,
  routeId: string,
  message?: string,
): Promise<{ success: boolean; error?: string; distanceM?: number }> {
  try {
    const { data, error } = await supabase.rpc("request_route_affiliation", {
      p_business_id: businessId,
      p_route_id: routeId,
      p_message: message || null,
    });

    if (error) throw error;

    return data as { success: boolean; error?: string; distanceM?: number };
  } catch (error) {
    console.error("Error requesting affiliation:", error);
    return { success: false, error: "Error al enviar la solicitud" };
  }
}

/**
 * Respond to an affiliation request (for route creators)
 */
export async function respondToAffiliationRequest(
  routeId: string,
  businessId: string,
  approved: boolean,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("respond_affiliation_request", {
      p_route_id: routeId,
      p_business_id: businessId,
      p_approved: approved,
      p_notes: notes || null,
    });

    if (error) throw error;

    return data as { success: boolean; error?: string };
  } catch (error) {
    console.error("Error responding to affiliation:", error);
    return { success: false, error: "Error al procesar la solicitud" };
  }
}

/**
 * Get pending affiliation requests for route creator
 */
export async function getPendingAffiliationRequests(
  routeId?: string,
): Promise<AffiliationRequest[]> {
  try {
    const { data, error } = await supabase.rpc(
      "get_pending_affiliation_requests",
      {
        p_route_id: routeId || null,
      },
    );

    if (error) throw error;

    return (data || []).map((row: any) => ({
      affiliationId: row.affiliation_id,
      routeId: row.route_id,
      routeName: row.route_name,
      businessId: row.business_id,
      businessName: row.business_name,
      businessType: row.business_type,
      businessLogo: row.business_logo,
      distanceM: row.distance_m,
      requestMessage: row.request_message,
      requestedAt: row.requested_at,
    }));
  } catch (error) {
    console.error("Error getting affiliation requests:", error);
    return [];
  }
}

/**
 * Get affiliations for a business
 */
export async function getBusinessAffiliations(
  businessId: string,
): Promise<BusinessAffiliation[]> {
  try {
    const { data, error } = await supabase
      .from("route_businesses")
      .select(
        `
        id,
        route_id,
        status,
        distance_from_route_m,
        requested_at,
        approved_at,
        route:routes!route_id (
          name,
          slug
        )
      `,
      )
      .eq("business_id", businessId)
      .order("requested_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      routeId: row.route_id,
      routeName: row.route?.name || "Ruta",
      routeSlug: row.route?.slug || "",
      status: row.status,
      distanceM: row.distance_from_route_m,
      requestedAt: row.requested_at,
      approvedAt: row.approved_at,
    }));
  } catch (error) {
    console.error("Error getting business affiliations:", error);
    return [];
  }
}

/**
 * Get affiliated businesses for a route
 */
export async function getRouteAffiliatedBusinesses(routeId: string): Promise<
  {
    id: string;
    name: string;
    type: string;
    logo: string | null;
    distanceM: number;
    orderIndex: number;
  }[]
> {
  try {
    const { data, error } = await supabase
      .from("route_businesses")
      .select(
        `
        id,
        distance_from_route_m,
        order_index,
        business:businesses!business_id (
          id,
          name,
          business_type,
          logo_url
        )
      `,
      )
      .eq("route_id", routeId)
      .eq("status", "aprobado")
      .order("order_index", { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.business?.id,
      name: row.business?.name || "Comercio",
      type: row.business?.business_type || "otro",
      logo: row.business?.logo_url,
      distanceM: row.distance_from_route_m,
      orderIndex: row.order_index || 0,
    }));
  } catch (error) {
    console.error("Error getting affiliated businesses:", error);
    return [];
  }
}

// Status labels and colors
export const AFFILIATION_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export const AFFILIATION_STATUS_COLORS: Record<string, string> = {
  pendiente: "#F59E0B",
  aprobado: "#22C55E",
  rechazado: "#EF4444",
};
