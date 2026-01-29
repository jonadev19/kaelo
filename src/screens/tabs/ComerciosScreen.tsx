/**
 * Comercios Screen
 * Shows list of businesses near cycling routes
 */

import { accent, accessibleText, brand, neutral, radius, shadows, typography } from '@/constants/Colors';
import {
    BUSINESS_TYPE_ICONS,
    BUSINESS_TYPE_LABELS,
    BusinessDetail,
    getAllBusinesses,
    getBusinessesByType,
    searchBusinesses,
} from '@/services/businesses';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Business type filters with colors
const BUSINESS_TYPES = [
    { id: 'all', label: 'Todos', icon: 'grid-outline', color: brand.primary },
    { id: 'restaurante', label: 'Restaurantes', icon: 'restaurant', color: accent.coral },
    { id: 'cafeteria', label: 'Cafeterías', icon: 'cafe', color: accent.violet },
    { id: 'tienda', label: 'Tiendas', icon: 'storefront', color: accent.sky },
    { id: 'taller_bicicletas', label: 'Talleres', icon: 'build', color: neutral.graphite },
    { id: 'hospedaje', label: 'Hospedaje', icon: 'bed', color: accent.emerald },
];

// Debounce timeout in ms
const SEARCH_DEBOUNCE_MS = 300;

export function ComerciosScreen() {
    const router = useRouter();

    const [businesses, setBusinesses] = useState<BusinessDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeType, setActiveType] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Debounce ref
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Optimized stats calculation
    const stats = useMemo(() => {
        const count = businesses.length;
        const avgRating = count > 0
            ? businesses.reduce((acc, b) => acc + b.averageRating, 0) / count
            : 0;
        return { count, avgRating };
    }, [businesses]);

    const loadBusinesses = useCallback(async (type: string = 'all') => {
        try {
            let data: BusinessDetail[];
            if (type === 'all') {
                data = await getAllBusinesses();
            } else {
                data = await getBusinessesByType(type);
            }
            setBusinesses(data);
        } catch (error) {
            console.error('Error loading businesses:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Load on focus
    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            loadBusinesses(activeType);
        }, [loadBusinesses, activeType])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        setHasSearched(false);
        loadBusinesses(activeType);
    };

    // Debounced search handler
    const handleSearchChange = useCallback((text: string) => {
        setSearchText(text);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!text.trim()) {
            setHasSearched(false);
            loadBusinesses(activeType);
            return;
        }

        // Set debounced search
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                setIsSearching(true);
                const results = await searchBusinesses(text.trim());
                setBusinesses(results);
                setHasSearched(true);
            } catch (error) {
                console.error('Error searching businesses:', error);
            } finally {
                setIsSearching(false);
            }
        }, SEARCH_DEBOUNCE_MS);
    }, [activeType, loadBusinesses]);

    const handleSearch = async () => {
        if (!searchText.trim()) {
            setHasSearched(false);
            loadBusinesses(activeType);
            return;
        }

        try {
            setIsSearching(true);
            const results = await searchBusinesses(searchText.trim());
            setBusinesses(results);
            setHasSearched(true);
        } catch (error) {
            console.error('Error searching businesses:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleTypeChange = (type: string) => {
        setActiveType(type);
        setSearchText('');
        setIsLoading(true);
        loadBusinesses(type);
    };

    const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
        return (BUSINESS_TYPE_ICONS[type] || 'storefront') as keyof typeof Ionicons.glyphMap;
    };

    const getTypeColor = (type: string): string => {
        const typeObj = BUSINESS_TYPES.find(t => t.id === type);
        return typeObj?.color || brand.primary;
    };

    const renderBusinessCard = ({ item }: { item: BusinessDetail }) => {
        const typeColor = getTypeColor(item.type);

        return (
            <TouchableOpacity
                style={styles.businessCard}
                onPress={() => router.push(`/business/${item.id}`)}
                activeOpacity={0.7}
            >
                {/* Image placeholder with colored icon */}
                <View style={[styles.businessImage, { backgroundColor: `${typeColor}15` }]}>
                    <Ionicons
                        name={getTypeIcon(item.type)}
                        size={28}
                        color={typeColor}
                    />
                </View>

                <View style={styles.businessInfo}>
                    <View style={styles.businessHeader}>
                        <Text style={styles.businessName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color={accent.amber} />
                            <Text style={styles.ratingText}>
                                {item.averageRating.toFixed(1)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.businessMeta}>
                        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
                            <Text style={[styles.typeText, { color: typeColor }]}>
                                {BUSINESS_TYPE_LABELS[item.type] || item.type}
                            </Text>
                        </View>
                        {item.totalReviews > 0 && (
                            <Text style={styles.reviewsText}>
                                ({item.totalReviews} reseñas)
                            </Text>
                        )}
                    </View>

                    {item.address && (
                        <View style={styles.addressRow}>
                            <Ionicons name="location-outline" size={14} color={neutral.steel} />
                            <Text style={styles.addressText} numberOfLines={1}>
                                {item.address}
                            </Text>
                        </View>
                    )}

                    {item.description && (
                        <Text style={styles.descriptionText} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}
                </View>

                <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={20} color={brand.primary} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="storefront-outline" size={48} color={neutral.steel} />
            </View>
            <Text style={styles.emptyTitle}>No hay comercios</Text>
            <Text style={styles.emptySubtitle}>
                {searchText
                    ? 'No encontramos comercios con ese nombre'
                    : 'No hay comercios disponibles en esta categoría'
                }
            </Text>
        </View>
    );

    const renderHeader = () => (
        <View>
            {/* Search Results Feedback */}
            {hasSearched && (
                <View style={styles.searchFeedback}>
                    <Text style={styles.searchFeedbackText}>
                        {stats.count} resultado{stats.count !== 1 ? 's' : ''} para "{searchText}"
                    </Text>
                    <TouchableOpacity onPress={() => {
                        setSearchText('');
                        setHasSearched(false);
                        loadBusinesses(activeType);
                    }}>
                        <Text style={styles.clearSearchText}>Limpiar</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="storefront" size={24} color={brand.primary} />
                    <Text style={styles.statValue}>{stats.count}</Text>
                    <Text style={styles.statLabel}>Comercios</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="star" size={24} color={accent.amber} />
                    <Text style={styles.statValue}>
                        {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                    </Text>
                    <Text style={styles.statLabel}>Rating Promedio</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Comercios</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, isSearching && styles.searchBarActive]}>
                    <Ionicons
                        name="search"
                        size={20}
                        color={isSearching ? brand.primary : neutral.steel}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar comercios..."
                        placeholderTextColor={accessibleText.placeholder}
                        value={searchText}
                        onChangeText={handleSearchChange}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                    />
                    {isSearching && (
                        <ActivityIndicator size="small" color={brand.primary} />
                    )}
                    {searchText.length > 0 && !isSearching && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => {
                                setSearchText('');
                                setHasSearched(false);
                                loadBusinesses(activeType);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close-circle" size={20} color={neutral.steel} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Type Filters */}
            <FlatList
                horizontal
                data={BUSINESS_TYPES}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typesContainer}
                renderItem={({ item }) => {
                    const isActive = activeType === item.id;
                    return (
                        <TouchableOpacity
                            style={[
                                styles.typeChip,
                                isActive && [
                                    { backgroundColor: item.color, transform: [{ scale: 1.05 }] },
                                    styles.typeChipActive,
                                    shadows.colored(item.color),
                                ],
                            ]}
                            onPress={() => handleTypeChange(item.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={item.icon as keyof typeof Ionicons.glyphMap}
                                size={18}
                                color={isActive ? neutral.white : item.color}
                            />
                            <Text style={[
                                styles.typeChipText,
                                isActive && styles.typeChipTextActive,
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={brand.primary} />
                </View>
            ) : (
                <FlatList
                    data={businesses}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBusinessCard}
                    contentContainerStyle={[
                        styles.listContent,
                        businesses.length === 0 && styles.emptyListContent,
                    ]}
                    ListHeaderComponent={businesses.length > 0 ? renderHeader : null}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={brand.primary}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: neutral.snow,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: neutral.white,
    },
    headerTitle: {
        fontSize: typography.headingLg,
        fontWeight: '700',
        color: neutral.charcoal,
        letterSpacing: -0.5,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: neutral.white,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.pearl,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: neutral.silver,
    },
    searchBarActive: {
        borderColor: brand.primary,
        backgroundColor: neutral.white,
    },
    clearButton: {
        padding: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: typography.bodyLg,
        color: neutral.charcoal,
    },
    typesContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: neutral.white,
        gap: 8,
    },
    typeChip: {
        transform: [{ scale: 1 }],
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44, // WCAG 2.5.5 touch target
        borderRadius: radius.full,
        backgroundColor: neutral.pearl,
        marginRight: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: neutral.silver,
    },
    typeChipActive: {
        borderColor: 'transparent',
    },
    typeChipText: {
        fontSize: typography.bodySm,
        fontWeight: '600',
        color: neutral.graphite,
    },
    typeChipTextActive: {
        color: neutral.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    emptyListContent: {
        flex: 1,
    },
    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: neutral.white,
        borderRadius: radius.lg,
        padding: 16,
        alignItems: 'center',
        ...shadows.small,
    },
    statValue: {
        fontSize: typography.headingMd,
        fontWeight: '700',
        color: neutral.charcoal,
        marginTop: 8,
    },
    statLabel: {
        fontSize: typography.caption,
        color: neutral.slate,
        marginTop: 4,
        fontWeight: '500',
    },
    // Business card
    businessCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.white,
        borderRadius: radius.xl,
        padding: 14,
        marginBottom: 12,
        ...shadows.medium,
    },
    businessImage: {
        width: 68,
        height: 68,
        borderRadius: radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    businessInfo: {
        flex: 1,
        marginLeft: 14,
    },
    businessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    businessName: {
        flex: 1,
        fontSize: typography.bodyLg,
        fontWeight: '600',
        color: neutral.charcoal,
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: typography.bodySm,
        fontWeight: '700',
        color: neutral.charcoal,
    },
    businessMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    typeText: {
        fontSize: typography.micro,
        fontWeight: '600',
    },
    reviewsText: {
        fontSize: typography.caption,
        color: neutral.slate,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    addressText: {
        flex: 1,
        fontSize: typography.caption,
        color: neutral.slate,
    },
    descriptionText: {
        fontSize: typography.caption,
        color: neutral.slate,
        lineHeight: 16,
    },
    // Empty state
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: neutral.pearl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: typography.headingSm,
        fontWeight: '600',
        color: neutral.charcoal,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: typography.bodySm,
        color: neutral.slate,
        textAlign: 'center',
        lineHeight: 20,
    },
    // Search feedback
    searchFeedback: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 8,
        marginBottom: 12,
        backgroundColor: brand.primaryTint,
        borderRadius: radius.sm,
        paddingLeft: 12,
        paddingRight: 12,
    },
    searchFeedbackText: {
        fontSize: typography.bodySm,
        color: brand.primaryDark,
        fontWeight: '500',
    },
    clearSearchText: {
        fontSize: typography.bodySm,
        color: brand.primary,
        fontWeight: '600',
    },
    // Chevron container
    chevronContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: brand.primaryTint,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
