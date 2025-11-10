export type StoreStatus = 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'inactivo' | string;

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  location: GeoPoint | string;
  status: StoreStatus;
  phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
  business_hours?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  approved_at?: string | null;
  owner?: {
    full_name?: string;
    email?: string;
  } | null;
}

export type StorePayload = Omit<
  Store,
  'id' | 'created_at' | 'updated_at' | 'approved_at' | 'owner'
>;
