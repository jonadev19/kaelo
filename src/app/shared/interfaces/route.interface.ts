export type RouteDifficulty = 'facil' | 'moderado' | 'dificil' | 'experto' | string;
export type RouteStatus =
  | 'borrador'
  | 'pendiente_aprobacion'
  | 'aprobada'
  | 'rechazada'
  | 'inactiva'
  | string;

export interface RouteSummary {
  id: string;
  title: string;
  description?: string | null;
  distance_km: number;
  difficulty: RouteDifficulty;
  price: number;
  status: RouteStatus;
  creator_id: string;
  created_at?: string;
  updated_at?: string;
  creator?: {
    full_name?: string;
    email?: string;
  } | null;
}

export type RoutePayload = Omit<RouteSummary, 'id' | 'creator' | 'created_at' | 'updated_at'>;
