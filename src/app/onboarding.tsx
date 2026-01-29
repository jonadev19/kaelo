/**
 * Onboarding Screen
 * Welcome flow for new users
 */

import { accent, brand, neutral, radius, shadows } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export const ONBOARDING_KEY = "@kaelo_onboarding_complete";

interface OnboardingSlide {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    gradientColors: [string, string];
}

const SLIDES: OnboardingSlide[] = [
    {
        id: "1",
        icon: "bicycle",
        title: "Descubre rutas ciclistas",
        description:
            "Explora rutas verificadas por la comunidad en toda la Península de Yucatán. Encuentra cenotes, zonas arqueológicas y paisajes increíbles.",
        gradientColors: [brand.primary, brand.gradient.end],
    },
    {
        id: "2",
        icon: "navigate",
        title: "Navega con GPS",
        description:
            "Sigue tu ruta en tiempo real con navegación GPS. Recibe alertas de puntos de interés y comercios cercanos mientras pedaleas.",
        gradientColors: [accent.sky, "#38BDF8"],
    },
    {
        id: "3",
        icon: "restaurant",
        title: "Ordena en el camino",
        description:
            "Haz pedidos en restaurantes y tiendas cercanas a tu ruta. Tu comida estará lista cuando llegues.",
        gradientColors: [accent.coral, "#FB923C"],
    },
    {
        id: "4",
        icon: "people",
        title: "Únete a la comunidad",
        description:
            "Comparte tus rutas, califica experiencias y conecta con otros ciclistas apasionados por explorar Yucatán.",
        gradientColors: [accent.emerald, "#34D399"],
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const viewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems[0]) {
                setCurrentIndex(Number(viewableItems[0].index) || 0);
            }
        }
    ).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, "true");
            router.replace("/login");
        } catch (error) {
            console.error("Error saving onboarding status:", error);
            router.replace("/login");
        }
    };

    const currentSlide = SLIDES[currentIndex];

    const renderItem = ({ item, index }: { item: OnboardingSlide; index: number }) => (
        <View style={styles.slide}>
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={item.gradientColors}
                    style={styles.iconGradient}
                >
                    <Ionicons name={item.icon} size={80} color={neutral.white} />
                </LinearGradient>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    const renderDots = () => (
        <View style={styles.dotsContainer}>
            {SLIDES.map((slide, index) => {
                const inputRange = [
                    (index - 1) * width,
                    index * width,
                    (index + 1) * width,
                ];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 28, 8],
                    extrapolate: "clamp",
                });

                const backgroundColor = scrollX.interpolate({
                    inputRange,
                    outputRange: [neutral.mist, brand.primary, neutral.mist],
                    extrapolate: "clamp",
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                backgroundColor,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            {/* Skip button */}
            {!isLastSlide && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Omitir</Text>
                </TouchableOpacity>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={32}
            />

            {/* Bottom section */}
            <View style={styles.bottomSection}>
                {renderDots()}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    activeOpacity={0.9}
                >
                    {isLastSlide ? (
                        <LinearGradient
                            colors={[brand.primary, brand.gradient.end]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonTextPrimary}>¡Comenzar!</Text>
                            <View style={styles.buttonIconCircle}>
                                <Ionicons name="arrow-forward" size={18} color={neutral.white} />
                            </View>
                        </LinearGradient>
                    ) : (
                        <View style={styles.buttonOutline}>
                            <Text style={styles.buttonText}>Siguiente</Text>
                            <Ionicons name="arrow-forward" size={20} color={brand.primary} />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: neutral.white,
    },
    skipButton: {
        position: "absolute",
        top: 70,
        right: 24,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: neutral.pearl,
        borderRadius: radius.full,
    },
    skipText: {
        fontSize: 14,
        color: neutral.slate,
        fontWeight: "600",
    },
    slide: {
        width,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingTop: 80,
    },
    iconContainer: {
        marginBottom: 48,
        ...shadows.large,
    },
    iconGradient: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: neutral.charcoal,
        textAlign: "center",
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        color: neutral.slate,
        textAlign: "center",
        lineHeight: 26,
    },
    bottomSection: {
        paddingHorizontal: 32,
        paddingBottom: 24,
    },
    dotsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    button: {
        borderRadius: radius.full,
        overflow: "hidden",
    },
    buttonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        paddingHorizontal: 32,
        gap: 12,
        ...shadows.colored(brand.primary),
    },
    buttonOutline: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        paddingHorizontal: 32,
        gap: 10,
        borderWidth: 2,
        borderColor: brand.primary,
        borderRadius: radius.full,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "700",
        color: brand.primary,
    },
    buttonTextPrimary: {
        fontSize: 17,
        fontWeight: "700",
        color: neutral.white,
        letterSpacing: 0.3,
    },
    buttonIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        justifyContent: "center",
        alignItems: "center",
    },
});
