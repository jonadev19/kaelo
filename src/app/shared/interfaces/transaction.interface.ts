export type PaymentStatus = 'pendiente' | 'completado' | 'fallida' | 'reembolsada' | string;

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_method?: string | null;
  payment_gateway_id?: string | null;
  route_id?: string | null;
  order_id?: string | null;
  created_at: string;
  completed_at?: string | null;
  user?: {
    full_name?: string;
    email?: string;
  } | null;
  route?: {
    title?: string;
  } | null;
}

export type TransactionPayload = Omit<Transaction, 'id' | 'created_at' | 'completed_at' | 'user' | 'route'>;
