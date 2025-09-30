/**
 * Deep Linking Hook
 * Handle incoming deep links and URL changes
 * Trend Ankara Mobile Application
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { DeepLinkHelper } from '@/utils/navigation';

// Deep link event types
interface DeepLinkEvent {
  url: string;
  source: 'initial' | 'listener';
  timestamp: number;
}

// Hook options
interface UseDeepLinkingOptions {
  enabled?: boolean;
  onDeepLink?: (event: DeepLinkEvent) => void;
  onError?: (error: Error, url: string) => void;
  logDeepLinks?: boolean;
}

/**
 * Deep Linking Hook
 * Handles incoming deep links and navigation
 */
export function useDeepLinking(options: UseDeepLinkingOptions = {}) {
  const {
    enabled = true,
    onDeepLink,
    onError,
    logDeepLinks = __DEV__,
  } = options;

  const router = useRouter();
  const lastProcessedUrl = useRef<string | null>(null);

  /**
   * Process incoming deep link
   */
  const processDeepLink = async (url: string, source: 'initial' | 'listener') => {
    // Avoid processing the same URL twice
    if (lastProcessedUrl.current === url) {
      return;
    }

    lastProcessedUrl.current = url;

    // Ignore Expo development client URLs - they're just for development
    if (url.includes('expo-development-client')) {
      if (logDeepLinks) {
        console.log('Ignoring Expo development client URL');
      }
      return;
    }

    try {
      if (logDeepLinks) {
        console.log('Processing deep link:', { url, source });
      }

      // Create deep link event
      const event: DeepLinkEvent = {
        url,
        source,
        timestamp: Date.now(),
      };

      // Call custom handler if provided
      onDeepLink?.(event);

      // Handle the deep link using our helper
      const handled = DeepLinkHelper.handleDeepLink(url);

      if (!handled) {
        console.warn('Deep link not handled:', url);
        onError?.(new Error('Deep link not handled'), url);
      }
    } catch (error) {
      console.error('Deep link processing error:', error);
      onError?.(error as Error, url);
    }
  };

  /**
   * Handle URL listener events
   */
  const handleUrlChange = ({ url }: { url: string }) => {
    processDeepLink(url, 'listener');
  };

  /**
   * Setup deep linking
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isMounted = true;

    // Handle initial URL (if app was opened via deep link)
    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl && isMounted) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            if (isMounted) {
              processDeepLink(initialUrl, 'initial');
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
        onError?.(error as Error, '');
      }
    };

    // Setup URL listener for when app is already running
    const subscription = Linking.addEventListener('url', handleUrlChange);

    // Handle initial URL
    handleInitialUrl();

    // Cleanup
    return () => {
      isMounted = false;
      subscription?.remove();
      lastProcessedUrl.current = null;
    };
  }, [enabled, onDeepLink, onError, logDeepLinks]);

  /**
   * Manually process a deep link
   */
  const processManualDeepLink = (url: string) => {
    processDeepLink(url, 'listener');
  };

  /**
   * Generate a shareable URL for current state
   */
  const generateCurrentUrl = () => {
    return DeepLinkHelper.getCurrentUrl();
  };

  return {
    processDeepLink: processManualDeepLink,
    generateCurrentUrl,
    lastProcessedUrl: lastProcessedUrl.current,
  };
}

/**
 * Deep Link Analytics Hook
 * Track deep link usage and performance
 */
export function useDeepLinkAnalytics() {
  const analyticsData = useRef({
    totalDeepLinks: 0,
    successfulDeepLinks: 0,
    failedDeepLinks: 0,
    deepLinkSources: {} as Record<string, number>,
    deepLinkRoutes: {} as Record<string, number>,
  });

  const trackDeepLink = (event: DeepLinkEvent, success: boolean) => {
    const data = analyticsData.current;

    data.totalDeepLinks++;

    if (success) {
      data.successfulDeepLinks++;
    } else {
      data.failedDeepLinks++;
    }

    // Track source
    data.deepLinkSources[event.source] = (data.deepLinkSources[event.source] || 0) + 1;

    // Extract route from URL for tracking
    try {
      const parsed = DeepLinkHelper.parseUrl(event.url);
      if (parsed) {
        const route = parsed.route;
        data.deepLinkRoutes[route] = (data.deepLinkRoutes[route] || 0) + 1;
      }
    } catch (error) {
      console.error('Error tracking deep link route:', error);
    }

    if (__DEV__) {
      console.log('Deep link analytics:', data);
    }
  };

  const getAnalytics = () => ({
    ...analyticsData.current,
    successRate: analyticsData.current.totalDeepLinks > 0
      ? (analyticsData.current.successfulDeepLinks / analyticsData.current.totalDeepLinks) * 100
      : 0,
  });

  const resetAnalytics = () => {
    analyticsData.current = {
      totalDeepLinks: 0,
      successfulDeepLinks: 0,
      failedDeepLinks: 0,
      deepLinkSources: {},
      deepLinkRoutes: {},
    };
  };

  return {
    trackDeepLink,
    getAnalytics,
    resetAnalytics,
  };
}

/**
 * Advanced Deep Linking Hook
 * Combines deep linking with analytics and error handling
 */
export function useAdvancedDeepLinking(options: UseDeepLinkingOptions = {}) {
  const analytics = useDeepLinkAnalytics();

  const deepLinking = useDeepLinking({
    ...options,
    onDeepLink: (event) => {
      options.onDeepLink?.(event);
      analytics.trackDeepLink(event, true);
    },
    onError: (error, url) => {
      options.onError?.(error, url);

      // Create a fake event for analytics
      const event: DeepLinkEvent = {
        url,
        source: 'listener',
        timestamp: Date.now(),
      };
      analytics.trackDeepLink(event, false);
    },
  });

  return {
    ...deepLinking,
    analytics: {
      getAnalytics: analytics.getAnalytics,
      resetAnalytics: analytics.resetAnalytics,
    },
  };
}

/**
 * Deep Link URL Validation Hook
 */
export function useDeepLinkValidation() {
  const validateUrl = (url: string): {
    isValid: boolean;
    reason?: string;
    parsed?: { route: string; params: Record<string, any> };
  } => {
    try {
      const parsed = DeepLinkHelper.parseUrl(url);

      if (!parsed) {
        return {
          isValid: false,
          reason: 'URL could not be parsed',
        };
      }

      // Add custom validation logic here
      // For example, check if route exists, validate parameters, etc.

      return {
        isValid: true,
        parsed,
      };
    } catch (error) {
      return {
        isValid: false,
        reason: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  };

  const validateAndProcess = (url: string): boolean => {
    const validation = validateUrl(url);

    if (!validation.isValid) {
      console.warn('Invalid deep link URL:', url, validation.reason);
      return false;
    }

    return DeepLinkHelper.handleDeepLink(url);
  };

  return {
    validateUrl,
    validateAndProcess,
  };
}

/**
 * Usage Examples:
 *
 * Basic Deep Linking:
 * ```tsx
 * function App() {
 *   useDeepLinking({
 *     onDeepLink: (event) => {
 *       console.log('Deep link received:', event);
 *     },
 *     onError: (error, url) => {
 *       console.error('Deep link error:', error, url);
 *     }
 *   });
 *
 *   return <YourAppContent />;
 * }
 * ```
 *
 * Advanced Deep Linking with Analytics:
 * ```tsx
 * function App() {
 *   const { analytics } = useAdvancedDeepLinking({
 *     logDeepLinks: true,
 *   });
 *
 *   const handleShowAnalytics = () => {
 *     const data = analytics.getAnalytics();
 *     console.log('Deep link analytics:', data);
 *   };
 *
 *   return <YourAppContent />;
 * }
 * ```
 *
 * URL Validation:
 * ```tsx
 * function ShareButton() {
 *   const { validateAndProcess } = useDeepLinkValidation();
 *
 *   const handleShare = (url: string) => {
 *     if (validateAndProcess(url)) {
 *       // URL is valid and was processed
 *     } else {
 *       // Handle invalid URL
 *     }
 *   };
 *
 *   return <Button onPress={() => handleShare('trendankara://article/123')} />;
 * }
 * ```
 */