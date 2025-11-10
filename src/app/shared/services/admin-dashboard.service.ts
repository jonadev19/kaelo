import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AdminStats, TransactionSummary } from '../interfaces/dashboard.interface';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = inject(SupabaseService).client;
  }

  async getStats(): Promise<AdminStats> {
    const [totalUsers, totalRoutes, totalStores, totalTransactions] = await Promise.all([
      this.countRows('users'),
      this.countRows('routes'),
      this.countRows('stores'),
      this.countRows('transactions'),
    ]);

    return {
      totalUsers,
      totalRoutes,
      totalStores,
      totalTransactions,
    };
  }

  async getRecentTransactions(limit = 5): Promise<TransactionSummary[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select(
        [
          'id',
          'amount',
          'transaction_type',
          'payment_status',
          'created_at',
          'user:users!transactions_user_id_fkey(full_name,email)',
          'route:routes!transactions_route_id_fkey(title)',
        ].join(','),
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }

    return (data ?? []) as unknown as TransactionSummary[];
  }

  private async countRows(table: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Error counting rows for ${table}:`, error);
      throw error;
    }

    return count ?? 0;
  }
}
