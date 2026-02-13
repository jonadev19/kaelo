/**
 * StatsCard - Displays a single statistic with icon and optional trend
 */
import { brand, neutral, radius, shadows } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBgColor?: string;
  trend?: number | null; // Percentage change (positive = up, negative = down)
}

export function StatsCard({
  icon,
  value,
  label,
  iconColor = brand.primary,
  iconBgColor = brand.primaryTint,
  trend,
}: StatsCardProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend !== undefined && trend !== null && trend !== 0 && (
        <View
          style={[
            styles.trendBadge,
            { backgroundColor: trend >= 0 ? "#ECFDF5" : "#FEF2F2" },
          ]}
        >
          <Ionicons
            name={trend >= 0 ? "arrow-up" : "arrow-down"}
            size={12}
            color={trend >= 0 ? "#10B981" : "#EF4444"}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend >= 0 ? "#10B981" : "#EF4444" },
            ]}
          >
            {Math.abs(trend).toFixed(0)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.white,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: "center",
    ...shadows.medium,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: neutral.charcoal,
  },
  label: {
    fontSize: 12,
    color: neutral.slate,
    marginTop: 4,
    textAlign: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
