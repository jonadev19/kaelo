import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Store, StorePayload } from '../interfaces/store.interface';
import { SupabaseService } from './supabase.service';

const STORE_SELECT =
  'id, owner_id, name, description, status, phone, address, logo_url, location, business_hours, approved_at, created_at, updated_at, owner:users(full_name,email)';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = inject(SupabaseService).client;
  }

  async getStores(): Promise<Store[]> {
    const { data, error } = await this.supabase
      .from('stores')
      .select(STORE_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }

    return (data ?? []) as Store[];
  }

  async createStore(payload: StorePayload): Promise<Store> {
    const { data, error } = await this.supabase
      .from('stores')
      .insert(payload)
      .select(STORE_SELECT)
      .single();

    if (error) {
      console.error('Error creating store:', error);
      throw error;
    }

    return data as Store;
  }

  async updateStore(storeId: string, payload: Partial<StorePayload>): Promise<Store> {
    const { data, error } = await this.supabase
      .from('stores')
      .update(payload)
      .eq('id', storeId)
      .select(STORE_SELECT)
      .single();

    if (error) {
      console.error('Error updating store:', error);
      throw error;
    }

    return data as Store;
  }

  async deleteStore(storeId: string): Promise<void> {
    const { error } = await this.supabase.from('stores').delete().eq('id', storeId);

    if (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
  }
}
