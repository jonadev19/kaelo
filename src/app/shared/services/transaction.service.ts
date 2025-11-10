import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Transaction, TransactionPayload } from '../interfaces/transaction.interface';
import { SupabaseService } from './supabase.service';

const TRANSACTION_SELECT =
  'id, user_id, transaction_type, amount, payment_status, payment_method, payment_gateway_id, route_id, order_id, created_at, completed_at, user:users(full_name,email), route:routes(title)';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = inject(SupabaseService).client;
  }

  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    return (data ?? []) as Transaction[];
  }

  async createTransaction(payload: TransactionPayload): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert(payload)
      .select(TRANSACTION_SELECT)
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    return data as Transaction;
  }

  async updateTransaction(transactionId: string, payload: Partial<TransactionPayload>): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .update(payload)
      .eq('id', transactionId)
      .select(TRANSACTION_SELECT)
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }

    return data as Transaction;
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    const { error } = await this.supabase.from('transactions').delete().eq('id', transactionId);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}
