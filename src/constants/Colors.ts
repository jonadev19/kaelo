/**
 * Kaelo App Color Palette
 * Inspired by Yucatán nature: cenotes, jungle trails, and warm sunlight
 * Optimized for outdoor visibility and cycling context
 */

// Brand Colors - Verde lima vibrante para energía ciclista
export const brand = {
  primary: "#16A34A", // Verde lima principal (green-600)
  primaryLight: "#22C55E", // Hover/active states (green-500)
  primaryDark: "#15803D", // Pressed states (green-700)
  primaryTint: "#DCFCE7", // Fondos sutiles (green-100)
  primaryMuted: "rgba(22, 163, 74, 0.12)", // Overlays
  gradient: {
    start: "#16A34A",
    end: "#22C55E", // Gradiente verde lima
  },
};

// Accent Colors - Inspirados en Yucatán
export const accent = {
  // Coral - Atardeceres yucatecos, CTAs energéticos
  coral: "#F97316",
  coralTint: "#FFF7ED",
  coralMuted: "rgba(249, 115, 22, 0.12)",

  // Cenote - Azul turquesa de cenotes
  cenote: "#0891B2",
  cenoteTint: "#ECFEFF",
  cenoteMuted: "rgba(8, 145, 178, 0.12)",

  // Amber - Sol yucateco, ratings
  amber: "#F59E0B",
  amberTint: "#FFFBEB",
  amberMuted: "rgba(245, 158, 11, 0.12)",

  // Emerald - Vegetación, éxito
  emerald: "#10B981",
  emeraldTint: "#ECFDF5",
  emeraldMuted: "rgba(16, 185, 129, 0.12)",

  // Violet - Premium, logros
  violet: "#8B5CF6",
  violetTint: "#F5F3FF",
  violetMuted: "rgba(139, 92, 246, 0.12)",

  // Sky - Info, navegación GPS
  sky: "#0EA5E9",
  skyTint: "#F0F9FF",
  skyMuted: "rgba(14, 165, 233, 0.12)",
};

// Neutral Colors - Grises cálidos para mejor legibilidad en exteriores
export const neutral = {
  white: "#FFFFFF",
  snow: "#FAFAF9", // Fondo principal (warm white)
  pearl: "#F5F5F4", // Fondo de cards (stone-100)
  silver: "#E7E5E4", // Bordes suaves (stone-200)
  mist: "#D6D3D1", // Dividers (stone-300)
  steel: "#A8A29E", // Placeholders, iconos inactivos (stone-400)
  slate: "#78716C", // Texto secundario (stone-500)
  graphite: "#57534E", // Texto medio (stone-600)
  charcoal: "#292524", // Texto principal (stone-800)
  ink: "#1C1917", // Texto máximo contraste (stone-900)
  black: "#000000",
  // Legacy aliases for compatibility
  gray50: "#FAFAF9",
  gray100: "#F5F5F4",
  gray200: "#E7E5E4",
  gray300: "#D6D3D1",
  gray400: "#A8A29E",
  gray500: "#78716C",
  gray600: "#57534E",
  gray700: "#44403C",
  gray800: "#292524",
  gray900: "#1C1917",
};

// Semantic Colors - Estados y feedback
export const semantic = {
  error: "#DC2626",
  errorTint: "#FEF2F2",
  errorMuted: "rgba(220, 38, 38, 0.12)",
  success: "#16A34A",
  successTint: "#DCFCE7",
  successMuted: "rgba(22, 163, 74, 0.12)",
  warning: "#D97706",
  warningTint: "#FFFBEB",
  warningMuted: "rgba(217, 119, 6, 0.12)",
  info: "#0284C7",
  infoTint: "#F0F9FF",
  infoMuted: "rgba(2, 132, 199, 0.12)",
};

// Shadow Presets - Sombras consistentes
export const shadows = {
  small: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  }),
};

// Spacing Scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius Scale
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Typography Scale (for consistent sizing)
export const typography = {
  displayLg: 52, // Logo
  displayMd: 30, // Welcome titles
  headingLg: 28, // Screen titles
  headingMd: 24, // Section titles
  headingSm: 18, // Card titles
  bodyLg: 16, // Body text
  bodyMd: 15, // Secondary body
  bodySm: 14, // Labels
  caption: 12, // Supporting text
  micro: 11, // Badges, chips
};

// Touch target minimum (WCAG 2.5.5 compliance)
export const touchTarget = {
  min: 44, // Minimum 44x44dp for interactive elements
  padding: 12, // Padding to achieve minimum touch area
};

// Accessible text colors (4.5:1+ contrast on light backgrounds)
export const accessibleText = {
  primary: neutral.charcoal, // #292524 - 14.7:1 on white
  secondary: neutral.graphite, // #57534E - 7.2:1 on white
  placeholder: neutral.slate, // #78716C - 4.8:1 on white
  disabled: neutral.steel, // #A8A29E - for disabled only
};

// Tab Bar Colors
export const tabBar = {
  background: neutral.white,
  border: neutral.silver,
  activeIcon: brand.primary,
  inactiveIcon: neutral.steel,
  activeText: brand.primary,
  inactiveText: neutral.slate,
  activeBg: brand.primaryMuted,
};

// Theme colors for Expo's theme system
const tintColorLight = brand.primary;
const tintColorDark = "#22C55E";

export default {
  light: {
    text: neutral.charcoal,
    textSecondary: neutral.slate,
    background: neutral.snow,
    tint: tintColorLight,
    tabIconDefault: neutral.steel,
    tabIconSelected: tintColorLight,
    inputBackground: neutral.pearl,
    border: neutral.silver,
    card: neutral.white,
  },
  dark: {
    text: neutral.white,
    textSecondary: neutral.steel,
    background: neutral.ink,
    tint: tintColorDark,
    tabIconDefault: neutral.slate,
    tabIconSelected: tintColorDark,
    inputBackground: neutral.charcoal,
    border: neutral.graphite,
    card: neutral.charcoal,
  },
};
