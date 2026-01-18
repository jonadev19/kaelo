/**
 * Kaelo App Color Palette
 */

// Brand Colors
export const brand = {
  primary: "#2DD4BF", // Turquoise - main brand color
  primaryDark: "#14B8A6", // Darker turquoise for hover/press states
  primaryLight: "rgba(45, 212, 191, 0.85)", // Tagline background
};

// Neutral Colors
export const neutral = {
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6", // Input backgrounds
  gray200: "#E5E7EB", // Handle/dividers
  gray300: "#D1D5DB", // Light borders
  gray400: "#9CA3AF", // Placeholder text
  gray500: "#6B7280", // Secondary text, icons
  gray600: "#4B5563", // Medium text
  gray700: "#374151",
  gray800: "#1F2937", // Primary text
  gray900: "#111827",
};

// Semantic Colors
export const semantic = {
  error: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
};

// Theme colors for Expo's theme system
const tintColorLight = brand.primary;
const tintColorDark = "#fff";

export default {
  light: {
    text: neutral.gray800,
    textSecondary: neutral.gray500,
    background: neutral.white,
    tint: tintColorLight,
    tabIconDefault: neutral.gray400,
    tabIconSelected: tintColorLight,
    inputBackground: neutral.gray100,
    border: neutral.gray200,
  },
  dark: {
    text: neutral.white,
    textSecondary: neutral.gray400,
    background: neutral.black,
    tint: tintColorDark,
    tabIconDefault: neutral.gray400,
    tabIconSelected: tintColorDark,
    inputBackground: neutral.gray800,
    border: neutral.gray700,
  },
};
