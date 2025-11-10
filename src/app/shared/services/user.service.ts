import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '../interfaces/user.interface';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseService = inject(SupabaseService);
    this.supabase = supabaseService.client;
  }

  async getUsers() {
    const { data, error } = await this.supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    return data as User[];
  }

  async getUsersByRole(role: User['role']) {
    const { data, error } = await this.supabase.from('users').select('*').eq('role', role);

    if (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }

    return data as User[];
  }

  getRouteCreators() {
    return this.getUsersByRole('creador_ruta');
  }

  getMerchants() {
    return this.getUsersByRole('comerciante');
  }

  async createUser(userData: Partial<User> & { password?: string }) {
    const { data, error } = await this.supabase.functions.invoke('create-user', {
      body: userData,
    });

    if (error) {
      console.error('Error invoking create-user function:', error);
      throw error;
    }

    return data;
  }

  async updateUser(userId: string, userData: Partial<User>) {
    const { data, error } = await this.supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select();
      
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
    return data;
  }

  async deleteUser(userId: string) {
    const { data, error } = await this.supabase.functions.invoke('delete-user', {
      body: { user_id: userId },
    });

    if (error) {
      console.error('Error invoking delete-user function:', error);
      throw error;
    }

    return data;
  }
}
