/**
 * Businesses Service
 * Handles fetching and managing business data
 */

import { supabase } from "@/lib/supabase";
import type { Coordinate } from "@/types";

// ============================================
// Types
// ============================================

export interface BusinessDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  openingHours: Record<string, string> | null;
  coordinate: Coordinate;
  imageUrl: string | null;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
}

export interface BusinessProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
}

// Business type labels
export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurante: "Restaurante",
  cafeteria: "Cafetería",
  tienda: "Tienda",
  taller_bicicletas: "Taller de Bicicletas",
  hospedaje: "Hospedaje",
  tienda_conveniencia: "Tienda de Conveniencia",
  mercado: "Mercado",
};

// Business type icons
export const BUSINESS_TYPE_ICONS: Record<string, string> = {
  restaurante: "restaurant",
  cafeteria: "cafe",
  tienda: "storefront",
  taller_bicicletas: "build",
  hospedaje: "bed",
  tienda_conveniencia: "cart",
  mercado: "basket",
};

// ============================================
// Helper Functions
// ============================================

function transformBusiness(business: any): BusinessDetail {
  let coordinate: Coordinate = { latitude: 0, longitude: 0 };

  if (business.location) {
    if (
      typeof business.location === "object" &&
      business.location.coordinates
    ) {
      coordinate = {
        longitude: business.location.coordinates[0],
        latitude: business.location.coordinates[1],
      };
    }
  }

  return {
    id: business.id,
    name: business.name,
    description: business.description,
    type: business.business_type,
    address: business.address,
    phone: business.phone,
    email: business.email,
    website: business.website,
    openingHours: business.opening_hours,
    coordinate,
    imageUrl: business.cover_image_url,
    averageRating: business.average_rating || 0,
    totalReviews: business.total_reviews || 0,
    isActive: business.status === "activo",
    createdAt: business.created_at,
  };
}

function transformProduct(product: any): BusinessProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.image_url,
    category: product.category,
    isAvailable: product.is_available,
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get all active businesses
 */
export async function getAllBusinesses(): Promise<BusinessDetail[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "activo")
    .order("name");

  if (error) {
    console.error("Error fetching businesses:", error);
    return [];
  }

  return (data || []).map(transformBusiness);
}

/**
 * Get businesses by type
 */
export async function getBusinessesByType(
  type: string,
): Promise<BusinessDetail[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "activo")
    .eq("business_type", type)
    .order("name");

  if (error) {
    console.error("Error fetching businesses by type:", error);
    return [];
  }

  return (data || []).map(transformBusiness);
}

/**
 * Get a single business by ID
 */
export async function getBusinessById(
  id: string,
): Promise<BusinessDetail | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching business:", error);
    return null;
  }

  return transformBusiness(data);
}

/**
 * Get products for a business
 */
export async function getBusinessProducts(
  businessId: string,
): Promise<BusinessProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_available", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data || []).map(transformProduct);
}

/**
 * Search businesses by name
 */
export async function searchBusinesses(
  query: string,
): Promise<BusinessDetail[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "activo")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(20);

  if (error) {
    console.error("Error searching businesses:", error);
    return [];
  }

  return (data || []).map(transformBusiness);
}

/**
 * Get business types with counts
 */
export async function getBusinessTypeCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("businesses")
    .select("business_type")
    .eq("status", "activo");

  if (error) {
    console.error("Error fetching business type counts:", error);
    return {};
  }

  const counts: Record<string, number> = {};
  (data || []).forEach((b) => {
    counts[b.business_type] = (counts[b.business_type] || 0) + 1;
  });

  return counts;
}
