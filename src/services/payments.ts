/**
 * Payments Service
 * Mock payment processing for MVP
 * TODO: Replace with Stripe/MercadoPago for production
 */

import { supabase } from "@/lib/supabase";

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Process a mock payment for a route
 * In production, this would integrate with Stripe/MercadoPago
 */
export async function processRoutePayment(
  routeId: string,
  amount: number,
  _cardDetails: {
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardHolder: string;
  },
): Promise<PaymentResult> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Simulate payment processing delay (1-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate earnings (90% creator, 10% platform)
    const platformFee = amount * 0.1;
    const creatorEarnings = amount - platformFee;

    // Record the purchase in route_purchases
    const { error: purchaseError } = await supabase
      .from("route_purchases")
      .insert({
        buyer_id: user.id,
        route_id: routeId,
        amount_paid: amount,
        creator_earnings: creatorEarnings,
        platform_fee: platformFee,
        payment_status: "completado",
        purchased_at: new Date().toISOString(),
      });

    if (purchaseError) {
      // Check if already purchased
      if (purchaseError.code === "23505") {
        return { success: false, error: "Ya tienes acceso a esta ruta" };
      }
      console.error("Error recording purchase:", purchaseError);
      return { success: false, error: "Error al procesar la compra" };
    }

    return {
      success: true,
      transactionId,
    };
  } catch (error) {
    console.error("Payment error:", error);
    return { success: false, error: "Error de conexión" };
  }
}

/**
 * Check if user has access to a route
 */
export async function checkRouteAccess(routeId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Check if route is free
    const { data: route } = await supabase
      .from("routes")
      .select("is_free, creator_id")
      .eq("id", routeId)
      .single();

    if (route?.is_free) return true;
    if (route?.creator_id === user.id) return true;

    // Check if user has purchased the route
    const { data: purchase } = await supabase
      .from("route_purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("route_id", routeId)
      .eq("payment_status", "completado")
      .single();

    return !!purchase;
  } catch (error) {
    console.error("Error checking route access:", error);
    return false;
  }
}

/**
 * Get user's purchased routes
 */
export async function getPurchasedRoutes(): Promise<
  Array<{
    routeId: string;
    purchasedAt: string;
    amount: number;
  }>
> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("route_purchases")
      .select("route_id, purchased_at, amount_paid")
      .eq("buyer_id", user.id)
      .eq("payment_status", "completado")
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchased routes:", error);
      return [];
    }

    return (data || []).map((r) => ({
      routeId: r.route_id,
      purchasedAt: r.purchased_at,
      amount: r.amount_paid || 0,
    }));
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}
