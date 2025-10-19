/**
 * Custom Color Scheme Hook
 * Returns the current color scheme based on Redux settings
 * Respects both system theme and manual dark/light mode selection
 * Trend Ankara Mobile Application
 */

import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useAppSelector } from '@/store/hooks';

export function useColorScheme() {
  const nativeColorScheme = useNativeColorScheme();

  // Get theme settings from Redux
  const { useSystemTheme, isDarkMode } = useAppSelector(
    (state) => state.settings.userPreferences
  );

  // Calculate effective color scheme based on settings
  // When useSystemTheme is ON: follow device theme
  // When useSystemTheme is OFF: use manual isDarkMode setting
  if (useSystemTheme) {
    return nativeColorScheme;
  }

  return isDarkMode ? 'dark' : 'light';
}
