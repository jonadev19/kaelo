import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { brand, neutral, radius, semantic, shadows } from "@/constants/Colors";
import { useCart } from "@/stores/cartStore";

// Tab bar icon with optional badge
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  focused: boolean;
  badge?: number;
}) {
  const showBadge = props.badge !== undefined && props.badge > 0;

  return (
    <View style={styles.iconContainer}>
      {props.focused && <View style={styles.focusedBackground} />}
      <FontAwesome
        size={22}
        style={{ marginBottom: -2 }}
        name={props.name}
        color={props.color}
      />
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
        tabBarActiveTintColor: brand.primary,
        tabBarInactiveTintColor: neutral.steel,
        tabBarStyle: {
          backgroundColor: neutral.white,
          borderTopColor: neutral.silver,
          borderTopWidth: 1,
          height: 88,
          paddingTop: 10,
          paddingBottom: 28,
          ...shadows.small,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: neutral.white,
        },
        headerTitleStyle: {
          color: neutral.charcoal,
          fontWeight: "700",
          fontSize: 18,
        },
        headerShadowVisible: false,
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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="map" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="comercios"
        options={{
          title: "Comercios",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="shopping-bag" color={color} focused={focused} badge={cartCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="user" color={color} focused={focused} />
          ),
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
    width: 44,
    height: 32,
  },
  focusedBackground: {
    position: "absolute",
    width: 44,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: brand.primaryTint,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -2,
    backgroundColor: semantic.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: neutral.white,
  },
  badgeText: {
    color: neutral.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
