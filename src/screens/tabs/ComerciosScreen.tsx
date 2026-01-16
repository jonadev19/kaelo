/**
 * Comercios Screen
 * Shows list of businesses near cycling routes
 */

import { brand, neutral } from '@/constants/Colors';
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
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Business type filters
const BUSINESS_TYPES = [
    { id: 'all', label: 'Todos', icon: 'grid-outline' },
    { id: 'restaurante', label: 'Restaurantes', icon: 'restaurant' },
    { id: 'cafeteria', label: 'Cafeterías', icon: 'cafe' },
    { id: 'tienda', label: 'Tiendas', icon: 'storefront' },
    { id: 'taller_bicicletas', label: 'Talleres', icon: 'build' },
    { id: 'hospedaje', label: 'Hospedaje', icon: 'bed' },
];

export function ComerciosScreen() {
    const router = useRouter();

    const [businesses, setBusinesses] = useState<BusinessDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeType, setActiveType] = useState('all');
    const [isSearching, setIsSearching] = useState(false);

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
        loadBusinesses(activeType);
    };

    const handleSearch = async () => {
        if (!searchText.trim()) {
            loadBusinesses(activeType);
            return;
        }

        try {
            setIsSearching(true);
            const results = await searchBusinesses(searchText.trim());
            setBusinesses(results);
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

    const renderBusinessCard = ({ item }: { item: BusinessDetail }) => (
        <TouchableOpacity
            style={styles.businessCard}
            onPress={() => router.push(`/business/${item.id}`)}
            activeOpacity={0.7}
        >
            {/* Image placeholder */}
            <View style={styles.businessImage}>
                <Ionicons
                    name={getTypeIcon(item.type)}
                    size={32}
                    color={brand.primary}
                />
            </View>

            <View style={styles.businessInfo}>
                <View style={styles.businessHeader}>
                    <Text style={styles.businessName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text style={styles.ratingText}>
                            {item.averageRating.toFixed(1)}
                        </Text>
                    </View>
                </View>

                <View style={styles.businessMeta}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>
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
                        <Ionicons name="location-outline" size={14} color={neutral.gray400} />
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

            <Ionicons name="chevron-forward" size={20} color={neutral.gray400} />
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="storefront-outline" size={48} color={neutral.gray400} />
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
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <Ionicons name="storefront" size={24} color={brand.primary} />
                <Text style={styles.statValue}>{businesses.length}</Text>
                <Text style={styles.statLabel}>Comercios</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="star" size={24} color="#FBBF24" />
                <Text style={styles.statValue}>
                    {businesses.length > 0
                        ? (businesses.reduce((acc, b) => acc + b.averageRating, 0) / businesses.length).toFixed(1)
                        : '0'
                    }
                </Text>
                <Text style={styles.statLabel}>Rating Promedio</Text>
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
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={neutral.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar comercios..."
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
                            loadBusinesses(activeType);
                        }}>
                            <Ionicons name="close-circle" size={20} color={neutral.gray400} />
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
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.typeChip,
                            activeType === item.id && styles.typeChipActive,
                        ]}
                        onPress={() => handleTypeChange(item.id)}
                    >
                        <Ionicons
                            name={item.icon as keyof typeof Ionicons.glyphMap}
                            size={18}
                            color={activeType === item.id ? neutral.white : neutral.gray700}
                        />
                        <Text style={[
                            styles.typeChipText,
                            activeType === item.id && styles.typeChipTextActive,
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
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
        backgroundColor: neutral.white,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: neutral.gray800,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.gray100,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: neutral.gray800,
    },
    typesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: neutral.gray100,
        marginRight: 8,
        gap: 6,
    },
    typeChipActive: {
        backgroundColor: brand.primary,
    },
    typeChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: neutral.gray700,
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
        backgroundColor: neutral.gray50,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: neutral.gray800,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: neutral.gray500,
        marginTop: 4,
    },
    // Business card
    businessCard: {
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
    businessImage: {
        width: 72,
        height: 72,
        backgroundColor: `${brand.primary}15`,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    businessInfo: {
        flex: 1,
        marginLeft: 12,
    },
    businessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    businessName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: neutral.gray800,
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600',
        color: neutral.gray800,
    },
    businessMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    typeBadge: {
        backgroundColor: neutral.gray100,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '500',
        color: neutral.gray700,
    },
    reviewsText: {
        fontSize: 12,
        color: neutral.gray500,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    addressText: {
        flex: 1,
        fontSize: 12,
        color: neutral.gray500,
    },
    descriptionText: {
        fontSize: 12,
        color: neutral.gray500,
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
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: neutral.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: neutral.gray800,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: neutral.gray500,
        textAlign: 'center',
        lineHeight: 20,
    },
});
