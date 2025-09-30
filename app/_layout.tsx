import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LightNavigationTheme, DarkNavigationTheme } from '@/constants/navigationTheme';
import { Strings } from '@/constants/strings';
import { ExpoVideoPlayerProvider } from '@/services/audio/ExpoVideoPlayerProvider';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { store, persistor } from '@/store';
import apiInitService from '@/services/api/initialization';
import ErrorBoundary from '@/components/ErrorBoundary';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize API service on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Temporarily clear cache for cards to test image loading
        if (__DEV__) {
          await apiInitService.clearCache();
          console.log('🗑️ Cache cleared for testing');
        }

        console.log('Initializing app services...');
        const result = await apiInitService.initialize();

        if (result.success) {
          console.log(`App initialized successfully in ${result.duration}ms`);
          console.log(`Loaded endpoints: ${result.loadedEndpoints.join(', ')}`);
        } else {
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
    onDeepLink: (event) => {
      console.log('Deep link received in RootLayout:', event);
    },
    onError: (error, url) => {
      console.error('Deep link error in RootLayout:', error, url);
    },
    logDeepLinks: __DEV__,
  });

  return (
    <ErrorBoundary level="app" showErrorDetails={__DEV__}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <CustomThemeProvider>
            <ExpoVideoPlayerProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkNavigationTheme : LightNavigationTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: Strings.common.modal }} />
                  <Stack.Screen name="settings" options={{ headerShown: false }} />
                  <Stack.Screen name="about" options={{ headerShown: false }} />
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              </ThemeProvider>
            </ExpoVideoPlayerProvider>
          </CustomThemeProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
