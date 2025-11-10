export interface AdminStats {
  totalUsers: number;
  totalRoutes: number;
  totalStores: number;
  totalTransactions: number;
}

export interface TransactionSummary {
  id: string;
  amount: number;
  transaction_type: string;
  payment_status?: string | null;
  created_at: string;
  user?: {
    full_name?: string;
    email?: string;
  } | null;
  route?: {
    title?: string;
  } | null;
}
