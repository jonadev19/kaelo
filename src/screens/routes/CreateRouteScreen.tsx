/**
 * Create Route Screen
 * Dark theme with green accents
 * Multi-step flow: Draw Route → Add Waypoints → Route Details → Publish
 */

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
  Modal,
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
  MapType,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// ============ DARK THEME COLORS ============
const colors = {
  // Backgrounds
  bgPrimary: "#0A1A10",
  bgSecondary: "#0D1F14",
  bgCard: "#142B1C",
  bgInput: "#1A3324",
  bgElevated: "#1E3A28",

  // Accent
  accent: "#22C55E",
  accentMuted: "rgba(34, 197, 94, 0.2)",
  accentBorder: "rgba(34, 197, 94, 0.3)",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",

  // Difficulty colors
  easy: "#22C55E",
  medium: "#F59E0B",
  hard: "#EF4444",
  expert: "#EF4444",

  // Others
  border: "rgba(255, 255, 255, 0.1)",
  overlay: "rgba(0, 0, 0, 0.7)",
  white: "#FFFFFF",
  black: "#000000",
};

// Steps
type Step = "draw" | "waypoints" | "details" | "success";

const TOTAL_STEPS = 4;

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
  { value: "facil", label: "Fácil", color: colors.easy },
  { value: "moderada", label: "Medio", color: colors.medium },
  { value: "dificil", label: "Difícil", color: colors.hard },
  { value: "experto", label: "Experto", color: colors.expert },
];

// Terrain options
const TERRAIN_OPTIONS: { value: TerrainType; label: string }[] = [
  { value: "asfalto", label: "Asfalto" },
  { value: "terraceria", label: "Terracería" },
  { value: "mixto", label: "Mixto (Asfalto + Sendero)" },
];

// Waypoint type options
const WAYPOINT_TYPES: {
  value: WaypointType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: "cenote", label: "Cenote", icon: "water", color: "#06B6D4" },
  { value: "mirador", label: "Mirador", icon: "eye", color: "#8B5CF6" },
  { value: "restaurante", label: "Restaurante", icon: "restaurant", color: "#F59E0B" },
  { value: "tienda", label: "Tienda", icon: "storefront", color: "#EC4899" },
  { value: "zona_arqueologica", label: "Zona Arqueológica", icon: "business", color: "#F59E0B" },
  { value: "punto_agua", label: "Punto de Agua", icon: "water-outline", color: "#3B82F6" },
  { value: "descanso", label: "Descanso", icon: "bed", color: "#10B981" },
  { value: "peligro", label: "Peligro", icon: "warning", color: "#EF4444" },
  { value: "foto", label: "Punto Foto", icon: "camera", color: "#A855F7" },
  { value: "otro", label: "Otro", icon: "location", color: "#6B7280" },
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

  // Map type
  const [mapType, setMapType] = useState<MapType>("standard");

  // Waypoints
  const [waypoints, setWaypoints] = useState<CreateWaypointData[]>([]);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
  const [selectedWaypointType, setSelectedWaypointType] = useState<WaypointType>("cenote");
  const [waypointName, setWaypointName] = useState("");
  const [showWaypointModal, setShowWaypointModal] = useState(false);
  const [pendingWaypointCoord, setPendingWaypointCoord] = useState<Coordinate | null>(null);

  // Route details
  const [routeName, setRouteName] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("moderada");
  const [terrainType, setTerrainType] = useState<TerrainType>("mixto");
  const [showTerrainPicker, setShowTerrainPicker] = useState(false);

  // Monetization
  const [isMonetized, setIsMonetized] = useState(false);
  const [price, setPrice] = useState("85");

  // Published route ID
  const [publishedRouteId, setPublishedRouteId] = useState<string | null>(null);

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

  // Estimate time (assuming 15 km/h average)
  const estimateTime = (): string => {
    const dist = calculateDistance();
    if (dist === 0) return "0m";
    const hours = dist / 15;
    const totalMinutes = Math.round(hours * 60);
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  };

  // Get current step index
  const getStepIndex = (): number => {
    switch (currentStep) {
      case "draw": return 0;
      case "waypoints": return 1;
      case "details": return 2;
      case "success": return 3;
      default: return 0;
    }
  };

  // Parse GPX file content
  const parseGPX = (content: string): Coordinate[] => {
    const coordinates: Coordinate[] = [];
    const trkptRegex = /<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"/g;
    const rteptRegex = /<rtept[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"/g;
    let match;

    while ((match = trkptRegex.exec(content)) !== null) {
      coordinates.push({
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      });
    }

    if (coordinates.length === 0) {
      while ((match = rteptRegex.exec(content)) !== null) {
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

      const content = await FileSystem.readAsStringAsync(file.uri);
      const coords = parseGPX(content);

      if (coords.length < 2) {
        Alert.alert("Error", "El archivo GPX no contiene suficientes puntos");
        return;
      }

      setRouteCoordinates(coords);

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 150, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }, 300);

      Alert.alert("¡GPX Importado!", `Se cargaron ${coords.length} puntos`);
    } catch (error) {
      console.error("Error importing GPX:", error);
      Alert.alert("Error", "No se pudo importar el archivo GPX");
    }
  };

  // Handle map press to add point
  const handleMapPress = (event: any) => {
    if (currentStep === "waypoints" && isAddingWaypoint) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setPendingWaypointCoord({ latitude, longitude });
      setShowWaypointModal(true);
      return;
    }

    if (currentStep !== "draw") return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    setRouteCoordinates([...routeCoordinates, { latitude, longitude }]);
  };

  // Add waypoint
  const confirmAddWaypoint = () => {
    if (!pendingWaypointCoord || !waypointName.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para el punto");
      return;
    }

    const newWaypoint: CreateWaypointData = {
      name: waypointName,
      waypointType: selectedWaypointType,
      coordinate: pendingWaypointCoord,
    };

    setWaypoints([...waypoints, newWaypoint]);
    setShowWaypointModal(false);
    setWaypointName("");
    setPendingWaypointCoord(null);
    setIsAddingWaypoint(false);
  };

  // Undo last point
  const handleUndo = () => {
    if (routeCoordinates.length > 0) {
      setRouteCoordinates(routeCoordinates.slice(0, -1));
    }
  };

  // Clear all points
  const handleClear = () => {
    Alert.alert("Limpiar ruta", "¿Seguro que quieres borrar todos los puntos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpiar", style: "destructive", onPress: () => setRouteCoordinates([]) },
    ]);
  };

  // Remove waypoint
  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  // Go to next step
  const handleNext = () => {
    if (currentStep === "draw") {
      if (routeCoordinates.length < 2) {
        Alert.alert("Ruta incompleta", "Necesitas al menos 2 puntos para crear una ruta");
        return;
      }
      setCurrentStep("waypoints");
    } else if (currentStep === "waypoints") {
      setCurrentStep("details");
    } else if (currentStep === "details") {
      handlePublish();
    }
  };

  // Go to previous step
  const handleBack = () => {
    if (currentStep === "waypoints") {
      setCurrentStep("draw");
    } else if (currentStep === "details") {
      setCurrentStep("waypoints");
    } else if (currentStep === "success") {
      router.replace("/(tabs)");
    } else {
      router.back();
    }
  };

  // Publish route
  const handlePublish = async () => {
    if (!routeName.trim()) {
      Alert.alert("Nombre requerido", "Por favor ingresa un nombre para la ruta");
      return;
    }

    const priceValue = isMonetized ? parseFloat(price) || 0 : 0;

    try {
      setIsPublishing(true);

      const result = await createAndPublishRoute({
        routeData: {
          name: routeName.trim(),
          description: routeDescription.trim(),
          difficulty,
          terrainType,
          price: priceValue,
          isFree: !isMonetized,
        },
        coordinates: routeCoordinates,
        waypoints,
      });

      setPublishedRouteId(result?.id || null);
      setCurrentStep("success");
    } catch (error: any) {
      console.error("Error publishing route:", error);
      Alert.alert("Error", error.message || "No se pudo publicar la ruta");
    } finally {
      setIsPublishing(false);
    }
  };

  // Center on user location
  const centerOnUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const distance = calculateDistance();
  const estimatedTime = estimateTime();

  // ============ RENDER PROGRESS BAR ============
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[...Array(TOTAL_STEPS)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressSegment,
            index <= getStepIndex() && styles.progressSegmentActive,
          ]}
        />
      ))}
    </View>
  );

  // ============ RENDER STEP 1: DRAW ============
  const renderDrawStep = () => (
    <View style={styles.stepContainer}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paso 1: Trazar</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Ayuda</Text>
        </TouchableOpacity>
      </View>

      {renderProgressBar()}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          mapType={mapType}
          initialRegion={INITIAL_REGION}
          onPress={handleMapPress}
          showsUserLocation
          customMapStyle={darkMapStyle}
        >
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.accent}
              strokeWidth={4}
            />
          )}
          {routeCoordinates.map((coord, index) => (
            <Marker key={`${index}-${routeCoordinates.length}`} coordinate={coord}>
              <View style={styles.routeMarker} />
            </Marker>
          ))}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={[styles.mapControlBtn, styles.mapControlBtnActive]}
            onPress={handleMapPress}
          >
            <Ionicons name="finger-print" size={22} color={colors.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlBtn} onPress={centerOnUser}>
            <Ionicons name="locate" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Route Controls */}
        <View style={styles.routeControls}>
          <TouchableOpacity
            style={[styles.routeControlBtn, routeCoordinates.length === 0 && styles.routeControlBtnDisabled]}
            onPress={handleUndo}
            disabled={routeCoordinates.length === 0}
          >
            <Ionicons name="arrow-undo" size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.routeControlBtn, routeCoordinates.length === 0 && styles.routeControlBtnDisabled]}
            onPress={handleClear}
            disabled={routeCoordinates.length === 0}
          >
            <Ionicons name="trash-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsLabel}>DISTANCIA TOTAL</Text>
            <View style={styles.statsValueRow}>
              <Text style={styles.statsValue}>{distance}</Text>
              <Text style={styles.statsUnit}> km</Text>
            </View>
          </View>
          <View style={styles.statsRight}>
            <Text style={styles.statsLabel}>ELEVACIÓN</Text>
            <View style={styles.statsValueRow}>
              <Ionicons name="trending-up" size={18} color={colors.accent} />
              <Text style={styles.statsValueSmall}> +0m</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.nextButton, routeCoordinates.length < 2 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={routeCoordinates.length < 2}
        >
          <Text style={styles.nextButtonText}>Siguiente</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.black} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ============ RENDER STEP 2: WAYPOINTS ============
  const renderWaypointsStep = () => (
    <View style={styles.stepContainer}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Ruta</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Dots */}
      <View style={styles.progressDots}>
        {[...Array(TOTAL_STEPS)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= getStepIndex() && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Puntos de interés</Text>
        <Text style={styles.sectionDescription}>
          Añade paradas interesantes a tu ruta como cenotes, ruinas o talleres para enriquecer la experiencia.
        </Text>

        {/* Waypoints List */}
        {waypoints.map((wp, index) => {
          const typeInfo = WAYPOINT_TYPES.find(t => t.value === wp.waypointType);
          return (
            <View key={index} style={styles.waypointCard}>
              <View style={[styles.waypointIcon, { backgroundColor: typeInfo?.color || colors.accent }]}>
                <Ionicons name={typeInfo?.icon || "location"} size={20} color={colors.white} />
              </View>
              <View style={styles.waypointInfo}>
                <Text style={styles.waypointName}>{wp.name}</Text>
                <Text style={styles.waypointType}>{typeInfo?.label || "Otro"}</Text>
              </View>
              <TouchableOpacity onPress={() => removeWaypoint(index)}>
                <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add Waypoint Button */}
        <TouchableOpacity
          style={styles.addWaypointButton}
          onPress={() => setIsAddingWaypoint(true)}
        >
          <Ionicons name="add" size={24} color={colors.textSecondary} />
          <Text style={styles.addWaypointText}>Agregar nuevo punto</Text>
        </TouchableOpacity>

        {isAddingWaypoint && (
          <View style={styles.addingWaypointHint}>
            <Ionicons name="information-circle" size={18} color={colors.accent} />
            <Text style={styles.addingWaypointHintText}>
              Toca el mapa para agregar un punto de interés
            </Text>
          </View>
        )}

        {/* Map Preview */}
        <View style={styles.mapPreview}>
          <MapView
            style={styles.mapPreviewMap}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            initialRegion={INITIAL_REGION}
            scrollEnabled={false}
            zoomEnabled={false}
            customMapStyle={darkMapStyle}
            onPress={isAddingWaypoint ? handleMapPress : undefined}
          >
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={colors.accent}
                strokeWidth={3}
              />
            )}
            {waypoints.map((wp, index) => (
              <Marker key={index} coordinate={wp.coordinate}>
                <View style={[styles.waypointMarker, { backgroundColor: WAYPOINT_TYPES.find(t => t.value === wp.waypointType)?.color }]}>
                  <Ionicons
                    name={WAYPOINT_TYPES.find(t => t.value === wp.waypointType)?.icon || "location"}
                    size={14}
                    color={colors.white}
                  />
                </View>
              </Marker>
            ))}
          </MapView>
          <View style={styles.mapPreviewOverlay}>
            <Ionicons name="map" size={16} color={colors.accent} />
            <Text style={styles.mapPreviewText}>Vista previa del mapa</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.backTextButton} onPress={handleBack}>
          <Text style={styles.backTextButtonText}>Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Siguiente</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.black} />
        </TouchableOpacity>
      </View>

      {/* Waypoint Modal */}
      <Modal visible={showWaypointModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo punto de interés</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del punto"
              placeholderTextColor={colors.textMuted}
              value={waypointName}
              onChangeText={setWaypointName}
            />

            <Text style={styles.modalLabel}>Tipo de punto</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.waypointTypeScroll}>
              {WAYPOINT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.waypointTypeOption,
                    selectedWaypointType === type.value && { borderColor: type.color },
                  ]}
                  onPress={() => setSelectedWaypointType(type.value)}
                >
                  <View style={[styles.waypointTypeIcon, { backgroundColor: type.color }]}>
                    <Ionicons name={type.icon} size={18} color={colors.white} />
                  </View>
                  <Text style={styles.waypointTypeLabel}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowWaypointModal(false);
                  setWaypointName("");
                  setPendingWaypointCoord(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmAddWaypoint}>
                <Text style={styles.modalConfirmText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // ============ RENDER STEP 3: DETAILS ============
  const renderDetailsStep = () => (
    <View style={styles.stepContainer}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de la Ruta</Text>
        <TouchableOpacity>
          <Text style={styles.saveText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      {renderProgressBar()}
      <Text style={styles.stepIndicator}>PASO 3 DE 4</Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Name Input */}
            <Text style={styles.inputLabel}>Nombre de la ruta</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. Ruta Cenotes Sagrados"
              placeholderTextColor={colors.textMuted}
              value={routeName}
              onChangeText={setRouteName}
            />

            {/* Description Input */}
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe los puntos de interés, paradas recomendadas y qué hace especial a esta ruta..."
              placeholderTextColor={colors.textMuted}
              value={routeDescription}
              onChangeText={setRouteDescription}
              multiline
              numberOfLines={4}
            />

            {/* Difficulty */}
            <Text style={styles.inputLabel}>Dificultad</Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.difficultyOption,
                    difficulty === option.value && styles.difficultyOptionActive,
                    difficulty === option.value && { borderColor: option.color },
                  ]}
                  onPress={() => setDifficulty(option.value)}
                >
                  <View style={[styles.difficultyDot, { backgroundColor: option.color }]} />
                  <Text style={[
                    styles.difficultyText,
                    difficulty === option.value && styles.difficultyTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Terrain Type */}
            <Text style={styles.inputLabel}>Tipo de Terreno</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowTerrainPicker(true)}
            >
              <Text style={styles.dropdownText}>
                {TERRAIN_OPTIONS.find(t => t.value === terrainType)?.label}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Monetization */}
            <View style={styles.monetizationSection}>
              <View style={styles.monetizationHeader}>
                <View>
                  <Text style={styles.monetizationTitle}>Monetización</Text>
                  <Text style={styles.monetizationSubtitle}>¿Deseas vender acceso a esta ruta?</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, isMonetized && styles.toggleActive]}
                  onPress={() => setIsMonetized(!isMonetized)}
                >
                  <View style={[styles.toggleKnob, isMonetized && styles.toggleKnobActive]} />
                </TouchableOpacity>
              </View>

              {isMonetized && (
                <View style={styles.monetizationContent}>
                  <View style={styles.premiumBadge}>
                    <Ionicons name="logo-usd" size={18} color={colors.accent} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.premiumTitle}>Modo Premium Activo</Text>
                      <Text style={styles.premiumDescription}>
                        Gana dinero por tu conocimiento local. Los ciclistas pagan para desbloquear la navegación completa.
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.priceLabel}>PRECIO DE VENTA (MXN)</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceCurrency}>$</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.priceMxn}>MXN</Text>
                  </View>

                  <View style={styles.earningsRow}>
                    <Text style={styles.earningsLabel}>Tu ganancia estimada (85%)</Text>
                    <Text style={styles.earningsValue}>
                      ${(parseFloat(price || "0") * 0.85).toFixed(2)} MXN
                    </Text>
                  </View>
                  <Text style={styles.priceHint}>Rango sugerido: $50 - $150 MXN</Text>
                </View>
              )}
            </View>

            <View style={{ height: 160 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.statsFooterItem}>
          <Ionicons name="speedometer-outline" size={16} color={colors.textMuted} />
          <Text style={styles.statsFooterText}>{distance} km</Text>
        </View>
        <View style={styles.statsFooterDivider} />
        <View style={styles.statsFooterItem}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.statsFooterText}>{waypoints.length} Puntos</Text>
        </View>
        <View style={styles.statsFooterDivider} />
        <View style={styles.statsFooterItem}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <Text style={styles.statsFooterText}>{estimatedTime}</Text>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.backOutlineButton} onPress={handleBack}>
          <Text style={styles.backOutlineButtonText}>Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, styles.nextButtonFlex, (!routeName.trim() || isPublishing) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!routeName.trim() || isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color={colors.black} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.black} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Terrain Picker Modal */}
      <Modal visible={showTerrainPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTerrainPicker(false)}
        >
          <View style={styles.pickerContent}>
            {TERRAIN_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.pickerOption}
                onPress={() => {
                  setTerrainType(option.value);
                  setShowTerrainPicker(false);
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  terrainType === option.value && styles.pickerOptionTextActive,
                ]}>
                  {option.label}
                </Text>
                {terrainType === option.value && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  // ============ RENDER STEP 4: SUCCESS ============
  const renderSuccessStep = () => (
    <View style={[styles.stepContainer, styles.successContainer]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Publicar Ruta</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderProgressBar()}

      <View style={styles.successContent}>
        {/* Trophy Icon */}
        <View style={styles.trophyContainer}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={64} color={colors.accent} />
          </View>
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </View>
        </View>

        <Text style={styles.successTitle}>¡Ruta Publicada!</Text>
        <Text style={styles.successDescription}>
          Tu ruta '<Text style={styles.successRouteName}>{routeName}</Text>' ya está visible para la comunidad.
        </Text>

        {/* Route Card Preview */}
        <View style={styles.routeCard}>
          {isMonetized && (
            <View style={styles.premiumTag}>
              <Ionicons name="logo-usd" size={12} color={colors.accent} />
              <Text style={styles.premiumTagText}>Premium</Text>
            </View>
          )}
          <View style={styles.routeCardContent}>
            <Text style={styles.routeCardName}>{routeName}</Text>
            <View style={styles.routeCardStats}>
              <Ionicons name="location" size={14} color={colors.accent} />
              <Text style={styles.routeCardStatText}>{distance} km</Text>
              <Text style={styles.routeCardStatDot}>•</Text>
              <Text style={styles.routeCardStatText}>
                {DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label}
              </Text>
            </View>
            <View style={styles.routeCardBadge}>
              <Ionicons name="star" size={12} color={colors.medium} />
              <Text style={styles.routeCardBadgeText}>Nueva Ruta</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={[styles.successButtons, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            if (publishedRouteId) {
              router.replace(`/route/${publishedRouteId}`);
            } else {
              router.replace("/(tabs)");
            }
          }}
        >
          <Text style={styles.nextButtonText}>Ver mi ruta</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.black} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeLink}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.homeLinkText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ============ MAIN RENDER ============
  return (
    <View style={styles.container}>
      {currentStep === "draw" && renderDrawStep()}
      {currentStep === "waypoints" && renderWaypointsStep()}
      {currentStep === "details" && renderDetailsStep()}
      {currentStep === "success" && renderSuccessStep()}
    </View>
  );
}

// Dark map style
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  stepContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.bgPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    justifyContent: "center",
    alignItems: "center",
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
    color: colors.white,
  },
  helpButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.bgCard,
    borderRadius: 20,
  },
  helpButtonText: {
    fontSize: 14,
    color: colors.white,
  },
  saveText: {
    fontSize: 14,
    color: colors.white,
  },

  // Progress
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bgCard,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: colors.accent,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 16,
  },
  progressDot: {
    width: 32,
    height: 6,
    backgroundColor: colors.bgCard,
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: colors.accent,
  },
  stepIndicator: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },

  // Map
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: "absolute",
    top: 16,
    right: 16,
    gap: 8,
  },
  mapControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    justifyContent: "center",
    alignItems: "center",
  },
  mapControlBtnActive: {
    backgroundColor: colors.accent,
  },
  routeControls: {
    position: "absolute",
    right: 16,
    top: 140,
    gap: 8,
  },
  routeControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    justifyContent: "center",
    alignItems: "center",
  },
  routeControlBtnDisabled: {
    opacity: 0.5,
  },
  routeMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.white,
  },

  // Bottom Panel
  bottomPanel: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  statsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statsValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statsValue: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.white,
  },
  statsUnit: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.accent,
  },
  statsRight: {
    alignItems: "flex-end",
  },
  statsValueSmall: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonFlex: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },

  // Waypoint Card
  waypointCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  waypointIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  waypointInfo: {
    flex: 1,
    marginLeft: 14,
  },
  waypointName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  waypointType: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addWaypointButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 16,
  },
  addWaypointText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  addingWaypointHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentMuted,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  addingWaypointHintText: {
    fontSize: 14,
    color: colors.accent,
  },

  // Map Preview
  mapPreview: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.bgCard,
  },
  mapPreviewMap: {
    flex: 1,
  },
  mapPreviewOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapPreviewText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  waypointMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },

  // Bottom Buttons
  bottomButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backTextButton: {
    flex: 0.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  backTextButtonText: {
    fontSize: 16,
    color: colors.white,
  },
  backOutlineButton: {
    flex: 0.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backOutlineButtonText: {
    fontSize: 16,
    color: colors.white,
  },

  // Input
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.white,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },

  // Difficulty
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  difficultyOptionActive: {
    backgroundColor: colors.bgElevated,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  difficultyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  difficultyTextActive: {
    color: colors.white,
    fontWeight: "600",
  },

  // Dropdown
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.white,
  },

  // Monetization
  monetizationSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  monetizationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monetizationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
  },
  monetizationSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: colors.accent,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleKnobActive: {
    alignSelf: "flex-end",
  },
  monetizationContent: {
    marginTop: 20,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 4,
  },
  premiumDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceCurrency: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.white,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  priceMxn: {
    fontSize: 14,
    color: colors.textMuted,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  earningsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
  priceHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },

  // Stats Footer
  statsFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgPrimary,
  },
  statsFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statsFooterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsFooterDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.white,
    marginBottom: 12,
  },
  waypointTypeScroll: {
    marginBottom: 20,
  },
  waypointTypeOption: {
    alignItems: "center",
    marginRight: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 80,
  },
  waypointTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  waypointTypeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.white,
  },
  modalConfirmButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
  },

  // Picker Modal
  pickerContent: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    overflow: "hidden",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.white,
  },
  pickerOptionTextActive: {
    color: colors.accent,
    fontWeight: "600",
  },

  // Success
  successContainer: {
    alignItems: "center",
  },
  successContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  trophyContainer: {
    position: "relative",
    marginBottom: 32,
  },
  trophyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bgCard,
  },
  checkBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  successRouteName: {
    color: colors.white,
    fontWeight: "600",
  },
  routeCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  premiumTag: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  premiumTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent,
  },
  routeCardContent: {
    marginTop: 32,
  },
  routeCardName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 8,
  },
  routeCardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  routeCardStatText: {
    fontSize: 14,
    color: colors.accent,
  },
  routeCardStatDot: {
    fontSize: 14,
    color: colors.textMuted,
  },
  routeCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeCardBadgeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  successButtons: {
    width: "100%",
    paddingHorizontal: 20,
  },
  homeLink: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  homeLinkText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
