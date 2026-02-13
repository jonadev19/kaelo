/**
 * Explorar Screen - Map view with all published routes
 * Enhanced UI with collapsible route panel and modern card design
 */

import { accent, brand, neutral, radius, shadows } from '@/constants/Colors';
import {
    getActiveBusinesses,
    getPublishedRoutes,
} from '@/services/routes';
import type { BusinessForMap, RouteForMap } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, {
    Marker,
    Polyline,
    PROVIDER_DEFAULT,
    PROVIDER_GOOGLE,
} from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Card dimensions
const CARD_WIDTH = 200;
const COLLAPSED_HEIGHT = 0;
const EXPANDED_HEIGHT = 165;

// Difficulty configurations
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; gradient: string[] }> = {
    facil: { label: 'Fácil', color: brand.primary, gradient: [brand.primary, brand.secondary] },
    moderada: { label: 'Media', color: accent.amber, gradient: ['#F59E0B', '#FBBF24'] },
    dificil: { label: 'Difícil', color: accent.coral, gradient: ['#EF4444', '#F87171'] },
    experto: { label: 'Experto', color: accent.violet, gradient: ['#8B5CF6', '#A78BFA'] },
};

// Categories for chips
const CATEGORIES = [
    { id: 'todos', label: 'Todos' },
    { id: 'montana', label: 'Montaña' },
    { id: 'ruta', label: 'Ruta' },
    { id: 'urbano', label: 'Urbano' },
    { id: 'gravel', label: 'Gravel' },
];

// Default region (Mérida, Yucatán)
const DEFAULT_REGION = {
    latitude: 20.9674,
    longitude: -89.5926,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
};

// Business type icons
const BUSINESS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    restaurante: 'restaurant',
    cafeteria: 'cafe',
    tienda: 'storefront',
    taller_bicicletas: 'build',
    hospedaje: 'bed',
    tienda_conveniencia: 'cart',
    mercado: 'basket',
    otro: 'location',
};

export function ExplorarScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);

    // Data State
    const [routes, setRoutes] = useState<RouteForMap[]>([]);
    const [businesses, setBusinesses] = useState<BusinessForMap[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<RouteForMap | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('todos');

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [showBusinesses, setShowBusinesses] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [isPanelExpanded, setIsPanelExpanded] = useState(true);

    // Animations
    const slideAnim = useRef(new Animated.Value(0)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;

    // Load data on mount
    useEffect(() => {
        loadData();
        requestLocationPermission();
    }, []);

    const togglePanel = useCallback(() => {
        const toExpanded = !isPanelExpanded;
        setIsPanelExpanded(toExpanded);

        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: toExpanded ? 0 : 300,
                friction: 12,
                tension: 65,
                useNativeDriver: true,
            }),
            Animated.timing(buttonOpacity, {
                toValue: toExpanded ? 0 : 1,
                duration: 250,
                delay: toExpanded ? 0 : 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isPanelExpanded, slideAnim, buttonOpacity]);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                setUserLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [routesData, businessesData] = await Promise.all([
                getPublishedRoutes(),
                getActiveBusinesses(),
            ]);
            setRoutes(routesData);
            setBusinesses(businessesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoutePress = useCallback((route: RouteForMap) => {
        setSelectedRoute(route);

        // Fit map to show the route
        if (mapRef.current && route.coordinates.length > 0) {
            mapRef.current.fitToCoordinates(route.coordinates, {
                edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                animated: true,
            });
        }
    }, []);

    const handleViewRouteDetail = useCallback(() => {
        if (selectedRoute) {
            router.push(`/route/${selectedRoute.id}`);
        }
    }, [selectedRoute, router]);

    const handleCenterOnUser = useCallback(() => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                ...userLocation,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }, 500);
        }
    }, [userLocation]);

    const handleFitAllRoutes = useCallback(() => {
        if (mapRef.current && routes.length > 0) {
            const allCoordinates = routes.flatMap(r => r.coordinates);
            if (allCoordinates.length > 0) {
                mapRef.current.fitToCoordinates(allCoordinates, {
                    edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                    animated: true,
                });
            }
        }
    }, [routes]);

    const closeRouteCard = useCallback(() => {
        setSelectedRoute(null);
    }, []);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={brand.primary} />
                <Text style={styles.loadingText}>Cargando rutas...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                initialRegion={userLocation ? {
                    ...userLocation,
                    latitudeDelta: 0.3,
                    longitudeDelta: 0.3,
                } : DEFAULT_REGION}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
                onMapReady={() => setMapReady(true)}
                onPress={() => setSelectedRoute(null)}
            >
                {/* Route Polylines */}
                {routes.map((route) => {
                    const isSelected = selectedRoute?.id === route.id;
                    const difficultyColor = DIFFICULTY_CONFIG[route.difficulty]?.color || brand.primary;

                    return (
                        <React.Fragment key={route.id}>
                            <Polyline
                                coordinates={route.coordinates}
                                strokeColor={isSelected ? difficultyColor : `${difficultyColor}80`}
                                strokeWidth={isSelected ? 5 : 3}
                                lineCap="round"
                                lineJoin="round"
                                tappable
                                onPress={() => handleRoutePress(route)}
                            />
                            {/* Start marker */}
                            <Marker
                                coordinate={route.startPoint}
                                onPress={() => handleRoutePress(route)}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <View style={[
                                    styles.markerContainer,
                                    isSelected && styles.markerContainerSelected,
                                    { borderColor: difficultyColor }
                                ]}>
                                    <Ionicons
                                        name="flag"
                                        size={16}
                                        color={isSelected ? neutral.white : difficultyColor}
                                    />
                                </View>
                            </Marker>
                        </React.Fragment>
                    );
                })}

                {/* Business Markers (when enabled) */}
                {showBusinesses && businesses.map((business) => (
                    <Marker
                        key={business.id}
                        coordinate={business.coordinate}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.businessMarker}>
                            <Ionicons
                                name={BUSINESS_ICONS[business.type] || 'storefront'}
                                size={14}
                                color={neutral.white}
                            />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Floating Search Bar & Filters */}
            <View style={[styles.topContainer, { paddingTop: insets.top + 10 }]}>
                <View style={styles.searchBarContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={neutral.slate} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Buscar rutas..."
                            placeholderTextColor={neutral.slate}
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <TouchableOpacity style={styles.filterButton}>
                            <Ionicons name="options-outline" size={20} color={neutral.charcoal} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                    style={styles.categoriesScroll}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat.id && styles.categoryChipActive
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat.id && styles.categoryTextActive
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Floating Map Controls - Right Side Pillar */}
            <View style={[styles.mapControls, { top: insets.top + 140 }]}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleCenterOnUser}
                >
                    <Ionicons name="navigate" size={22} color={brand.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        showBusinesses && styles.controlButtonActive
                    ]}
                    onPress={() => setShowBusinesses(!showBusinesses)}
                >
                    <Ionicons
                        name="storefront"
                        size={22}
                        color={showBusinesses ? neutral.white : neutral.charcoal}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleFitAllRoutes}
                >
                    <Ionicons name="map" size={22} color={neutral.charcoal} />
                </TouchableOpacity>
            </View>

            {/* Collapsible Route List - Carousel */}
            {!selectedRoute && (
                <Animated.View
                    style={[
                        styles.carouselContainer,
                        {
                            bottom: insets.bottom + 20,
                            transform: [{ translateY: slideAnim }],
                            opacity: slideAnim.interpolate({
                                inputRange: [0, 300],
                                outputRange: [1, 0],
                            }),
                        }
                    ]}
                >
                    <ScrollView
                        horizontal
                        pagingEnabled
                        decelerationRate="fast"
                        snapToInterval={CARD_WIDTH + 12}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                    >
                        {routes.map((route) => {
                            const difficultyConfig = DIFFICULTY_CONFIG[route.difficulty.toLowerCase()] || DIFFICULTY_CONFIG.facil;

                            return (
                                <TouchableOpacity
                                    key={route.id}
                                    style={styles.modernCard}
                                    onPress={() => handleRoutePress(route)}
                                    activeOpacity={0.9}
                                >
                                    {/* Image Holder / Map Preview Graphic */}
                                    <View style={styles.modernCardImagePlaceholder}>
                                        <LinearGradient
                                            colors={['#E5E5E5', '#F5F5F5']}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Ionicons name="map" size={32} color={neutral.silver} />

                                        {/* Badges Overlay */}
                                        <View style={styles.cardBadgesOverlay}>
                                            <View style={[styles.difficultyBadge, { backgroundColor: difficultyConfig.color }]}>
                                                <Text style={styles.difficultyBadgeText}>
                                                    {difficultyConfig.label}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Content */}
                                    <View style={styles.modernCardBody}>
                                        <View style={styles.modernCardHeader}>
                                            <Text style={styles.modernCardTitle} numberOfLines={1}>
                                                {route.name}
                                            </Text>
                                            <View style={styles.ratingContainer}>
                                                <Ionicons name="star" size={12} color={accent.amber} />
                                                <Text style={styles.ratingText}>{route.averageRating.toFixed(1)}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.modernCardStatsRow}>
                                            <Text style={styles.modernCardStat}>
                                                {route.distanceKm.toFixed(1)} km
                                            </Text>
                                            <Text style={styles.statDot}>•</Text>
                                            <Text style={styles.modernCardStat}>
                                                {route.elevationGainM}m elev
                                            </Text>
                                        </View>

                                        <View style={styles.modernCardFooter}>
                                            <Text style={styles.priceLabel}>
                                                {route.isFree ? 'Gratis' : `$${route.price}`}
                                            </Text>
                                            <Ionicons name="arrow-forward-circle" size={24} color={brand.primary} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </Animated.View>
            )}

            {/* Toggle Panel Button (When collapsed, mostly for re-opening) */}
            {!selectedRoute && !isPanelExpanded && (
                <TouchableOpacity
                    style={[styles.reopenButton, { bottom: insets.bottom + 30 }]}
                    onPress={togglePanel}
                >
                    <Ionicons name="list" size={20} color={neutral.white} />
                    <Text style={styles.reopenButtonText}>Ver Lista</Text>
                </TouchableOpacity>
            )}

            {/* Selected Route Card */}
            {selectedRoute && (
                <View style={[styles.selectedRouteCard, { paddingBottom: insets.bottom + 20 }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={closeRouteCard}>
                        <Ionicons name="close" size={24} color={neutral.charcoal} />
                    </TouchableOpacity>

                    <View style={styles.selectedRouteHeader}>
                        <View style={[
                            styles.selectedRouteDifficulty,
                            { backgroundColor: `${DIFFICULTY_CONFIG[selectedRoute.difficulty]?.color || brand.primary}15` }
                        ]}>
                            <Text style={[
                                styles.selectedRouteDifficultyText,
                                { color: DIFFICULTY_CONFIG[selectedRoute.difficulty]?.color || brand.primary }
                            ]}>
                                {DIFFICULTY_CONFIG[selectedRoute.difficulty]?.label || selectedRoute.difficulty}
                            </Text>
                        </View>
                        <View style={styles.selectedRouteRating}>
                            <Ionicons name="star" size={16} color={accent.amber} />
                            <Text style={styles.selectedRouteRatingText}>
                                {selectedRoute.averageRating.toFixed(1)}
                            </Text>
                            <Text style={styles.selectedRouteReviews}>
                                ({selectedRoute.totalReviews})
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.selectedRouteName}>{selectedRoute.name}</Text>

                    {selectedRoute.description && (
                        <Text style={styles.selectedRouteDescription} numberOfLines={2}>
                            {selectedRoute.description}
                        </Text>
                    )}

                    <View style={styles.selectedRouteStats}>
                        <View style={styles.selectedRouteStat}>
                            <Ionicons name="resize-outline" size={18} color={brand.primary} />
                            <Text style={styles.selectedRouteStatValue}>{selectedRoute.distanceKm.toFixed(1)} km</Text>
                            <Text style={styles.selectedRouteStatLabel}>Distancia</Text>
                        </View>
                        <View style={styles.selectedRouteStatDivider} />
                        <View style={styles.selectedRouteStat}>
                            <Ionicons name="trending-up" size={18} color={accent.coral} />
                            <Text style={styles.selectedRouteStatValue}>{selectedRoute.elevationGainM}m</Text>
                            <Text style={styles.selectedRouteStatLabel}>Elevación</Text>
                        </View>
                        <View style={styles.selectedRouteStatDivider} />
                        <View style={styles.selectedRouteStat}>
                            <Ionicons name="time-outline" size={18} color={accent.cenote} />
                            <Text style={styles.selectedRouteStatValue}>
                                {selectedRoute.estimatedDurationMin ? `${Math.floor(selectedRoute.estimatedDurationMin / 60)}h ${selectedRoute.estimatedDurationMin % 60}m` : '--'}
                            </Text>
                            <Text style={styles.selectedRouteStatLabel}>Tiempo est.</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.viewRouteButton}
                        onPress={handleViewRouteDetail}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.viewRouteButtonText}>Ver Detalles</Text>
                        <Ionicons name="arrow-forward" size={18} color={neutral.white} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: neutral.snow,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: neutral.slate,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },

    // Top Search & Filter
    topContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    searchBarContainer: {
        marginBottom: 12,
        ...shadows.medium,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.white,
        borderRadius: radius.full,
        paddingHorizontal: 16,
        paddingVertical: 10,
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: neutral.charcoal,
        fontWeight: '500',
    },
    filterButton: {
        padding: 4,
        marginLeft: 8,
    },
    categoriesScroll: {
        maxHeight: 40,
    },
    categoriesContainer: {
        paddingRight: 16,
        gap: 8,
        paddingBottom: 4, // for shadow
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: radius.full,
        backgroundColor: neutral.white,
        ...shadows.small,
    },
    categoryChipActive: {
        backgroundColor: brand.primary,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: neutral.charcoal,
    },
    categoryTextActive: {
        color: neutral.white,
    },

    // Map Controls
    mapControls: {
        position: 'absolute',
        right: 16,
        gap: 12,
    },
    controlButton: {
        width: 44,
        height: 44,
        borderRadius: 12, // More square
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.medium,
    },
    controlButtonActive: {
        backgroundColor: brand.primary,
    },

    // Markers
    markerContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        ...shadows.small,
    },
    markerContainerSelected: {
        backgroundColor: brand.primary,
        borderColor: brand.white,
        transform: [{ scale: 1.2 }]
    },
    businessMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: accent.coral,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: neutral.white,
        ...shadows.small,
    },

    // Carousel
    carouselContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 180, // slightly taller
    },
    carouselContent: {
        paddingHorizontal: (width - CARD_WIDTH) / 2, // Center first card
        gap: 12,
    },
    modernCard: {
        width: CARD_WIDTH,
        height: 170,
        backgroundColor: neutral.white,
        borderRadius: 20,
        marginRight: 12,
        overflow: 'hidden',
        ...shadows.large, // Deep shadow
        borderWidth: 1,
        borderColor: neutral.pearl,
    },
    modernCardImagePlaceholder: {
        height: 90,
        backgroundColor: neutral.pearl,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cardBadgesOverlay: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyBadgeText: {
        color: neutral.white,
        fontSize: 10,
        fontWeight: '700',
    },
    modernCardBody: {
        padding: 12,
        flex: 1,
        justifyContent: 'space-between',
    },
    modernCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    modernCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: neutral.charcoal,
        flex: 1,
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: accent.amberTint,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#D97706',
    },
    modernCardStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modernCardStat: {
        fontSize: 12,
        color: neutral.slate,
        fontWeight: '500',
    },
    statDot: {
        marginHorizontal: 6,
        color: neutral.mist,
    },
    modernCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    priceLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: brand.primary,
    },

    // Reopen Button
    reopenButton: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: neutral.charcoal,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        ...shadows.large,
    },
    reopenButtonText: {
        color: neutral.white,
        fontWeight: '600',
    },

    // Selected Route Card
    selectedRouteCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: neutral.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        ...shadows.large,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: neutral.pearl,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    selectedRouteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingRight: 40,
    },
    selectedRouteDifficulty: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.md,
    },
    selectedRouteDifficultyText: {
        fontSize: 12,
        fontWeight: '700',
    },
    selectedRouteRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    selectedRouteRatingText: {
        fontSize: 14,
        fontWeight: '700',
        color: neutral.charcoal,
    },
    selectedRouteReviews: {
        fontSize: 12,
        color: neutral.slate,
    },
    selectedRouteName: {
        fontSize: 22,
        fontWeight: '700',
        color: neutral.charcoal,
        marginBottom: 8,
    },
    selectedRouteDescription: {
        fontSize: 14,
        color: neutral.slate,
        lineHeight: 20,
        marginBottom: 16,
    },
    selectedRouteStats: {
        flexDirection: 'row',
        backgroundColor: neutral.pearl,
        borderRadius: radius.lg,
        padding: 16,
        marginBottom: 20,
    },
    selectedRouteStat: {
        flex: 1,
        alignItems: 'center',
    },
    selectedRouteStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: neutral.charcoal,
        marginTop: 6,
    },
    selectedRouteStatLabel: {
        fontSize: 11,
        color: neutral.slate,
        marginTop: 2,
    },
    selectedRouteStatDivider: {
        width: 1,
        backgroundColor: neutral.silver,
        marginHorizontal: 12,
    },
    viewRouteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: brand.primary,
        borderRadius: radius.lg,
        paddingVertical: 16,
        gap: 8,
        ...shadows.colored(brand.primary),
    },
    viewRouteButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: neutral.white,
    },

    // Floating Show Routes Button
    showRoutesButton: {
        position: 'absolute',
        alignSelf: 'center',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    showRoutesButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: brand.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        ...shadows.colored(brand.primary),
    },
    showRoutesButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: neutral.white,
    },
});
