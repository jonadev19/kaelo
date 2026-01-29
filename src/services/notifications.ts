/**
 * Notifications Service
 * Handles push notification setup, permissions, and handling
 */

import { supabase } from "@/lib/supabase";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationData {
    type: "order_status" | "route_recommendation" | "general";
    orderId?: string;
    routeId?: string;
    title: string;
    body: string;
    [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
}

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
    // Check if running on physical device
    if (!Device.isDevice) {
        console.log("Push notifications only work on physical devices");
        return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return null;
    }

    // Get the push token
    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });

        return tokenData.data;
    } catch (error) {
        console.error("Error getting push token:", error);
        return null;
    }
}

/**
 * Save push token to Supabase for the current user
 */
export async function savePushToken(token: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Upsert the push token (insert or update)
        const { error } = await supabase
            .from("profiles")
            .update({
                push_token: token,
                push_token_updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (error) {
            console.error("Error saving push token:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error saving push token:", error);
        return false;
    }
}

/**
 * Remove push token from Supabase (on logout)
 */
export async function removePushToken(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from("profiles")
            .update({
                push_token: null,
                push_token_updated_at: null,
            })
            .eq("id", user.id);

        if (error) {
            console.error("Error removing push token:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error removing push token:", error);
        return false;
    }
}

/**
 * Set up Android notification channel
 */
export async function setupNotificationChannel(): Promise<void> {
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "Kaelo",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#2DD4BF",
        });

        await Notifications.setNotificationChannelAsync("orders", {
            name: "Pedidos",
            description: "Notificaciones sobre el estado de tus pedidos",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#2DD4BF",
        });

        await Notifications.setNotificationChannelAsync("routes", {
            name: "Rutas",
            description: "Recomendaciones y actualizaciones de rutas",
            importance: Notifications.AndroidImportance.DEFAULT,
            lightColor: "#2DD4BF",
        });
    }
}

/**
 * Schedule a local notification (for testing or immediate feedback)
 */
export async function sendLocalNotification(
    title: string,
    body: string,
    data?: NotificationData
): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: data || {},
            sound: true,
        },
        trigger: null, // Immediate notification
    });

    return notificationId;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get the badge count
 */
export async function getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge count
 */
export async function clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener (when notification arrives)
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
}
