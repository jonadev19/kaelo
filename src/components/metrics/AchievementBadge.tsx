/**
 * AchievementBadge - Displays an achievement with progress
 */
import { accent, brand, neutral, radius, shadows } from "@/constants/Colors";
import { Achievement, ACHIEVEMENT_INFO } from "@/services/metrics";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  compact?: boolean;
}

export function AchievementBadge({
  achievement,
  onPress,
  compact = false,
}: AchievementBadgeProps) {
  const info = ACHIEVEMENT_INFO[achievement.achievement_type];
  const isUnlocked = achievement.is_unlocked;

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, !isUnlocked && styles.locked]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View
          style={[
            styles.compactIconContainer,
            { backgroundColor: isUnlocked ? brand.primaryTint : neutral.pearl },
          ]}
        >
          <Ionicons
            name={info.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={isUnlocked ? brand.primary : neutral.steel}
          />
        </View>
        {!isUnlocked && (
          <View style={styles.progressRing}>
            <Text style={styles.progressRingText}>
              {(achievement.progress_percentage || 0).toFixed(0)}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, !isUnlocked && styles.locked]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isUnlocked ? brand.primaryTint : neutral.pearl },
        ]}
      >
        <Ionicons
          name={info.icon as keyof typeof Ionicons.glyphMap}
          size={28}
          color={isUnlocked ? brand.primary : neutral.steel}
        />
        {isUnlocked && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={10} color={neutral.white} />
          </View>
        )}
      </View>
      <Text style={[styles.title, !isUnlocked && styles.lockedText]}>
        {info.title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {info.description}
      </Text>
      {!isUnlocked && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${achievement.progress_percentage || 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress_current}/{achievement.progress_target}
          </Text>
        </View>
      )}
      {isUnlocked && achievement.points_awarded > 0 && (
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={12} color={accent.amber} />
          <Text style={styles.pointsText}>{achievement.points_awarded} pts</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: neutral.white,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: "center",
    width: 140,
    ...shadows.medium,
  },
  locked: {
    opacity: 0.85,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: neutral.white,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: neutral.charcoal,
    textAlign: "center",
  },
  lockedText: {
    color: neutral.graphite,
  },
  description: {
    fontSize: 11,
    color: neutral.slate,
    textAlign: "center",
    marginTop: 4,
  },
  progressContainer: {
    width: "100%",
    marginTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: neutral.pearl,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: brand.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: neutral.slate,
    textAlign: "center",
    marginTop: 4,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: "600",
    color: accent.amber,
  },
  compactContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: neutral.white,
    position: "relative",
    ...shadows.small,
  },
  compactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  progressRing: {
    position: "absolute",
    bottom: -4,
    backgroundColor: neutral.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressRingText: {
    fontSize: 9,
    fontWeight: "600",
    color: neutral.slate,
  },
});
