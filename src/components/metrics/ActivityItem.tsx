/**
 * ActivityItem - Displays a single activity/ride
 */
import { neutral, radius, semantic, shadows } from "@/constants/Colors";
import { ActivityItem as ActivityItemType, formatDuration } from "@/services/metrics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActivityItemProps {
  activity: ActivityItemType;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const router = useRouter();
  const isCompleted = activity.status === "completado";
  const date = new Date(activity.started_at);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/route/${activity.route_id}`)}
    >
      <View style={styles.dateColumn}>
        <Text style={styles.dateDay}>{date.getDate()}</Text>
        <Text style={styles.dateMonth}>
          {date
            .toLocaleDateString("es-MX", { month: "short" })
            .toUpperCase()
            .replace(".", "")}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.routeName} numberOfLines={1}>
            {activity.route_name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompleted
                  ? semantic.successTint
                  : semantic.warningTint,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isCompleted ? semantic.success : semantic.warning },
              ]}
            >
              {isCompleted ? "Completado" : "Abandonado"}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="map-outline" size={14} color={neutral.slate} />
            <Text style={styles.statText}>
              {activity.distance_km?.toFixed(1) || "0"} km
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color={neutral.slate} />
            <Text style={styles.statText}>
              {formatDuration(activity.duration_min || 0)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="speedometer-outline" size={14} color={neutral.slate} />
            <Text style={styles.statText}>
              {activity.avg_speed_kmh?.toFixed(1) || "0"} km/h
            </Text>
          </View>
          {activity.calories_burned > 0 && (
            <View style={styles.stat}>
              <Ionicons name="flame-outline" size={14} color={neutral.slate} />
              <Text style={styles.statText}>{activity.calories_burned} cal</Text>
            </View>
          )}
        </View>

        <Text style={styles.timeText}>
          {date.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={neutral.steel} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: neutral.white,
    borderRadius: radius.xl,
    padding: 16,
    ...shadows.small,
  },
  dateColumn: {
    alignItems: "center",
    marginRight: 14,
    minWidth: 40,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: "700",
    color: neutral.charcoal,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "600",
    color: neutral.slate,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  routeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: neutral.charcoal,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: neutral.graphite,
  },
  timeText: {
    fontSize: 11,
    color: neutral.steel,
    marginTop: 6,
  },
});
