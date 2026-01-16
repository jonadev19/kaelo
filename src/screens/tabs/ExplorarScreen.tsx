import { brand, neutral } from '@/constants/Colors';
import {
    getActiveBusinesses,
    getBusinessesNearRoute,
    getNearestRoute,
    getPublishedRoutes,
    searchRoutes,
} from '@/services/routes';
import type { BusinessForMap, Coordinate, RouteForMap } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Keyboard,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import MapView, { MapType, Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Card positioning
const CARD_BOTTOM_MARGIN = 23;
const CARD_HEIGHT = 120;

// Yucatan region (Mérida as default)
const INITIAL_REGION = {
    latitude: 20.9673,
    longitude: -89.5925,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
};

// Filter options
const DIFFICULTY_OPTIONS = [
    { id: 'all', label: 'Todas' },
    { id: 'facil', label: 'Fácil' },
    { id: 'moderada', label: 'Media' },
    { id: 'dificil', label: 'Difícil' },
    { id: 'experto', label: 'Experto' },
];

const DISTANCE_OPTIONS = [
    { id: 'all', label: 'Cualquiera', min: 0, max: 999 },
    { id: 'short', label: '< 10 km', min: 0, max: 10 },
    { id: 'medium', label: '10-30 km', min: 10, max: 30 },
    { id: 'long', label: '30-50 km', min: 30, max: 50 },
    { id: 'ultra', label: '> 50 km', min: 50, max: 999 },
];

const TERRAIN_OPTIONS = [
    { id: 'all', label: 'Todos' },
    { id: 'asfalto', label: 'Asfalto' },
    { id: 'terraceria', label: 'Terracería' },
    { id: 'mixto', label: 'Mixto' },
];

// Map type options
const MAP_TYPE_OPTIONS: { type: MapType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { type: 'standard', label: 'Estándar', icon: 'map-outline' },
    { type: 'satellite', label: 'Satélite', icon: 'earth-outline' },
    { type: 'hybrid', label: 'Híbrido', icon: 'globe-outline' },
    { type: 'terrain', label: 'Terreno', icon: 'trail-sign-outline' },
];

// Difficulty label mapping
const DIFFICULTY_LABELS: Record<string, string> = {
    facil: 'Fácil',
    moderada: 'Media',
    dificil: 'Difícil',
    experto: 'Experto',
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

    // UI State
    const [searchText, setSearchText] = useState('');
    const [isCardVisible, setIsCardVisible] = useState(true);
    const [mapType, setMapType] = useState<MapType>('standard');
    const [showMapTypeModal, setShowMapTypeModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const cardAnimation = useRef(new Animated.Value(0)).current;

    // Filter State
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [distanceFilter, setDistanceFilter] = useState('all');
    const [terrainFilter, setTerrainFilter] = useState('all');

    // Location State
    const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
    const [locationPermission, setLocationPermission] = useState<boolean>(false);

    // Data State
    const [routes, setRoutes] = useState<RouteForMap[]>([]);
    const [businesses, setBusinesses] = useState<BusinessForMap[]>([]);
    const [nearestRoute, setNearestRoute] = useState<RouteForMap | null>(null);
    const [selectedRoute, setSelectedRoute] = useState<RouteForMap | null>(null);
    const [nearbyBusinesses, setNearbyBusinesses] = useState<BusinessForMap[]>([]);

    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch routes and businesses on mount
    useEffect(() => {
        loadInitialData();
    }, []);

    // Fetch nearby businesses when a route is selected
    useEffect(() => {
        if (selectedRoute) {
            loadBusinessesForRoute(selectedRoute.id);
        } else {
            setNearbyBusinesses([]);
        }
    }, [selectedRoute]);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);

            // Fetch routes and businesses in parallel
            const [routesData, businessesData] = await Promise.all([
                getPublishedRoutes(),
                getActiveBusinesses(),
            ]);

            setRoutes(routesData);
            setBusinesses(businessesData);

            // If we have a location, find nearest route
            if (userLocation) {
                const nearest = await getNearestRoute(userLocation.latitude, userLocation.longitude);
                setNearestRoute(nearest);
            } else if (routesData.length > 0) {
                // Default to first route if no location
                setNearestRoute(routesData[0]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'No se pudieron cargar las rutas. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadBusinessesForRoute = async (routeId: string) => {
        try {
            const nearby = await getBusinessesNearRoute(routeId, 1000);
            setNearbyBusinesses(nearby);
        } catch (error) {
            console.error('Error loading businesses for route:', error);
        }
    };

    // Filter routes based on active filters
    const getFilteredRoutes = useCallback(() => {
        let filtered = routes;

        // Filter by difficulty
        if (difficultyFilter !== 'all') {
            filtered = filtered.filter(route => route.difficulty === difficultyFilter);
        }

        // Filter by distance
        if (distanceFilter !== 'all') {
            const distanceOption = DISTANCE_OPTIONS.find(opt => opt.id === distanceFilter);
            if (distanceOption) {
                filtered = filtered.filter(
                    route => route.distanceKm >= distanceOption.min && route.distanceKm < distanceOption.max
                );
            }
        }

        // Filter by terrain
        if (terrainFilter !== 'all') {
            filtered = filtered.filter(route => route.terrainType === terrainFilter);
        }

        return filtered;
    }, [routes, difficultyFilter, distanceFilter, terrainFilter]);

    // Count active filters
    const activeFilterCount = [difficultyFilter, distanceFilter, terrainFilter]
        .filter(f => f !== 'all').length;

    // Clear all filters
    const clearFilters = () => {
        setDifficultyFilter('all');
        setDistanceFilter('all');
        setTerrainFilter('all');
    };

    // Get filtered routes
    const filteredRoutes = getFilteredRoutes();

    // Request location permissions on mount
    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permisos de ubicación',
                    'Necesitamos acceso a tu ubicación para mostrarte rutas cercanas.',
                    [{ text: 'Entendido' }]
                );
                return;
            }

            setLocationPermission(true);

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const userCoord = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setUserLocation(userCoord);

            // Animate map to user location
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    ...userCoord,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }, 1000);
            }

            // Find nearest route
            try {
                const nearest = await getNearestRoute(userCoord.latitude, userCoord.longitude);
                if (nearest) {
                    setNearestRoute(nearest);
                }
            } catch (error) {
                console.error('Error finding nearest route:', error);
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const handleSearch = useCallback(async () => {
        if (!searchText.trim()) return;

        try {
            setIsSearching(true);
            const results = await searchRoutes(searchText);
            setRoutes(results);

            if (results.length > 0) {
                // Fit map to show all results
                const coordinates = results.flatMap(r => [r.startPoint, r.endPoint]);
                mapRef.current?.fitToCoordinates(coordinates, {
                    edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
                    animated: true,
                });
            }
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchText]);



    const handleLocatePress = async () => {
        Keyboard.dismiss();

        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 500);
        } else {
            await requestLocationPermission();
        }
    };

    const handleRoutePress = (route: RouteForMap) => {
        setSelectedRoute(route);
        setNearestRoute(route);

        // Fit map to show the route
        if (mapRef.current && route.coordinates.length > 0) {
            mapRef.current.fitToCoordinates(route.coordinates, {
                edgePadding: { top: 150, right: 50, bottom: 200, left: 50 },
                animated: true,
            });
        }
    };

    const toggleMapType = () => {
        setShowMapTypeModal(true);
    };

    const selectMapType = (type: MapType) => {
        setMapType(type);
        setShowMapTypeModal(false);
    };

    const toggleCard = () => {
        const toValue = isCardVisible ? 1 : 0;
        Animated.spring(cardAnimation, {
            toValue,
            useNativeDriver: true,
            friction: 8,
        }).start();
        setIsCardVisible(!isCardVisible);
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const formatDuration = (minutes: number | null): string => {
        if (!minutes) return '--';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    // Card slide animation
    const cardTranslateY = cardAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, CARD_HEIGHT + 20],
    });

    // Determine which route to show in card
    const cardRoute = selectedRoute || nearestRoute;

    return (
        <View style={styles.container}>
            {/* Map View */}
            {viewMode === 'map' && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                    initialRegion={INITIAL_REGION}
                    showsUserLocation={locationPermission}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    mapType={mapType}
                    onPress={dismissKeyboard}
                >
                    {/* Route Polylines */}
                    {filteredRoutes.map((route) => (
                        <Polyline
                            key={route.id}
                            coordinates={route.coordinates}
                            strokeColor={selectedRoute?.id === route.id ? brand.primary : '#3B82F6'}
                            strokeWidth={selectedRoute?.id === route.id ? 5 : 3}
                            tappable
                            onPress={() => handleRoutePress(route)}
                        />
                    ))}

                    {/* Route Start/End Markers */}
                    {filteredRoutes.map((route) => (
                        <React.Fragment key={`markers-${route.id}`}>
                            <Marker
                                coordinate={route.startPoint}
                                title={route.name}
                                description="Punto de inicio"
                                onPress={() => handleRoutePress(route)}
                            >
                                <View style={[styles.routeMarker, styles.startMarker]}>
                                    <Ionicons name="flag" size={14} color={neutral.white} />
                                </View>
                            </Marker>
                            <Marker
                                coordinate={route.endPoint}
                                title={`Fin: ${route.name}`}
                                description="Punto final"
                            >
                                <View style={[styles.routeMarker, styles.endMarker]}>
                                    <Ionicons name="checkmark" size={14} color={neutral.white} />
                                </View>
                            </Marker>
                        </React.Fragment>
                    ))}

                    {/* Business Markers */}
                    {(selectedRoute ? nearbyBusinesses : businesses).map((business) => (
                        <Marker
                            key={business.id}
                            coordinate={business.coordinate}
                            title={business.name}
                            description={business.address}
                        >
                            <View style={styles.businessMarker}>
                                <Ionicons
                                    name={BUSINESS_ICONS[business.type] || 'location'}
                                    size={16}
                                    color={brand.primary}
                                />
                            </View>
                        </Marker>
                    ))}
                </MapView>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <FlatList
                    data={filteredRoutes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    style={[styles.listView, { marginTop: insets.top + 130 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={loadInitialData}
                            tintColor={brand.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyListState}>
                            <Ionicons name="bicycle-outline" size={48} color={neutral.gray400} />
                            <Text style={styles.emptyListText}>No hay rutas disponibles</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.routeListCard}
                            onPress={() => router.push(`/route/${item.id}`)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.routeListImage}>
                                <Ionicons name="bicycle" size={28} color={neutral.gray400} />
                            </View>
                            <View style={styles.routeListInfo}>
                                <Text style={styles.routeListName} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <View style={styles.routeListStats}>
                                    <Text style={styles.routeListStat}>
                                        {item.distanceKm.toFixed(1)} km
                                    </Text>
                                    <View style={styles.routeListDot} />
                                    <Text style={styles.routeListStat}>
                                        {DIFFICULTY_LABELS[item.difficulty]}
                                    </Text>
                                    <View style={styles.routeListDot} />
                                    <View style={styles.routeListRating}>
                                        <Ionicons name="star" size={12} color="#FBBF24" />
                                        <Text style={styles.routeListStat}>
                                            {item.averageRating.toFixed(1)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.routeListFooter}>
                                    <Text style={[
                                        styles.routeListPrice,
                                        item.isFree && styles.routeListPriceFree
                                    ]}>
                                        {item.isFree ? 'Gratis' : `$${item.price.toFixed(0)} MXN`}
                                    </Text>
                                    {item.creatorName && (
                                        <Text style={styles.routeListCreator} numberOfLines={1}>
                                            por {item.creatorName}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={neutral.gray400} />
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Loading Overlay */}
            {isLoading && viewMode === 'map' && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={brand.primary} />
                    <Text style={styles.loadingText}>Cargando rutas...</Text>
                </View>
            )}

            {/* Search Bar & Filters Overlay */}
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <View style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color={neutral.gray400} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar rutas o cenotes..."
                                placeholderTextColor={neutral.gray400}
                                value={searchText}
                                onChangeText={setSearchText}
                                returnKeyType="search"
                                onSubmitEditing={handleSearch}
                            />
                            {isSearching && (
                                <ActivityIndicator size="small" color={brand.primary} />
                            )}
                            {searchText.length > 0 && !isSearching && (
                                <TouchableOpacity onPress={() => {
                                    setSearchText('');
                                    loadInitialData(); // Reload all routes
                                    dismissKeyboard();
                                }}>
                                    <Ionicons name="close-circle" size={20} color={neutral.gray400} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {/* View Toggle */}
                        <TouchableOpacity
                            style={styles.viewToggleButton}
                            onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                        >
                            <Ionicons
                                name={viewMode === 'map' ? 'list' : 'map'}
                                size={22}
                                color={neutral.gray700}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setShowFilterModal(true)}
                        >
                            <Ionicons name="options-outline" size={22} color={neutral.gray700} />
                            {activeFilterCount > 0 && (
                                <View style={styles.filterBadge}>
                                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Active Filter Chips */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Show active filters as removable chips */}
                        {difficultyFilter !== 'all' && (
                            <TouchableOpacity
                                style={[styles.filterChip, styles.filterChipActive]}
                                onPress={() => setDifficultyFilter('all')}
                            >
                                <Text style={styles.filterChipTextActive}>
                                    {DIFFICULTY_OPTIONS.find(o => o.id === difficultyFilter)?.label}
                                </Text>
                                <Ionicons name="close-circle" size={16} color={neutral.white} />
                            </TouchableOpacity>
                        )}
                        {distanceFilter !== 'all' && (
                            <TouchableOpacity
                                style={[styles.filterChip, styles.filterChipActive]}
                                onPress={() => setDistanceFilter('all')}
                            >
                                <Text style={styles.filterChipTextActive}>
                                    {DISTANCE_OPTIONS.find(o => o.id === distanceFilter)?.label}
                                </Text>
                                <Ionicons name="close-circle" size={16} color={neutral.white} />
                            </TouchableOpacity>
                        )}
                        {terrainFilter !== 'all' && (
                            <TouchableOpacity
                                style={[styles.filterChip, styles.filterChipActive]}
                                onPress={() => setTerrainFilter('all')}
                            >
                                <Text style={styles.filterChipTextActive}>
                                    {TERRAIN_OPTIONS.find(o => o.id === terrainFilter)?.label}
                                </Text>
                                <Ionicons name="close-circle" size={16} color={neutral.white} />
                            </TouchableOpacity>
                        )}
                        {/* Results count chip */}
                        <View style={styles.resultsChip}>
                            <Text style={styles.resultsChipText}>
                                {filteredRoutes.length} {filteredRoutes.length === 1 ? 'ruta' : 'rutas'}
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </TouchableWithoutFeedback>

            {/* Map Controls */}
            <View style={[styles.mapControls, { bottom: CARD_BOTTOM_MARGIN + CARD_HEIGHT + 24 }]}>
                <TouchableOpacity
                    style={[
                        styles.mapControlButton,
                        userLocation && styles.mapControlButtonActive
                    ]}
                    onPress={handleLocatePress}
                >
                    <Ionicons
                        name="locate"
                        size={22}
                        color={userLocation ? brand.primary : neutral.gray700}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.mapControlButton,
                        mapType !== 'standard' && styles.mapControlButtonActive
                    ]}
                    onPress={toggleMapType}
                >
                    <Ionicons
                        name="layers-outline"
                        size={22}
                        color={mapType !== 'standard' ? brand.primary : neutral.gray700}
                    />
                </TouchableOpacity>
            </View>

            {/* Create Route FAB */}
            <TouchableOpacity
                style={[styles.createRouteFab, { bottom: CARD_BOTTOM_MARGIN + CARD_HEIGHT + 24 }]}
                onPress={() => router.push('/create-route')}
            >
                <Ionicons name="add" size={28} color={neutral.white} />
            </TouchableOpacity>

            {/* Toggle Card Button */}
            <Animated.View
                style={[
                    styles.toggleCardButton,
                    {
                        bottom: CARD_BOTTOM_MARGIN + CARD_HEIGHT + 11,
                        transform: [{ translateY: cardTranslateY }],
                    }
                ]}
            >
                <TouchableOpacity onPress={toggleCard} style={styles.toggleCardButtonInner}>
                    <Ionicons
                        name={isCardVisible ? "chevron-down" : "chevron-up"}
                        size={20}
                        color={neutral.gray500}
                    />
                </TouchableOpacity>
            </Animated.View>

            {/* Route Preview Card */}
            <Animated.View
                style={[
                    styles.routeCardContainer,
                    {
                        bottom: CARD_BOTTOM_MARGIN,
                        transform: [{ translateY: cardTranslateY }],
                    }
                ]}
            >
                {cardRoute ? (
                    <View style={styles.routeCard}>
                        <View style={styles.routeImagePlaceholder}>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color={neutral.white} />
                                <Text style={styles.ratingText}>
                                    {cardRoute.averageRating.toFixed(1)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.routeInfo}>
                            <View style={styles.routeTagContainer}>
                                <View style={styles.routeTag} />
                                <Text style={styles.routeTagText}>
                                    {selectedRoute ? 'RUTA SELECCIONADA' : 'RUTA MÁS CERCANA'}
                                </Text>
                            </View>
                            <Text style={styles.routeName} numberOfLines={1}>
                                {cardRoute.name}
                            </Text>
                            <View style={styles.routeDetails}>
                                <View style={styles.routeDetailItem}>
                                    <Ionicons name="map-outline" size={14} color={neutral.gray500} />
                                    <Text style={styles.routeDetailText}>
                                        {cardRoute.distanceKm.toFixed(1)}km
                                    </Text>
                                </View>
                                <View style={styles.routeDetailDot} />
                                <View style={styles.routeDetailItem}>
                                    <Ionicons name="bar-chart-outline" size={14} color={neutral.gray500} />
                                    <Text style={styles.routeDetailText}>
                                        {DIFFICULTY_LABELS[cardRoute.difficulty] || cardRoute.difficulty}
                                    </Text>
                                </View>
                                {!cardRoute.isFree && (
                                    <>
                                        <View style={styles.routeDetailDot} />
                                        <View style={styles.routeDetailItem}>
                                            <Text style={styles.routePriceText}>
                                                ${cardRoute.price.toFixed(0)}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </View>
                            <Text style={styles.routeTime}>
                                ~{formatDuration(cardRoute.estimatedDurationMin)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewRouteButton}
                            onPress={() => router.push(`/route/${cardRoute.id}`)}
                        >
                            <Text style={styles.viewRouteButtonText}>Ver ruta</Text>
                            <Ionicons name="arrow-forward" size={16} color={neutral.white} />
                        </TouchableOpacity>
                    </View>
                ) : !isLoading && (
                    <View style={[styles.routeCard, styles.emptyCard]}>
                        <Ionicons name="bicycle-outline" size={32} color={neutral.gray400} />
                        <Text style={styles.emptyCardText}>
                            No hay rutas disponibles en esta zona
                        </Text>
                    </View>
                )}
            </Animated.View>

            {/* Map Type Selection Modal */}
            <Modal
                visible={showMapTypeModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMapTypeModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowMapTypeModal(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Tipo de mapa</Text>
                                <View style={styles.mapTypeGrid}>
                                    {MAP_TYPE_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.type}
                                            style={[
                                                styles.mapTypeOption,
                                                mapType === option.type && styles.mapTypeOptionActive,
                                            ]}
                                            onPress={() => selectMapType(option.type)}
                                        >
                                            <View style={[
                                                styles.mapTypeIconContainer,
                                                mapType === option.type && styles.mapTypeIconContainerActive,
                                            ]}>
                                                <Ionicons
                                                    name={option.icon}
                                                    size={28}
                                                    color={mapType === option.type ? neutral.white : neutral.gray700}
                                                />
                                            </View>
                                            <Text style={[
                                                styles.mapTypeLabel,
                                                mapType === option.type && styles.mapTypeLabelActive,
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.filterModalContent}>
                                <View style={styles.filterModalHeader}>
                                    <Text style={styles.modalTitle}>Filtros</Text>
                                    {activeFilterCount > 0 && (
                                        <TouchableOpacity onPress={clearFilters}>
                                            <Text style={styles.clearFiltersText}>Limpiar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Difficulty Filter */}
                                <Text style={styles.filterSectionTitle}>Dificultad</Text>
                                <View style={styles.filterOptionsRow}>
                                    {DIFFICULTY_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[
                                                styles.filterOption,
                                                difficultyFilter === option.id && styles.filterOptionActive,
                                            ]}
                                            onPress={() => setDifficultyFilter(option.id)}
                                        >
                                            <Text style={[
                                                styles.filterOptionText,
                                                difficultyFilter === option.id && styles.filterOptionTextActive,
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Distance Filter */}
                                <Text style={styles.filterSectionTitle}>Distancia</Text>
                                <View style={styles.filterOptionsRow}>
                                    {DISTANCE_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[
                                                styles.filterOption,
                                                distanceFilter === option.id && styles.filterOptionActive,
                                            ]}
                                            onPress={() => setDistanceFilter(option.id)}
                                        >
                                            <Text style={[
                                                styles.filterOptionText,
                                                distanceFilter === option.id && styles.filterOptionTextActive,
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Terrain Filter */}
                                <Text style={styles.filterSectionTitle}>Tipo de Terreno</Text>
                                <View style={styles.filterOptionsRow}>
                                    {TERRAIN_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[
                                                styles.filterOption,
                                                terrainFilter === option.id && styles.filterOptionActive,
                                            ]}
                                            onPress={() => setTerrainFilter(option.id)}
                                        >
                                            <Text style={[
                                                styles.filterOptionText,
                                                terrainFilter === option.id && styles.filterOptionTextActive,
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Results count */}
                                <Text style={styles.filterResultsText}>
                                    {filteredRoutes.length} {filteredRoutes.length === 1 ? 'ruta' : 'rutas'} encontradas
                                </Text>

                                {/* Apply button */}
                                <TouchableOpacity
                                    style={styles.applyFiltersButton}
                                    onPress={() => setShowFilterModal(false)}
                                >
                                    <Text style={styles.applyFiltersButtonText}>Aplicar Filtros</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: neutral.white,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: neutral.gray500,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: neutral.gray800,
    },
    filterButton: {
        width: 48,
        height: 48,
        backgroundColor: neutral.white,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    viewToggleButton: {
        width: 48,
        height: 48,
        backgroundColor: neutral.white,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    filterBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: neutral.white,
    },
    // Filter Modal Styles
    filterModalContent: {
        backgroundColor: neutral.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        marginTop: 'auto',
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    clearFiltersText: {
        fontSize: 14,
        color: brand.primary,
        fontWeight: '600',
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: neutral.gray700,
        marginBottom: 12,
        marginTop: 16,
    },
    filterOptionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: neutral.gray100,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterOptionActive: {
        backgroundColor: `${brand.primary}15`,
        borderColor: brand.primary,
    },
    filterOptionText: {
        fontSize: 14,
        color: neutral.gray700,
    },
    filterOptionTextActive: {
        color: brand.primary,
        fontWeight: '600',
    },
    filterResultsText: {
        marginTop: 24,
        fontSize: 14,
        color: neutral.gray500,
        textAlign: 'center',
    },
    applyFiltersButton: {
        backgroundColor: brand.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    applyFiltersButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: neutral.white,
    },
    // List View Styles
    listView: {
        flex: 1,
        backgroundColor: neutral.gray50,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyListState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyListText: {
        marginTop: 12,
        fontSize: 16,
        color: neutral.gray500,
    },
    routeListCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.white,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    routeListImage: {
        width: 64,
        height: 64,
        backgroundColor: neutral.gray100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeListInfo: {
        flex: 1,
        marginLeft: 12,
    },
    routeListName: {
        fontSize: 16,
        fontWeight: '600',
        color: neutral.gray800,
        marginBottom: 4,
    },
    routeListStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    routeListStat: {
        fontSize: 13,
        color: neutral.gray500,
    },
    routeListDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: neutral.gray400,
        marginHorizontal: 6,
    },
    routeListRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    routeListFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    routeListPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: brand.primary,
    },
    routeListPriceFree: {
        color: '#22C55E',
    },
    routeListCreator: {
        fontSize: 12,
        color: neutral.gray400,
        maxWidth: 120,
    },
    filtersContainer: {
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: brand.primary,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: neutral.gray700,
    },
    filterChipTextActive: {
        color: neutral.white,
    },
    resultsChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: neutral.gray100,
    },
    resultsChipText: {
        fontSize: 13,
        color: neutral.gray500,
    },
    mapControls: {
        position: 'absolute',
        right: 16,
        gap: 8,
    },
    mapControlButton: {
        width: 44,
        height: 44,
        backgroundColor: neutral.white,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    mapControlButtonActive: {
        borderWidth: 2,
        borderColor: brand.primary,
    },
    createRouteFab: {
        position: 'absolute',
        left: 16,
        width: 56,
        height: 56,
        backgroundColor: brand.primary,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    toggleCardButton: {
        position: 'absolute',
        alignSelf: 'center',
        left: '50%',
        marginLeft: -20,
    },
    toggleCardButtonInner: {
        width: 40,
        height: 24,
        backgroundColor: neutral.white,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    routeCardContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
    },
    routeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.white,
        borderRadius: 16,
        padding: 12,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    emptyCard: {
        flexDirection: 'column',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    emptyCardText: {
        fontSize: 14,
        color: neutral.gray500,
        textAlign: 'center',
    },
    routeImagePlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: neutral.gray200,
        borderRadius: 12,
        overflow: 'hidden',
    },
    ratingBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    ratingText: {
        color: neutral.white,
        fontSize: 11,
        fontWeight: '600',
    },
    routeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    routeTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    routeTag: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: brand.primary,
    },
    routeTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: brand.primary,
        letterSpacing: 0.5,
    },
    routeName: {
        fontSize: 15,
        fontWeight: '600',
        color: neutral.gray800,
        marginBottom: 4,
    },
    routeDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    routeDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    routeDetailText: {
        fontSize: 12,
        color: neutral.gray500,
    },
    routeDetailDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: neutral.gray400,
    },
    routePriceText: {
        fontSize: 12,
        fontWeight: '600',
        color: brand.primary,
    },
    routeTime: {
        fontSize: 12,
        color: neutral.gray500,
        marginTop: 4,
    },
    viewRouteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: brand.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 4,
    },
    viewRouteButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: neutral.white,
    },
    // Markers
    routeMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: neutral.white,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    startMarker: {
        backgroundColor: '#22C55E', // Green
    },
    endMarker: {
        backgroundColor: '#EF4444', // Red
    },
    businessMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: brand.primary,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        paddingBottom: 40,
    },
    modalContent: {
        backgroundColor: neutral.white,
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: neutral.gray800,
        marginBottom: 20,
        textAlign: 'center',
    },
    mapTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    mapTypeOption: {
        width: '47%',
        backgroundColor: neutral.white,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: neutral.gray200,
    },
    mapTypeOptionActive: {
        borderColor: brand.primary,
        backgroundColor: `${brand.primary}10`,
    },
    mapTypeIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: neutral.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    mapTypeIconContainerActive: {
        backgroundColor: brand.primary,
    },
    mapTypeLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: neutral.gray700,
    },
    mapTypeLabelActive: {
        color: brand.primary,
        fontWeight: '600',
    },
});
