import { brand, neutral } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Keyboard,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import MapView, { MapType, Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Card positioning
const CARD_BOTTOM_MARGIN = 23;  // pixels above tab bar
const CARD_HEIGHT = 120;

// Yucatan region (Cancún area as default)
const INITIAL_REGION = {
    latitude: 21.1619,
    longitude: -86.8515,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
};

// Filter options
const FILTERS = [
    { id: 'distance', label: 'Distancia', icon: 'swap-vertical' },
    { id: 'difficulty', label: 'Dificultad', icon: 'speedometer' },
    { id: 'bike_type', label: 'Tipo de Bici', icon: 'bicycle' },
];

// Sample markers (will be replaced with real data)
const SAMPLE_MARKERS = [
    { id: 1, latitude: 21.1619, longitude: -86.8515, title: 'Cancún', type: 'city' },
    { id: 2, latitude: 21.0619, longitude: -86.7715, title: 'Ruta Cenotes', type: 'route' },
];

// Map type options
const MAP_TYPE_OPTIONS: { type: MapType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { type: 'standard', label: 'Estándar', icon: 'map-outline' },
    { type: 'satellite', label: 'Satélite', icon: 'earth-outline' },
    { type: 'hybrid', label: 'Híbrido', icon: 'globe-outline' },
    { type: 'terrain', label: 'Terreno', icon: 'trail-sign-outline' },
];

export function ExplorarScreen() {
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const [searchText, setSearchText] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [locationPermission, setLocationPermission] = useState<boolean>(false);
    const [isCardVisible, setIsCardVisible] = useState(true);
    const [mapType, setMapType] = useState<MapType>('standard');
    const [showMapTypeModal, setShowMapTypeModal] = useState(false);
    const cardAnimation = useRef(new Animated.Value(0)).current;

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

            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            // Animate map to user location
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }, 1000);
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const handleFilterPress = (filterId: string) => {
        Keyboard.dismiss();
        setActiveFilter(activeFilter === filterId ? null : filterId);
    };

    const handleLocatePress = async () => {
        Keyboard.dismiss();

        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 500);
        } else {
            // Try to get location again
            await requestLocationPermission();
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

    // Card slide animation
    const cardTranslateY = cardAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, CARD_HEIGHT + 20],
    });

    return (
        <View style={styles.container}>
            {/* Map */}
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
                {SAMPLE_MARKERS.map((marker) => (
                    <Marker
                        key={marker.id}
                        coordinate={{
                            latitude: marker.latitude,
                            longitude: marker.longitude,
                        }}
                        title={marker.title}
                    />
                ))}
            </MapView>

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
                                onSubmitEditing={dismissKeyboard}
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => {
                                    setSearchText('');
                                    dismissKeyboard();
                                }}>
                                    <Ionicons name="close-circle" size={20} color={neutral.gray400} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity style={styles.filterButton} onPress={dismissKeyboard}>
                            <Ionicons name="options-outline" size={22} color={neutral.gray700} />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Chips */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        {FILTERS.map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.filterChip,
                                    activeFilter === filter.id && styles.filterChipActive,
                                ]}
                                onPress={() => handleFilterPress(filter.id)}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        activeFilter === filter.id && styles.filterChipTextActive,
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color={activeFilter === filter.id ? neutral.white : neutral.gray700}
                                />
                            </TouchableOpacity>
                        ))}
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
                <View style={styles.routeCard}>
                    <View style={styles.routeImagePlaceholder}>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color={neutral.white} />
                            <Text style={styles.ratingText}>4.8</Text>
                        </View>
                    </View>
                    <View style={styles.routeInfo}>
                        <View style={styles.routeTagContainer}>
                            <View style={styles.routeTag} />
                            <Text style={styles.routeTagText}>RUTA MÁS CERCANA</Text>
                        </View>
                        <Text style={styles.routeName}>Sendero de los Cenotes</Text>
                        <View style={styles.routeDetails}>
                            <View style={styles.routeDetailItem}>
                                <Ionicons name="map-outline" size={14} color={neutral.gray500} />
                                <Text style={styles.routeDetailText}>12km</Text>
                            </View>
                            <View style={styles.routeDetailDot} />
                            <View style={styles.routeDetailItem}>
                                <Ionicons name="bar-chart-outline" size={14} color={neutral.gray500} />
                                <Text style={styles.routeDetailText}>Media</Text>
                            </View>
                        </View>
                        <Text style={styles.routeTime}>~45 min</Text>
                    </View>
                    <TouchableOpacity style={styles.viewRouteButton}>
                        <Text style={styles.viewRouteButtonText}>Ver ruta</Text>
                        <Ionicons name="arrow-forward" size={16} color={neutral.white} />
                    </TouchableOpacity>
                </View>
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
        backgroundColor: `${brand.primary}10`, // 10% opacity
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
