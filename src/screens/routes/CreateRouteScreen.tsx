/**
 * Create Route Screen
 * Multi-step flow: Draw Route → Add Waypoints → Route Details → Publish
 */

import { brand, neutral, semantic } from "@/constants/Colors";
import {
    createAndPublishRoute,
    CreateWaypointData,
} from "@/services/createRoute";
import type {
    Coordinate,
    Difficulty,
    TerrainType,
    WaypointType,
} from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
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

// Steps
type Step = "draw" | "waypoints" | "details" | "publishing";
type DrawMode = "tap" | "record";

const STEPS: {
  key: Step;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "draw", label: "Trazar", icon: "pencil" },
  { key: "waypoints", label: "Puntos", icon: "location" },
  { key: "details", label: "Detalles", icon: "document-text" },
];

// Yucatan default region
const INITIAL_REGION = {
  latitude: 20.9673,
  longitude: -89.5925,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Difficulty options
const DIFFICULTY_OPTIONS: {
  value: Difficulty;
  label: string;
  color: string;
}[] = [
  { value: "facil", label: "Fácil", color: "#22C55E" },
  { value: "moderada", label: "Media", color: "#F59E0B" },
  { value: "dificil", label: "Difícil", color: "#EF4444" },
  { value: "experto", label: "Experto", color: "#7C3AED" },
];

// Terrain options
const TERRAIN_OPTIONS: { value: TerrainType; label: string }[] = [
  { value: "asfalto", label: "Asfalto" },
  { value: "terraceria", label: "Terracería" },
  { value: "mixto", label: "Mixto" },
];

// Waypoint type options
const WAYPOINT_TYPES: {
  value: WaypointType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "cenote", label: "Cenote", icon: "water" },
  { value: "mirador", label: "Mirador", icon: "eye" },
  { value: "restaurante", label: "Restaurante", icon: "restaurant" },
  { value: "tienda", label: "Tienda", icon: "storefront" },
  { value: "zona_arqueologica", label: "Zona Arqueológica", icon: "business" },
  { value: "punto_agua", label: "Punto de Agua", icon: "water-outline" },
  { value: "descanso", label: "Descanso", icon: "bed" },
  { value: "peligro", label: "Peligro", icon: "warning" },
  { value: "foto", label: "Punto Foto", icon: "camera" },
  { value: "otro", label: "Otro", icon: "location" },
];

export default function CreateRouteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>("draw");
  const [isPublishing, setIsPublishing] = useState(false);

  // Route coordinates
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);

  // Drawing mode state
  const [drawMode, setDrawMode] = useState<DrawMode>("tap");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Waypoints
  const [waypoints, setWaypoints] = useState<CreateWaypointData[]>([]);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
  const [selectedWaypointType, setSelectedWaypointType] =
    useState<WaypointType>("otro");
  const [waypointName, setWaypointName] = useState("");

  // Route details
  const [routeName, setRouteName] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("moderada");
  const [terrainType, setTerrainType] = useState<TerrainType>("asfalto");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");

  // Calculate distance
  const calculateDistance = (): number => {
    if (routeCoordinates.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < routeCoordinates.length; i++) {
      const lat1 = routeCoordinates[i - 1].latitude;
      const lon1 = routeCoordinates[i - 1].longitude;
      const lat2 = routeCoordinates[i].latitude;
      const lon2 = routeCoordinates[i].longitude;
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return Math.round(total * 10) / 10;
  };

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    }
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  // Start GPS recording
  const startRecording = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos requeridos",
        "Necesitamos acceso a tu ubicación para grabar la ruta",
      );
      return;
    }

    try {
      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const initialCoord: Coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setRouteCoordinates([initialCoord]);
      setIsRecording(true);
      setRecordingTime(0);

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
          timeInterval: 3000, // Update every 3 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (loc) => {
          const newCoord: Coordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setRouteCoordinates((prev) => [...prev, newCoord]);

          // Follow user
          mapRef.current?.animateToRegion(
            {
              ...newCoord,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            300,
          );
        },
      );
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  };

  // Stop GPS recording
  const stopRecording = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsRecording(false);
  };

  // Format recording time
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Parse GPX file content
  const parseGPX = (content: string): Coordinate[] => {
    const coordinates: Coordinate[] = [];

    // Simple regex to extract trackpoints and route points
    const trkptRegex = /<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"/g;
    const rteptRegex = /<rtept[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"/g;
    const wptRegex = /<wpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"/g;

    let match;

    // Extract track points
    while ((match = trkptRegex.exec(content)) !== null) {
      coordinates.push({
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      });
    }

    // If no track points, try route points
    if (coordinates.length === 0) {
      while ((match = rteptRegex.exec(content)) !== null) {
        coordinates.push({
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
        });
      }
    }

    // If still no points, try waypoints
    if (coordinates.length === 0) {
      while ((match = wptRegex.exec(content)) !== null) {
        coordinates.push({
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
        });
      }
    }

    return coordinates;
  };

  // Import GPX file
  const handleImportGPX = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/gpx+xml", "text/xml", "application/xml", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file.uri) return;

      // Read file content
      const content = await FileSystem.readAsStringAsync(file.uri);

      // Parse GPX
      const coords = parseGPX(content);

      if (coords.length < 2) {
        Alert.alert("Error", "El archivo GPX no contiene suficientes puntos");
        return;
      }

      // Set coordinates
      setRouteCoordinates(coords);

      // Fit map to route
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
          animated: true,
        });
      }, 300);

      Alert.alert(
        "¡GPX Importado!",
        `Se cargaron ${coords.length} puntos (${calculateDistanceFromCoords(coords).toFixed(1)} km)`,
      );
    } catch (error) {
      console.error("Error importing GPX:", error);
      Alert.alert("Error", "No se pudo importar el archivo GPX");
    }
  };

  // Calculate distance from specific coordinates
  const calculateDistanceFromCoords = (coords: Coordinate[]): number => {
    if (coords.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      const lat1 = coords[i - 1].latitude;
      const lon1 = coords[i - 1].longitude;
      const lat2 = coords[i].latitude;
      const lon2 = coords[i].longitude;
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return total;
  };

  // Handle map press to add point
  const handleMapPress = (event: any) => {
    // Don't allow tapping when recording
    if (isRecording) return;
    if (currentStep !== "draw" && !isAddingWaypoint) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newCoord: Coordinate = { latitude, longitude };

    if (isAddingWaypoint) {
      // Add waypoint at this location
      if (!waypointName.trim()) {
        Alert.alert(
          "Nombre requerido",
          "Por favor ingresa un nombre para el punto de interés",
        );
        return;
      }
      const newWaypoint: CreateWaypointData = {
        name: waypointName,
        waypointType: selectedWaypointType,
        coordinate: newCoord,
      };
      setWaypoints([...waypoints, newWaypoint]);
      setIsAddingWaypoint(false);
      setWaypointName("");
    } else if (drawMode === "tap") {
      // Add route point only in tap mode
      setRouteCoordinates([...routeCoordinates, newCoord]);
    }
  };

  // Undo last point
  const handleUndo = () => {
    if (routeCoordinates.length > 0) {
      setRouteCoordinates(routeCoordinates.slice(0, -1));
    }
  };

  // Clear all points
  const handleClear = () => {
    Alert.alert(
      "Limpiar ruta",
      "¿Seguro que quieres borrar todos los puntos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          style: "destructive",
          onPress: () => setRouteCoordinates([]),
        },
      ],
    );
  };

  // Remove waypoint
  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  // Go to next step
  const handleNext = () => {
    if (currentStep === "draw") {
      if (routeCoordinates.length < 2) {
        Alert.alert(
          "Ruta incompleta",
          "Necesitas al menos 2 puntos para crear una ruta",
        );
        return;
      }
      setCurrentStep("waypoints");
    } else if (currentStep === "waypoints") {
      setCurrentStep("details");
    }
  };

  // Go to previous step
  const handleBack = () => {
    if (currentStep === "waypoints") {
      setCurrentStep("draw");
    } else if (currentStep === "details") {
      setCurrentStep("waypoints");
    } else {
      router.back();
    }
  };

  // Publish route
  const handlePublish = async () => {
    if (!routeName.trim()) {
      Alert.alert(
        "Nombre requerido",
        "Por favor ingresa un nombre para la ruta",
      );
      return;
    }

    const priceValue = isFree ? 0 : parseFloat(price) || 0;

    try {
      setIsPublishing(true);
      setCurrentStep("publishing");

      await createAndPublishRoute({
        routeData: {
          name: routeName.trim(),
          description: routeDescription.trim(),
          difficulty,
          terrainType,
          price: priceValue,
          isFree,
        },
        coordinates: routeCoordinates,
        waypoints,
      });

      Alert.alert(
        "¡Ruta Publicada!",
        "Tu ruta ya está disponible en el marketplace",
        [{ text: "Ver en Explorar", onPress: () => router.replace("/(tabs)") }],
      );
    } catch (error: any) {
      console.error("Error publishing route:", error);
      Alert.alert("Error", error.message || "No se pudo publicar la ruta");
      setCurrentStep("details");
    } finally {
      setIsPublishing(false);
    }
  };

  const distance = calculateDistance();

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => {
        const isActive = step.key === currentStep;
        const isPast = STEPS.findIndex((s) => s.key === currentStep) > index;
        return (
          <React.Fragment key={step.key}>
            <View
              style={[
                styles.stepDot,
                isActive && styles.stepDotActive,
                isPast && styles.stepDotPast,
              ]}
            >
              {isPast ? (
                <Ionicons name="checkmark" size={14} color={neutral.white} />
              ) : (
                <Ionicons
                  name={step.icon}
                  size={14}
                  color={isActive ? neutral.white : neutral.gray400}
                />
              )}
            </View>
            {index < STEPS.length - 1 && (
              <View style={[styles.stepLine, isPast && styles.stepLinePast]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  // Render draw step
  const renderDrawStep = () => (
    <>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
        showsUserLocation
        followsUserLocation={isRecording}
      >
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={isRecording ? semantic.success : brand.primary}
            strokeWidth={4}
          />
        )}
        {/* Only show numbered markers in tap mode */}
        {drawMode === "tap" &&
          routeCoordinates.map((coord, index) => (
            <Marker key={index} coordinate={coord}>
              <View
                style={[
                  styles.routePoint,
                  index === 0 && styles.startPoint,
                  index === routeCoordinates.length - 1 &&
                    index > 0 &&
                    styles.endPoint,
                ]}
              >
                <Text style={styles.routePointText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
        {/* Show start/end in record mode */}
        {drawMode === "record" && routeCoordinates.length > 0 && (
          <>
            <Marker coordinate={routeCoordinates[0]}>
              <View style={[styles.routePoint, styles.startPoint]}>
                <Ionicons name="flag" size={12} color={neutral.white} />
              </View>
            </Marker>
            {routeCoordinates.length > 1 && (
              <Marker
                coordinate={routeCoordinates[routeCoordinates.length - 1]}
              >
                <View style={[styles.routePoint, styles.endPoint]}>
                  <Ionicons name="bicycle" size={12} color={neutral.white} />
                </View>
              </Marker>
            )}
          </>
        )}
      </MapView>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            drawMode === "tap" && styles.modeButtonActive,
          ]}
          onPress={() => {
            if (!isRecording) {
              setDrawMode("tap");
            }
          }}
          disabled={isRecording}
        >
          <Ionicons
            name="finger-print"
            size={18}
            color={drawMode === "tap" ? neutral.white : neutral.gray600}
          />
          <Text
            style={[
              styles.modeButtonText,
              drawMode === "tap" && styles.modeButtonTextActive,
            ]}
          >
            Dibujar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            drawMode === "record" && styles.modeButtonActive,
            isRecording && styles.modeButtonRecording,
          ]}
          onPress={() => {
            if (!isRecording) {
              setDrawMode("record");
            }
          }}
          disabled={isRecording}
        >
          <Ionicons
            name="radio-button-on"
            size={18}
            color={drawMode === "record" ? neutral.white : neutral.gray600}
          />
          <Text
            style={[
              styles.modeButtonText,
              drawMode === "record" && styles.modeButtonTextActive,
            ]}
          >
            Grabar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Drawing controls - only for tap mode */}
      {drawMode === "tap" && (
        <View style={styles.drawControls}>
          <TouchableOpacity style={styles.drawButton} onPress={handleImportGPX}>
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color={brand.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.drawButton,
              routeCoordinates.length === 0 && styles.drawButtonDisabled,
            ]}
            onPress={handleUndo}
            disabled={routeCoordinates.length === 0}
          >
            <Ionicons
              name="arrow-undo"
              size={20}
              color={
                routeCoordinates.length === 0
                  ? neutral.gray400
                  : neutral.gray700
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.drawButton,
              routeCoordinates.length === 0 && styles.drawButtonDisabled,
            ]}
            onPress={handleClear}
            disabled={routeCoordinates.length === 0}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={
                routeCoordinates.length === 0 ? neutral.gray400 : semantic.error
              }
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Recording controls */}
      {drawMode === "record" && (
        <View style={styles.recordingControls}>
          {isRecording ? (
            <>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTimeText}>
                  {formatRecordingTime(recordingTime)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.stopRecordButton}
                onPress={stopRecording}
              >
                <Ionicons name="stop" size={24} color={neutral.white} />
                <Text style={styles.stopRecordButtonText}>Detener</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {routeCoordinates.length > 0 && (
                <TouchableOpacity
                  style={styles.clearRecordButton}
                  onPress={handleClear}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={semantic.error}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.startRecordButton}
                onPress={startRecording}
              >
                <Ionicons
                  name="radio-button-on"
                  size={24}
                  color={neutral.white}
                />
                <Text style={styles.startRecordButtonText}>
                  {routeCoordinates.length > 0
                    ? "Continuar"
                    : "Iniciar Grabación"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.infoText}>
          {drawMode === "tap"
            ? "Toca el mapa para agregar puntos a tu ruta"
            : isRecording
              ? "🔴 Grabando tu recorrido..."
              : "Presiona iniciar y pedalea tu ruta"}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={16} color={brand.primary} />
            <Text style={styles.statText}>
              {routeCoordinates.length} puntos
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="map" size={16} color={brand.primary} />
            <Text style={styles.statText}>{distance} km</Text>
          </View>
        </View>
      </View>
    </>
  );

  // Render waypoints step
  const renderWaypointsStep = () => (
    <>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        initialRegion={INITIAL_REGION}
        onPress={isAddingWaypoint ? handleMapPress : undefined}
      >
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={brand.primary}
          strokeWidth={4}
        />
        {/* Route start/end */}
        {routeCoordinates.length > 0 && (
          <>
            <Marker coordinate={routeCoordinates[0]}>
              <View style={[styles.routePoint, styles.startPoint]}>
                <Ionicons name="flag" size={12} color={neutral.white} />
              </View>
            </Marker>
            <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]}>
              <View style={[styles.routePoint, styles.endPoint]}>
                <Ionicons name="checkmark" size={12} color={neutral.white} />
              </View>
            </Marker>
          </>
        )}
        {/* Waypoints */}
        {waypoints.map((wp, index) => (
          <Marker key={index} coordinate={wp.coordinate}>
            <View style={styles.waypointMarker}>
              <Ionicons
                name={
                  WAYPOINT_TYPES.find((t) => t.value === wp.waypointType)
                    ?.icon || "location"
                }
                size={16}
                color={brand.primary}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Waypoint input overlay */}
      {isAddingWaypoint ? (
        <View style={styles.waypointInputOverlay}>
          <Text style={styles.waypointInputTitle}>
            Toca el mapa para ubicar el punto
          </Text>
          <TextInput
            style={styles.waypointInput}
            placeholder="Nombre del punto de interés"
            value={waypointName}
            onChangeText={setWaypointName}
            placeholderTextColor={neutral.gray400}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.waypointTypesScroll}
          >
            {WAYPOINT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.waypointTypeChip,
                  selectedWaypointType === type.value &&
                    styles.waypointTypeChipActive,
                ]}
                onPress={() => setSelectedWaypointType(type.value)}
              >
                <Ionicons
                  name={type.icon}
                  size={16}
                  color={
                    selectedWaypointType === type.value
                      ? neutral.white
                      : neutral.gray700
                  }
                />
                <Text
                  style={[
                    styles.waypointTypeText,
                    selectedWaypointType === type.value &&
                      styles.waypointTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.cancelWaypointButton}
            onPress={() => setIsAddingWaypoint(false)}
          >
            <Text style={styles.cancelWaypointText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.waypointsListOverlay}>
          <Text style={styles.waypointsTitle}>
            Puntos de Interés ({waypoints.length})
          </Text>
          {waypoints.length === 0 ? (
            <Text style={styles.noWaypointsText}>
              No hay puntos de interés aún
            </Text>
          ) : (
            <ScrollView style={styles.waypointsList}>
              {waypoints.map((wp, index) => (
                <View key={index} style={styles.waypointItem}>
                  <Ionicons
                    name={
                      WAYPOINT_TYPES.find((t) => t.value === wp.waypointType)
                        ?.icon || "location"
                    }
                    size={18}
                    color={brand.primary}
                  />
                  <Text style={styles.waypointItemName} numberOfLines={1}>
                    {wp.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeWaypoint(index)}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={neutral.gray400}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity
            style={styles.addWaypointButton}
            onPress={() => setIsAddingWaypoint(true)}
          >
            <Ionicons name="add" size={20} color={neutral.white} />
            <Text style={styles.addWaypointText}>Agregar Punto</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // Render details step
  const renderDetailsStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.detailsContainer}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.detailsScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Información de la Ruta</Text>

          <Text style={styles.inputLabel}>Nombre *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Ruta de los Cenotes"
            value={routeName}
            onChangeText={setRouteName}
            placeholderTextColor={neutral.gray400}
          />

          <Text style={styles.inputLabel}>Descripción</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe tu ruta..."
            value={routeDescription}
            onChangeText={setRouteDescription}
            placeholderTextColor={neutral.gray400}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>Dificultad</Text>
          <View style={styles.optionsRow}>
            {DIFFICULTY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionChip,
                  difficulty === option.value && {
                    backgroundColor: option.color,
                  },
                ]}
                onPress={() => setDifficulty(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    difficulty === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Tipo de Terreno</Text>
          <View style={styles.optionsRow}>
            {TERRAIN_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionChip,
                  terrainType === option.value && styles.optionChipActive,
                ]}
                onPress={() => setTerrainType(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    terrainType === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Precio</Text>
          <View style={styles.priceToggle}>
            <TouchableOpacity
              style={[styles.priceOption, isFree && styles.priceOptionActive]}
              onPress={() => setIsFree(true)}
            >
              <Text
                style={[
                  styles.priceOptionText,
                  isFree && styles.priceOptionTextActive,
                ]}
              >
                Gratis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.priceOption, !isFree && styles.priceOptionActive]}
              onPress={() => setIsFree(false)}
            >
              <Text
                style={[
                  styles.priceOptionText,
                  !isFree && styles.priceOptionTextActive,
                ]}
              >
                De Pago
              </Text>
            </TouchableOpacity>
          </View>

          {!isFree && (
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor={neutral.gray400}
              />
              <Text style={styles.currencyLabel}>MXN</Text>
            </View>
          )}

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Distancia:</Text>
              <Text style={styles.summaryValue}>{distance} km</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Puntos:</Text>
              <Text style={styles.summaryValue}>{routeCoordinates.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Waypoints:</Text>
              <Text style={styles.summaryValue}>{waypoints.length}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  // Render publishing state
  const renderPublishing = () => (
    <View style={styles.publishingContainer}>
      <ActivityIndicator size="large" color={brand.primary} />
      <Text style={styles.publishingText}>Publicando tu ruta...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={neutral.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === "draw" && "Trazar Ruta"}
          {currentStep === "waypoints" && "Puntos de Interés"}
          {currentStep === "details" && "Detalles"}
          {currentStep === "publishing" && "Publicando"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator */}
      {currentStep !== "publishing" && renderStepIndicator()}

      {/* Content */}
      <View style={styles.content}>
        {currentStep === "draw" && renderDrawStep()}
        {currentStep === "waypoints" && renderWaypointsStep()}
        {currentStep === "details" && renderDetailsStep()}
        {currentStep === "publishing" && renderPublishing()}
      </View>

      {/* Bottom actions */}
      {currentStep !== "publishing" && (
        <View
          style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}
        >
          {currentStep === "details" ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !routeName.trim() && styles.primaryButtonDisabled,
              ]}
              onPress={handlePublish}
              disabled={!routeName.trim() || isPublishing}
            >
              <Text style={styles.primaryButtonText}>Publicar Ruta</Text>
              <Ionicons name="rocket" size={20} color={neutral.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                currentStep === "draw" &&
                  routeCoordinates.length < 2 &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={currentStep === "draw" && routeCoordinates.length < 2}
            >
              <Text style={styles.primaryButtonText}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={20} color={neutral.white} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: neutral.gray800,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: neutral.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    backgroundColor: brand.primary,
  },
  stepDotPast: {
    backgroundColor: semantic.success,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: neutral.gray200,
    marginHorizontal: 8,
  },
  stepLinePast: {
    backgroundColor: semantic.success,
  },
  content: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // Draw step
  drawControls: {
    position: "absolute",
    top: 16,
    right: 16,
    gap: 8,
  },
  drawButton: {
    width: 44,
    height: 44,
    backgroundColor: neutral.white,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drawButtonDisabled: {
    opacity: 0.5,
  },
  // Mode toggle
  modeToggle: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    backgroundColor: neutral.white,
    borderRadius: 24,
    padding: 4,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: brand.primary,
  },
  modeButtonRecording: {
    backgroundColor: semantic.error,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: neutral.gray600,
  },
  modeButtonTextActive: {
    color: neutral.white,
  },
  // Recording controls
  recordingControls: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    alignItems: "center",
    gap: 12,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: neutral.white,
  },
  recordingTimeText: {
    fontSize: 18,
    fontWeight: "700",
    color: neutral.white,
    fontVariant: ["tabular-nums"],
  },
  stopRecordButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: semantic.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stopRecordButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.white,
  },
  startRecordButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: semantic.success,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 10,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startRecordButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.white,
  },
  clearRecordButton: {
    width: 44,
    height: 44,
    backgroundColor: neutral.white,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: neutral.white,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    color: neutral.gray500,
    textAlign: "center",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.gray800,
  },
  routePoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: neutral.gray400,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: neutral.white,
  },
  startPoint: {
    backgroundColor: "#22C55E",
  },
  endPoint: {
    backgroundColor: "#EF4444",
  },
  routePointText: {
    fontSize: 10,
    fontWeight: "bold",
    color: neutral.white,
  },
  // Waypoints step
  waypointMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: neutral.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: brand.primary,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  waypointInputOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: neutral.white,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  waypointInputTitle: {
    fontSize: 14,
    color: neutral.gray500,
    textAlign: "center",
    marginBottom: 12,
  },
  waypointInput: {
    backgroundColor: neutral.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: neutral.gray800,
    marginBottom: 12,
  },
  waypointTypesScroll: {
    marginBottom: 12,
  },
  waypointTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: neutral.gray100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  waypointTypeChipActive: {
    backgroundColor: brand.primary,
  },
  waypointTypeText: {
    fontSize: 13,
    color: neutral.gray700,
  },
  waypointTypeTextActive: {
    color: neutral.white,
  },
  cancelWaypointButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelWaypointText: {
    fontSize: 14,
    color: neutral.gray500,
  },
  waypointsListOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: neutral.white,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.4,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  waypointsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.gray800,
    marginBottom: 12,
  },
  noWaypointsText: {
    fontSize: 14,
    color: neutral.gray400,
    textAlign: "center",
    paddingVertical: 20,
  },
  waypointsList: {
    maxHeight: 150,
  },
  waypointItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: neutral.gray100,
    gap: 10,
  },
  waypointItemName: {
    flex: 1,
    fontSize: 14,
    color: neutral.gray800,
  },
  addWaypointButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  addWaypointText: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.white,
  },
  // Details step
  detailsContainer: {
    flex: 1,
  },
  detailsScroll: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: neutral.gray800,
    marginTop: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: neutral.gray700,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: neutral.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: neutral.gray800,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: neutral.gray100,
  },
  optionChipActive: {
    backgroundColor: brand.primary,
  },
  optionText: {
    fontSize: 14,
    color: neutral.gray700,
  },
  optionTextActive: {
    color: neutral.white,
    fontWeight: "600",
  },
  priceToggle: {
    flexDirection: "row",
    backgroundColor: neutral.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  priceOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  priceOptionActive: {
    backgroundColor: neutral.white,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceOptionText: {
    fontSize: 14,
    color: neutral.gray500,
  },
  priceOptionTextActive: {
    color: neutral.gray800,
    fontWeight: "600",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: neutral.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: neutral.gray800,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: neutral.gray800,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  currencyLabel: {
    fontSize: 14,
    color: neutral.gray500,
  },
  summaryCard: {
    backgroundColor: neutral.gray50,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray700,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: neutral.gray500,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray800,
  },
  // Publishing
  publishingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  publishingText: {
    marginTop: 16,
    fontSize: 16,
    color: neutral.gray500,
  },
  // Bottom actions
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: neutral.gray200,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: neutral.gray400,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.white,
  },
});
