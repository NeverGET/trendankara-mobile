/**
 * App Review Prompt Utility
 *
 * Manages app store review prompts with intelligent timing and frequency controls.
 * Integrates with Expo's StoreReview API for native review flows.
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

interface ReviewPromptConfig {
  minimumUsageDays: number;
  minimumLaunchCount: number;
  minimumEventCount: number;
  daysBetweenPrompts: number;
  maxPromptsPerVersion: number;
  significantEventsRequired: number;
}

interface UsageStats {
  firstLaunchDate: string;
  launchCount: number;
  eventCount: number;
  significantEventCount: number;
  lastPromptDate?: string;
  promptCount: number;
  currentVersion: string;
  hasRatedCurrentVersion: boolean;
  hasDeclinedReview: boolean;
  lastDeclineDate?: string;
}

interface ReviewTriggerEvent {
  name: string;
  weight: number; // How significant this event is (1-10)
  timestamp: string;
}

const DEFAULT_CONFIG: ReviewPromptConfig = {
  minimumUsageDays: 3,
  minimumLaunchCount: 5,
  minimumEventCount: 10,
  daysBetweenPrompts: 30,
  maxPromptsPerVersion: 2,
  significantEventsRequired: 3,
};

const STORAGE_KEYS = {
  USAGE_STATS: 'app_review_usage_stats',
  CONFIG: 'app_review_config',
  EVENTS: 'app_review_events',
} as const;

class AppReviewService {
  private static instance: AppReviewService;
  private config: ReviewPromptConfig = DEFAULT_CONFIG;
  private isInitialized = false;

  static getInstance(): AppReviewService {
    if (!AppReviewService.instance) {
      AppReviewService.instance = new AppReviewService();
    }
    return AppReviewService.instance;
  }

  /**
   * Initialize the review service
   */
  async initialize(config: Partial<ReviewPromptConfig> = {}) {
    if (this.isInitialized) return;

    this.config = { ...DEFAULT_CONFIG, ...config };

    try {
      // Initialize usage stats
      await this.initializeUsageStats();

      // Record app launch
      await this.recordLaunch();

      this.isInitialized = true;
      if (__DEV__) { console.log('App Review Service initialized'); }
    } catch (error) {
      console.error('Failed to initialize App Review Service:', error);
    }
  }

  /**
   * Record a significant user event that might trigger a review prompt
   */
  async recordEvent(eventName: string, weight: number = 1) {
    if (!this.isInitialized) {
      console.warn('App Review Service not initialized');
      return;
    }

    try {
      const stats = await this.getUsageStats();
      const event: ReviewTriggerEvent = {
        name: eventName,
        weight,
        timestamp: new Date().toISOString(),
      };

      // Update stats
      stats.eventCount += 1;
      if (weight >= 5) {
        stats.significantEventCount += 1;
      }

      await this.saveUsageStats(stats);
      await this.saveEvent(event);

      if (__DEV__) {
        console.log(`Review event recorded: ${eventName} (weight: ${weight})`);
      }
    } catch (error) {
      console.error('Failed to record review event:', error);
    }
  }

  /**
   * Check if conditions are met and show review prompt if appropriate
   */
  async checkAndPromptReview(): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('App Review Service not initialized');
      return false;
    }

    try {
      const shouldPrompt = await this.shouldShowReviewPrompt();

      if (shouldPrompt) {
        return await this.showReviewPrompt();
      }

      return false;
    } catch (error) {
      console.error('Failed to check and prompt review:', error);
      return false;
    }
  }

  /**
   * Force show review prompt (for testing or manual trigger)
   */
  async forceShowReviewPrompt(): Promise<boolean> {
    return await this.showReviewPrompt();
  }

  /**
   * Check if review prompt should be shown
   */
  private async shouldShowReviewPrompt(): Promise<boolean> {
    const stats = await this.getUsageStats();
    const now = new Date();

    // Check if review is available on this platform
    if (!(await StoreReview.hasAction())) {
      return false;
    }

    // Don't prompt if user has already rated this version
    if (stats.hasRatedCurrentVersion) {
      return false;
    }

    // Don't prompt if user has declined recently
    if (stats.hasDeclinedReview && stats.lastDeclineDate) {
      const daysSinceDecline = this.getDaysBetween(new Date(stats.lastDeclineDate), now);
      if (daysSinceDecline < this.config.daysBetweenPrompts * 2) {
        return false;
      }
    }

    // Check minimum usage days
    const daysSinceFirstLaunch = this.getDaysBetween(new Date(stats.firstLaunchDate), now);
    if (daysSinceFirstLaunch < this.config.minimumUsageDays) {
      return false;
    }

    // Check minimum launch count
    if (stats.launchCount < this.config.minimumLaunchCount) {
      return false;
    }

    // Check minimum event count
    if (stats.eventCount < this.config.minimumEventCount) {
      return false;
    }

    // Check significant events
    if (stats.significantEventCount < this.config.significantEventsRequired) {
      return false;
    }

    // Check if enough time has passed since last prompt
    if (stats.lastPromptDate) {
      const daysSinceLastPrompt = this.getDaysBetween(new Date(stats.lastPromptDate), now);
      if (daysSinceLastPrompt < this.config.daysBetweenPrompts) {
        return false;
      }
    }

    // Check max prompts per version
    if (stats.promptCount >= this.config.maxPromptsPerVersion) {
      return false;
    }

    return true;
  }

  /**
   * Show the native review prompt
   */
  private async showReviewPrompt(): Promise<boolean> {
    try {
      // Check if review action is available
      const isAvailable = await StoreReview.hasAction();
      if (!isAvailable) {
        console.log('Store review not available on this device');
        return false;
      }

      // Show the native review prompt
      await StoreReview.requestReview();

      // Update stats
      const stats = await this.getUsageStats();
      stats.lastPromptDate = new Date().toISOString();
      stats.promptCount += 1;
      await this.saveUsageStats(stats);

      if (__DEV__) { console.log('Review prompt shown'); }
      return true;
    } catch (error) {
      console.error('Failed to show review prompt:', error);
      return false;
    }
  }

  /**
   * Mark that user has rated the current version
   */
  async markAsRated() {
    try {
      const stats = await this.getUsageStats();
      stats.hasRatedCurrentVersion = true;
      await this.saveUsageStats(stats);
      if (__DEV__) { console.log('User marked as having rated the app'); }
    } catch (error) {
      console.error('Failed to mark as rated:', error);
    }
  }

  /**
   * Mark that user has declined to review
   */
  async markAsDeclined() {
    try {
      const stats = await this.getUsageStats();
      stats.hasDeclinedReview = true;
      stats.lastDeclineDate = new Date().toISOString();
      await this.saveUsageStats(stats);
      if (__DEV__) { console.log('User marked as having declined review'); }
    } catch (error) {
      console.error('Failed to mark as declined:', error);
    }
  }

  /**
   * Get current usage statistics
   */
  async getStats(): Promise<UsageStats> {
    return await this.getUsageStats();
  }

  /**
   * Reset all review data (useful for testing)
   */
  async resetData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USAGE_STATS,
        STORAGE_KEYS.EVENTS,
      ]);
      if (__DEV__) { console.log('App review data reset'); }
    } catch (error) {
      console.error('Failed to reset app review data:', error);
    }
  }

  /**
   * Initialize usage stats
   */
  private async initializeUsageStats() {
    try {
      const existingStats = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_STATS);

      if (!existingStats) {
        const initialStats: UsageStats = {
          firstLaunchDate: new Date().toISOString(),
          launchCount: 0,
          eventCount: 0,
          significantEventCount: 0,
          promptCount: 0,
          currentVersion: this.getCurrentVersion(),
          hasRatedCurrentVersion: false,
          hasDeclinedReview: false,
        };

        await this.saveUsageStats(initialStats);
      } else {
        // Check if version has changed
        const stats: UsageStats = JSON.parse(existingStats);
        const currentVersion = this.getCurrentVersion();

        if (stats.currentVersion !== currentVersion) {
          // Reset version-specific data
          stats.currentVersion = currentVersion;
          stats.hasRatedCurrentVersion = false;
          stats.promptCount = 0;
          await this.saveUsageStats(stats);
        }
      }
    } catch (error) {
      console.error('Failed to initialize usage stats:', error);
    }
  }

  /**
   * Record app launch
   */
  private async recordLaunch() {
    try {
      const stats = await this.getUsageStats();
      stats.launchCount += 1;
      await this.saveUsageStats(stats);
    } catch (error) {
      console.error('Failed to record app launch:', error);
    }
  }

  /**
   * Get usage stats from storage
   */
  private async getUsageStats(): Promise<UsageStats> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_STATS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get usage stats:', error);
    }

    // Return default stats if not found
    return {
      firstLaunchDate: new Date().toISOString(),
      launchCount: 0,
      eventCount: 0,
      significantEventCount: 0,
      promptCount: 0,
      currentVersion: this.getCurrentVersion(),
      hasRatedCurrentVersion: false,
      hasDeclinedReview: false,
    };
  }

  /**
   * Save usage stats to storage
   */
  private async saveUsageStats(stats: UsageStats) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }

  /**
   * Save event to storage
   */
  private async saveEvent(event: ReviewTriggerEvent) {
    try {
      const existingEvents = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      const events: ReviewTriggerEvent[] = existingEvents ? JSON.parse(existingEvents) : [];

      events.push(event);

      // Keep only recent events (last 100)
      const recentEvents = events.slice(-100);

      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(recentEvents));
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  }

  /**
   * Get current app version
   */
  private getCurrentVersion(): string {
    // In a real app, you'd get this from Constants.expoConfig?.version or similar
    return '1.0.0';
  }

  /**
   * Calculate days between two dates
   */
  private getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Predefined event types with weights
export const ReviewEvents = {
  // High-value events (weight 8-10)
  COMPLETED_ONBOARDING: { name: 'completed_onboarding', weight: 8 },
  SHARED_CONTENT: { name: 'shared_content', weight: 9 },
  USED_PREMIUM_FEATURE: { name: 'used_premium_feature', weight: 10 },

  // Medium-value events (weight 5-7)
  LISTENED_TO_RADIO: { name: 'listened_to_radio', weight: 6 },
  VOTED_IN_POLL: { name: 'voted_in_poll', weight: 7 },
  READ_NEWS_ARTICLE: { name: 'read_news_article', weight: 5 },

  // Low-value events (weight 1-4)
  OPENED_APP: { name: 'opened_app', weight: 1 },
  NAVIGATED_TO_SCREEN: { name: 'navigated_to_screen', weight: 2 },
  INTERACTED_WITH_UI: { name: 'interacted_with_ui', weight: 3 },
} as const;

// Export singleton instance
export const appReview = AppReviewService.getInstance();

// Hook for React components
export const useAppReview = () => {
  return {
    recordEvent: appReview.recordEvent.bind(appReview),
    checkAndPromptReview: appReview.checkAndPromptReview.bind(appReview),
    markAsRated: appReview.markAsRated.bind(appReview),
    markAsDeclined: appReview.markAsDeclined.bind(appReview),
    getStats: appReview.getStats.bind(appReview),
  };
};

// Higher-order component for automatic event tracking
export const withReviewTracking = <P extends object>(
  Component: React.ComponentType<P>,
  eventName: string,
  weight: number = 3
) => {
  return React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      appReview.recordEvent(eventName, weight);
    }, []);

    return <Component {...props} ref={ref} />;
  });
};

