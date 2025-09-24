/**
 * TypeScript type definitions for the Trend Ankara theme system
 * These interfaces provide type safety for brand colors and theme configurations
 */

/**
 * Brand color palette interface for Trend Ankara
 * Defines the core brand colors and extended gray palette
 */
export interface BrandPalette {
  // Core brand colors
  primary: string;      // Vibrant red for actions
  secondary: string;    // Pure black
  tertiary: string;     // Pure white

  // Gray palette for consistent shading
  gray900: string;
  gray800: string;
  gray700: string;
  gray600: string;
  gray500: string;
  gray400: string;
  gray300: string;
  gray200: string;
  gray100: string;
  gray50: string;

  // Semantic colors for UI states
  error: string;        // Error states
  warning: string;      // Warning states
  success: string;      // Success states
  info: string;         // Info badges (only blue allowed in news)
}

/**
 * Theme colors interface compatible with React Navigation
 * Defines colors for both light and dark theme modes
 */
export interface ThemeColors {
  light: {
    text: string;
    background: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
    border: string;
    card: string;
    notification: string;
    link: string;
    placeholder: string;
    surface: string;
  };
  dark: {
    text: string;
    background: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
    border: string;
    card: string;
    notification: string;
    link: string;
    placeholder: string;
    surface: string;
  };
}

/**
 * Font configuration interface with platform-specific definitions
 */
export interface FontPalette {
  sans: string;
  serif: string;
  rounded: string;
  mono: string;
}

/**
 * Complete theme configuration interface
 * Combines brand colors, theme colors, and fonts
 */
export interface ThemeConfiguration {
  brandColors: BrandPalette;
  colors: ThemeColors;
  fonts: FontPalette;
}

/**
 * Color scheme type for theme switching
 */
export type ColorScheme = 'light' | 'dark';

/**
 * Theme color key type for use with useThemeColor hook
 * Ensures only valid color names can be referenced
 */
export type ThemeColorName = keyof ThemeColors['light'] & keyof ThemeColors['dark'];