/**
 * Business Detail Screen
 * Shows detailed information about a business and its products
 */

import { Toast, useToast } from "@/components/Toast";
import { accent, brand, neutral, semantic, typography } from "@/constants/Colors";
import {
  BUSINESS_TYPE_ICONS,
  BUSINESS_TYPE_LABELS,
  BusinessDetail,
  BusinessProduct,
  getBusinessById,
  getBusinessProducts,
} from "@/services/businesses";
import { useCart } from "@/stores/cartStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function BusinessDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "products">("info");
  const tabIndicatorX = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabIndicatorX, {
      toValue: activeTab === 'info' ? 0 : width / 2,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [activeTab]);

  // Toast
  const { toast, showToast, hideToast } = useToast();

  // Cart
  const {
    addItem,
    getItemQuantity,
    getItemCount,
    clearCart,
    state: cartState,
  } = useCart();
  const cartItemCount = getItemCount();
  const isCartFromThisBusiness = cartState.businessId === id;

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [businessData, productsData] = await Promise.all([
        getBusinessById(id),
        getBusinessProducts(id),
      ]);
      setBusiness(businessData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading business:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (business?.phone) {
      Linking.openURL(`tel:${business.phone}`);
    }
  };

  const handleEmail = () => {
    if (business?.email) {
      Linking.openURL(`mailto:${business.email}`);
    }
  };

  const handleWebsite = () => {
    if (business?.website) {
      Linking.openURL(business.website);
    }
  };

  const handleMaps = () => {
    if (business?.coordinate) {
      const url = `https://www.google.com/maps/search/?api=1&query=${business.coordinate.latitude},${business.coordinate.longitude}`;
      Linking.openURL(url);
    }
  };

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    return (BUSINESS_TYPE_ICONS[type] ||
      "storefront") as keyof typeof Ionicons.glyphMap;
  };

  const handleAddToCart = (product: BusinessProduct) => {
    if (!business) return;

    // Check if cart has items from another business
    if (
      cartState.businessId &&
      cartState.businessId !== id &&
      cartState.items.length > 0
    ) {
      Alert.alert(
        "Cambiar comercio",
        `Tu carrito tiene productos de ${cartState.businessName}. ¿Quieres vaciar el carrito y agregar productos de ${business.name}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Vaciar y agregar",
            onPress: () => {
              clearCart();
              addItem({
                productId: product.id,
                productName: product.name,
                unitPrice: product.price,
                businessId: id!,
                businessName: business.name,
                imageUrl: product.imageUrl || undefined,
              });
              showToast(`${product.name} agregado al carrito`, "success");
            },
          },
        ],
      );
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      businessId: id!,
      businessName: business.name,
      imageUrl: product.imageUrl || undefined,
    });
    showToast(`${product.name} agregado al carrito`, "success");
  };

  // Group products by category
  const productsByCategory = products.reduce(
    (acc, product) => {
      const category = product.category || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    },
    {} as Record<string, BusinessProduct[]>,
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={neutral.steel}
          />
          <Text style={styles.errorText}>Comercio no encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={neutral.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {business.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <LinearGradient
        colors={[brand.primaryTint, neutral.white]}
        style={styles.heroContainer}
      >
        <View style={styles.heroImage}>
          <Ionicons
            name={getTypeIcon(business.type)}
            size={64}
            color={brand.primary}
          />
        </View>
        <View style={styles.heroInfo}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {BUSINESS_TYPE_LABELS[business.type] || business.type}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color={accent.amber} />
            <Text style={styles.ratingText}>
              {business.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.reviewsText}>
              ({business.totalReviews} reseñas)
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("info")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "info" && styles.activeTabText,
            ]}
          >
            Información
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("products")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "products" && styles.activeTabText,
            ]}
          >
            Productos ({products.length})
          </Text>
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.tabIndicator,
            { transform: [{ translateX: tabIndicatorX }] }
          ]}
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "info" ? (
          <>
            {/* Description */}
            {business.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Acerca de</Text>
                <Text style={styles.descriptionText}>
                  {business.description}
                </Text>
              </View>
            )}

            {/* Contact */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contacto</Text>

              {business.address && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={handleMaps}
                >
                  <View style={styles.contactIcon}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={brand.primary}
                    />
                  </View>
                  <Text style={styles.contactText}>{business.address}</Text>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={neutral.steel}
                  />
                </TouchableOpacity>
              )}

              {business.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={handleCall}
                >
                  <View style={styles.contactIcon}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={brand.primary}
                    />
                  </View>
                  <Text style={styles.contactText}>{business.phone}</Text>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={neutral.steel}
                  />
                </TouchableOpacity>
              )}

              {business.email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={handleEmail}
                >
                  <View style={styles.contactIcon}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={brand.primary}
                    />
                  </View>
                  <Text style={styles.contactText}>{business.email}</Text>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={neutral.steel}
                  />
                </TouchableOpacity>
              )}

              {business.website && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={handleWebsite}
                >
                  <View style={styles.contactIcon}>
                    <Ionicons
                      name="globe-outline"
                      size={20}
                      color={brand.primary}
                    />
                  </View>
                  <Text style={styles.contactText} numberOfLines={1}>
                    {business.website}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={neutral.steel}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Opening Hours */}
            {business.openingHours &&
              Object.keys(business.openingHours).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Horarios</Text>
                  {Object.entries(business.openingHours).map(([day, hours]) => (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={styles.dayText}>{day}</Text>
                      <Text style={styles.hoursText}>{hours}</Text>
                    </View>
                  ))}
                </View>
              )}
          </>
        ) : (
          <>
            {products.length === 0 ? (
              <View style={styles.emptyProducts}>
                <Ionicons
                  name="basket-outline"
                  size={48}
                  color={neutral.steel}
                />
                <Text style={styles.emptyProductsText}>
                  No hay productos disponibles
                </Text>
              </View>
            ) : (
              Object.entries(productsByCategory).map(
                ([category, categoryProducts]) => (
                  <View key={category} style={styles.section}>
                    <Text style={styles.sectionTitle}>{category}</Text>
                    {categoryProducts.map((product) => (
                      <View key={product.id} style={styles.productCard}>
                        <View style={styles.productImage}>
                          <Ionicons
                            name="cube-outline"
                            size={24}
                            color={neutral.steel}
                          />
                        </View>
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{product.name}</Text>
                          {product.description && (
                            <Text style={styles.productDesc} numberOfLines={2}>
                              {product.description}
                            </Text>
                          )}
                          <Text style={styles.productPrice}>
                            ${product.price.toFixed(2)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.addButton,
                            getItemQuantity(product.id) > 0 &&
                            styles.addButtonActive,
                          ]}
                          onPress={() => handleAddToCart(product)}
                        >
                          {getItemQuantity(product.id) > 0 ? (
                            <Text style={styles.addButtonQuantity}>
                              {getItemQuantity(product.id)}
                            </Text>
                          ) : (
                            <Ionicons
                              name="add"
                              size={22}
                              color={neutral.white}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ),
              )
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {cartItemCount > 0 && isCartFromThisBusiness ? (
        <View style={[styles.bottomCta, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/cart")}
          >
            <View style={styles.cartButtonLeft}>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
              <Text style={styles.cartButtonText}>Ver carrito</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={neutral.white} />
          </TouchableOpacity>
        </View>
      ) : business.phone ? (
        <View style={[styles.bottomCta, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color={neutral.white} />
            <Text style={styles.ctaButtonText}>Llamar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaButtonSecondary}
            onPress={handleMaps}
          >
            <Ionicons name="navigate" size={20} color={brand.primary} />
            <Text style={styles.ctaButtonSecondaryText}>Cómo llegar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: neutral.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: typography.bodyLg,
    color: neutral.slate,
    marginTop: 12,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: brand.primary,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    color: neutral.white,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.silver,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: neutral.charcoal,
    textAlign: "center",
  },
  // Hero
  heroContainer: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: neutral.pearl,
  },
  heroImage: {
    width: 120,
    height: 120,
    backgroundColor: `${brand.primary}15`,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroInfo: {
    alignItems: "center",
  },
  typeBadge: {
    backgroundColor: brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: neutral.white,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: typography.headingSm,
    fontWeight: "600",
    color: neutral.charcoal,
  },
  reviewsText: {
    fontSize: typography.bodySm,
    color: neutral.slate,
  },
  // Tabs
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: neutral.silver,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: brand.primary,
    width: width / 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  activeTab: {
  },
  tabText: {
    fontSize: typography.bodySm,
    fontWeight: "500",
    color: neutral.slate,
  },
  activeTabText: {
    color: brand.primary,
    fontWeight: "600",
  },
  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: neutral.pearl,
  },
  sectionTitle: {
    fontSize: typography.bodyLg,
    fontWeight: "600",
    color: neutral.charcoal,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: typography.bodySm,
    color: neutral.graphite,
    lineHeight: 22,
  },
  // Contact
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.pearl,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${brand.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: neutral.graphite,
  },
  // Hours
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  dayText: {
    fontSize: typography.bodySm,
    color: neutral.graphite,
  },
  hoursText: {
    fontSize: typography.bodySm,
    color: neutral.slate,
  },
  // Products
  emptyProducts: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyProductsText: {
    marginTop: 12,
    fontSize: typography.bodySm,
    color: neutral.slate,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.pearl,
  },
  productImage: {
    width: 56,
    height: 56,
    backgroundColor: neutral.pearl,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    color: neutral.charcoal,
  },
  productDesc: {
    fontSize: typography.caption,
    color: neutral.slate,
    marginTop: 2,
  },
  productPrice: {
    fontSize: typography.bodyMd,
    fontWeight: "600",
    color: brand.primary,
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonActive: {
    backgroundColor: semantic.success,
  },
  addButtonQuantity: {
    fontSize: typography.bodySm,
    fontWeight: "700",
    color: neutral.white,
  },
  // Bottom CTA
  bottomCta: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: neutral.silver,
    backgroundColor: neutral.white,
  },
  ctaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: typography.bodyLg,
    fontWeight: "600",
    color: neutral.white,
  },
  ctaButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${brand.primary}15`,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonSecondaryText: {
    fontSize: typography.bodyLg,
    fontWeight: "600",
    color: brand.primary,
  },
  cartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: brand.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cartButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cartBadge: {
    backgroundColor: neutral.white,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: brand.primary,
  },
  cartButtonText: {
    fontSize: typography.bodyLg,
    fontWeight: "600",
    color: neutral.white,
  },
});
