import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useEffect, useMemo } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LightNavigationTheme, DarkNavigationTheme } from '@/constants/navigationTheme';
import { Strings } from '@/constants/strings';
import { ExpoVideoPlayerProvider } from '@/services/audio/ExpoVideoPlayerProvider';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { store, persistor } from '@/store';
import apiInitService from '@/services/api/initialization';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAppSelector } from '@/store/hooks';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * App content component that uses Redux hooks
 * Separated from RootLayout to access Redux state after Provider is mounted
 */
function AppContent() {
  const systemColorScheme = useColorScheme();

  // Subscribe to theme settings from Redux state
  const { useSystemTheme, isDarkMode } = useAppSelector(
    (state) => state.settings.userPreferences
  );

  // Calculate current theme based on settings
  // AC 1.2, 1.4, 1.5: When useSystemTheme is ON, follow device theme
  // AC 2.4, 2.5: When useSystemTheme is OFF, use isDarkMode setting
  const currentTheme = useMemo(() => {
    if (useSystemTheme) {
      // Follow system theme preference
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    // Use manual dark/light mode setting
    return isDarkMode ? 'dark' : 'light';
  }, [useSystemTheme, isDarkMode, systemColorScheme]);

  // Initialize API service on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Temporarily clear cache for cards to test image loading
        if (__DEV__) {
          await apiInitService.clearCache();
        }

        const result = await apiInitService.initialize();

        if (!result.success) {
          console.warn('Some endpoints failed to load:', result.failedEndpoints);
        }
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      apiInitService.cleanup();
    };
  }, []);

  // Setup deep linking
  useDeepLinking({
    onDeepLink: () => {
      // Deep link handling
    },
    onError: (error, url) => {
      console.error('Deep link error in RootLayout:', error, url);
    },
    logDeepLinks: __DEV__,
  });

  return (
    <CustomThemeProvider>
      <ExpoVideoPlayerProvider>
        <ThemeProvider value={currentTheme === 'dark' ? DarkNavigationTheme : LightNavigationTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: Strings.common.modal }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </ExpoVideoPlayerProvider>
    </CustomThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary level="app" showErrorDetails={__DEV__}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
