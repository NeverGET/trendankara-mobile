/**
 * Analytics Service
 * Track user interactions and app usage
 * Trend Ankara Mobile Application
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Analytics event types
export type AnalyticsEvent =
  // Player events
  | 'player_play'
  | 'player_pause'
  | 'player_stop'
  | 'player_volume_change'
  | 'player_error'

  // Navigation events
  | 'screen_view'
  | 'tab_switch'
  | 'deep_link_open'

  // Content events
  | 'news_article_view'
  | 'news_article_share'
  | 'news_category_filter'
  | 'poll_view'
  | 'poll_vote'
  | 'poll_share'

  // User interaction events
  | 'button_press'
  | 'search_query'
  | 'share_content'
  | 'notification_received'
  | 'notification_tapped'

  // App lifecycle events
  | 'app_open'
  | 'app_background'
  | 'app_foreground'
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'onboarding_skip'

  // Settings events
  | 'settings_change'
  | 'theme_change'
  | 'notification_permission_grant'
  | 'notification_permission_deny'

  // Error events
  | 'error_occurred'
  | 'api_error'
  | 'network_error';

// Analytics event data
export interface AnalyticsEventData {
  // Event identification
  event: AnalyticsEvent;
  timestamp: number;
  sessionId: string;

  // User properties
  userId?: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;

  // Event properties
  properties?: Record<string, any>;

  // Screen context
  screen?: string;
  previousScreen?: string;

  // Network context
  networkType?: 'wifi' | 'cellular' | 'none' | 'unknown';
  isOnline?: boolean;

  // App context
  buildNumber?: string;
  locale?: string;
  timezone?: string;
}

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean;
  debugMode: boolean;
  batchSize: number;
  flushInterval: number; // in milliseconds
  maxQueueSize: number;
  storageKey: string;
  endpoint?: string; // For sending to analytics service
}

/**
 * Analytics Service Class
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private config: AnalyticsConfig;
  private sessionId: string;
  private deviceId: string;
  private eventQueue: AnalyticsEventData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private currentScreen: string | null = null;

  private constructor() {
    this.config = {
      enabled: !__DEV__, // Disabled in development by default
      debugMode: __DEV__,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxQueueSize: 100,
      storageKey: 'analytics_events',
      endpoint: 'https://analytics.trendankara.com/events', // Mock endpoint
    };

    this.sessionId = this.generateSessionId();
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics service
   */
  async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
    try {
      // Update configuration
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Load device ID from storage
      const storedDeviceId = await AsyncStorage.getItem('analytics_device_id');
      if (storedDeviceId) {
        this.deviceId = storedDeviceId;
      } else {
        await AsyncStorage.setItem('analytics_device_id', this.deviceId);
      }

      // Load queued events from storage
      await this.loadQueuedEvents();

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;

      if (this.config.debugMode) {
        console.log('Analytics service initialized:', {
          sessionId: this.sessionId,
          deviceId: this.deviceId,
          config: this.config,
        });
      }

      // Track app open
      this.track('app_open', {
        isFirstOpen: !(await AsyncStorage.getItem('analytics_first_open')),
      });

      // Mark first open
      await AsyncStorage.setItem('analytics_first_open', 'true');
    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }

  /**
   * Track an analytics event
   */
  async track(
    event: AnalyticsEvent,
    properties: Record<string, any> = {},
    options: { immediate?: boolean } = {}
  ): Promise<void> {
    try {
      if (!this.config.enabled) {
        if (this.config.debugMode) {
          console.log('Analytics disabled, skipping event:', event, properties);
        }
        return;
      }

      const eventData: AnalyticsEventData = {
        event,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        platform: Platform.OS as 'ios' | 'android',
        appVersion: Constants.expoConfig?.version || '1.0.0',
        buildNumber: Constants.expoConfig?.ios?.buildNumber || '1',
        properties,
        screen: this.currentScreen || undefined,
        locale: 'tr-TR', // Turkish locale
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Add to queue
      this.eventQueue.push(eventData);

      if (this.config.debugMode) {
        console.log('Analytics event tracked:', eventData);
      }

      // Check if queue needs to be flushed
      if (
        options.immediate ||
        this.eventQueue.length >= this.config.batchSize
      ) {
        await this.flush();
      }

      // Check max queue size
      if (this.eventQueue.length > this.config.maxQueueSize) {
        // Remove oldest events
        this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    const previousScreen = this.currentScreen;
    this.currentScreen = screenName;

    await this.track('screen_view', {
      screen_name: screenName,
      previous_screen: previousScreen,
      ...properties,
    });
  }

  /**
   * Track player events
   */
  async trackPlayerEvent(
    action: 'play' | 'pause' | 'stop' | 'volume_change' | 'error',
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track(`player_${action}` as AnalyticsEvent, {
      player_action: action,
      ...properties,
    });
  }

  /**
   * Track content interaction
   */
  async trackContentInteraction(
    contentType: 'news' | 'poll',
    action: 'view' | 'share' | 'vote',
    contentId: number,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track(`${contentType}_${action}` as AnalyticsEvent, {
      content_type: contentType,
      content_id: contentId,
      action,
      ...properties,
    });
  }

  /**
   * Track user interactions
   */
  async trackUserInteraction(
    element: string,
    action: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('button_press', {
      element,
      action,
      ...properties,
    });
  }

  /**
   * Track errors
   */
  async trackError(
    error: Error | string,
    context: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    await this.track('error_occurred', {
      error_message: errorMessage,
      error_stack: errorStack,
      error_context: context,
      ...properties,
    }, { immediate: true });
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'analytics_user_properties',
        JSON.stringify(properties)
      );

      if (this.config.debugMode) {
        console.log('User properties set:', properties);
      }
    } catch (error) {
      console.error('Set user properties error:', error);
    }
  }

  /**
   * Flush events to analytics service
   */
  async flush(): Promise<void> {
    try {
      if (this.eventQueue.length === 0) {
        return;
      }

      const eventsToFlush = [...this.eventQueue];
      this.eventQueue = [];

      if (this.config.debugMode) {
        console.log('Flushing analytics events:', eventsToFlush.length);
      }

      // In a real implementation, send events to analytics service
      if (this.config.endpoint) {
        await this.sendEvents(eventsToFlush);
      }

      // Store events locally for offline support
      await this.storeEvents(eventsToFlush);
    } catch (error) {
      console.error('Analytics flush error:', error);
      // Add events back to queue on error
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  /**
   * Send events to analytics service
   */
  private async sendEvents(events: AnalyticsEventData[]): Promise<void> {
    try {
      // Mock implementation - in a real app, use fetch or axios
      if (this.config.debugMode) {
        console.log('Sending events to analytics service:', {
          endpoint: this.config.endpoint,
          eventCount: events.length,
          events: events.slice(0, 3), // Log first 3 events for debugging
        });
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));

      // In a real implementation:
      // const response = await fetch(this.config.endpoint!, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ events }),
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`Analytics API error: ${response.status}`);
      // }
    } catch (error) {
      if (this.config.debugMode) {
        console.error('Send events error:', error);
      }
      throw error;
    }
  }

  /**
   * Store events locally
   */
  private async storeEvents(events: AnalyticsEventData[]): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(this.config.storageKey);
      const existingEvents = existing ? JSON.parse(existing) : [];

      const allEvents = [...existingEvents, ...events];

      // Keep only recent events to avoid storage bloat
      const recentEvents = allEvents.slice(-500); // Keep last 500 events

      await AsyncStorage.setItem(
        this.config.storageKey,
        JSON.stringify(recentEvents)
      );
    } catch (error) {
      console.error('Store events error:', error);
    }
  }

  /**
   * Load queued events from storage
   */
  private async loadQueuedEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey);
      if (stored) {
        const events = JSON.parse(stored);
        // Add old events to queue for retry
        this.eventQueue.push(...events.slice(-10)); // Only retry last 10 events
      }
    } catch (error) {
      console.error('Load queued events error:', error);
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate device ID
   */
  private generateDeviceId(): string {
    return `device_${Platform.OS}_${Math.random().toString(36).substr(2, 12)}`;
  }

  /**
   * Get analytics configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Update analytics configuration
   */
  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart timer if interval changed
    if (config.flushInterval) {
      this.startFlushTimer();
    }
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (this.config.debugMode) {
      console.log('Analytics enabled:', enabled);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get device ID
   */
  getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * Clear all analytics data
   */
  async clearData(): Promise<void> {
    try {
      this.eventQueue = [];
      await AsyncStorage.multiRemove([
        this.config.storageKey,
        'analytics_user_properties',
        'analytics_first_open',
      ]);

      if (this.config.debugMode) {
        console.log('Analytics data cleared');
      }
    } catch (error) {
      console.error('Clear analytics data error:', error);
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(): Promise<{
    queuedEvents: number;
    sessionId: string;
    deviceId: string;
    isEnabled: boolean;
  }> {
    return {
      queuedEvents: this.eventQueue.length,
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      isEnabled: this.config.enabled,
    };
  }

  /**
   * Cleanup on app close
   */
  async cleanup(): Promise<void> {
    this.stopFlushTimer();
    await this.flush();
  }
}

// Export singleton instance
export default AnalyticsService.getInstance();

/**
 * Analytics Helper Functions
 */
export const AnalyticsHelpers = {
  /**
   * Create timing event properties
   */
  createTimingProperties: (startTime: number, endTime?: number) => ({
    duration: (endTime || Date.now()) - startTime,
    start_time: startTime,
    end_time: endTime || Date.now(),
  }),

  /**
   * Create user interaction properties
   */
  createInteractionProperties: (
    elementType: string,
    elementId?: string,
    additionalProps?: Record<string, any>
  ) => ({
    element_type: elementType,
    element_id: elementId,
    ...additionalProps,
  }),

  /**
   * Create content properties
   */
  createContentProperties: (
    contentType: string,
    contentId: number | string,
    contentTitle?: string,
    additionalProps?: Record<string, any>
  ) => ({
    content_type: contentType,
    content_id: contentId,
    content_title: contentTitle,
    ...additionalProps,
  }),
};

/**
 * Usage Examples:
 *
 * Initialize analytics:
 * ```tsx
 * import AnalyticsService from '@/services/analytics';
 *
 * // In App.tsx
 * useEffect(() => {
 *   AnalyticsService.initialize({
 *     enabled: true,
 *     debugMode: __DEV__,
 *   });
 * }, []);
 * ```
 *
 * Track screen views:
 * ```tsx
 * import { useFocusEffect } from '@react-navigation/native';
 *
 * function HomeScreen() {
 *   useFocusEffect(
 *     useCallback(() => {
 *       AnalyticsService.trackScreenView('home', {
 *         tab: 'main',
 *       });
 *     }, [])
 *   );
 * }
 * ```
 *
 * Track user interactions:
 * ```tsx
 * const handleButtonPress = async () => {
 *   await AnalyticsService.trackUserInteraction('play_button', 'press', {
 *     location: 'player_controls',
 *   });
 *
 *   // Perform action
 *   playAudio();
 * };
 * ```
 *
 * Track content interactions:
 * ```tsx
 * const handleArticleRead = async (article: NewsArticle) => {
 *   await AnalyticsService.trackContentInteraction(
 *     'news',
 *     'view',
 *     article.id,
 *     {
 *       article_title: article.title,
 *       category: article.category,
 *       reading_time: article.readTime,
 *     }
 *   );
 * };
 * ```
 *
 * Track errors:
 * ```tsx
 * try {
 *   await fetchData();
 * } catch (error) {
 *   await AnalyticsService.trackError(
 *     error,
 *     'data_fetch',
 *     { endpoint: '/api/news' }
 *   );
 * }
 * ```
 */