/**
 * Cart Screen
 * Shows items in cart and allows proceeding to checkout
 */

import { brand, neutral, semantic } from "@/constants/Colors";
import { CartItem, useCart } from "@/stores/cartStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function CartScreen() {
  const router = useRouter();
  const { state, updateQuantity, removeItem, clearCart, getSubtotal } =
    useCart();

  const handleClearCart = () => {
    Alert.alert(
      "Vaciar carrito",
      "¿Estás seguro de que quieres vaciar el carrito?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Vaciar", style: "destructive", onPress: clearCart },
      ],
    );
  };

  const handleCheckout = () => {
    if (state.items.length === 0) {
      Alert.alert("Carrito vacío", "Agrega productos antes de continuar");
      return;
    }
    router.push("/checkout");
  };

  const subtotal = getSubtotal();
  const serviceFee = Math.round(subtotal * 0.1 * 100) / 100; // 10% service fee
  const total = subtotal + serviceFee;

  if (state.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={neutral.gray800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Carrito</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={neutral.gray300} />
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptySubtitle}>
            Explora comercios y agrega productos
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push("/(tabs)/comercios")}
          >
            <Text style={styles.exploreButtonText}>Ver comercios</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Mi Carrito</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
          <Ionicons name="trash-outline" size={22} color={semantic.error} />
        </TouchableOpacity>
      </View>

      {/* Business Info */}
      <View style={styles.businessInfo}>
        <Ionicons name="storefront" size={20} color={brand.primary} />
        <Text style={styles.businessName}>{state.businessName}</Text>
      </View>

      {/* Cart Items */}
      <ScrollView
        style={styles.itemsContainer}
        showsVerticalScrollIndicator={false}
      >
        {state.items.map((item: CartItem) => (
          <View key={item.productId} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)}</Text>
              {item.notes && (
                <Text style={styles.itemNotes} numberOfLines={1}>
                  Nota: {item.notes}
                </Text>
              )}
            </View>

            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  updateQuantity(item.productId, item.quantity - 1)
                }
              >
                <Ionicons name="remove" size={18} color={neutral.gray700} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  updateQuantity(item.productId, item.quantity + 1)
                }
              >
                <Ionicons name="add" size={18} color={neutral.gray700} />
              </TouchableOpacity>
            </View>

            <Text style={styles.itemTotal}>
              ${(item.unitPrice * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tarifa de servicio (10%)</Text>
            <Text style={styles.summaryValue}>${serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>
            Continuar • ${total.toFixed(2)}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={neutral.white} />
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  businessInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray200,
    gap: 8,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "500",
    color: neutral.gray800,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: neutral.gray800,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: neutral.gray500,
    textAlign: "center",
    marginTop: 8,
  },
  exploreButton: {
    marginTop: 24,
    backgroundColor: brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: neutral.white,
    fontSize: 16,
    fontWeight: "600",
  },
  itemsContainer: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: neutral.gray800,
  },
  itemPrice: {
    fontSize: 14,
    color: neutral.gray500,
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: neutral.gray400,
    fontStyle: "italic",
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: neutral.gray100,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray800,
    minWidth: 24,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.gray800,
    minWidth: 60,
    textAlign: "right",
  },
  summaryContainer: {
    backgroundColor: neutral.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
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
    marginVertical: 8,
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
  checkoutContainer: {
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
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: neutral.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
