/**
 * Route Detail Screen
 * Shows complete information about a route including waypoints, nearby businesses, and purchase options
 */

import { brand, neutral, semantic } from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import {
  getBusinessesNearRoute,
  getRouteById,
  getRouteWaypoints,
} from "@/services/routes";
import type {
  BusinessForMap,
  RouteForMap,
  RouteWaypoint,
  WaypointType,
} from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const MAP_HEIGHT = height * 0.35;

// Difficulty configurations
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  facil: { label: "Fácil", color: "#22C55E" },
  moderada: { label: "Media", color: "#F59E0B" },
  dificil: { label: "Difícil", color: "#EF4444" },
  experto: { label: "Experto", color: "#7C3AED" },
};

// Waypoint icons
const WAYPOINT_ICONS: Record<
  WaypointType,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  inicio: { icon: "flag", color: "#22C55E" },
  fin: { icon: "checkmark-circle", color: "#EF4444" },
  cenote: { icon: "water", color: "#3B82F6" },
  zona_arqueologica: { icon: "business", color: "#8B5CF6" },
  mirador: { icon: "eye", color: "#06B6D4" },
  restaurante: { icon: "restaurant", color: "#F97316" },
  tienda: { icon: "storefront", color: "#10B981" },
  taller_bicicletas: { icon: "build", color: "#6366F1" },
  descanso: { icon: "bed", color: "#EC4899" },
  punto_agua: { icon: "water-outline", color: "#0EA5E9" },
  peligro: { icon: "warning", color: "#EF4444" },
  foto: { icon: "camera", color: "#8B5CF6" },
  otro: { icon: "location", color: "#6B7280" },
};

// Business type icons
const BUSINESS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurante: "restaurant",
  cafeteria: "cafe",
  tienda: "storefront",
  taller_bicicletas: "build",
  hospedaje: "bed",
  tienda_conveniencia: "cart",
  mercado: "basket",
  otro: "location",
};

export default function RouteDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // State
  const [route, setRoute] = useState<RouteForMap | null>(null);
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [businesses, setBusinesses] = useState<BusinessForMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "info" | "waypoints" | "businesses"
  >("info");
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadRouteData(id);
    }
  }, [id]);

  const loadRouteData = async (routeId: string) => {
    try {
      setIsLoading(true);

      // Fetch route, waypoints, and businesses in parallel
      const [routeData, waypointsData, businessesData] = await Promise.all([
        getRouteById(routeId),
        getRouteWaypoints(routeId),
        getBusinessesNearRoute(routeId, 1000),
      ]);

      setRoute(routeData);
      setWaypoints(waypointsData);
      setBusinesses(businessesData);

      // Check if user has access to this route
      if (routeData) {
        await checkUserAccess(routeId, routeData.isFree);
      }

      // Fit map to route
      if (routeData && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(routeData.coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: false,
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error loading route:", error);
      Alert.alert("Error", "No se pudo cargar la ruta");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserAccess = async (routeId: string, isFree: boolean) => {
    // Free routes are accessible to everyone
    if (isFree) {
      setHasAccess(true);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Check if user is the creator
      const { data: routeData } = await supabase
        .from("routes")
        .select("creator_id")
        .eq("id", routeId)
        .single();

      if (routeData?.creator_id === user.id) {
        setHasAccess(true);
        return;
      }

      // Check if user purchased the route
      const { data: purchase } = await supabase
        .from("route_purchases")
        .select("id")
        .eq("route_id", routeId)
        .eq("buyer_id", user.id)
        .eq("payment_status", "completado")
        .single();

      setHasAccess(!!purchase);
    } catch (error) {
      console.error("Error checking access:", error);
      setHasAccess(false);
    }
  };

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return "--";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handlePurchase = () => {
    if (route?.isFree) {
      Alert.alert(
        "¡Ruta Gratuita!",
        "Esta ruta es gratuita. Se ha añadido a tus rutas.",
        [{ text: "Genial", style: "default" }],
      );
      setHasAccess(true);
    } else {
      Alert.alert(
        "Comprar Ruta",
        `¿Deseas comprar "${route?.name}" por $${route?.price.toFixed(0)} MXN?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Comprar", onPress: () => processPurchase() },
        ],
      );
    }
  };

  const processPurchase = () => {
    // TODO: Implement Stripe/MercadoPago integration
    Alert.alert(
      "Próximamente",
      "El sistema de pagos estará disponible pronto.",
    );
  };

  // Header opacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, MAP_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={brand.primary} />
        <Text style={styles.loadingText}>Cargando ruta...</Text>
      </View>
    );
  }

  if (!route) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle" size={48} color={semantic.error} />
        <Text style={styles.errorText}>No se encontró la ruta</Text>
        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonErrorText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const difficultyConfig =
    DIFFICULTY_CONFIG[route.difficulty] || DIFFICULTY_CONFIG.moderada;

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          { paddingTop: insets.top, opacity: headerOpacity },
        ]}
      >
        <Text style={styles.animatedHeaderTitle} numberOfLines={1}>
          {route.name}
        </Text>
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={neutral.white} />
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity
        style={[styles.shareButton, { top: insets.top + 8 }]}
        onPress={() => Alert.alert("Compartir", "Próximamente")}
      >
        <Ionicons name="share-outline" size={24} color={neutral.white} />
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Map Header */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={
              Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
            }
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {/* Route Polyline */}
            <Polyline
              coordinates={route.coordinates}
              strokeColor={brand.primary}
              strokeWidth={4}
            />

            {/* Start Marker */}
            <Marker coordinate={route.startPoint}>
              <View style={[styles.routeMarker, styles.startMarker]}>
                <Ionicons name="flag" size={14} color={neutral.white} />
              </View>
            </Marker>

            {/* End Marker */}
            <Marker coordinate={route.endPoint}>
              <View style={[styles.routeMarker, styles.endMarker]}>
                <Ionicons name="checkmark" size={14} color={neutral.white} />
              </View>
            </Marker>
          </MapView>

          {/* Gradient Overlay */}
          <View style={styles.mapGradient} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.routeName}>{route.name}</Text>
              {route.isFree ? (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>GRATIS</Text>
                </View>
              ) : (
                <Text style={styles.priceText}>${route.price.toFixed(0)}</Text>
              )}
            </View>

            {/* Rating & Reviews */}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text style={styles.ratingText}>
                {route.averageRating.toFixed(1)}
              </Text>
              <Text style={styles.reviewsText}>
                ({route.totalReviews} reseñas)
              </Text>
              {route.creatorName && (
                <>
                  <View style={styles.dot} />
                  <Text style={styles.creatorText}>
                    por {route.creatorName}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="map-outline" size={20} color={brand.primary} />
              <Text style={styles.statValue}>
                {route.distanceKm.toFixed(1)} km
              </Text>
              <Text style={styles.statLabel}>Distancia</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={20} color={brand.primary} />
              <Text style={styles.statValue}>
                {formatDuration(route.estimatedDurationMin)}
              </Text>
              <Text style={styles.statLabel}>Duración</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons
                name="trending-up-outline"
                size={20}
                color={brand.primary}
              />
              <Text style={styles.statValue}>{route.elevationGainM}m</Text>
              <Text style={styles.statLabel}>Elevación</Text>
            </View>
            <View
              style={[styles.statCard, { borderColor: difficultyConfig.color }]}
            >
              <Ionicons
                name="speedometer-outline"
                size={20}
                color={difficultyConfig.color}
              />
              <Text
                style={[styles.statValue, { color: difficultyConfig.color }]}
              >
                {difficultyConfig.label}
              </Text>
              <Text style={styles.statLabel}>Dificultad</Text>
            </View>
          </View>

          {/* Description */}
          {route.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{route.description}</Text>
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "info" && styles.activeTab]}
              onPress={() => setActiveTab("info")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "info" && styles.activeTabText,
                ]}
              >
                Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "waypoints" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("waypoints")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "waypoints" && styles.activeTabText,
                ]}
              >
                Puntos ({waypoints.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "businesses" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("businesses")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "businesses" && styles.activeTabText,
                ]}
              >
                Comercios ({businesses.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === "info" && (
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="bicycle-outline"
                  size={20}
                  color={neutral.gray500}
                />
                <Text style={styles.infoLabel}>Terreno:</Text>
                <Text style={styles.infoValue}>
                  {route.terrainType === "asfalto"
                    ? "Asfalto"
                    : route.terrainType === "terraceria"
                    ? "Terracería"
                    : "Mixto"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={neutral.gray500}
                />
                <Text style={styles.infoLabel}>Inicio:</Text>
                <Text style={styles.infoValue}>
                  {route.startPoint.latitude.toFixed(4)},{" "}
                  {route.startPoint.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          )}

          {activeTab === "waypoints" && (
            <View style={styles.section}>
              {waypoints.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="location-outline"
                    size={32}
                    color={neutral.gray400}
                  />
                  <Text style={styles.emptyStateText}>
                    No hay puntos de interés registrados
                  </Text>
                </View>
              ) : (
                waypoints.map((waypoint, index) => {
                  const config =
                    WAYPOINT_ICONS[waypoint.waypoint_type] ||
                    WAYPOINT_ICONS.otro;
                  return (
                    <View key={waypoint.id} style={styles.waypointItem}>
                      <View
                        style={[
                          styles.waypointIcon,
                          { backgroundColor: config.color },
                        ]}
                      >
                        <Ionicons
                          name={config.icon}
                          size={16}
                          color={neutral.white}
                        />
                      </View>
                      <View style={styles.waypointInfo}>
                        <Text style={styles.waypointName}>{waypoint.name}</Text>
                        {waypoint.description && (
                          <Text
                            style={styles.waypointDescription}
                            numberOfLines={2}
                          >
                            {waypoint.description}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.waypointIndex}>#{index + 1}</Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {activeTab === "businesses" && (
            <View style={styles.section}>
              {businesses.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="storefront-outline"
                    size={32}
                    color={neutral.gray400}
                  />
                  <Text style={styles.emptyStateText}>
                    No hay comercios cerca de esta ruta
                  </Text>
                </View>
              ) : (
                businesses.map((business) => (
                  <TouchableOpacity
                    key={business.id}
                    style={styles.businessItem}
                  >
                    <View style={styles.businessIcon}>
                      <Ionicons
                        name={BUSINESS_ICONS[business.type] || "storefront"}
                        size={20}
                        color={brand.primary}
                      />
                    </View>
                    <View style={styles.businessInfo}>
                      <Text style={styles.businessName}>{business.name}</Text>
                      <Text style={styles.businessType}>
                        {business.type.replace("_", " ")}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={neutral.gray400}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* Bottom Purchase Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.bottomBarContent}>
          <View>
            {route.isFree ? (
              <Text style={styles.bottomPriceLabel}>Gratuita</Text>
            ) : hasAccess ? (
              <Text style={styles.bottomPriceLabel}>Ruta adquirida</Text>
            ) : (
              <>
                <Text style={styles.bottomPriceLabel}>Precio</Text>
                <Text style={styles.bottomPrice}>
                  ${route.price.toFixed(0)} MXN
                </Text>
              </>
            )}
          </View>
          {hasAccess || route.isFree ? (
            <TouchableOpacity
              style={[styles.purchaseButton, styles.startRouteButton]}
              onPress={() => router.push(`/route/active/${route.id}`)}
            >
              <Text style={styles.purchaseButtonText}>Iniciar Ruta</Text>
              <Ionicons name="play" size={20} color={neutral.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handlePurchase}
            >
              <Text style={styles.purchaseButtonText}>Comprar Ruta</Text>
              <Ionicons name="cart-outline" size={20} color={neutral.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: neutral.gray500,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: semantic.error,
  },
  backButtonError: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: brand.primary,
    borderRadius: 8,
  },
  backButtonErrorText: {
    color: neutral.white,
    fontWeight: "600",
  },
  // Header
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: brand.primary,
    zIndex: 100,
    paddingBottom: 12,
    paddingHorizontal: 60,
  },
  animatedHeaderTitle: {
    color: neutral.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 101,
  },
  shareButton: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 101,
  },
  // Map
  mapContainer: {
    height: MAP_HEIGHT,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "transparent",
  },
  routeMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: neutral.white,
  },
  startMarker: {
    backgroundColor: "#22C55E",
  },
  endMarker: {
    backgroundColor: "#EF4444",
  },
  // Content
  content: {
    backgroundColor: neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  routeName: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: neutral.gray800,
    marginRight: 12,
  },
  freeBadge: {
    backgroundColor: semantic.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeBadgeText: {
    color: neutral.white,
    fontSize: 12,
    fontWeight: "700",
  },
  priceText: {
    fontSize: 24,
    fontWeight: "bold",
    color: brand.primary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray800,
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: neutral.gray500,
    marginLeft: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: neutral.gray400,
    marginHorizontal: 8,
  },
  creatorText: {
    fontSize: 14,
    color: neutral.gray500,
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: neutral.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: neutral.gray200,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: neutral.gray800,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: neutral.gray500,
    marginTop: 2,
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: neutral.gray800,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: neutral.gray700,
  },
  // Tabs
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: neutral.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: neutral.white,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: neutral.gray500,
  },
  activeTabText: {
    color: neutral.gray800,
  },
  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray100,
  },
  infoLabel: {
    fontSize: 14,
    color: neutral.gray500,
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    color: neutral.gray800,
    fontWeight: "500",
    marginLeft: 8,
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: neutral.gray500,
  },
  // Waypoints
  waypointItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray100,
  },
  waypointIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  waypointInfo: {
    flex: 1,
    marginLeft: 12,
  },
  waypointName: {
    fontSize: 15,
    fontWeight: "500",
    color: neutral.gray800,
  },
  waypointDescription: {
    fontSize: 13,
    color: neutral.gray500,
    marginTop: 2,
  },
  waypointIndex: {
    fontSize: 12,
    color: neutral.gray400,
    fontWeight: "600",
  },
  // Businesses
  businessItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray100,
  },
  businessIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${brand.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  businessInfo: {
    flex: 1,
    marginLeft: 12,
  },
  businessName: {
    fontSize: 15,
    fontWeight: "500",
    color: neutral.gray800,
  },
  businessType: {
    fontSize: 13,
    color: neutral.gray500,
    marginTop: 2,
    textTransform: "capitalize",
  },
  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: neutral.white,
    borderTopWidth: 1,
    borderTopColor: neutral.gray200,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  bottomBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: neutral.gray500,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: neutral.gray800,
  },
  purchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startRouteButton: {
    backgroundColor: "#22C55E",
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.white,
  },
});
