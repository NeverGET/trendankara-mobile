/**
 * Theme System
 * Light and dark theme configurations
 * Trend Ankara Mobile Application
 */

import { ColorSchemeName } from 'react-native';

// Color palette
export const Colors = {
  // Brand colors
  primary: '#FF6B35',
  primaryDark: '#E5562F',
  primaryLight: '#FF8A5C',

  secondary: '#2E86AB',
  secondaryDark: '#1E5F7A',
  secondaryLight: '#4FA3D1',

  accent: '#F18F01',
  accentDark: '#D17A01',
  accentLight: '#F5A637',

  // Neutral colors
  black: '#000000',
  white: '#FFFFFF',

  // Light theme colors
  light: {
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textMuted: '#CCCCCC',
    icon: '#999999',  // Neutral gray for icons
    tint: '#FF6B35',  // Primary color for tints

    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#F1F3F4',

    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',

    border: '#E1E1E1',
    borderLight: '#F0F0F0',

    card: '#FFFFFF',
    cardSecondary: '#FAFAFA',

    error: '#DC3545',
    warning: '#FFC107',
    success: '#28A745',
    info: '#17A2B8',

    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.15)',

    player: {
      background: '#FFFFFF',
      controls: '#F8F9FA',
      text: '#000000',
      accent: '#FF6B35',
    },

    tabBar: {
      background: '#FFFFFF',
      active: '#FF6B35',
      inactive: '#999999',
      border: '#E1E1E1',
    },
  },

  // Dark theme colors
  dark: {
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textTertiary: '#999999',
    textMuted: '#666666',
    icon: '#999999',  // Neutral gray for icons
    tint: '#FF6B35',  // Primary color for tints

    background: '#000000',
    backgroundSecondary: '#111111',
    backgroundTertiary: '#1A1A1A',

    surface: '#1A1A1A',
    surfaceSecondary: '#2A2A2A',

    border: '#333333',
    borderLight: '#2A2A2A',

    card: '#1A1A1A',
    cardSecondary: '#222222',

    error: '#FF5252',
    warning: '#FFB74D',
    success: '#4CAF50',
    info: '#29B6F6',

    overlay: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.3)',

    player: {
      background: '#1A1A1A',
      controls: '#2A2A2A',
      text: '#FFFFFF',
      accent: '#FF6B35',
    },

    tabBar: {
      background: '#1A1A1A',
      active: '#FF6B35',
      inactive: '#999999',
      border: '#333333',
    },
  },
};

// Typography
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
    '4xl': 48,
  },

  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Border radius
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Component styles
export const ComponentStyles = {
  button: {
    height: 48,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
  },

  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },

  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },

  header: {
    height: 56,
    paddingHorizontal: Spacing.lg,
  },

  tabBar: {
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
};

// Theme type definitions
export interface Theme {
  colors: typeof Colors.light;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows.light;
  components: typeof ComponentStyles;
  isDark: boolean;
}

// Light theme
export const LightTheme: Theme = {
  colors: Colors.light,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows.light,
  components: ComponentStyles,
  isDark: false,
};

// Dark theme
export const DarkTheme: Theme = {
  colors: Colors.dark,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows.dark,
  components: ComponentStyles,
  isDark: true,
};

// Theme helper functions
export const getTheme = (colorScheme: ColorSchemeName): Theme => {
  return colorScheme === 'dark' ? DarkTheme : LightTheme;
};

export const getThemeColors = (colorScheme: ColorSchemeName) => {
  return colorScheme === 'dark' ? Colors.dark : Colors.light;
};

// Style mixins
export const StyleMixins = {
  /**
   * Center content flexbox
   */
  centerContent: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  /**
   * Row layout with center alignment
   */
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  /**
   * Absolute fill
   */
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  /**
   * Full width and height
   */
  full: {
    width: '100%',
    height: '100%',
  },

  /**
   * Safe area padding
   */
  safeArea: {
    paddingTop: 44, // iOS status bar height
    paddingBottom: 34, // iOS home indicator height
  },

  /**
   * Card shadow based on theme
   */
  cardShadow: (isDark: boolean) => isDark ? Shadows.dark.md : Shadows.light.md,

  /**
   * Button shadow based on theme
   */
  buttonShadow: (isDark: boolean) => isDark ? Shadows.dark.sm : Shadows.light.sm,
};

// Animation configurations
export const Animations = {
  timing: {
    fast: 150,
    medium: 250,
    slow: 350,
  },

  easing: {
    linear: 'linear' as const,
    ease: 'ease' as const,
    easeIn: 'ease-in' as const,
    easeOut: 'ease-out' as const,
    easeInOut: 'ease-in-out' as const,
  },

  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Breakpoints for responsive design
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Z-index layers
export const ZIndex = {
  backdrop: 1,
  drawer: 10,
  modal: 100,
  popover: 200,
  tooltip: 300,
  toast: 400,
};

/**
 * Usage Examples:
 *
 * Basic theme usage:
 * ```tsx
 * import { useTheme } from '@/hooks/useTheme';
 *
 * function MyComponent() {
 *   const theme = useTheme();
 *
 *   return (
 *     <View style={{
 *       backgroundColor: theme.colors.background,
 *       padding: theme.spacing.lg,
 *       borderRadius: theme.borderRadius.md,
 *       ...theme.shadows.md,
 *     }}>
 *       <Text style={{
 *         color: theme.colors.text,
 *         fontSize: theme.typography.fontSize.lg,
 *       }}>
 *         Hello World
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * Style mixins:
 * ```tsx
 * const styles = StyleSheet.create({
 *   container: {
 *     ...StyleMixins.centerContent,
 *     backgroundColor: theme.colors.background,
 *   },
 *   row: {
 *     ...StyleMixins.row,
 *     padding: theme.spacing.md,
 *   },
 * });
 * ```
 *
 * Responsive styles:
 * ```tsx
 * const getStyles = (width: number) => ({
 *   container: {
 *     padding: width > Breakpoints.md ? Spacing.xl : Spacing.lg,
 *   },
 * });
 * ```
 */