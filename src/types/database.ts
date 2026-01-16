/**
 * Database types for Kaelo app
 * These types match the Supabase/PostgreSQL schema
 */

// ============================================
// Core Types
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  wallet_balance: number;
  is_creator: boolean;
  is_business_owner: boolean;
  creator_rating: number;
  total_routes_sold: number;
  total_earnings: number;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type Difficulty = 'facil' | 'moderada' | 'dificil' | 'experto';
export type TerrainType = 'asfalto' | 'terraceria' | 'mixto';
export type RouteStatus = 'borrador' | 'en_revision' | 'publicado' | 'rechazado' | 'archivado';

export interface Route {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  slug: string;
  // PostGIS geometry fields - returned as GeoJSON or WKT
  route_path: GeoJSONLineString | null;
  start_point: GeoJSONPoint | null;
  end_point: GeoJSONPoint | null;
  distance_km: number;
  elevation_gain_m: number;
  estimated_duration_min: number | null;
  difficulty: Difficulty;
  terrain_type: TerrainType;
  status: RouteStatus;
  price: number;
  is_free: boolean;
  cover_image_url: string | null;
  photos: string[];
  tags: string[];
  municipality: string | null;
  purchase_count: number;
  view_count: number;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  // Joined fields
  creator?: Profile;
}

export type WaypointType = 
  | 'inicio' | 'fin' | 'cenote' | 'zona_arqueologica'
  | 'mirador' | 'restaurante' | 'tienda' | 'taller_bicicletas'
  | 'descanso' | 'punto_agua' | 'peligro' | 'foto' | 'otro';

export interface RouteWaypoint {
  id: string;
  route_id: string;
  location: GeoJSONPoint;
  name: string;
  description: string | null;
  waypoint_type: WaypointType;
  image_url: string | null;
  order_index: number;
  created_at: string;
}

export type BusinessType = 
  | 'restaurante' | 'cafeteria' | 'tienda' | 'taller_bicicletas'
  | 'hospedaje' | 'tienda_conveniencia' | 'mercado' | 'otro';

export type BusinessStatus = 'pendiente' | 'activo' | 'pausado' | 'rechazado';

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  location: GeoJSONPoint;
  address: string;
  municipality: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  business_hours: Record<string, { open: string; close: string }>;
  business_type: BusinessType;
  cover_image_url: string | null;
  logo_url: string | null;
  photos: string[];
  status: BusinessStatus;
  accepts_advance_orders: boolean;
  minimum_order_amount: number;
  advance_order_hours: number;
  average_rating: number;
  total_reviews: number;
  total_orders: number;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// GeoJSON Types (PostGIS returns these)
// ============================================

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: [number, number][]; // Array of [longitude, latitude]
}

// ============================================
// App-specific Types (transformed for UI)
// ============================================

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteForMap {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  coordinates: Coordinate[];
  startPoint: Coordinate;
  endPoint: Coordinate;
  distanceKm: number;
  elevationGainM: number;
  estimatedDurationMin: number | null;
  difficulty: Difficulty;
  terrainType: TerrainType;
  price: number;
  isFree: boolean;
  coverImageUrl: string | null;
  averageRating: number;
  totalReviews: number;
  creatorName: string | null;
}

export interface BusinessForMap {
  id: string;
  name: string;
  type: BusinessType;
  coordinate: Coordinate;
  address: string;
  phone: string | null;
  logoUrl: string | null;
  averageRating: number;
}

// ============================================
// API Response Types
// ============================================

export interface NearbyRouteResult {
  route_id: string;
  name: string;
  distance_km: number;
  difficulty: Difficulty;
  price: number;
  is_free: boolean;
  distance_to_start_km: number;
}

export interface NearbyBusinessResult {
  business_id: string;
  name: string;
  business_type: BusinessType;
  distance_m: number;
  location_lat: number;
  location_lng: number;
}
