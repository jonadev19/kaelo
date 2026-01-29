/**
 * Mis Rutas Screen
 * Shows user's purchased, created, and saved routes
 */

import { accent, brand, neutral, radius, semantic, shadows } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
    getMyCreatedRoutes,
    getMyPurchasedRoutes,
    getMySavedRoutes,
    UserRoute,
} from '@/services/userRoutes';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    facil: accent.emerald,
    moderada: accent.amber,
    dificil: accent.coral,
    experto: accent.violet,
};

const DIFFICULTY_LABELS: Record<string, string> = {
    facil: 'Fácil',
    moderada: 'Media',
    dificil: 'Difícil',
    experto: 'Experto',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    borrador: { label: 'Borrador', color: neutral.slate },
    en_revision: { label: 'En revisión', color: accent.amber },
    publicado: { label: 'Publicado', color: semantic.success },
    rechazado: { label: 'Rechazado', color: semantic.error },
    archivado: { label: 'Archivado', color: neutral.steel },
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
        const difficultyColor = DIFFICULTY_COLORS[item.difficulty] || neutral.slate;
        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.borrador;

        return (
            <TouchableOpacity
                style={styles.routeCard}
                onPress={() => router.push(`/route/${item.id}`)}
                activeOpacity={0.7}
            >
                {/* Image placeholder with gradient */}
                <View style={styles.routeImage}>
                    <LinearGradient
                        colors={[`${difficultyColor}20`, `${difficultyColor}05`]}
                        style={styles.routeImageGradient}
                    >
                        <Ionicons name="bicycle" size={28} color={difficultyColor} />
                    </LinearGradient>
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
                            <Ionicons name="map-outline" size={14} color={neutral.slate} />
                            <Text style={styles.statText}>{item.distanceKm.toFixed(1)} km</Text>
                        </View>
                        <View style={styles.statDot} />
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={14} color={neutral.slate} />
                            <Text style={styles.statText}>{formatDuration(item.estimatedDurationMin)}</Text>
                        </View>
                    </View>

                    <View style={styles.routeFooter}>
                        <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}15` }]}>
                            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                                {DIFFICULTY_LABELS[item.difficulty]}
                            </Text>
                        </View>

                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color={accent.amber} />
                            <Text style={styles.ratingText}>
                                {item.averageRating.toFixed(1)}
                            </Text>
                            <Text style={styles.reviewsText}>
                                ({item.totalReviews})
                            </Text>
                        </View>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={neutral.steel} />
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
                    <Ionicons name={config.icon} size={48} color={neutral.steel} />
                </View>
                <Text style={styles.emptyTitle}>{config.title}</Text>
                <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={config.onPress} activeOpacity={0.9}>
                    <LinearGradient
                        colors={[brand.primary, brand.gradient.end]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.emptyButtonGradient}
                    >
                        <Text style={styles.emptyButtonText}>{config.buttonText}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: accent.coralTint }]}>
                <Text style={[styles.statCardValue, { color: accent.coral }]}>{purchasedRoutes.length}</Text>
                <Text style={styles.statCardLabel}>Compradas</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: brand.primaryTint }]}>
                <Text style={[styles.statCardValue, { color: brand.primary }]}>{createdRoutes.length}</Text>
                <Text style={styles.statCardLabel}>Creadas</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: accent.violetTint }]}>
                <Text style={[styles.statCardValue, { color: accent.violet }]}>{savedRoutes.length}</Text>
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
                    <LinearGradient
                        colors={[brand.primary, brand.gradient.end]}
                        style={styles.createButtonGradient}
                    >
                        <Ionicons name="add" size={22} color={neutral.white} />
                    </LinearGradient>
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
                            color={activeTab === tab.key ? brand.primary : neutral.slate}
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
        backgroundColor: neutral.snow,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: neutral.white,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: neutral.charcoal,
        letterSpacing: -0.5,
    },
    createButton: {
        borderRadius: radius.full,
        overflow: 'hidden',
        ...shadows.small,
    },
    createButtonGradient: {
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        backgroundColor: neutral.white,
        borderBottomWidth: 1,
        borderBottomColor: neutral.silver,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: brand.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: neutral.slate,
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
        gap: 10,
    },
    statCard: {
        flex: 1,
        borderRadius: radius.lg,
        padding: 14,
        alignItems: 'center',
    },
    statCardValue: {
        fontSize: 26,
        fontWeight: '700',
    },
    statCardLabel: {
        fontSize: 12,
        color: neutral.slate,
        marginTop: 2,
        fontWeight: '500',
    },
    // Route card
    routeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.white,
        borderRadius: radius.xl,
        padding: 14,
        marginBottom: 12,
        ...shadows.medium,
    },
    routeImage: {
        width: 72,
        height: 72,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    routeImageGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        color: neutral.white,
    },
    routeInfo: {
        flex: 1,
        marginLeft: 14,
    },
    routeName: {
        fontSize: 16,
        fontWeight: '600',
        color: neutral.charcoal,
        marginBottom: 6,
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
        color: neutral.slate,
        fontWeight: '500',
    },
    statDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: neutral.mist,
        marginHorizontal: 10,
    },
    routeFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    difficultyText: {
        fontSize: 11,
        fontWeight: '700',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: neutral.charcoal,
    },
    reviewsText: {
        fontSize: 12,
        color: neutral.slate,
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
        fontSize: 18,
        fontWeight: '600',
        color: neutral.charcoal,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: neutral.slate,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 20,
    },
    emptyButton: {
        borderRadius: radius.full,
        overflow: 'hidden',
        ...shadows.colored(brand.primary),
    },
    emptyButtonGradient: {
        paddingHorizontal: 28,
        paddingVertical: 14,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: neutral.white,
    },
});
