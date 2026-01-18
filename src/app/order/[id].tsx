/**
 * Order Detail Screen
 * Shows order status and details
 */

import { brand, neutral, semantic } from "@/constants/Colors";
import {
    cancelOrder,
    getOrderById,
    ORDER_STATUS_COLORS,
    ORDER_STATUS_LABELS,
    OrderDetail,
    OrderItemDetail,
} from "@/services/orders";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await getOrderById(id!);
      setOrder(data);
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrder();
  };

  const handleCall = () => {
    if (order?.businessPhone) {
      Linking.openURL(`tel:${order.businessPhone}`);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar pedido",
      "¿Estás seguro de que quieres cancelar este pedido?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            const success = await cancelOrder(order!.id);
            if (success) {
              loadOrder();
              Alert.alert("Pedido cancelado", "Tu pedido ha sido cancelado");
            } else {
              Alert.alert("Error", "No se pudo cancelar el pedido");
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case "pendiente":
        return "time-outline";
      case "confirmado":
        return "checkmark-circle-outline";
      case "preparando":
        return "restaurant-outline";
      case "listo":
        return "bag-check-outline";
      case "entregado":
        return "checkmark-done-circle";
      case "cancelado":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={neutral.gray800} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={neutral.gray400}
          />
          <Text style={styles.errorText}>Pedido no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = ORDER_STATUS_COLORS[order.status] || neutral.gray500;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={neutral.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido #{order.orderNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={getStatusIcon(order.status)}
              size={32}
              color={statusColor}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Text>
            {order.status === "listo" && (
              <Text style={styles.statusHint}>
                ¡Tu pedido está listo para recoger!
              </Text>
            )}
            {order.status === "pendiente" && (
              <Text style={styles.statusHint}>
                Esperando confirmación del comercio
              </Text>
            )}
            {order.status === "preparando" && (
              <Text style={styles.statusHint}>
                El comercio está preparando tu pedido
              </Text>
            )}
          </View>
        </View>

        {/* Pickup Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recoger en</Text>
          <View style={styles.pickupCard}>
            <View style={styles.pickupInfo}>
              <Ionicons name="storefront" size={24} color={brand.primary} />
              <View style={styles.pickupDetails}>
                <Text style={styles.businessName}>{order.businessName}</Text>
                <Text style={styles.businessAddress}>
                  {order.businessAddress}
                </Text>
              </View>
            </View>
            {order.businessPhone && (
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color={brand.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={18} color={neutral.gray500} />
            <Text style={styles.timeText}>
              Hora estimada: {formatTime(order.estimatedPickupTime)}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu pedido</Text>
          {order.items.map((item: OrderItemDetail) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemQuantity}>
                <Text style={styles.quantityText}>{item.quantity}x</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.notes && (
                  <Text style={styles.itemNotes}>{item.notes}</Text>
                )}
              </View>
              <Text style={styles.itemPrice}>
                ${item.totalPrice.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pago</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ${order.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tarifa de servicio</Text>
            <Text style={styles.summaryValue}>
              ${order.platformFee.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentMethodRow}>
            <Ionicons name="cash-outline" size={18} color={neutral.gray500} />
            <Text style={styles.paymentMethodText}>
              {order.paymentMethod === "efectivo"
                ? "Pago en efectivo"
                : "Tarjeta"}
            </Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <Text style={styles.orderDate}>
            Pedido: {formatDate(order.createdAt)}
          </Text>
          {order.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notas:</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Cancel Button */}
        {order.status === "pendiente" && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={semantic.error}
            />
            <Text style={styles.cancelButtonText}>Cancelar pedido</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.gray50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: neutral.gray50,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: neutral.gray500,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.gray800,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: neutral.white,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 16,
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: neutral.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusHint: {
    fontSize: 14,
    color: neutral.gray500,
    marginTop: 4,
  },
  section: {
    backgroundColor: neutral.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray500,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickupInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pickupDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.gray800,
  },
  businessAddress: {
    fontSize: 14,
    color: neutral.gray500,
    marginTop: 2,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: neutral.gray100,
  },
  timeText: {
    fontSize: 14,
    color: neutral.gray600,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray100,
  },
  itemQuantity: {
    width: 32,
    height: 24,
    backgroundColor: neutral.gray100,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.gray700,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    color: neutral.gray800,
  },
  itemNotes: {
    fontSize: 13,
    color: neutral.gray500,
    fontStyle: "italic",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "500",
    color: neutral.gray800,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: neutral.gray600,
  },
  summaryValue: {
    fontSize: 14,
    color: neutral.gray800,
  },
  divider: {
    height: 1,
    backgroundColor: neutral.gray200,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.gray800,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: brand.primary,
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: neutral.gray100,
  },
  paymentMethodText: {
    fontSize: 14,
    color: neutral.gray600,
  },
  orderDate: {
    fontSize: 14,
    color: neutral.gray600,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: neutral.gray100,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.gray500,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: neutral.gray700,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: semantic.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: semantic.error,
  },
});
