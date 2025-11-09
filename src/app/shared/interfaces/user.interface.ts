export interface UserProfile {
  fullName: string;
  role: 'ciclista' | 'comerciante' | 'creador_ruta' | 'administrador';
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ciclista' | 'comerciante' | 'creador_ruta' | 'administrador';
  avatar_url?: string;
  phone?: string;
  is_active?: boolean;
  created_at: string;
  last_login?: string;
}
