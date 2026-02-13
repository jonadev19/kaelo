/**
 * GoalProgressBar - Displays a goal with progress
 */
import { brand, neutral, radius, semantic, shadows } from "@/constants/Colors";
import { UserGoal } from "@/services/metrics";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GoalProgressBarProps {
  goal: UserGoal;
  onPress?: () => void;
}

const GOAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  distance_monthly: "map",
  distance_weekly: "map-outline",
  routes_count: "trail-sign",
  streak_days: "flame",
  avg_speed: "speedometer",
  elevation_total: "trending-up",
  calories: "fitness",
  custom: "flag",
};

export function GoalProgressBar({ goal, onPress }: GoalProgressBarProps) {
  const isCompleted = goal.status === "completed";
  const isExpired = goal.status === "expired";
  const daysLeft = goal.deadline
    ? Math.ceil(
        (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.completed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isCompleted
                ? semantic.successTint
                : brand.primaryTint,
            },
          ]}
        >
          <Ionicons
            name={GOAL_ICONS[goal.goal_type] || "flag"}
            size={20}
            color={isCompleted ? semantic.success : brand.primary}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{goal.title}</Text>
          {daysLeft !== null && daysLeft > 0 && !isCompleted && (
            <Text style={styles.deadline}>
              {daysLeft} {daysLeft === 1 ? "dia" : "dias"} restantes
            </Text>
          )}
          {isExpired && <Text style={styles.expired}>Expirado</Text>}
          {isCompleted && <Text style={styles.completedText}>Completado</Text>}
        </View>
        {goal.reward_points > 0 && (
          <View style={styles.rewardBadge}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.rewardText}>{goal.reward_points}</Text>
          </View>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(goal.progress_percentage || 0, 100)}%`,
                backgroundColor: isCompleted ? semantic.success : brand.primary,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressValue}>
            {goal.current_value} {goal.unit}
          </Text>
          <Text style={styles.progressTarget}>
            {goal.target_value} {goal.unit}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: neutral.white,
    borderRadius: radius.xl,
    padding: 16,
    ...shadows.medium,
  },
  completed: {
    borderWidth: 1,
    borderColor: semantic.success,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: neutral.charcoal,
  },
  deadline: {
    fontSize: 12,
    color: neutral.slate,
    marginTop: 2,
  },
  expired: {
    fontSize: 12,
    color: semantic.error,
    marginTop: 2,
  },
  completedText: {
    fontSize: 12,
    color: semantic.success,
    fontWeight: "500",
    marginTop: 2,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },
  progressSection: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: neutral.pearl,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.charcoal,
  },
  progressTarget: {
    fontSize: 12,
    color: neutral.slate,
  },
});
