import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { RoutePayload, RouteSummary } from '../interfaces/route.interface';
import { SupabaseService } from './supabase.service';

const ROUTE_SELECT_FIELDS =
  'id, title, description, distance_km, difficulty, price, status, creator_id, created_at, updated_at, creator:users!routes_creator_id_fkey(full_name, email)';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseService = inject(SupabaseService);
    this.supabase = supabaseService.client;
  }

  async getRoutes(): Promise<RouteSummary[]> {
    const { data, error } = await this.supabase
      .from('routes')
      .select(ROUTE_SELECT_FIELDS)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }

    return (data ?? []) as RouteSummary[];
  }

  async createRoute(routeData: RoutePayload): Promise<RouteSummary> {
    const { data, error } = await this.supabase
      .from('routes')
      .insert(routeData)
      .select(ROUTE_SELECT_FIELDS)
      .single();

    if (error) {
      console.error('Error creating route:', error);
      throw error;
    }

    return data as RouteSummary;
  }

  async updateRoute(routeId: string, routeData: Partial<RoutePayload>): Promise<RouteSummary> {
    const { data, error } = await this.supabase
      .from('routes')
      .update(routeData)
      .eq('id', routeId)
      .select(ROUTE_SELECT_FIELDS)
      .single();

    if (error) {
      console.error('Error updating route:', error);
      throw error;
    }

    return data as RouteSummary;
  }

  async deleteRoute(routeId: string): Promise<void> {
    const { error } = await this.supabase.from('routes').delete().eq('id', routeId);

    if (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  }
}
