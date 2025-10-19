/**
 * Theme Context
 * Provides theme functionality throughout the app
 * Trend Ankara Mobile Application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme as useNativeColorScheme, ColorSchemeName } from 'react-native';
import { Theme, LightTheme, DarkTheme, getTheme } from '@/constants/themes';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUseSystemTheme, setIsDarkMode } from '@/store/slices/settingsSlice';

// Theme mode type for backward compatibility
type ThemeMode = 'light' | 'dark' | 'system';

// Theme context type
interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorSchemeName;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * Updated to use new Redux state structure (useSystemTheme + isDarkMode)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const dispatch = useAppDispatch();
  const systemColorScheme = useNativeColorScheme();

  // Use new Redux state structure
  const { useSystemTheme, isDarkMode } = useAppSelector(
    state => state.settings.userPreferences
  );

  const [effectiveColorScheme, setEffectiveColorScheme] = useState<ColorSchemeName>(() => {
    if (useSystemTheme) {
      return systemColorScheme;
    }
    return isDarkMode ? 'dark' : 'light';
  });

  // Update effective color scheme when settings or system theme changes
  useEffect(() => {
    if (useSystemTheme) {
      setEffectiveColorScheme(systemColorScheme);
    } else {
      setEffectiveColorScheme(isDarkMode ? 'dark' : 'light');
    }
  }, [useSystemTheme, isDarkMode, systemColorScheme]);

  // Get current theme based on effective color scheme
  const theme = getTheme(effectiveColorScheme);

  // Theme control functions (backward compatible)
  const setThemeMode = (mode: ThemeMode) => {
    if (mode === 'system') {
      dispatch(setUseSystemTheme(true));
    } else if (mode === 'dark') {
      dispatch(setUseSystemTheme(false));
      dispatch(setIsDarkMode(true));
    } else {
      dispatch(setUseSystemTheme(false));
      dispatch(setIsDarkMode(false));
    }
  };

  const toggleTheme = () => {
    if (!useSystemTheme && !isDarkMode) {
      // light → dark
      setThemeMode('dark');
    } else if (!useSystemTheme && isDarkMode) {
      // dark → system
      setThemeMode('system');
    } else {
      // system → light
      setThemeMode('light');
    }
  };

  // Theme state helpers
  const isDarkBool = effectiveColorScheme === 'dark';
  const isLight = effectiveColorScheme === 'light';
  const isSystem = useSystemTheme;

  // Compute themeMode for backward compatibility
  const themeMode: ThemeMode = useSystemTheme ? 'system' : (isDarkMode ? 'dark' : 'light');

  const contextValue: ThemeContextType = {
    theme,
    colorScheme: effectiveColorScheme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isDark: isDarkBool,
    isLight,
    isSystem,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Use Theme Hook
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Theme-aware component HOC
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
) {
  return function ThemedComponent(props: P) {
    const { theme } = useTheme();

    return <Component {...props} theme={theme} />;
  };
}

/**
 * Hook for theme-aware styles
 */
export function useThemedStyles<T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return React.useMemo(() => styleFactory(theme), [theme, styleFactory]);
}

/**
 * Hook for responsive styles based on screen dimensions
 */
export function useResponsiveStyles<T extends Record<string, any>>(
  styleFactory: (theme: Theme, dimensions: { width: number; height: number }) => T
): T {
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      // In a real app, you'd get these from Dimensions or useWindowDimensions
      setDimensions({
        width: 375, // Mock iPhone width
        height: 812, // Mock iPhone height
      });
    };

    updateDimensions();
  }, []);

  return React.useMemo(
    () => styleFactory(theme, dimensions),
    [theme, dimensions, styleFactory]
  );
}

/**
 * Hook for animated theme transitions
 */
export function useAnimatedTheme() {
  const { theme, isDark } = useTheme();
  const [animatedTheme, setAnimatedTheme] = useState(theme);

  useEffect(() => {
    // Animate theme change
    const timeout = setTimeout(() => {
      setAnimatedTheme(theme);
    }, 150); // Short delay for smooth transition

    return () => clearTimeout(timeout);
  }, [theme]);

  return {
    theme: animatedTheme,
    isDark,
    isTransitioning: animatedTheme !== theme,
  };
}

/**
 * Theme utilities
 */
export const ThemeUtils = {
  /**
   * Get contrast color based on background
   */
  getContrastColor: (backgroundColor: string, theme: Theme): string => {
    // Simple implementation - in a real app, you'd calculate luminance
    return theme.isDark ? theme.colors.text : theme.colors.text;
  },

  /**
   * Interpolate color based on theme
   */
  interpolateColor: (
    lightColor: string,
    darkColor: string,
    isDark: boolean
  ): string => {
    return isDark ? darkColor : lightColor;
  },

  /**
   * Get themed icon name
   */
  getThemedIcon: (
    lightIcon: string,
    darkIcon: string,
    isDark: boolean
  ): string => {
    return isDark ? darkIcon : lightIcon;
  },

  /**
   * Get themed opacity
   */
  getThemedOpacity: (lightOpacity: number, darkOpacity: number, isDark: boolean): number => {
    return isDark ? darkOpacity : lightOpacity;
  },
};

/**
 * Theme-aware StatusBar component
 */
export function ThemedStatusBar() {
  const { isDark } = useTheme();

  // This would use expo-status-bar in a real implementation
  return null; // Mock implementation
}

/**
 * Usage Examples:
 *
 * Basic theme usage:
 * ```tsx
 * function MyComponent() {
 *   const { theme, isDark, toggleTheme } = useTheme();
 *
 *   return (
 *     <View style={{ backgroundColor: theme.colors.background }}>
 *       <Text style={{ color: theme.colors.text }}>
 *         Current theme: {isDark ? 'Dark' : 'Light'}
 *       </Text>
 *       <Button title="Toggle Theme" onPress={toggleTheme} />
 *     </View>
 *   );
 * }
 * ```
 *
 * Themed styles hook:
 * ```tsx
 * function MyComponent() {
 *   const styles = useThemedStyles((theme) => ({
 *     container: {
 *       backgroundColor: theme.colors.background,
 *       padding: theme.spacing.lg,
 *       borderRadius: theme.borderRadius.md,
 *     },
 *     text: {
 *       color: theme.colors.text,
 *       fontSize: theme.typography.fontSize.lg,
 *     },
 *   }));
 *
 *   return (
 *     <View style={styles.container}>
 *       <Text style={styles.text}>Themed Component</Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * HOC usage:
 * ```tsx
 * const ThemedButton = withTheme<{ title: string }>(({ title, theme }) => (
 *   <TouchableOpacity
 *     style={{
 *       backgroundColor: theme.colors.primary,
 *       padding: theme.spacing.md,
 *       borderRadius: theme.borderRadius.md,
 *     }}
 *   >
 *     <Text style={{ color: theme.colors.white }}>{title}</Text>
 *   </TouchableOpacity>
 * ));
 * ```
 *
 * Responsive styles:
 * ```tsx
 * function ResponsiveComponent() {
 *   const styles = useResponsiveStyles((theme, { width }) => ({
 *     container: {
 *       padding: width > 768 ? theme.spacing.xl : theme.spacing.lg,
 *       flexDirection: width > 768 ? 'row' : 'column',
 *     },
 *   }));
 *
 *   return <View style={styles.container}>...</View>;
 * }
 * ```
 */