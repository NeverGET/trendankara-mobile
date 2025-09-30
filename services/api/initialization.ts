/**
 * API Initialization Service
 * Preloads critical endpoints on app launch for fast usability
 */

import { apiCache, CACHE_KEYS, CACHE_TTL } from '@/services/cache/apiCache';
import { radioApi } from './radio';
import { pollsService } from './polls';
import { newsService } from './news';
import { cardsService } from './cards';
import configApi from './config';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { testApiConnection } from './testConnection';

interface InitializationResult {
  success: boolean;
  loadedEndpoints: string[];
  failedEndpoints: string[];
  duration: number;
}

class ApiInitializationService {
  private isInitialized = false;
  private backgroundInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private netInfoUnsubscribe: (() => void) | null = null;
  private lastRefreshTime = 0;
  private refreshInterval = 5 * 60 * 1000; // 5 minutes
  private networkRefreshTimeout: NodeJS.Timeout | null = null;
  private lastNetworkState = false;

  /**
   * Initialize all critical endpoints on app launch
   */
  async initialize(): Promise<InitializationResult> {
    const startTime = Date.now();
    const loadedEndpoints: string[] = [];
    const failedEndpoints: string[] = [];

    if (this.isInitialized) {
      console.log('API already initialized, skipping...');
      return {
        success: true,
        loadedEndpoints: [],
        failedEndpoints: [],
        duration: 0,
      };
    }

    console.log('Starting API initialization...');

    // Run connection test in development
    if (__DEV__) {
      await testApiConnection();
    }

    // Critical endpoints to preload
    const endpoints = [
      {
        name: 'RadioConfig',
        key: CACHE_KEYS.RADIO_CONFIG,
        ttl: CACHE_TTL.RADIO_CONFIG,
        fetch: () => radioApi.getRadioConfig(true),
      },
      {
        name: 'AppConfig',
        key: CACHE_KEYS.APP_CONFIG,
        ttl: CACHE_TTL.CONFIG,
        fetch: () => configApi.getAppConfig(),
      },
      {
        name: 'LatestNews',
        key: `${CACHE_KEYS.NEWS_LATEST}_v2`,
        ttl: CACHE_TTL.NEWS_LIST,
        fetch: () => newsService.getLatestNews({ limit: 10 }),
      },
      {
        name: 'ActivePolls',
        key: CACHE_KEYS.POLLS_ACTIVE,
        ttl: CACHE_TTL.POLL_DATA,
        fetch: () => pollsService.getCurrentPolls(),
      },
      {
        name: 'Cards',
        key: CACHE_KEYS.CARDS_ALL,
        ttl: CACHE_TTL.CARD_DATA,
        fetch: () => cardsService.getAllCards(),
      },
    ];

    // Preload endpoints in parallel
    const promises = endpoints.map(async (endpoint) => {
      try {
        const data = await apiCache.getOrFetch(
          endpoint.key,
          endpoint.fetch,
          endpoint.ttl
        );

        if (data) {
          console.log(`✓ Loaded ${endpoint.name}`);
          loadedEndpoints.push(endpoint.name);
        }
      } catch (error) {
        console.error(`✗ Failed to load ${endpoint.name}:`, error);
        failedEndpoints.push(endpoint.name);
      }
    });

    await Promise.all(promises);

    this.isInitialized = true;
    this.lastRefreshTime = Date.now();

    // Start background refresh
    this.startBackgroundRefresh();

    // Monitor network connectivity
    this.monitorNetworkChanges();

    // Monitor app state
    this.monitorAppState();

    const duration = Date.now() - startTime;

    console.log(`API initialization completed in ${duration}ms`);
    console.log(`Loaded: ${loadedEndpoints.length}, Failed: ${failedEndpoints.length}`);

    return {
      success: failedEndpoints.length === 0,
      loadedEndpoints,
      failedEndpoints,
      duration,
    };
  }

  /**
   * Start background refresh of critical data
   */
  private startBackgroundRefresh(): void {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
    }

    // Refresh critical data periodically
    this.backgroundInterval = setInterval(() => {
      this.refreshCriticalData();
    }, this.refreshInterval);
  }

  /**
   * Refresh critical data in background
   */
  private async refreshCriticalData(): Promise<void> {
    const now = Date.now();

    // Check if enough time has passed since last refresh
    if (now - this.lastRefreshTime < this.refreshInterval) {
      return;
    }

    console.log('Refreshing critical data in background...');

    try {
      // Check network connectivity first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No network connection, skipping refresh');
        return;
      }

      // Refresh radio config (most critical)
      await radioApi.getRadioConfig(true);

      // Refresh other critical data
      await Promise.all([
        configApi.getAppConfig().catch(e => console.error('Config refresh failed:', e)),
        newsService.getLatestNews({ limit: 10 }).catch(e => console.error('News refresh failed:', e)),
      ]);

      this.lastRefreshTime = now;
      console.log('Background data refresh completed');
    } catch (error) {
      console.error('Background refresh error:', error);
    }
  }

  /**
   * Monitor network connectivity changes
   */
  private monitorNetworkChanges(): void {
    // Clear any existing listeners first
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }

    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;

      // Only trigger on state change from disconnected to connected
      if (isConnected && !this.lastNetworkState) {
        // Clear any existing timeout
        if (this.networkRefreshTimeout) {
          clearTimeout(this.networkRefreshTimeout);
        }

        console.log('Network reconnected, scheduling data refresh...');
        // Debounce to avoid multiple refreshes
        this.networkRefreshTimeout = setTimeout(() => {
          this.refreshCriticalData();
          this.networkRefreshTimeout = null;
        }, 3000);
      }

      this.lastNetworkState = isConnected;
    });
  }

  /**
   * Monitor app state changes
   */
  private monitorAppState(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          // App came to foreground
          const timeSinceLastRefresh = Date.now() - this.lastRefreshTime;

          // Refresh if more than 5 minutes have passed
          if (timeSinceLastRefresh > this.refreshInterval) {
            console.log('App resumed, refreshing stale data...');
            this.refreshCriticalData();
          }
        }
      }
    );
  }

  /**
   * Force refresh all cached data
   */
  async forceRefresh(): Promise<void> {
    console.log('Force refreshing all cached data...');

    await Promise.all([
      radioApi.getRadioConfig(true),
      configApi.getAppConfig(),
      newsService.getLatestNews({ limit: 10 }),
      pollsService.getCurrentPolls(),
      cardsService.getAllCards(),
    ]).catch(error => {
      console.error('Force refresh failed:', error);
    });

    this.lastRefreshTime = Date.now();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return apiCache.getStats();
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await apiCache.clearAll();
    this.isInitialized = false;
    console.log('Cache cleared');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    if (this.networkRefreshTimeout) {
      clearTimeout(this.networkRefreshTimeout);
      this.networkRefreshTimeout = null;
    }
  }

  /**
   * Check if service is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get last refresh time
   */
  getLastRefreshTime(): number {
    return this.lastRefreshTime;
  }
}

export const apiInitService = new ApiInitializationService();
export default apiInitService;