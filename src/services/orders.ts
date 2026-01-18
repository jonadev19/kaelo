/**
 * Orders Service
 * Handles order creation, management, and tracking
 */

import { supabase } from "@/lib/supabase";

// ============================================
// Types
// ============================================

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreateOrderData {
  businessId: string;
  routeId?: string;
  items: CartItem[];
  estimatedPickupTime: Date;
  notes?: string;
  paymentMethod: "efectivo" | "tarjeta" | "wallet";
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status:
    | "pendiente"
    | "confirmado"
    | "preparando"
    | "listo"
    | "entregado"
    | "cancelado";
  businessId: string;
  businessName: string;
  businessPhone: string | null;
  businessAddress: string;
  subtotal: number;
  platformFee: number;
  total: number;
  estimatedPickupTime: string;
  actualPickupTime: string | null;
  notes: string | null;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItemDetail[];
  createdAt: string;
}

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  businessName: string;
  total: number;
  estimatedPickupTime: string;
  createdAt: string;
  itemCount: number;
}

// Status labels
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparando: "Preparando",
  listo: "Listo para recoger",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pendiente: "#F59E0B",
  confirmado: "#3B82F6",
  preparando: "#8B5CF6",
  listo: "#22C55E",
  entregado: "#6B7280",
  cancelado: "#EF4444",
};

// ============================================
// Helper Functions
// ============================================

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KAE-${timestamp}-${random}`;
}

function calculatePlatformFee(
  subtotal: number,
  commissionRate: number = 10,
): number {
  return Math.round(((subtotal * commissionRate) / 100) * 100) / 100;
}

// ============================================
// API Functions
// ============================================

/**
 * Create a new order
 */
export async function createOrder(
  data: CreateOrderData,
): Promise<{ orderId: string; orderNumber: string } | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // Get business commission rate
    const { data: business } = await supabase
      .from("businesses")
      .select("commission_rate")
      .eq("id", data.businessId)
      .single();

    const commissionRate = business?.commission_rate || 10;

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const platformFee = calculatePlatformFee(subtotal, commissionRate);
    const total = subtotal + platformFee;

    const orderNumber = generateOrderNumber();

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        business_id: data.businessId,
        route_id: data.routeId || null,
        order_number: orderNumber,
        status: "pendiente",
        subtotal,
        platform_fee: platformFee,
        total,
        estimated_pickup_time: data.estimatedPickupTime.toISOString(),
        notes: data.notes || null,
        payment_method: data.paymentMethod,
        payment_status:
          data.paymentMethod === "efectivo" ? "pendiente" : "pendiente",
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = data.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Create notification for business owner
    const { data: businessData } = await supabase
      .from("businesses")
      .select("owner_id, name")
      .eq("id", data.businessId)
      .single();

    if (businessData) {
      await supabase.from("notifications").insert({
        user_id: businessData.owner_id,
        title: "¡Nuevo pedido! 🛒",
        body: `Tienes un nuevo pedido #${orderNumber} por $${total.toFixed(2)}`,
        notification_type: "orden_recibida",
        related_order_id: order.id,
        related_business_id: data.businessId,
      });
    }

    return { orderId: order.id, orderNumber };
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}

/**
 * Get user's orders
 */
export async function getMyOrders(): Promise<OrderSummary[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        total,
        estimated_pickup_time,
        created_at,
        business:businesses!business_id (
          name
        ),
        order_items (
          id
        )
      `,
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      businessName: order.business?.name || "Comercio",
      total: order.total,
      estimatedPickupTime: order.estimated_pickup_time,
      createdAt: order.created_at,
      itemCount: order.order_items?.length || 0,
    }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/**
 * Get order details by ID
 */
export async function getOrderById(
  orderId: string,
): Promise<OrderDetail | null> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        business:businesses!business_id (
          name,
          phone,
          address
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          notes,
          product:products!product_id (
            name
          )
        )
      `,
      )
      .eq("id", orderId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      orderNumber: data.order_number,
      status: data.status,
      businessId: data.business_id,
      businessName: (data.business as any)?.name || "Comercio",
      businessPhone: (data.business as any)?.phone || null,
      businessAddress: (data.business as any)?.address || "",
      subtotal: data.subtotal,
      platformFee: data.platform_fee,
      total: data.total,
      estimatedPickupTime: data.estimated_pickup_time,
      actualPickupTime: data.actual_pickup_time,
      notes: data.notes,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      items: (data.order_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name || "Producto",
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        notes: item.notes,
      })),
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

/**
 * Cancel an order (only if pending)
 */
export async function cancelOrder(orderId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelado" })
      .eq("id", orderId)
      .eq("status", "pendiente");

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error canceling order:", error);
    return false;
  }
}

/**
 * Calculate ETA to business
 */
export async function calculateETAToBusiness(
  currentLat: number,
  currentLng: number,
  businessId: string,
  speedKmh: number = 18,
): Promise<number | null> {
  try {
    // Get business location and calculate manually
    const { data: business } = await supabase
      .from("businesses")
      .select("location")
      .eq("id", businessId)
      .single();

    if (business?.location) {
      const coords = business.location as any;
      const lat2 = coords.coordinates?.[1] || 0;
      const lng2 = coords.coordinates?.[0] || 0;

      // Haversine formula
      const R = 6371;
      const dLat = ((lat2 - currentLat) * Math.PI) / 180;
      const dLon = ((lng2 - currentLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((currentLat * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return Math.ceil((distance / speedKmh) * 60);
    }

    return null;
  } catch (error) {
    console.error("Error calculating ETA:", error);
    return null;
  }
}
