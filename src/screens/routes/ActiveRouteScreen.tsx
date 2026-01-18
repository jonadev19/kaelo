/**
 * Active Route Screen
 * Real-time navigation and tracking while cycling a route
 */

import { brand, neutral, semantic } from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { getBusinessesNearRoute, getRouteById } from "@/services/routes";
import type { BusinessForMap, Coordinate, RouteForMap } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
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

// Status types
type RouteStatus = "loading" | "ready" | "active" | "paused" | "completed";

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

const getBusinessIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  return BUSINESS_ICONS[type] || "storefront";
};

export default function ActiveRouteScreen() {
  // Keep screen awake during active navigation
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  // Route data
  const [route, setRoute] = useState<RouteForMap | null>(null);
  const [businesses, setBusinesses] = useState<BusinessForMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tracking state
  const [status, setStatus] = useState<RouteStatus>("loading");
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [recordedPath, setRecordedPath] = useState<Coordinate[]>([]);
  const [completionId, setCompletionId] = useState<string | null>(null);

  // Stats
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // seconds
  const [distanceTraveled, setDistanceTraveled] = useState(0); // km
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load route data
  useEffect(() => {
    if (id) {
      loadRoute(id);
    }
    return () => {
      stopTracking();
    };
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (status === "active" && startTime) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - startTime.getTime()) / 1000,
        );
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, startTime]);

  const loadRoute = async (routeId: string) => {
    try {
      setIsLoading(true);

      // Load route and nearby businesses in parallel
      const [routeData, businessesData] = await Promise.all([
        getRouteById(routeId),
        getBusinessesNearRoute(routeId, 500), // 500m radius
      ]);

      setRoute(routeData);
      setBusinesses(businessesData);
      setStatus("ready");

      // Fit map to route
      if (routeData && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(routeData.coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
            animated: true,
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error loading route:", error);
      Alert.alert("Error", "No se pudo cargar la ruta");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos requeridos",
        "Necesitamos acceso a tu ubicación para seguir la ruta.",
        [{ text: "Entendido" }],
      );
      return false;
    }
    return true;
  };

  const startTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const initialCoord: Coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(initialCoord);
      setRecordedPath([initialCoord]);
      setStartTime(new Date());
      setStatus("active");

      // Create completion record
      await createCompletionRecord();

      // Center map on user
      mapRef.current?.animateToRegion(
        {
          ...initialCoord,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );

      // Start watching location
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 5, // Or every 5 meters
        },
        (location) => {
          const newCoord: Coordinate = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setUserLocation(newCoord);
          setCurrentSpeed((location.coords.speed || 0) * 3.6); // m/s to km/h

          setRecordedPath((prev) => {
            const updated = [...prev, newCoord];
            // Calculate distance
            if (prev.length > 0) {
              const lastCoord = prev[prev.length - 1];
              const dist = calculateDistance(lastCoord, newCoord);
              setDistanceTraveled((d) => d + dist);
            }
            return updated;
          });

          // Follow user on map
          mapRef.current?.animateToRegion(
            {
              ...newCoord,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            300,
          );

          // Check if near end point
          if (route) {
            const distToEnd = calculateDistance(newCoord, route.endPoint);
            if (distToEnd < 0.05) {
              // 50 meters
              handleArrival();
            }
          }
        },
      );

      Vibration.vibrate(100);
    } catch (error) {
      console.error("Error starting tracking:", error);
      Alert.alert("Error", "No se pudo iniciar el seguimiento");
    }
  };

  const createCompletionRecord = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !route) return;

      const { data, error } = await supabase
        .from("route_completions")
        .insert({
          user_id: user.id,
          route_id: route.id,
          started_at: new Date().toISOString(),
          status: "en_progreso",
        })
        .select("id")
        .single();

      if (error) throw error;
      setCompletionId(data.id);
    } catch (error) {
      console.error("Error creating completion:", error);
    }
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const pauseTracking = () => {
    stopTracking();
    setStatus("paused");
    Vibration.vibrate(50);
  };

  const resumeTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setStatus("active");

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) => {
        const newCoord: Coordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(newCoord);
        setCurrentSpeed((location.coords.speed || 0) * 3.6);

        setRecordedPath((prev) => {
          const updated = [...prev, newCoord];
          if (prev.length > 0) {
            const lastCoord = prev[prev.length - 1];
            const dist = calculateDistance(lastCoord, newCoord);
            setDistanceTraveled((d) => d + dist);
          }
          return updated;
        });

        mapRef.current?.animateToRegion(
          {
            ...newCoord,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          300,
        );
      },
    );

    Vibration.vibrate(100);
  };

  const handleArrival = () => {
    Vibration.vibrate([100, 100, 100, 100, 100]);
    Alert.alert("¡Llegaste!", "¡Felicidades! Has completado la ruta.", [
      {
        text: "Finalizar",
        onPress: () => finishRoute("completado"),
      },
    ]);
  };

  const finishRoute = async (finalStatus: "completado" | "abandonado") => {
    stopTracking();
    setStatus("completed");

    try {
      if (completionId) {
        await supabase
          .from("route_completions")
          .update({
            completed_at: new Date().toISOString(),
            duration_min: Math.floor(elapsedTime / 60),
            status: finalStatus,
            notes:
              finalStatus === "completado"
                ? `Distancia: ${distanceTraveled.toFixed(2)}km`
                : "Ruta abandonada",
          })
          .eq("id", completionId);
      }
    } catch (error) {
      console.error("Error updating completion:", error);
    }

    if (finalStatus === "completado") {
      Alert.alert(
        "¡Ruta Completada!",
        `Tiempo: ${formatTime(
          elapsedTime,
        )}\nDistancia: ${distanceTraveled.toFixed(2)} km`,
        [{ text: "Genial", onPress: () => router.back() }],
      );
    } else {
      router.back();
    }
  };

  const handleStop = () => {
    Alert.alert("Abandonar Ruta", "¿Seguro que quieres abandonar la ruta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Abandonar",
        style: "destructive",
        onPress: () => finishRoute("abandonado"),
      },
    ]);
  };

  const handleBack = () => {
    if (status === "active" || status === "paused") {
      Alert.alert("Salir", "Tienes una ruta en progreso. ¿Qué deseas hacer?", [
        { text: "Continuar", style: "cancel" },
        {
          text: "Abandonar",
          style: "destructive",
          onPress: () => finishRoute("abandonado"),
        },
      ]);
    } else {
      router.back();
    }
  };

  // Haversine formula for distance calculation
  const calculateDistance = (
    coord1: Coordinate,
    coord2: Coordinate,
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const toRad = (deg: number): number => deg * (Math.PI / 180);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const centerOnUser = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500,
      );
    }
  };

  const showFullRoute = () => {
    if (route) {
      mapRef.current?.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
    }
  };

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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        showsUserLocation={status === "active" || status === "paused"}
        showsMyLocationButton={false}
        followsUserLocation={status === "active"}
      >
        {/* Original Route Polyline */}
        <Polyline
          coordinates={route.coordinates}
          strokeColor={neutral.gray400}
          strokeWidth={4}
          lineDashPattern={[10, 5]}
        />

        {/* Recorded Path */}
        {recordedPath.length > 1 && (
          <Polyline
            coordinates={recordedPath}
            strokeColor={brand.primary}
            strokeWidth={5}
          />
        )}

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

        {/* Business Markers */}
        {businesses.map((business) => (
          <Marker
            key={business.id}
            coordinate={{
              latitude: business.coordinate.latitude,
              longitude: business.coordinate.longitude,
            }}
            title={business.name}
            description={business.type.replace("_", " ")}
            onCalloutPress={() => router.push(`/business/${business.id}`)}
          >
            <View style={styles.businessMarker}>
              <Ionicons
                name={getBusinessIcon(business.type)}
                size={14}
                color={neutral.white}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={neutral.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {route.name}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
          >
            <Text style={styles.statusText}>{getStatusLabel()}</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={centerOnUser}
        >
          <Ionicons name="locate" size={22} color={neutral.gray700} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={showFullRoute}
        >
          <Ionicons name="map-outline" size={22} color={neutral.gray700} />
        </TouchableOpacity>
      </View>

      {/* Stats Panel */}
      <View style={[styles.statsPanel, { paddingBottom: insets.bottom + 16 }]}>
        {/* Navigation Info - Only show when active */}
        {(status === "active" || status === "paused") && (
          <View style={styles.navigationInfo}>
            <View style={styles.navInfoItem}>
              <Ionicons
                name="flag-outline"
                size={18}
                color={semantic.success}
              />
              <View>
                <Text style={styles.navInfoValue}>
                  {Math.max(0, route.distanceKm - distanceTraveled).toFixed(1)}{" "}
                  km
                </Text>
                <Text style={styles.navInfoLabel}>Restantes</Text>
              </View>
            </View>
            <View style={styles.navInfoDivider} />
            <View style={styles.navInfoItem}>
              <Ionicons name="time-outline" size={18} color={brand.primary} />
              <View>
                <Text style={styles.navInfoValue}>
                  {currentSpeed > 0
                    ? formatTime(
                        Math.round(
                          ((route.distanceKm - distanceTraveled) /
                            currentSpeed) *
                            3600,
                        ),
                      )
                    : "--:--"}
                </Text>
                <Text style={styles.navInfoLabel}>ETA</Text>
              </View>
            </View>
            <View style={styles.navInfoDivider} />
            <View style={styles.navInfoItem}>
              <Ionicons
                name="location-outline"
                size={18}
                color={semantic.error}
              />
              <View>
                <Text style={styles.navInfoValue}>
                  {userLocation && route
                    ? (
                        calculateDistance(userLocation, route.endPoint) * 1000
                      ).toFixed(0) + "m"
                    : "--"}
                </Text>
                <Text style={styles.navInfoLabel}>Al fin</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={brand.primary} />
            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons
              name="speedometer-outline"
              size={20}
              color={brand.primary}
            />
            <Text style={styles.statValue}>{currentSpeed.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km/h</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={20} color={brand.primary} />
            <Text style={styles.statValue}>{distanceTraveled.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (distanceTraveled / route.distanceKm) * 100,
                    100,
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {distanceTraveled.toFixed(1)} / {route.distanceKm.toFixed(1)} km
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsRow}>
          {status === "ready" && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.startButton]}
              onPress={startTracking}
            >
              <Ionicons name="play" size={24} color={neutral.white} />
              <Text style={styles.primaryButtonText}>Iniciar Ruta</Text>
            </TouchableOpacity>
          )}

          {status === "active" && (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={handleStop}
              >
                <Ionicons name="stop" size={24} color={neutral.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.pauseButton]}
                onPress={pauseTracking}
              >
                <Ionicons name="pause" size={24} color={neutral.white} />
                <Text style={styles.primaryButtonText}>Pausar</Text>
              </TouchableOpacity>
            </>
          )}

          {status === "paused" && (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={handleStop}
              >
                <Ionicons name="stop" size={24} color={neutral.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.resumeButton]}
                onPress={resumeTracking}
              >
                <Ionicons name="play" size={24} color={neutral.white} />
                <Text style={styles.primaryButtonText}>Reanudar</Text>
              </TouchableOpacity>
            </>
          )}

          {status === "completed" && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.finishButton]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={neutral.white}
              />
              <Text style={styles.primaryButtonText}>Volver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  function getStatusColor(): string {
    switch (status) {
      case "ready":
        return neutral.gray500;
      case "active":
        return "#22C55E";
      case "paused":
        return "#F59E0B";
      case "completed":
        return brand.primary;
      default:
        return neutral.gray500;
    }
  }

  function getStatusLabel(): string {
    switch (status) {
      case "ready":
        return "LISTO";
      case "active":
        return "EN RUTA";
      case "paused":
        return "PAUSADO";
      case "completed":
        return "COMPLETADO";
      default:
        return "";
    }
  }
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.white,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: neutral.white,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    top: 140,
    gap: 8,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: neutral.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  navigationInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: neutral.gray100,
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navInfoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: neutral.gray800,
  },
  navInfoLabel: {
    fontSize: 10,
    color: neutral.gray500,
    textTransform: "uppercase",
  },
  navInfoDivider: {
    width: 1,
    height: 32,
    backgroundColor: neutral.gray300,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: neutral.gray800,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: neutral.gray500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: neutral.gray200,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: neutral.gray200,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: brand.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: neutral.gray500,
    textAlign: "center",
    marginTop: 6,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.white,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: brand.primary,
  },
  pauseButton: {
    backgroundColor: "#F59E0B",
  },
  resumeButton: {
    backgroundColor: "#22C55E",
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  finishButton: {
    backgroundColor: brand.primary,
  },
  routeMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: neutral.white,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  startMarker: {
    backgroundColor: "#22C55E",
  },
  endMarker: {
    backgroundColor: "#EF4444",
  },
  businessMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: brand.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: neutral.white,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
