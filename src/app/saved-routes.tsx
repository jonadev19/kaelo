import { brand, neutral, spacing } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Saved Routes Screen
 * Displays user's saved/favorited routes
 */
export default function SavedRoutesScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityLabel="Volver"
                    accessibilityRole="button"
                >
                    <Ionicons name="arrow-back" size={24} color={neutral.charcoal} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rutas Guardadas</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={64} color={neutral.steel} />
                    <Text style={styles.emptyTitle}>No tienes rutas guardadas</Text>
                    <Text style={styles.emptySubtitle}>
                        Explora rutas y guarda tus favoritas para acceder a ellas rápidamente
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => router.back()}
                        accessibilityLabel="Volver al perfil"
                        accessibilityRole="button"
                    >
                        <Text style={styles.exploreButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: neutral.white,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: neutral.white,
        borderBottomWidth: 1,
        borderBottomColor: neutral.pearl,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: neutral.charcoal,
    },
    headerSpacer: {
        width: 40,
    },
    container: {
        flex: 1,
        backgroundColor: neutral.snow,
    },
    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: spacing.xxxl,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: neutral.charcoal,
        marginTop: spacing.xl,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: 15,
        color: neutral.slate,
        textAlign: "center",
        marginBottom: spacing.xxl,
        paddingHorizontal: spacing.xl,
        lineHeight: 22,
    },
    exploreButton: {
        backgroundColor: brand.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: 12,
    },
    exploreButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: neutral.white,
    },
});
