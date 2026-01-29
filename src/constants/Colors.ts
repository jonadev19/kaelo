/**
 * Kaelo App Color Palette
 * Premium design system with enhanced colors, gradients, and shadows
 */

// Brand Colors - Turquesa profundo más elegante
export const brand = {
  primary: "#0D9488", // Turquesa principal (teal-600)
  primaryLight: "#14B8A6", // Hover/active states (teal-500)
  primaryDark: "#0F766E", // Pressed states (teal-700)
  primaryTint: "#CCFBF1", // Fondos sutiles (teal-100)
  primaryMuted: "rgba(13, 148, 136, 0.15)", // Overlays
  gradient: {
    start: "#0D9488",
    end: "#06B6D4", // Gradiente turquesa → cyan
  },
};

// Accent Colors - Colores vibrantes de acento
export const accent = {
  coral: "#F97316", // CTAs secundarios, energía
  coralTint: "#FFF7ED", // Fondo naranja suave
  violet: "#8B5CF6", // Premium, experto
  violetTint: "#F5F3FF", // Fondo violeta suave
  amber: "#FBBF24", // Ratings, destacados
  amberTint: "#FFFBEB", // Fondo amarillo suave
  emerald: "#10B981", // Éxito, validación
  emeraldTint: "#ECFDF5", // Fondo verde suave
  sky: "#0EA5E9", // Info, navegación
  skyTint: "#F0F9FF", // Fondo azul suave
};

// Neutral Colors - Grises refinados con mejor contraste
export const neutral = {
  white: "#FFFFFF",
  snow: "#FAFAFA", // Fondo principal
  pearl: "#F1F5F9", // Fondo de cards (slate-100)
  silver: "#E2E8F0", // Bordes suaves (slate-200)
  mist: "#CBD5E1", // Dividers (slate-300)
  steel: "#94A3B8", // Placeholders, iconos inactivos (slate-400)
  slate: "#64748B", // Texto secundario (slate-500)
  graphite: "#475569", // Texto medio (slate-600)
  charcoal: "#1E293B", // Texto principal (slate-800)
  ink: "#0F172A", // Texto máximo contraste (slate-900)
  black: "#000000",
  // Legacy aliases for compatibility
  gray50: "#FAFAFA",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",
};

// Semantic Colors - Estados y feedback
export const semantic = {
  error: "#EF4444",
  errorTint: "#FEF2F2",
  success: "#10B981",
  successTint: "#ECFDF5",
  warning: "#F59E0B",
  warningTint: "#FFFBEB",
  info: "#3B82F6",
  infoTint: "#EFF6FF",
};

// Shadow Presets - Sombras consistentes
export const shadows = {
  small: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
  displayLg: 52,   // Logo
  displayMd: 30,   // Welcome titles
  headingLg: 28,   // Screen titles
  headingMd: 24,   // Section titles
  headingSm: 18,   // Card titles
  bodyLg: 16,      // Body text
  bodyMd: 15,      // Secondary body
  bodySm: 14,      // Labels
  caption: 12,     // Supporting text
  micro: 11,       // Badges, chips
};

// Touch target minimum (WCAG 2.5.5 compliance)
export const touchTarget = {
  min: 44,         // Minimum 44x44dp for interactive elements
  padding: 12,     // Padding to achieve minimum touch area
};

// Accessible text colors (4.5:1+ contrast on light backgrounds)
export const accessibleText = {
  primary: neutral.charcoal,     // #1E293B - 12.6:1 on white
  secondary: neutral.graphite,   // #475569 - 7.0:1 on white (was slate)
  placeholder: neutral.slate,    // #64748B - 4.6:1 on white (was steel)
  disabled: neutral.steel,       // #94A3B8 - for disabled only
};

// Theme colors for Expo's theme system
const tintColorLight = brand.primary;
const tintColorDark = "#fff";

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
