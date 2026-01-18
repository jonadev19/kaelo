import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { brand, neutral } from "@/constants/Colors";
import { useCart } from "@/stores/cartStore";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  badge?: number;
}) {
  const showBadge = props.badge !== undefined && props.badge > 0;

  return (
    <View style={styles.iconContainer}>
      <FontAwesome
        size={24}
        style={{ marginBottom: -3 }}
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
        tabBarInactiveTintColor: neutral.gray400,
        tabBarStyle: {
          backgroundColor: neutral.white,
          borderTopColor: neutral.gray200,
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: neutral.white,
        },
        headerTitleStyle: {
          color: neutral.gray800,
          fontWeight: "600",
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
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="compass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rutas"
        options={{
          title: "Rutas",
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="comercios"
        options={{
          title: "Comercios",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="shopping-bag" color={color} badge={cartCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
