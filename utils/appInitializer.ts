/**
 * App Initializer
 *
 * Centralized initialization for all app services and configurations
 */

import { performanceMonitor } from './performance';
import { crashReporting } from '../services/crashReporting';
import { appReview, ReviewEvents } from './appReview';
import { splashScreenService } from './splashScreen';

interface AppInitConfig {
  enablePerformanceMonitoring?: boolean;
  enableCrashReporting?: boolean;
  enableAppReview?: boolean;
  splashScreenMinTime?: number;
  developmentMode?: boolean;
}

const DEFAULT_CONFIG: AppInitConfig = {
  enablePerformanceMonitoring: true,
  enableCrashReporting: true,
  enableAppReview: true,
  splashScreenMinTime: 1500,
  developmentMode: __DEV__,
};

class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized = false;
  private config: AppInitConfig = DEFAULT_CONFIG;

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * Initialize all app services
   */
  async initialize(config: Partial<AppInitConfig> = {}): Promise<void> {
    if (this.isInitialized) {
      console.log('🚀 App already initialized');
      return;
    }

    this.config = { ...DEFAULT_CONFIG, ...config };

    console.log('🚀 Initializing TrendAnkara Mobile App...');

    try {
      // Initialize splash screen first
      await this.initializeSplashScreen();

      // Initialize core services in parallel
      await Promise.all([
        this.initializePerformanceMonitoring(),
        this.initializeCrashReporting(),
        this.initializeAppReview(),
      ]);

      // Initialize other services
      await this.initializeAdditionalServices();

      this.isInitialized = true;
      console.log('✅ App initialization completed successfully');

      // Record successful initialization
      if (this.config.enableAppReview) {
        await appReview.recordEvent(ReviewEvents.OPENED_APP.name, ReviewEvents.OPENED_APP.weight);
      }

    } catch (error) {
      console.error('❌ App initialization failed:', error);

      // Report initialization error
      if (this.config.enableCrashReporting) {
        await crashReporting.reportError(
          error instanceof Error ? error : new Error('App initialization failed'),
          {
            action: 'app_initialization',
            additionalData: { config: this.config },
          }
        );
      }

      throw error;
    }
  }

  /**
   * Initialize splash screen
   */
  private async initializeSplashScreen(): Promise<void> {
    try {
      await splashScreenService.initialize({
        minimumDisplayTime: this.config.splashScreenMinTime,
        enableAutoHide: true,
      });
      console.log('💦 Splash screen initialized');
    } catch (error) {
      console.error('Failed to initialize splash screen:', error);
    }
  }

  /**
   * Initialize performance monitoring
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    if (!this.config.enablePerformanceMonitoring) return;

    try {
      performanceMonitor.startMonitoring({
        memoryCheckInterval: 30000,
        enableRenderTracking: true,
        enableNetworkTracking: true,
      });
      console.log('📊 Performance monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Initialize crash reporting
   */
  private async initializeCrashReporting(): Promise<void> {
    if (!this.config.enableCrashReporting) return;

    try {
      await crashReporting.initialize({
        environment: this.config.developmentMode ? 'development' : 'production',
        enableInDevEnvironment: false,
        enableAutoSessionTracking: true,
        enableNativeCrashHandling: true,
        maxBreadcrumbs: 100,
      });
      console.log('🚨 Crash reporting initialized');
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  /**
   * Initialize app review system
   */
  private async initializeAppReview(): Promise<void> {
    if (!this.config.enableAppReview) return;

    try {
      await appReview.initialize({
        minimumUsageDays: 3,
        minimumLaunchCount: 5,
        minimumEventCount: 10,
        daysBetweenPrompts: 30,
        maxPromptsPerVersion: 2,
        significantEventsRequired: 3,
      });
      console.log('⭐ App review system initialized');
    } catch (error) {
      console.error('Failed to initialize app review system:', error);
    }
  }

  /**
   * Initialize additional services
   */
  private async initializeAdditionalServices(): Promise<void> {
    const tasks = [];

    // Add any additional service initializations here
    // Example:
    // tasks.push(this.initializeAnalytics());
    // tasks.push(this.initializeNotifications());
    // tasks.push(this.initializeDeepLinking());

    try {
      await Promise.all(tasks);
      console.log('🔧 Additional services initialized');
    } catch (error) {
      console.error('Failed to initialize additional services:', error);
    }
  }

  /**
   * Mark app as ready (hides splash screen)
   */
  async markAppReady(): Promise<void> {
    try {
      splashScreenService.setAppReady();
      console.log('✅ App marked as ready');
    } catch (error) {
      console.error('Failed to mark app as ready:', error);
    }
  }

  /**
   * Cleanup app services (for app shutdown)
   */
  async cleanup(): Promise<void> {
    try {
      // Stop performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        performanceMonitor.stopMonitoring();
      }

      console.log('🧹 App cleanup completed');
    } catch (error) {
      console.error('Error during app cleanup:', error);
    }
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      services: {
        performanceMonitoring: this.config.enablePerformanceMonitoring,
        crashReporting: this.config.enableCrashReporting,
        appReview: this.config.enableAppReview,
      },
    };
  }
}

// Export singleton instance
export const appInitializer = AppInitializer.getInstance();

/**
 * Hook for app initialization in React components
 */
export const useAppInitializer = (config?: Partial<AppInitConfig>) => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initError, setInitError] = React.useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        await appInitializer.initialize(config);
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setInitError(error instanceof Error ? error : new Error('Unknown initialization error'));
        setIsInitialized(true); // Continue even with error
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const markReady = React.useCallback(async () => {
    await appInitializer.markAppReady();
  }, []);

  return {
    isInitialized,
    isInitializing,
    initError,
    markReady,
    status: appInitializer.getStatus(),
  };
};

/**
 * Higher-order component for app initialization
 */
export const withAppInitialization = <P extends object>(
  Component: React.ComponentType<P>,
  config?: Partial<AppInitConfig>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { isInitialized, isInitializing, initError, markReady } = useAppInitializer(config);

    React.useEffect(() => {
      if (isInitialized && !isInitializing) {
        // Small delay to ensure everything is ready
        const timer = setTimeout(() => {
          markReady();
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [isInitialized, isInitializing, markReady]);

    // Show loading or error state if needed
    if (isInitializing) {
      return null; // Splash screen will be shown
    }

    if (initError) {
      // In a real app, you might want to show an error screen
      console.error('App initialization error:', initError);
    }

    return <Component {...props} ref={ref} />;
  });
};

export type { AppInitConfig };
export { React } from 'react';