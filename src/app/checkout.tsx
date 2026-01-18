/**
 * Checkout Screen
 * Confirm order details and place order
 */

import { brand, neutral } from "@/constants/Colors";
import { createOrder } from "@/services/orders";
import { CartItem, useCart } from "@/stores/cartStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type PaymentMethod = "efectivo" | "tarjeta" | "wallet";

const PICKUP_TIME_OPTIONS = [
  { label: "30 minutos", minutes: 30 },
  { label: "1 hora", minutes: 60 },
  { label: "1.5 horas", minutes: 90 },
  { label: "2 horas", minutes: 120 },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { state, getSubtotal, clearCart } = useCart();

  const [selectedPickupTime, setSelectedPickupTime] = useState(60);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const serviceFee = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + serviceFee;

  const getEstimatedPickupTime = (): Date => {
    const now = new Date();
    return new Date(now.getTime() + selectedPickupTime * 60 * 1000);
  };

  const formatPickupTime = (date: Date): string => {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePlaceOrder = async () => {
    if (!state.businessId) {
      Alert.alert("Error", "No se encontró el comercio");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createOrder({
        businessId: state.businessId,
        items: state.items.map((item: CartItem) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })),
        estimatedPickupTime: getEstimatedPickupTime(),
        notes: notes.trim() || undefined,
        paymentMethod,
      });

      if (result) {
        clearCart();
        Alert.alert(
          "¡Pedido confirmado!",
          `Tu pedido #${result.orderNumber} ha sido enviado al comercio.`,
          [
            {
              text: "Ver pedido",
              onPress: () => router.replace(`/order/${result.orderId}`),
            },
          ],
        );
      } else {
        throw new Error("No se pudo crear el pedido");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "No se pudo procesar tu pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Text style={styles.headerTitle}>Confirmar pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Business Info */}
          <View style={styles.section}>
            <View style={styles.businessCard}>
              <Ionicons name="storefront" size={24} color={brand.primary} />
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{state.businessName}</Text>
                <Text style={styles.itemCount}>
                  {state.items.length} producto
                  {state.items.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Pickup Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hora de recogida</Text>
            <View style={styles.pickupOptions}>
              {PICKUP_TIME_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.minutes}
                  style={[
                    styles.pickupOption,
                    selectedPickupTime === option.minutes &&
                      styles.pickupOptionSelected,
                  ]}
                  onPress={() => setSelectedPickupTime(option.minutes)}
                >
                  <Text
                    style={[
                      styles.pickupOptionText,
                      selectedPickupTime === option.minutes &&
                        styles.pickupOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.pickupTimeInfo}>
              <Ionicons name="time-outline" size={18} color={neutral.gray500} />
              <Text style={styles.pickupTimeText}>
                Listo aproximadamente a las{" "}
                {formatPickupTime(getEstimatedPickupTime())}
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de pago</Text>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "efectivo" && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMethod("efectivo")}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons
                  name="cash-outline"
                  size={24}
                  color={neutral.gray700}
                />
                <Text style={styles.paymentOptionText}>
                  Efectivo al recoger
                </Text>
              </View>
              {paymentMethod === "efectivo" && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={brand.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "tarjeta" && styles.paymentOptionSelected,
                styles.paymentDisabled,
              ]}
              disabled
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={neutral.gray400}
                />
                <View>
                  <Text
                    style={[
                      styles.paymentOptionText,
                      { color: neutral.gray400 },
                    ]}
                  >
                    Tarjeta
                  </Text>
                  <Text style={styles.comingSoon}>Próximamente</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas para el comercio</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Ej: Sin cebolla, extra salsa..."
              placeholderTextColor={neutral.gray400}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.summaryCard}>
              {state.items.map((item: CartItem) => (
                <View key={item.productId} style={styles.summaryItem}>
                  <Text style={styles.summaryItemName}>
                    {item.quantity}x {item.productName}
                  </Text>
                  <Text style={styles.summaryItemPrice}>
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tarifa de servicio</Text>
                <Text style={styles.summaryValue}>
                  ${serviceFee.toFixed(2)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Place Order Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.orderButton,
            isSubmitting && styles.orderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={neutral.white} />
          ) : (
            <>
              <Text style={styles.orderButtonText}>Confirmar pedido</Text>
              <Text style={styles.orderButtonPrice}>${total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.gray50,
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
    fontSize: 18,
    fontWeight: "600",
    color: neutral.gray800,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: neutral.white,
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.gray800,
    marginBottom: 12,
  },
  businessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.gray800,
  },
  itemCount: {
    fontSize: 14,
    color: neutral.gray500,
    marginTop: 2,
  },
  pickupOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickupOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: neutral.gray100,
    borderWidth: 1,
    borderColor: neutral.gray200,
  },
  pickupOptionSelected: {
    backgroundColor: brand.primaryLight,
    borderColor: brand.primary,
  },
  pickupOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: neutral.gray700,
  },
  pickupOptionTextSelected: {
    color: brand.primary,
  },
  pickupTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  pickupTimeText: {
    fontSize: 14,
    color: neutral.gray500,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: neutral.gray50,
    borderWidth: 1,
    borderColor: neutral.gray200,
    marginBottom: 8,
  },
  paymentOptionSelected: {
    backgroundColor: brand.primaryLight,
    borderColor: brand.primary,
  },
  paymentDisabled: {
    opacity: 0.6,
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: neutral.gray800,
  },
  comingSoon: {
    fontSize: 12,
    color: neutral.gray400,
  },
  notesInput: {
    backgroundColor: neutral.gray50,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: neutral.gray800,
    minHeight: 80,
    borderWidth: 1,
    borderColor: neutral.gray200,
  },
  summaryCard: {
    backgroundColor: neutral.gray50,
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryItemName: {
    fontSize: 14,
    color: neutral.gray700,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    color: neutral.gray700,
  },
  divider: {
    height: 1,
    backgroundColor: neutral.gray200,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: neutral.gray600,
  },
  summaryValue: {
    fontSize: 14,
    color: neutral.gray800,
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
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: neutral.white,
    borderTopWidth: 1,
    borderTopColor: neutral.gray200,
  },
  orderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  orderButtonDisabled: {
    opacity: 0.7,
  },
  orderButtonText: {
    color: neutral.white,
    fontSize: 16,
    fontWeight: "600",
  },
  orderButtonPrice: {
    color: neutral.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
