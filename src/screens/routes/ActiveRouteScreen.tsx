/**
 * Active Route Screen
 * Real-time navigation and tracking while cycling a route
 */

import { brand, neutral, semantic } from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { getBusinessesNearRoute, getRouteById } from "@/services/routes";
import type { BusinessForMap, Coordinate, RouteForMap } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import { useKeepAwake } from "expo-keep-awake";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
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

// Douglas-Peucker algorithm to simplify path for visualization (reduces memory)
const simplifyPath = (points: Coordinate[], tolerance: number): Coordinate[] => {
  if (points.length <= 2) return [...points];

  const perpendicularDistance = (
    point: Coordinate,
    lineStart: Coordinate,
    lineEnd: Coordinate,
  ): number => {
    const dx = lineEnd.longitude - lineStart.longitude;
    const dy = lineEnd.latitude - lineStart.latitude;

    if (dx === 0 && dy === 0) {
      return Math.sqrt(
        Math.pow(point.longitude - lineStart.longitude, 2) +
        Math.pow(point.latitude - lineStart.latitude, 2)
      );
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.longitude - lineStart.longitude) * dx +
          (point.latitude - lineStart.latitude) * dy) /
          (dx * dx + dy * dy)
      )
    );

    const nearestLon = lineStart.longitude + t * dx;
    const nearestLat = lineStart.latitude + t * dy;

    return Math.sqrt(
      Math.pow(point.longitude - nearestLon, 2) +
      Math.pow(point.latitude - nearestLat, 2)
    );
  };

  let maxDistance = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
};

// Memoized Business Marker component to prevent re-renders
const BusinessMarker = memo(({
  business,
  onPress
}: {
  business: BusinessForMap;
  onPress: (id: string) => void;
}) => (
  <Marker
    coordinate={business.coordinate}
    title={business.name}
    description={business.type.replace("_", " ")}
    onCalloutPress={() => onPress(business.id)}
    tracksViewChanges={false}
  >
    <View style={styles.businessMarker}>
      <Ionicons
        name={getBusinessIcon(business.type)}
        size={14}
        color={neutral.white}
      />
    </View>
  </Marker>
));

// Memoized Elapsed Time component to isolate timer re-renders
const ElapsedTimeDisplay = memo(({
  startTime,
  isActive
}: {
  startTime: Date | null;
  isActive: boolean;
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed(0);
      return;
    }

    // Set initial elapsed time
    const now = new Date();
    setElapsed(Math.floor((now.getTime() - startTime.getTime()) / 1000));

    const timer = setInterval(() => {
      const now = new Date();
      setElapsed(Math.floor((now.getTime() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, startTime]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return <Text style={styles.statValue}>{formatTime(elapsed)}</Text>;
});

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
  const [completionId, setCompletionId] = useState<string | null>(null);

  // OPTIMIZATION: Use ref for full path (no re-renders on push) and state for simplified visual path
  const recordedPathRef = useRef<Coordinate[]>([]);
  const [simplifiedPath, setSimplifiedPath] = useState<Coordinate[]>([]);

  // Stats
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0); // km
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [maxSpeed, setMaxSpeed] = useState(0); // km/h - track max speed for metrics

  // Prevent multiple clicks
  const [isStarting, setIsStarting] = useState(false);

  // Load route data
  useEffect(() => {
    if (id) {
      loadRoute(id);
    }
    return () => {
      stopTracking();
    };
  }, [id]);

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
    // Prevent multiple clicks
    if (isStarting || status !== "ready") return;
    setIsStarting(true);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setIsStarting(false);
      return;
    }

    try {
      // OPTIMIZATION: Try to get last known location first (instant)
      let initialLocation: Location.LocationObject | null = null;

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 30000, // Accept location up to 30 seconds old
      });

      if (lastKnown && lastKnown.coords.accuracy && lastKnown.coords.accuracy < 100) {
        // Good accuracy cached location - use immediately
        initialLocation = lastKnown;
      } else {
        // Get fresh location with balanced accuracy (faster than BestForNavigation)
        initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const initialCoord: Coordinate = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      };

      // Update UI immediately - user sees route started
      setUserLocation(initialCoord);
      // OPTIMIZATION: Reset ref and simplified path
      recordedPathRef.current = [initialCoord];
      setSimplifiedPath([initialCoord]);
      setStartTime(new Date());
      setMaxSpeed(0);
      setStatus("active");
      setIsStarting(false); // Reset loading state on success

      // Create completion record in background - don't block UI
      createCompletionRecordInBackground();

      // Center map on user
      mapRef.current?.animateToRegion(
        {
          ...initialCoord,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );

      // Clean up any existing subscription before creating new one
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      // Start watching location with high accuracy for continuous tracking
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High, // High is sufficient for cycling, less battery than BestForNavigation
          timeInterval: 2000,
          distanceInterval: 5,
        },
        handleLocationUpdate,
      );

      Vibration.vibrate(100);
    } catch (error) {
      console.error("Error starting tracking:", error);
      Alert.alert("Error", "No se pudo iniciar el seguimiento");
      setIsStarting(false);
    }
  };

  // Location update handler - extracted to avoid recreation on each render
  const handleLocationUpdate = useCallback(
    (location: Location.LocationObject) => {
      const newCoord: Coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(newCoord);
      const speedKmh = (location.coords.speed || 0) * 3.6;
      setCurrentSpeed(speedKmh);
      setMaxSpeed((prev) => Math.max(prev, speedKmh));

      // OPTIMIZATION: Direct push O(1) instead of spread O(n)
      const path = recordedPathRef.current;
      if (path.length > 0) {
        const lastCoord = path[path.length - 1];
        const dist = calculateDistance(lastCoord, newCoord);
        setDistanceTraveled((d) => d + dist);
      }
      path.push(newCoord);

      // Only update visual Polyline every 5 points to reduce re-renders
      if (path.length % 5 === 0 || path.length <= 2) {
        // Simplify path for visualization (Douglas-Peucker algorithm)
        setSimplifiedPath(simplifyPath(path, 0.00005));
      }

      mapRef.current?.animateToRegion(
        {
          ...newCoord,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        300,
      );

      if (route) {
        const distToEnd = calculateDistance(newCoord, route.endPoint);
        if (distToEnd < 0.05) {
          handleArrival();
        }
      }
    },
    [route],
  );

  // Creates completion record in background - doesn't block route start
  const createCompletionRecordInBackground = () => {
    // Fire and forget - don't await
    (async () => {
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

        if (!error && data) {
          setCompletionId(data.id);
        }
      } catch (error) {
        console.error("Error creating completion:", error);
        // Non-critical - route works without this record
      }
    })();
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const pauseTracking = () => {
    stopTracking();
    setStatus("paused");
    Vibration.vibrate(50);
  };

  const resumeTracking = async () => {
    // Prevent multiple clicks
    if (status !== "paused") return;

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setStatus("active");

    // Clean up any existing subscription before creating new one
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High, // Optimized: High is sufficient for cycling
        timeInterval: 2000,
        distanceInterval: 5,
      },
      handleLocationUpdate, // Reuse the same handler
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

    // Calculate elapsed time from startTime
    const elapsedSeconds = startTime
      ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
      : 0;

    try {
      if (completionId) {
        const durationMin = Math.floor(elapsedSeconds / 60);
        // Calculate average speed: distance / time (in hours)
        const avgSpeedKmh =
          elapsedSeconds > 0 ? distanceTraveled / (elapsedSeconds / 3600) : 0;

        await supabase
          .from("route_completions")
          .update({
            completed_at: new Date().toISOString(),
            duration_min: durationMin,
            status: finalStatus,
            // Save all metrics for triggers to process
            distance_actual_km: Math.round(distanceTraveled * 100) / 100,
            avg_speed_kmh: Math.round(avgSpeedKmh * 10) / 10,
            max_speed_kmh: Math.round(maxSpeed * 10) / 10,
            recorded_path: coordinatesToWKT(recordedPathRef.current),
            device_info: getDeviceInfo(),
            notes:
              finalStatus === "completado"
                ? "Ruta completada exitosamente"
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
          elapsedSeconds,
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

  // Convert coordinates array to PostGIS WKT LineString format
  const coordinatesToWKT = (coords: Coordinate[]): string | null => {
    if (coords.length < 2) return null;
    const points = coords.map((c) => `${c.longitude} ${c.latitude}`).join(",");
    return `LINESTRING(${points})`;
  };

  // Get device info for tracking
  const getDeviceInfo = () => ({
    brand: Device.brand,
    model: Device.modelName,
    os_version: `${Device.osName} ${Device.osVersion}`,
  });

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

  // Memoized handler for business marker press
  const handleBusinessPress = useCallback((id: string) => {
    router.push(`/business/${id}`);
  }, [router]);

  // OPTIMIZATION: Simplify original route for display (reduces polyline memory)
  const displayRouteCoordinates = useMemo(() => {
    if (!route?.coordinates) return [];
    // Simplify route: from potentially 1000+ points to ~100
    return simplifyPath(route.coordinates, 0.0001);
  }, [route?.coordinates]);

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
        showsUserLocation={false}
        showsMyLocationButton={false}
        followsUserLocation={status === "active"}
        mapType="standard"
        minZoomLevel={10}
        maxZoomLevel={18}
        loadingEnabled={true}
        loadingIndicatorColor={brand.primary}
        moveOnMarkerPress={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterest={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/* Original Route Polyline */}
        <Polyline
          coordinates={displayRouteCoordinates}
          strokeColor={brand.primary}
          strokeWidth={5}
        />

        {/* Recorded Path */}
        {simplifiedPath.length > 1 && (
          <Polyline
            coordinates={simplifiedPath}
            strokeColor={brand.primaryDark}
            strokeWidth={6}
          />
        )}

        {/* User Location Marker with pulse effect */}
        {userLocation && (status === "active" || status === "paused") && (
          <Marker coordinate={userLocation} tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerPulse} />
              <View style={styles.userMarker}>
                <View style={styles.userMarkerInner} />
              </View>
            </View>
          </Marker>
        )}

        {/* Start Marker */}
        <Marker coordinate={route.startPoint} tracksViewChanges={false}>
          <View style={styles.startMarker}>
            <Ionicons name="flag" size={16} color={neutral.white} />
          </View>
        </Marker>

        {/* End Marker */}
        <Marker coordinate={route.endPoint} tracksViewChanges={false}>
          <View style={styles.endMarker}>
            <Ionicons name="navigate" size={18} color={neutral.gray800} />
          </View>
        </Marker>

        {/* Business Markers */}
        {businesses.map((business) => (
          <BusinessMarker
            key={business.id}
            business={business}
            onPress={handleBusinessPress}
          />
        ))}
      </MapView>

      {/* Dark Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {route.name}
        </Text>
        <TouchableOpacity style={styles.headerMenuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={neutral.white} />
        </TouchableOpacity>
      </View>

      {/* Status Banner - below header */}
      {(status === "active" || status === "paused") && (
        <View style={[styles.statusBanner, { top: insets.top + 60 }]}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={status === "active" ? "bicycle" : "pause"}
              size={20}
              color={neutral.white}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusMainText}>
              {status === "active" ? "En ruta" : "Pausado"}
            </Text>
            <Text style={styles.statusSubText}>
              {Math.max(0, route.distanceKm - distanceTraveled).toFixed(1)} km restantes
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="flag" size={14} color={neutral.white} />
            <Text style={styles.statusBadgeText}>
              {route.distanceKm.toFixed(1)}km
            </Text>
          </View>
        </View>
      )}

      {/* Map Controls */}
      <View style={[styles.mapControls, { top: insets.top + (status === "active" || status === "paused" ? 130 : 70) }]}>
        <TouchableOpacity style={styles.mapControlButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={22} color={neutral.gray700} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlButton} onPress={showFullRoute}>
          <Ionicons name="expand-outline" size={22} color={neutral.gray700} />
        </TouchableOpacity>
      </View>

      {/* Bottom Stats Panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.statsContainer}>
          {/* Speed Box */}
          <View style={styles.speedBox}>
            <Text style={styles.speedValue}>{Math.round(currentSpeed)}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>

          {/* Time & Distance */}
          <View style={styles.timeDistanceContainer}>
            <View style={styles.timeRow}>
              <ElapsedTimeDisplay
                startTime={startTime}
                isActive={status === "active" || status === "paused"}
              />
            </View>
            <Text style={styles.distanceText}>
              {distanceTraveled.toFixed(1)}km | {route.distanceKm.toFixed(1)}km
            </Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            {status === "ready" && (
              <TouchableOpacity
                style={[styles.playButton, isStarting && styles.buttonDisabled]}
                onPress={startTracking}
                disabled={isStarting}
              >
                {isStarting ? (
                  <ActivityIndicator size="small" color={neutral.white} />
                ) : (
                  <Ionicons name="play" size={28} color={neutral.white} />
                )}
              </TouchableOpacity>
            )}

            {status === "active" && (
              <>
                <TouchableOpacity style={styles.stopSmallButton} onPress={handleStop}>
                  <Ionicons name="stop" size={20} color={semantic.error} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.pauseButton} onPress={pauseTracking}>
                  <Ionicons name="pause" size={28} color={neutral.white} />
                </TouchableOpacity>
              </>
            )}

            {status === "paused" && (
              <>
                <TouchableOpacity style={styles.stopSmallButton} onPress={handleStop}>
                  <Ionicons name="stop" size={20} color={semantic.error} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playButton} onPress={resumeTracking}>
                  <Ionicons name="play" size={28} color={neutral.white} />
                </TouchableOpacity>
              </>
            )}

            {status === "completed" && (
              <TouchableOpacity style={styles.playButton} onPress={() => router.back()}>
                <Ionicons name="checkmark" size={28} color={neutral.white} />
              </TouchableOpacity>
            )}
          </View>
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
  // Dark Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: neutral.gray900,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: neutral.gray700,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: neutral.white,
    marginLeft: 12,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  // Status Banner
  statusBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: neutral.gray900,
    borderRadius: 12,
    padding: 12,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  statusMainText: {
    fontSize: 15,
    fontWeight: "600",
    color: neutral.white,
  },
  statusSubText: {
    fontSize: 13,
    color: neutral.gray400,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: neutral.white,
  },
  // Map Controls
  mapControls: {
    position: "absolute",
    right: 16,
    gap: 10,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: neutral.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  // User Location Marker
  userMarkerContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  userMarkerPulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brand.primaryTint,
    opacity: 0.5,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: brand.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: neutral.white,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: neutral.white,
  },
  // Route Markers
  startMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.success,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: neutral.white,
  },
  endMarker: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: neutral.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: neutral.gray300,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  businessMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: brand.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: neutral.white,
  },
  // Bottom Panel
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Speed Box
  speedBox: {
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: brand.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: neutral.white,
  },
  speedValue: {
    fontSize: 32,
    fontWeight: "700",
    color: neutral.gray900,
    lineHeight: 36,
  },
  speedUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: neutral.gray500,
    marginTop: -2,
  },
  // Time & Distance
  timeDistanceContainer: {
    flex: 1,
    marginLeft: 16,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: neutral.gray900,
  },
  distanceText: {
    fontSize: 14,
    color: neutral.gray500,
    marginTop: 4,
  },
  // Control Buttons
  controlButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stopSmallButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: neutral.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: neutral.gray200,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
