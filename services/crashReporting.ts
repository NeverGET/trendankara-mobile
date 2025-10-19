/**
 * Crash Reporting Service
 *
 * Provides error tracking and crash reporting capabilities.
 * This is a basic implementation that can be extended with Sentry, Bugsnag, or similar services.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface CrashReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: {
    userId?: string;
    screen?: string;
    action?: string;
    additionalData?: Record<string, any>;
  };
  device: {
    brand?: string | null;
    modelName?: string | null;
    osName?: string | null;
    osVersion?: string | null;
    platformApiLevel?: number | null;
  };
  app: {
    version?: string;
    buildVersion?: string | number;
    releaseChannel?: string;
  };
  breadcrumbs: Breadcrumb[];
}

interface Breadcrumb {
  timestamp: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category?: string;
  data?: Record<string, any>;
}

interface CrashReportingConfig {
  dsn?: string; // For Sentry or similar services
  environment: 'development' | 'staging' | 'production';
  enableAutoSessionTracking: boolean;
  enableNativeCrashHandling: boolean;
  maxBreadcrumbs: number;
  enableInDevEnvironment: boolean;
}

class CrashReportingService {
  private static instance: CrashReportingService;
  private config: CrashReportingConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private userId?: string;
  private currentScreen?: string;
  private isInitialized = false;

  private constructor() {
    this.config = {
      environment: __DEV__ ? 'development' : 'production',
      enableAutoSessionTracking: true,
      enableNativeCrashHandling: true,
      maxBreadcrumbs: 100,
      enableInDevEnvironment: false,
    };
  }

  static getInstance(): CrashReportingService {
    if (!CrashReportingService.instance) {
      CrashReportingService.instance = new CrashReportingService();
    }
    return CrashReportingService.instance;
  }

  /**
   * Initialize crash reporting
   */
  async initialize(config: Partial<CrashReportingConfig> = {}) {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    // Don't initialize in development unless explicitly enabled
    if (__DEV__ && !this.config.enableInDevEnvironment) {
      console.log('Crash reporting disabled in development');
      return;
    }

    try {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      // Load persisted user ID if available
      await this.loadPersistedData();

      this.isInitialized = true;
      this.addBreadcrumb('Crash reporting initialized', 'info', 'system');

      if (__DEV__) {
        console.log('Crash reporting initialized');
      }
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  /**
   * Set user information for crash reports
   */
  async setUser(userId: string, email?: string, username?: string) {
    this.userId = userId;

    try {
      await AsyncStorage.setItem('crash_report_user_id', userId);
      this.addBreadcrumb(`User set: ${userId}`, 'info', 'user');
    } catch (error) {
      console.error('Failed to persist user ID:', error);
    }
  }

  /**
   * Set current screen for context
   */
  setCurrentScreen(screenName: string) {
    this.currentScreen = screenName;
    this.addBreadcrumb(`Screen changed: ${screenName}`, 'info', 'navigation');
  }

  /**
   * Add breadcrumb for debugging context
   */
  addBreadcrumb(
    message: string,
    level: 'info' | 'warning' | 'error' | 'debug' = 'info',
    category = 'manual',
    data?: Record<string, any>
  ) {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      message,
      level,
      category,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only the latest breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    if (__DEV__) {
      console.log(`Breadcrumb [${level}]: ${message}`, data);
    }
  }

  /**
   * Report an error manually
   */
  async reportError(
    error: Error,
    context?: {
      screen?: string;
      action?: string;
      additionalData?: Record<string, any>;
    }
  ) {
    try {
      const crashReport = await this.createCrashReport(error, context);
      await this.sendCrashReport(crashReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Report a handled exception
   */
  async reportHandledException(
    error: Error,
    context?: {
      screen?: string;
      action?: string;
      additionalData?: Record<string, any>;
      severity?: 'low' | 'medium' | 'high';
    }
  ) {
    this.addBreadcrumb(
      `Handled exception: ${error.message}`,
      'warning',
      'exception',
      context
    );

    // In a real implementation, you might send this to a different endpoint
    // or with different metadata than crashes
    await this.reportError(error, context);
  }

  /**
   * Create a crash report
   */
  private async createCrashReport(
    error: Error,
    context?: {
      screen?: string;
      action?: string;
      additionalData?: Record<string, any>;
    }
  ): Promise<CrashReport> {
    const id = `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: {
        userId: this.userId,
        screen: context?.screen || this.currentScreen,
        action: context?.action,
        additionalData: context?.additionalData,
      },
      device: {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platformApiLevel: Device.platformApiLevel,
      },
      app: {
        version: Constants.expoConfig?.version,
        buildVersion: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
        releaseChannel: Constants.expoConfig?.releaseChannel,
      },
      breadcrumbs: [...this.breadcrumbs],
    };
  }

  /**
   * Send crash report to remote service
   */
  private async sendCrashReport(crashReport: CrashReport) {
    try {
      // Store locally first
      await this.storeCrashReportLocally(crashReport);

      // In a real implementation, you would send this to your crash reporting service
      // Example with Sentry:
      // Sentry.captureException(new Error(crashReport.error.message), {
      //   extra: crashReport,
      //   tags: {
      //     screen: crashReport.context.screen,
      //     userId: crashReport.context.userId,
      //   },
      // });

      if (__DEV__) {
        console.group('Crash Report');
        console.error('Error:', crashReport.error);
        console.log('Context:', crashReport.context);
        console.log('Device:', crashReport.device);
        console.log('Breadcrumbs:', crashReport.breadcrumbs);
        console.groupEnd();
      }

    } catch (error) {
      console.error('Failed to send crash report:', error);
    }
  }

  /**
   * Store crash report locally for retry
   */
  private async storeCrashReportLocally(crashReport: CrashReport) {
    try {
      const existingReports = await this.getStoredCrashReports();
      const updatedReports = [...existingReports, crashReport];

      // Keep only last 10 reports to prevent storage bloat
      const reportsToStore = updatedReports.slice(-10);

      await AsyncStorage.setItem(
        'crash_reports',
        JSON.stringify(reportsToStore)
      );
    } catch (error) {
      console.error('Failed to store crash report locally:', error);
    }
  }

  /**
   * Get stored crash reports
   */
  private async getStoredCrashReports(): Promise<CrashReport[]> {
    try {
      const stored = await AsyncStorage.getItem('crash_reports');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load stored crash reports:', error);
      return [];
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    const originalHandler = global.Promise.prototype.catch;

    // React Native error handler
    if (ErrorUtils) {
      const originalGlobalHandler = ErrorUtils.getGlobalHandler();

      ErrorUtils.setGlobalHandler(async (error, isFatal) => {
        try {
          await this.reportError(error, {
            action: 'global_error_handler',
            additionalData: { isFatal },
          });
        } catch (reportingError) {
          console.error('Failed to report global error:', reportingError);
        }

        // Call original handler
        originalGlobalHandler?.(error, isFatal);
      });
    }

    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', async (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

        try {
          await this.reportError(error, {
            action: 'unhandled_promise_rejection',
            additionalData: { reason: event.reason },
          });
        } catch (reportingError) {
          console.error('Failed to report unhandled rejection:', reportingError);
        }
      });
    }
  }

  /**
   * Load persisted data
   */
  private async loadPersistedData() {
    try {
      const storedUserId = await AsyncStorage.getItem('crash_report_user_id');
      if (storedUserId) {
        this.userId = storedUserId;
      }
    } catch (error) {
      console.error('Failed to load persisted crash reporting data:', error);
    }
  }

  /**
   * Get crash report statistics
   */
  async getReportStats() {
    const storedReports = await this.getStoredCrashReports();
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const last7Days = now - 7 * 24 * 60 * 60 * 1000;

    const recent24h = storedReports.filter(
      report => new Date(report.timestamp).getTime() > last24Hours
    );

    const recent7d = storedReports.filter(
      report => new Date(report.timestamp).getTime() > last7Days
    );

    return {
      total: storedReports.length,
      last24Hours: recent24h.length,
      last7Days: recent7d.length,
      breadcrumbsCount: this.breadcrumbs.length,
    };
  }

  /**
   * Clear stored crash reports
   */
  async clearStoredReports() {
    try {
      await AsyncStorage.removeItem('crash_reports');
      this.addBreadcrumb('Stored crash reports cleared', 'info', 'system');
    } catch (error) {
      console.error('Failed to clear stored crash reports:', error);
    }
  }
}

// Export singleton instance
export const crashReporting = CrashReportingService.getInstance();

// Export types
export type { CrashReport, Breadcrumb, CrashReportingConfig };

// Global error boundary helper
export const withCrashReporting = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      crashReporting.setCurrentScreen(Component.displayName || Component.name || 'Unknown');
    }, []);

    return <Component {...props} ref={ref} />;
  });
};

// Hook for manual error reporting
export const useCrashReporting = () => {
  return {
    reportError: crashReporting.reportError.bind(crashReporting),
    reportHandledException: crashReporting.reportHandledException.bind(crashReporting),
    addBreadcrumb: crashReporting.addBreadcrumb.bind(crashReporting),
    setUser: crashReporting.setUser.bind(crashReporting),
    setCurrentScreen: crashReporting.setCurrentScreen.bind(crashReporting),
  };
};

export { React } from 'react';