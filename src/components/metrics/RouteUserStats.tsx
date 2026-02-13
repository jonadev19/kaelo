/**
 * RouteUserStats - Shows user's personal stats and history for a specific route
 */
import { accent, brand, neutral, radius, semantic, shadows } from "@/constants/Colors";
import {
  formatDuration,
  getUserRouteStats,
  RouteHistoryItem,
  UserRouteStats,
} from "@/services/metrics";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface RouteUserStatsProps {
  routeId: string;
}

export function RouteUserStats({ routeId }: RouteUserStatsProps) {
  const [stats, setStats] = useState<UserRouteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [routeId]);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await getUserRouteStats(routeId);
    setStats(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={brand.primary} />
      </View>
    );
  }

  if (!stats || !stats.has_completed) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="bicycle-outline" size={32} color={neutral.steel} />
        </View>
        <Text style={styles.emptyTitle}>Aun no has completado esta ruta</Text>
        <Text style={styles.emptyText}>
          Completa la ruta para ver tu progreso y estadisticas personales
        </Text>
      </View>
    );
  }

  const timeImprovement = stats.time_improvement_percent;
  const speedImprovement = stats.speed_improvement_percent;

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="repeat" size={20} color={brand.primary} />
          <Text style={styles.summaryValue}>{stats.completion_count}</Text>
          <Text style={styles.summaryLabel}>
            {stats.completion_count === 1 ? "vez" : "veces"}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="trophy" size={20} color={accent.amber} />
          <Text style={styles.summaryValue}>
            {stats.best_time_min ? formatDuration(stats.best_time_min) : "--"}
          </Text>
          <Text style={styles.summaryLabel}>Mejor tiempo</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="speedometer" size={20} color={accent.violet} />
          <Text style={styles.summaryValue}>
            {stats.best_speed_kmh ? `${stats.best_speed_kmh}` : "--"}
          </Text>
          <Text style={styles.summaryLabel}>km/h max</Text>
        </View>
      </View>

      {/* Last vs Best Comparison */}
      {stats.completion_count > 1 && (
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Ultimo recorrido vs Mejor</Text>

          {/* Time Comparison */}
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Ultimo tiempo</Text>
              <Text style={styles.comparisonValue}>
                {stats.last_time_min ? formatDuration(stats.last_time_min) : "--"}
              </Text>
            </View>
            <View style={styles.comparisonDivider}>
              {timeImprovement !== null && timeImprovement !== 0 && (
                <View
                  style={[
                    styles.improvementBadge,
                    {
                      backgroundColor:
                        timeImprovement <= 0 ? semantic.successTint : semantic.errorTint,
                    },
                  ]}
                >
                  <Ionicons
                    name={timeImprovement <= 0 ? "arrow-down" : "arrow-up"}
                    size={12}
                    color={timeImprovement <= 0 ? semantic.success : semantic.error}
                  />
                  <Text
                    style={[
                      styles.improvementText,
                      {
                        color: timeImprovement <= 0 ? semantic.success : semantic.error,
                      },
                    ]}
                  >
                    {Math.abs(timeImprovement).toFixed(0)}%
                  </Text>
                </View>
              )}
              {stats.is_personal_best && (
                <View style={styles.pbBadge}>
                  <Ionicons name="star" size={10} color={accent.amber} />
                  <Text style={styles.pbText}>PB</Text>
                </View>
              )}
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Mejor tiempo</Text>
              <Text style={[styles.comparisonValue, styles.bestValue]}>
                {stats.best_time_min ? formatDuration(stats.best_time_min) : "--"}
              </Text>
            </View>
          </View>

          {/* Speed Comparison */}
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Ultima velocidad</Text>
              <Text style={styles.comparisonValue}>
                {stats.last_speed_kmh ? `${stats.last_speed_kmh} km/h` : "--"}
              </Text>
            </View>
            <View style={styles.comparisonDivider}>
              {speedImprovement !== null && speedImprovement !== 0 && (
                <View
                  style={[
                    styles.improvementBadge,
                    {
                      backgroundColor:
                        speedImprovement >= 0 ? semantic.successTint : semantic.errorTint,
                    },
                  ]}
                >
                  <Ionicons
                    name={speedImprovement >= 0 ? "arrow-up" : "arrow-down"}
                    size={12}
                    color={speedImprovement >= 0 ? semantic.success : semantic.error}
                  />
                  <Text
                    style={[
                      styles.improvementText,
                      {
                        color: speedImprovement >= 0 ? semantic.success : semantic.error,
                      },
                    ]}
                  >
                    {Math.abs(speedImprovement).toFixed(0)}%
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Mejor velocidad</Text>
              <Text style={[styles.comparisonValue, styles.bestValue]}>
                {stats.best_speed_kmh ? `${stats.best_speed_kmh} km/h` : "--"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* History */}
      {stats.history && stats.history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial de recorridos</Text>
          {stats.history.map((item, index) => (
            <HistoryRow key={item.id} item={item} index={index} />
          ))}
        </View>
      )}
    </View>
  );
}

function HistoryRow({ item, index }: { item: RouteHistoryItem; index: number }) {
  const date = new Date(item.completed_at);
  const formattedDate = date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyIndex}>
        <Text style={styles.historyIndexText}>#{index + 1}</Text>
      </View>
      <View style={styles.historyContent}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>{formattedDate}</Text>
          {item.is_best_time && (
            <View style={styles.bestTimeBadge}>
              <Ionicons name="trophy" size={10} color={accent.amber} />
              <Text style={styles.bestTimeText}>Mejor</Text>
            </View>
          )}
        </View>
        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <Ionicons name="time-outline" size={14} color={neutral.slate} />
            <Text style={styles.historyStatText}>
              {item.duration_min ? formatDuration(item.duration_min) : "--"}
            </Text>
          </View>
          <View style={styles.historyStat}>
            <Ionicons name="speedometer-outline" size={14} color={neutral.slate} />
            <Text style={styles.historyStatText}>
              {item.avg_speed_kmh ? `${item.avg_speed_kmh} km/h` : "--"}
            </Text>
          </View>
          {item.calories_burned > 0 && (
            <View style={styles.historyStat}>
              <Ionicons name="flame-outline" size={14} color={neutral.slate} />
              <Text style={styles.historyStatText}>{item.calories_burned} cal</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: neutral.pearl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: neutral.charcoal,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: neutral.slate,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: neutral.pearl,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: neutral.charcoal,
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: neutral.slate,
    marginTop: 2,
  },
  comparisonSection: {
    backgroundColor: neutral.white,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: neutral.silver,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.charcoal,
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 11,
    color: neutral.slate,
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: 15,
    fontWeight: "600",
    color: neutral.charcoal,
  },
  bestValue: {
    color: brand.primary,
  },
  comparisonDivider: {
    width: 60,
    alignItems: "center",
    gap: 4,
  },
  improvementBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
  },
  improvementText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pbBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: accent.amberTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  pbText: {
    fontSize: 9,
    fontWeight: "700",
    color: accent.amber,
  },
  historySection: {
    marginTop: 4,
  },
  historyRow: {
    flexDirection: "row",
    backgroundColor: neutral.pearl,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  historyIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: neutral.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  historyIndexText: {
    fontSize: 11,
    fontWeight: "600",
    color: neutral.slate,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: "600",
    color: neutral.charcoal,
  },
  bestTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: accent.amberTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    gap: 3,
  },
  bestTimeText: {
    fontSize: 10,
    fontWeight: "600",
    color: accent.amber,
  },
  historyStats: {
    flexDirection: "row",
    gap: 14,
  },
  historyStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyStatText: {
    fontSize: 12,
    color: neutral.graphite,
  },
});
