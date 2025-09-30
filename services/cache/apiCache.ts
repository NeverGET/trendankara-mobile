/**
 * API Cache Service
 * Provides caching layer for API responses with automatic expiration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  prefix: string;
}

class ApiCacheService {
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default
  private cachePrefix = '@api_cache_';

  /**
   * Store data in cache with expiration
   */
  async set<T>(
    key: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    try {
      const expiresAt = Date.now() + (ttl || this.defaultTTL);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt,
      };

      await AsyncStorage.setItem(
        `${this.cachePrefix}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get data from cache if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.cachePrefix}${key}`);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if cache has expired
      if (Date.now() > entry.expiresAt) {
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Get data from cache or fetch from source
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`Cache hit for key: ${key}`);
      return cached;
    }

    console.log(`Cache miss for key: ${key}, fetching...`);

    try {
      // Fetch fresh data
      const data = await fetchFn();

      // Store in cache
      await this.set(key, data, ttl);

      return data;
    } catch (error) {
      console.error('Error fetching data:', error);

      // Try to get expired cache as fallback
      const expiredCache = await this.getExpired<T>(key);
      if (expiredCache) {
        console.log('Using expired cache as fallback');
        return expiredCache;
      }

      throw error;
    }
  }

  /**
   * Get expired cache data (useful for offline mode)
   */
  private async getExpired<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.cachePrefix}${key}`);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      return entry.data;
    } catch (error) {
      console.error('Error reading expired cache:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.cachePrefix}${key}`);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Preload multiple cache entries
   */
  async preload<T>(
    entries: Array<{
      key: string;
      fetchFn: () => Promise<T>;
      ttl?: number;
    }>
  ): Promise<void> {
    const promises = entries.map(entry =>
      this.getOrFetch(entry.key, entry.fetchFn, entry.ttl)
        .catch(error => {
          console.error(`Failed to preload ${entry.key}:`, error);
        })
    );

    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    entries: Array<{ key: string; size: number; expiresAt: number }>;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));

      const entries = await Promise.all(
        cacheKeys.map(async (key) => {
          const value = await AsyncStorage.getItem(key);
          if (!value) return null;

          try {
            const entry = JSON.parse(value);
            return {
              key: key.replace(this.cachePrefix, ''),
              size: value.length,
              expiresAt: entry.expiresAt,
            };
          } catch {
            return null;
          }
        })
      );

      const validEntries = entries.filter(Boolean) as Array<{
        key: string;
        size: number;
        expiresAt: number;
      }>;

      return {
        totalEntries: validEntries.length,
        totalSize: validEntries.reduce((sum, entry) => sum + entry.size, 0),
        entries: validEntries,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        entries: [],
      };
    }
  }
}

// Cache TTL configurations for different endpoints
export const CACHE_TTL = {
  RADIO_CONFIG: 30 * 60 * 1000, // 30 minutes
  NEWS_LIST: 5 * 60 * 1000,     // 5 minutes
  POLL_DATA: 10 * 60 * 1000,    // 10 minutes
  CARD_DATA: 15 * 60 * 1000,    // 15 minutes
  CONFIG: 60 * 60 * 1000,       // 1 hour
  SPONSORS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Cache keys for different endpoints
export const CACHE_KEYS = {
  RADIO_CONFIG: 'radio_config',
  NEWS_LATEST: 'news_latest',
  NEWS_ARTICLES: 'news_articles',
  NEWS_ARTICLE: 'news_article',
  NEWS_CATEGORIES: 'news_categories',
  POLLS_ACTIVE: 'polls_active',
  CURRENT_POLLS: 'current_polls',
  POLL_VOTES: 'poll_votes',
  CARDS_ALL: 'cards_all',
  APP_CONFIG: 'app_config',
  SPONSORS: 'sponsors',
} as const;

export const apiCache = new ApiCacheService();
export default apiCache;