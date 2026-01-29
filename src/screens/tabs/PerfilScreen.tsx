import { accent, brand, neutral, radius, semantic, shadows } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import {
  getMyProfile,
  getMyStats,
  getUserBadge,
  UserProfile,
  UserStats,
} from "@/services/profile";
import { formatCurrency, formatNumber } from "@/utils/format";
import { getLocationEnabled, setLocationEnabled as saveLocationEnabled } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function PerfilScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const [profileData, statsData, locationPref] = await Promise.all([
        getMyProfile(),
        getMyStats(),
        getLocationEnabled(),
      ]);
      setProfile(profileData);
      setStats(statsData);
      setIsLocationEnabled(locationPref);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProfile();
  };

  const handleLocationToggle = async (value: boolean) => {
    setIsLocationEnabled(value);
    await saveLocationEnabled(value);
  };

  const handleLocationHistory = () => {
    Alert.alert(
      "Historial de Ubicación",
      "Esta función te permitirá gestionar tu historial de ubicaciones compartidas.",
      [
        {
          text: "Entendido",
          style: "default",
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Error", "No se pudo cerrar sesión. Intenta de nuevo.");
          }
        },
      },
    ]);
  };

  const badge = stats
    ? getUserBadge(stats)
    : { label: "CICLISTA", icon: "bicycle" };
  const displayName =
    profile?.fullName || user?.email?.split("@")[0] || "Usuario";

  // Use fallback avatar if error or no custom avatar
  const avatarUrl = avatarError || !profile?.avatarUrl
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D9488&color=fff&size=200`
    : profile.avatarUrl;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push("/edit-profile")}
          accessibilityLabel="Abrir configuración"
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={24} color={neutral.graphite} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={brand.primary}
          />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[brand.primary, brand.gradient.end]}
              style={styles.avatarGradient}
            >
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                onError={() => setAvatarError(true)}
              />
            </LinearGradient>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => router.push("/edit-profile")}
              accessibilityLabel="Cambiar foto de perfil"
              accessibilityRole="button"
            >
              <Ionicons name="camera" size={16} color={neutral.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <View style={styles.userBadge}>
            <Ionicons
              name={badge.icon as any}
              size={16}
              color={brand.primary}
            />
            <Text style={styles.userBadgeText}>{badge.label}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View
            style={styles.statCard}
            accessibilityLabel={`${stats?.totalRoutes || 0} rutas completadas`}
            accessibilityRole="text"
          >
            <View style={[styles.statIconContainer, { backgroundColor: accent.coralTint }]}>
              <Ionicons name="map" size={20} color={accent.coral} />
            </View>
            <Text style={styles.statValue}>{formatNumber(stats?.totalRoutes || 0)}</Text>
            <Text style={styles.statLabel}>Rutas</Text>
          </View>
          <View
            style={styles.statCard}
            accessibilityLabel={`${stats?.totalKilometers || 0} kilómetros recorridos`}
            accessibilityRole="text"
          >
            <View style={[styles.statIconContainer, { backgroundColor: brand.primaryTint }]}>
              <Ionicons name="bicycle" size={20} color={brand.primary} />
            </View>
            <Text style={styles.statValue}>{formatNumber(stats?.totalKilometers || 0)}</Text>
            <Text style={styles.statLabel}>Kilómetros</Text>
          </View>
          <View
            style={styles.statCard}
            accessibilityLabel={`${stats?.totalOrders || 0} pedidos realizados`}
            accessibilityRole="text"
          >
            <View style={[styles.statIconContainer, { backgroundColor: accent.amberTint }]}>
              <Ionicons name="bag-handle" size={20} color={accent.amber} />
            </View>
            <Text style={styles.statValue}>{formatNumber(stats?.totalOrders || 0)}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
        </View>

        {/* Menu Info */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/orders")}
            activeOpacity={0.7}
            accessibilityLabel="Ver mis pedidos"
            accessibilityRole="button"
            accessibilityHint="Abre la pantalla de pedidos realizados"
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="bag-handle" size={20} color={neutral.graphite} />
            </View>
            <Text style={styles.menuText}>Mis Pedidos</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={neutral.steel}
            />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/saved-routes")}
            activeOpacity={0.7}
            accessibilityLabel={`Mis rutas guardadas, ${stats?.savedRoutes || 0} rutas`}
            accessibilityRole="button"
            accessibilityHint="Abre la pantalla de rutas guardadas"
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="heart" size={20} color={neutral.graphite} />
            </View>
            <Text style={styles.menuText}>Mis Rutas Guardadas</Text>
            {stats && stats.savedRoutes > 0 && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{stats.savedRoutes}</Text>
              </View>
            )}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={neutral.steel}
            />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                "Próximamente",
                "Los métodos de pago estarán disponibles pronto",
              )
            }
            activeOpacity={0.7}
            accessibilityLabel={`Wallet, saldo actual ${formatCurrency(profile?.walletBalance || 0)}`}
            accessibilityRole="button"
            accessibilityHint="Gestiona tu saldo y métodos de pago"
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="wallet" size={20} color={neutral.graphite} />
            </View>
            <Text style={styles.menuText}>Wallet</Text>
            <Text style={styles.walletBalance}>
              {formatCurrency(profile?.walletBalance || 0)}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={neutral.steel}
            />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <Text style={styles.sectionHeader}>SEGURIDAD Y PRIVACIDAD</Text>

        <View style={styles.securityContainer}>
          <View style={styles.securityRow}>
            <View style={[styles.securityIconBox, { backgroundColor: accent.skyTint }]}>
              <Ionicons name="locate" size={22} color={accent.sky} />
            </View>
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Ubicación en tiempo real</Text>
              <Text style={styles.securitySubtitle}>
                Visible para amigos en ruta
              </Text>
            </View>
            <Switch
              value={isLocationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: neutral.silver, true: brand.primaryLight }}
              thumbColor={neutral.white}
              ios_backgroundColor={neutral.silver}
              accessibilityLabel="Compartir ubicación en tiempo real"
              accessibilityRole="switch"
              accessibilityState={{ checked: isLocationEnabled }}
            />
          </View>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={handleLocationHistory}
            activeOpacity={0.7}
            accessibilityLabel="Gestionar historial de ubicación"
            accessibilityRole="button"
            accessibilityHint="Abre las opciones para gestionar tu historial de ubicaciones"
          >
            <Ionicons name="time-outline" size={20} color={neutral.graphite} />
            <Text style={styles.historyButtonText}>
              Gestionar Historial de Ubicación
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
          accessibilityHint="Cierra tu sesión actual"
        >
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Bottom spacing to prevent tab bar overlap */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: neutral.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: neutral.snow,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: neutral.white,
  },
  headerSpacer: {
    width: 40,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: neutral.charcoal,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGradient: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: neutral.white,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: brand.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: neutral.white,
    ...shadows.small,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: neutral.charcoal,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: brand.primaryTint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    gap: 6,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: brand.primary,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: neutral.white,
    borderRadius: radius.xl,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    ...shadows.medium,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: neutral.charcoal,
  },
  statLabel: {
    fontSize: 12,
    color: neutral.slate,
    marginTop: 4,
    fontWeight: "500",
  },
  menuContainer: {
    backgroundColor: neutral.white,
    borderRadius: radius.xxl,
    padding: 8,
    marginBottom: 24,
    ...shadows.medium,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    backgroundColor: neutral.pearl,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: neutral.charcoal,
  },
  separator: {
    height: 1,
    backgroundColor: neutral.pearl,
    marginLeft: 40 + 14 + 16, // menuIconBox width + marginRight + menuItem paddingLeft
  },
  menuBadge: {
    backgroundColor: brand.primary,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: neutral.white,
  },
  walletBalance: {
    fontSize: 15,
    fontWeight: "700",
    color: brand.primary,
    marginRight: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: neutral.slate,
    marginBottom: 12,
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  securityContainer: {
    backgroundColor: neutral.white,
    borderRadius: radius.xxl,
    padding: 20,
    marginBottom: 28,
    ...shadows.medium,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  securityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: neutral.charcoal,
  },
  securitySubtitle: {
    fontSize: 13,
    color: neutral.slate,
    marginTop: 2,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: neutral.silver,
    gap: 8,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.graphite,
  },
  logoutButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: semantic.error,
  },
});
