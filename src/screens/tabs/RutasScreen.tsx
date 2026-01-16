/**
 * Mis Rutas Screen
 * Shows user's purchased, created, and saved routes
 */

import { brand, neutral, semantic } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
    getMyCreatedRoutes,
    getMyPurchasedRoutes,
    getMySavedRoutes,
    UserRoute,
} from '@/services/userRoutes';
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
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type TabType = 'purchased' | 'created' | 'saved';

const TABS: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'purchased', label: 'Compradas', icon: 'cart' },
    { key: 'created', label: 'Creadas', icon: 'create' },
    { key: 'saved', label: 'Guardadas', icon: 'heart' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
    facil: '#22C55E',
    moderada: '#F59E0B',
    dificil: '#EF4444',
    experto: '#7C3AED',
};

const DIFFICULTY_LABELS: Record<string, string> = {
    facil: 'Fácil',
    moderada: 'Media',
    dificil: 'Difícil',
    experto: 'Experto',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    borrador: { label: 'Borrador', color: neutral.gray500 },
    en_revision: { label: 'En revisión', color: '#F59E0B' },
    publicado: { label: 'Publicado', color: semantic.success },
    rechazado: { label: 'Rechazado', color: semantic.error },
    archivado: { label: 'Archivado', color: neutral.gray400 },
};

export function RutasScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('purchased');
    const [purchasedRoutes, setPurchasedRoutes] = useState<UserRoute[]>([]);
    const [createdRoutes, setCreatedRoutes] = useState<UserRoute[]>([]);
    const [savedRoutes, setSavedRoutes] = useState<UserRoute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadRoutes = useCallback(async () => {
        try {
            const [purchased, created, saved] = await Promise.all([
                getMyPurchasedRoutes(),
                getMyCreatedRoutes(),
                getMySavedRoutes(),
            ]);
            setPurchasedRoutes(purchased);
            setCreatedRoutes(created);
            setSavedRoutes(saved);
        } catch (error) {
            console.error('Error loading routes:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Reload when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            loadRoutes();
        }, [loadRoutes])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadRoutes();
    };

    const getActiveRoutes = (): UserRoute[] => {
        switch (activeTab) {
            case 'purchased':
                return purchasedRoutes;
            case 'created':
                return createdRoutes;
            case 'saved':
                return savedRoutes;
            default:
                return [];
        }
    };

    const formatDuration = (minutes: number | null): string => {
        if (!minutes) return '--';
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const renderRouteCard = ({ item }: { item: UserRoute }) => {
        const difficultyColor = DIFFICULTY_COLORS[item.difficulty] || neutral.gray500;
        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.borrador;

        return (
            <TouchableOpacity
                style={styles.routeCard}
                onPress={() => router.push(`/route/${item.id}`)}
                activeOpacity={0.7}
            >
                {/* Image placeholder */}
                <View style={styles.routeImage}>
                    <Ionicons name="bicycle" size={32} color={neutral.gray400} />
                    {/* Status badge for created routes */}
                    {activeTab === 'created' && (
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                            <Text style={styles.statusText}>{statusConfig.label}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.routeInfo}>
                    <Text style={styles.routeName} numberOfLines={1}>
                        {item.name}
                    </Text>

                    <View style={styles.routeStats}>
                        <View style={styles.statItem}>
                            <Ionicons name="map-outline" size={14} color={neutral.gray500} />
                            <Text style={styles.statText}>{item.distanceKm.toFixed(1)} km</Text>
                        </View>
                        <View style={styles.statDot} />
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={14} color={neutral.gray500} />
                            <Text style={styles.statText}>{formatDuration(item.estimatedDurationMin)}</Text>
                        </View>
                    </View>

                    <View style={styles.routeFooter}>
                        <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20` }]}>
                            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                                {DIFFICULTY_LABELS[item.difficulty]}
                            </Text>
                        </View>

                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text style={styles.ratingText}>
                                {item.averageRating.toFixed(1)}
                            </Text>
                            <Text style={styles.reviewsText}>
                                ({item.totalReviews})
                            </Text>
                        </View>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={neutral.gray400} />
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => {
        const emptyConfig = {
            purchased: {
                icon: 'cart-outline' as const,
                title: 'No tienes rutas compradas',
                subtitle: 'Explora el marketplace y encuentra tu próxima aventura',
                buttonText: 'Explorar Rutas',
                onPress: () => router.push('/(tabs)'),
            },
            created: {
                icon: 'create-outline' as const,
                title: 'No has creado rutas aún',
                subtitle: 'Comparte tus rutas favoritas con otros ciclistas',
                buttonText: 'Crear Ruta',
                onPress: () => router.push('/create-route'),
            },
            saved: {
                icon: 'heart-outline' as const,
                title: 'No tienes rutas guardadas',
                subtitle: 'Guarda rutas para verlas después',
                buttonText: 'Explorar Rutas',
                onPress: () => router.push('/(tabs)'),
            },
        };

        const config = emptyConfig[activeTab];

        return (
            <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                    <Ionicons name={config.icon} size={48} color={neutral.gray400} />
                </View>
                <Text style={styles.emptyTitle}>{config.title}</Text>
                <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={config.onPress}>
                    <Text style={styles.emptyButtonText}>{config.buttonText}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{purchasedRoutes.length}</Text>
                <Text style={styles.statCardLabel}>Compradas</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{createdRoutes.length}</Text>
                <Text style={styles.statCardLabel}>Creadas</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{savedRoutes.length}</Text>
                <Text style={styles.statCardLabel}>Guardadas</Text>
            </View>
        </View>
    );

    const routes = getActiveRoutes();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Rutas</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push('/create-route')}
                >
                    <Ionicons name="add" size={24} color={brand.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons
                            name={tab.icon}
                            size={18}
                            color={activeTab === tab.key ? brand.primary : neutral.gray500}
                        />
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.key && styles.activeTabText,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={brand.primary} />
                </View>
            ) : (
                <FlatList
                    data={routes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRouteCard}
                    contentContainerStyle={[
                        styles.listContent,
                        routes.length === 0 && styles.emptyListContent,
                    ]}
                    ListHeaderComponent={routes.length > 0 ? renderHeader : null}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={brand.primary}
                            colors={[brand.primary]}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: neutral.gray800,
    },
    createButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${brand.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: brand.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: neutral.gray500,
    },
    activeTabText: {
        color: brand.primary,
        fontWeight: '600',
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
    // Stats header
    statsContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: neutral.gray50,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    statCardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: neutral.gray800,
    },
    statCardLabel: {
        fontSize: 12,
        color: neutral.gray500,
        marginTop: 2,
    },
    // Route card
    routeCard: {
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
    routeImage: {
        width: 72,
        height: 72,
        backgroundColor: neutral.gray100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '600',
        color: neutral.white,
    },
    routeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    routeName: {
        fontSize: 16,
        fontWeight: '600',
        color: neutral.gray800,
        marginBottom: 4,
    },
    routeStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 13,
        color: neutral.gray500,
    },
    statDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: neutral.gray400,
        marginHorizontal: 8,
    },
    routeFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    difficultyText: {
        fontSize: 11,
        fontWeight: '600',
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
    reviewsText: {
        fontSize: 12,
        color: neutral.gray500,
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
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: neutral.gray500,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyButton: {
        backgroundColor: brand.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: neutral.white,
    },
});
