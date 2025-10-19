/**
 * Splash Screen Utilities
 *
 * Provides smooth splash screen transitions and loading state management
 */

import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';

interface SplashScreenConfig {
  minimumDisplayTime?: number;
  fadeOutDuration?: number;
  enableAutoHide?: boolean;
}

const DEFAULT_CONFIG: SplashScreenConfig = {
  minimumDisplayTime: 1500, // Minimum 1.5 seconds
  fadeOutDuration: 500,     // 500ms fade out
  enableAutoHide: true,
};

class SplashScreenService {
  private static instance: SplashScreenService;
  private config: SplashScreenConfig = DEFAULT_CONFIG;
  private isReady = false;
  private startTime: number = Date.now();
  private minimumTimeElapsed = false;

  static getInstance(): SplashScreenService {
    if (!SplashScreenService.instance) {
      SplashScreenService.instance = new SplashScreenService();
    }
    return SplashScreenService.instance;
  }

  /**
   * Initialize splash screen service
   */
  async initialize(config: SplashScreenConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = Date.now();

    try {
      // Prevent splash screen from auto-hiding
      await SplashScreen.preventAutoHideAsync();
      if (__DEV__) {
        console.log('Splash screen initialized');
      }

      // Set up minimum display time timer
      if (this.config.minimumDisplayTime) {
        setTimeout(() => {
          this.minimumTimeElapsed = true;
          if (this.isReady && this.config.enableAutoHide) {
            this.hideSplashScreen();
          }
        }, this.config.minimumDisplayTime);
      } else {
        this.minimumTimeElapsed = true;
      }
    } catch (error) {
      console.error('Failed to initialize splash screen:', error);
      // If there's an error, mark as ready to continue app flow
      this.isReady = true;
      this.minimumTimeElapsed = true;
    }
  }

  /**
   * Mark app as ready and potentially hide splash screen
   */
  setAppReady() {
    this.isReady = true;

    if (this.minimumTimeElapsed && this.config.enableAutoHide) {
      this.hideSplashScreen();
    }
  }

  /**
   * Force hide splash screen
   */
  async hideSplashScreen() {
    try {
      await SplashScreen.hideAsync();
      if (__DEV__) {
        const totalTime = Date.now() - this.startTime;
        console.log(`Splash screen hidden after ${totalTime}ms`);
      }
    } catch (error) {
      console.error('Failed to hide splash screen:', error);
    }
  }

  /**
   * Check if splash screen can be hidden
   */
  canHide(): boolean {
    return this.isReady && this.minimumTimeElapsed;
  }

  /**
   * Get splash screen status
   */
  getStatus() {
    return {
      isReady: this.isReady,
      minimumTimeElapsed: this.minimumTimeElapsed,
      canHide: this.canHide(),
      displayTime: Date.now() - this.startTime,
    };
  }
}

// Singleton instance
export const splashScreenService = SplashScreenService.getInstance();

/**
 * Hook for managing splash screen in React components
 */
export const useSplashScreen = (config?: SplashScreenConfig) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    // Initialize splash screen service
    splashScreenService.initialize(config);
  }, []);

  const setAppReady = useCallback(async () => {
    try {
      setIsAppReady(true);
      splashScreenService.setAppReady();

      // Wait a frame for any final renders
      await new Promise(resolve => setTimeout(resolve, 100));

      // Hide splash screen
      await splashScreenService.hideSplashScreen();
      setSplashVisible(false);
    } catch (error) {
      console.error('Error hiding splash screen:', error);
      setSplashVisible(false);
    }
  }, []);

  const hideSplashScreen = useCallback(async () => {
    try {
      await splashScreenService.hideSplashScreen();
      setSplashVisible(false);
    } catch (error) {
      console.error('Error hiding splash screen:', error);
      setSplashVisible(false);
    }
  }, []);

  return {
    isAppReady,
    splashVisible,
    setAppReady,
    hideSplashScreen,
    status: splashScreenService.getStatus(),
  };
};

/**
 * Hook for loading resources and managing splash screen
 */
export const useAppLoading = (loadingFunction: () => Promise<void>) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { setAppReady, splashVisible } = useSplashScreen();

  useEffect(() => {
    const loadApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Execute the loading function
        await loadingFunction();

        // Mark app as ready
        await setAppReady();
      } catch (err) {
        console.error('App loading error:', err);
        setError(err instanceof Error ? err : new Error('Unknown loading error'));

        // Still hide splash screen even on error
        await setAppReady();
      } finally {
        setIsLoading(false);
      }
    };

    loadApp();
  }, [loadingFunction, setAppReady]);

  return {
    isLoading,
    error,
    splashVisible,
  };
};

/**
 * Higher-order component for splash screen management
 */
export const withSplashScreen = <P extends object>(
  Component: React.ComponentType<P>,
  loadingFunction?: () => Promise<void>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const [isReady, setIsReady] = useState(false);

    React.useEffect(() => {
      const prepareApp = async () => {
        try {
          // Initialize splash screen
          await splashScreenService.initialize();

          // Run loading function if provided
          if (loadingFunction) {
            await loadingFunction();
          }

          // Mark app as ready
          splashScreenService.setAppReady();
          setIsReady(true);
        } catch (error) {
          console.error('App preparation error:', error);
          setIsReady(true); // Continue even if there's an error
        }
      };

      prepareApp();
    }, []);

    if (!isReady) {
      return null; // Splash screen will be visible
    }

    return <Component {...props} ref={ref} />;
  });
};

/**
 * Utility function to preload critical resources
 */
export const preloadCriticalResources = async () => {
  const tasks = [];

  // Preload fonts (if using custom fonts)
  // tasks.push(Font.loadAsync({...}));

  // Preload critical images
  // tasks.push(Asset.loadAsync([require('../assets/images/logo.png')]));

  // Initialize critical services
  // tasks.push(initializeCriticalServices());

  try {
    await Promise.all(tasks);
    if (__DEV__) { console.log('Critical resources preloaded'); }
  } catch (error) {
    console.error('Error preloading resources:', error);
    // Don't throw - allow app to continue
  }
};

/**
 * Utility for smooth splash to main app transition
 */
export const createSmoothTransition = (onTransitionComplete?: () => void) => {
  return {
    onLayoutRootView: async () => {
      try {
        // This tells the splash screen to hide immediately
        await splashScreenService.hideSplashScreen();
        onTransitionComplete?.();
      } catch (error) {
        console.error('Error in transition:', error);
        onTransitionComplete?.();
      }
    },
  };
};

export { React } from 'react';