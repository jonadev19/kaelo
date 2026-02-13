/**
 * MetricsScreen - User statistics and achievements dashboard
 */
import {
  AchievementBadge,
  ActivityItem,
  GoalProgressBar,
  StatsCard,
} from "@/components/metrics";
import { accent, brand, neutral, radius, shadows } from "@/constants/Colors";
import {
  Achievement,
  ActivityItem as ActivityItemType,
  formatCalories,
  formatDistance,
  formatDuration,
  getUserAchievements,
  getUserActivityHistory,
  getUserGoals,
  getUserStats,
  UserGoal,
  UserMetricsStats,
} from "@/services/metrics";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "overview" | "achievements" | "goals" | "history";

const TABS: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "overview", label: "Resumen", icon: "stats-chart" },
  { key: "achievements", label: "Logros", icon: "trophy" },
  { key: "goals", label: "Metas", icon: "flag" },
  { key: "history", label: "Historial", icon: "time" },
];

export function MetricsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data
  const [stats, setStats] = useState<UserMetricsStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [activities, setActivities] = useState<ActivityItemType[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [statsData, achievementsData, goalsData, activitiesData] =
        await Promise.all([
          getUserStats(),
          getUserAchievements(),
          getUserGoals(),
          getUserActivityHistory(20),
        ]);

      setStats(statsData);
      setAchievements(achievementsData);
      setGoals(goalsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Memoize derived state to prevent recalculation on every render
  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.is_unlocked),
    [achievements]
  );

  const inProgressAchievements = useMemo(
    () => achievements.filter((a) => !a.is_unlocked),
    [achievements]
  );

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status === "active"),
    [goals]
  );

  const completedGoals = useMemo(
    () => goals.filter((g) => g.status === "completed"),
    [goals]
  );

  const renderOverview = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>Estadisticas Totales</Text>
      <View style={styles.statsGrid}>
        <StatsCard
          icon="bicycle"
          value={formatDistance(stats?.all_time.total_distance_km || 0)}
          label="Distancia Total"
          trend={stats?.current_month?.distance_change_percent}
        />
        <StatsCard
          icon="flag"
          value={stats?.all_time.total_rides || 0}
          label="Rutas Completadas"
          iconColor={accent.emerald}
          iconBgColor={accent.emeraldTint}
          trend={stats?.current_month?.rides_change_percent}
        />
      </View>
      <View style={styles.statsGrid}>
        <StatsCard
          icon="time"
          value={formatDuration(stats?.all_time.total_duration_min || 0)}
          label="Tiempo Total"
          iconColor={accent.violet}
          iconBgColor={accent.violetTint}
        />
        <StatsCard
          icon="flame"
          value={formatCalories(stats?.all_time.total_calories || 0)}
          label="Calorias"
          iconColor={accent.coral}
          iconBgColor={accent.coralTint}
        />
      </View>
      <View style={styles.statsGrid}>
        <StatsCard
          icon="speedometer"
          value={`${(stats?.all_time.avg_speed_kmh || 0).toFixed(1)} km/h`}
          label="Velocidad Promedio"
          iconColor={accent.sky}
          iconBgColor={accent.skyTint}
          trend={stats?.current_month?.speed_change_percent}
        />
        <StatsCard
          icon="trending-up"
          value={`${stats?.all_time.max_speed_kmh || 0} km/h`}
          label="Velocidad Maxima"
          iconColor={accent.amber}
          iconBgColor={accent.amberTint}
        />
      </View>

      {/* Recent Achievements */}
      {unlockedAchievements.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Logros Recientes</Text>
            <TouchableOpacity onPress={() => setActiveTab("achievements")}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {unlockedAchievements.slice(0, 5).map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </ScrollView>
        </>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metas Activas</Text>
            <TouchableOpacity onPress={() => setActiveTab("goals")}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.goalsList}>
            {activeGoals.slice(0, 3).map((goal) => (
              <GoalProgressBar key={goal.id} goal={goal} />
            ))}
          </View>
        </>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <TouchableOpacity onPress={() => setActiveTab("history")}>
              <Text style={styles.seeAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {activities.slice(0, 3).map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </View>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderAchievements = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            Desbloqueados ({unlockedAchievements.length})
          </Text>
          <View style={styles.achievementsGrid}>
            {unlockedAchievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </>
      )}

      {/* In Progress Achievements */}
      {inProgressAchievements.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            En Progreso ({inProgressAchievements.length})
          </Text>
          <View style={styles.achievementsGrid}>
            {inProgressAchievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </>
      )}

      {achievements.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color={neutral.steel} />
          <Text style={styles.emptyTitle}>Sin logros aun</Text>
          <Text style={styles.emptyText}>
            Completa rutas para desbloquear logros
          </Text>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderGoals = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Metas Activas</Text>
          <View style={styles.goalsList}>
            {activeGoals.map((goal) => (
              <GoalProgressBar key={goal.id} goal={goal} />
            ))}
          </View>
        </>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Completadas</Text>
          <View style={styles.goalsList}>
            {completedGoals.map((goal) => (
              <GoalProgressBar key={goal.id} goal={goal} />
            ))}
          </View>
        </>
      )}

      {goals.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="flag-outline" size={64} color={neutral.steel} />
          <Text style={styles.emptyTitle}>Sin metas</Text>
          <Text style={styles.emptyText}>
            Crea metas para trackear tu progreso
          </Text>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderHistory = () => (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ActivityItem activity={item} />}
      contentContainerStyle={styles.historyList}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={neutral.steel} />
          <Text style={styles.emptyTitle}>Sin actividad</Text>
          <Text style={styles.emptyText}>
            Completa rutas para ver tu historial
          </Text>
        </View>
      }
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brand.primary} />
        <Text style={styles.loadingText}>Cargando metricas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Estadísticas</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
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
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "achievements" && renderAchievements()}
      {activeTab === "goals" && renderGoals()}
      {activeTab === "history" && renderHistory()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.snow,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: neutral.snow,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: neutral.slate,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: neutral.silver,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: neutral.charcoal,
  },
  tabsContainer: {
    backgroundColor: neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: neutral.silver,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: neutral.pearl,
    gap: 6,
  },
  activeTab: {
    backgroundColor: brand.primaryTint,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: neutral.slate,
  },
  activeTabText: {
    color: brand.primary,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.charcoal,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: brand.primary,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  horizontalScroll: {
    gap: 12,
    paddingRight: 16,
  },
  goalsList: {
    gap: 12,
  },
  activityList: {
    gap: 12,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
  historyList: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: neutral.charcoal,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: neutral.slate,
    marginTop: 4,
    textAlign: "center",
  },
  bottomPadding: {
    height: 32,
  },
});
