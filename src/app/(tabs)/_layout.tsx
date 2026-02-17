import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { neutral, semantic, tabBar } from "@/constants/Colors";
import { useCart } from "@/stores/cartStore";

// Tab bar icon with optional badge
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
  badge?: number;
}) {
  const showBadge = props.badge !== undefined && props.badge > 0;

  return (
    <View style={styles.iconContainer}>
      {props.focused && <View style={styles.focusedBackground} />}
      <Ionicons size={24} name={props.name} color={props.color} />
      {showBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {props.badge! > 9 ? "9+" : props.badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabLayout() {
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabBar.activeIcon,
        tabBarInactiveTintColor: tabBar.inactiveIcon,
        tabBarStyle: {
          backgroundColor: tabBar.background,
          borderTopColor: tabBar.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 70,
          paddingTop: 12,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          elevation: 0,
          shadowColor: neutral.ink,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: neutral.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: neutral.silver,
        },
        headerTitleStyle: {
          color: neutral.charcoal,
          fontWeight: "700",
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerTintColor: neutral.charcoal,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explorar",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="compass" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rutas"
        options={{
          title: "Rutas",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="map" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          title: "Métricas",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="stats-chart" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="person" color={color} focused={focused} />
          ),
        }}
      />
      {/* Hide comercios tab */}
      <Tabs.Screen
        name="comercios"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 32,
  },
  focusedBackground: {
    position: "absolute",
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: tabBar.activeBg,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: 0,
    backgroundColor: semantic.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: tabBar.background,
  },
  badgeText: {
    color: neutral.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
