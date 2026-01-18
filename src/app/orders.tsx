/**
 * My Orders Screen
 * List of user's orders
 */

import { brand, neutral } from "@/constants/Colors";
import {
    getMyOrders,
    ORDER_STATUS_COLORS,
    ORDER_STATUS_LABELS,
    OrderSummary,
} from "@/services/orders";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Hoy, ${date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
    }

    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
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

  const renderOrderCard = ({ item }: { item: OrderSummary }) => {
    const statusColor = ORDER_STATUS_COLORS[item.status] || neutral.gray500;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}15` },
            ]}
          >
            <Ionicons
              name={getStatusIcon(item.status)}
              size={14}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {ORDER_STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.businessRow}>
            <Ionicons
              name="storefront-outline"
              size={18}
              color={neutral.gray500}
            />
            <Text style={styles.businessName}>{item.businessName}</Text>
          </View>
          <View style={styles.orderDetails}>
            <Text style={styles.itemCount}>
              {item.itemCount} producto{item.itemCount !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
          </View>
        </View>

        {item.status === "listo" && (
          <View style={styles.readyBanner}>
            <Ionicons name="alert-circle" size={16} color={neutral.white} />
            <Text style={styles.readyText}>¡Listo para recoger!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color={neutral.gray300} />
      <Text style={styles.emptyTitle}>No tienes pedidos</Text>
      <Text style={styles.emptySubtitle}>Tus pedidos aparecerán aquí</Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push("/(tabs)/comercios")}
      >
        <Text style={styles.exploreButtonText}>Explorar comercios</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
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
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={[
          styles.listContent,
          orders.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: neutral.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray100,
  },
  orderInfo: {},
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray800,
  },
  orderDate: {
    fontSize: 12,
    color: neutral.gray500,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderBody: {
    padding: 16,
    paddingTop: 12,
  },
  businessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  businessName: {
    fontSize: 15,
    fontWeight: "500",
    color: neutral.gray800,
  },
  orderDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  itemCount: {
    fontSize: 14,
    color: neutral.gray500,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: brand.primary,
  },
  readyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22C55E",
    paddingVertical: 10,
  },
  readyText: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.white,
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
});
