/**
 * Cache Manager Service
 * Unified caching strategy with TTL support and automatic purging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CacheEntry } from '@/types/models';

interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxCacheSize: number; // Max cache size in bytes
  checkInterval: number; // Interval to check for expired items
}

class CacheManager {
  private static instance: CacheManager;
  private readonly config: CacheConfig = {
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    checkInterval: 60 * 60 * 1000, // 1 hour
  };

  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly cachePrefix = '@trendankara_cache:';

  private constructor() {
    // Start automatic cleanup
    this.startAutoCleanup();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set item in cache with TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
      };

      const serialized = JSON.stringify(entry);

      // Check if adding this would exceed cache size
      const currentSize = await this.getCacheSize();
      const newItemSize = new Blob([serialized]).size;

      if (currentSize + newItemSize > this.config.maxCacheSize) {
        console.log('Cache size limit reached, purging old items...');
        await this.purgeOldestItems(newItemSize);
      }

      await AsyncStorage.setItem(cacheKey, serialized);
      console.log(`Cached: ${key} (TTL: ${entry.ttl}ms)`);
    } catch (error) {
      console.error(`Error caching ${key}:`, error);
    }
  }

  /**
   * Get item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const entry = JSON.parse(cached) as CacheEntry<T>;

      // Check if expired
      if (this.isExpired(entry)) {
        console.log(`Cache expired: ${key}`);
        await this.remove(key);
        return null;
      }

      console.log(`Cache hit: ${key}`);
      return entry.data;
    } catch (error) {
      console.error(`Error reading cache ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      await AsyncStorage.removeItem(cacheKey);
      console.log(`Cache removed: ${key}`);
    } catch (error) {
      console.error(`Error removing cache ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.cachePrefix));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`Cleared ${cacheKeys.length} cached items`);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Purge expired items
   */
  async purgeExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.cachePrefix));

      const expiredKeys: string[] = [];

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const entry = JSON.parse(cached) as CacheEntry<unknown>;
            if (this.isExpired(entry)) {
              expiredKeys.push(key);
            }
          } catch {
            // Invalid entry, remove it
            expiredKeys.push(key);
          }
        }
      }

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        console.log(`Purged ${expiredKeys.length} expired cache items`);
      }
    } catch (error) {
      console.error('Error purging expired cache:', error);
    }
  }

  /**
   * Purge oldest items to make space
   */
  private async purgeOldestItems(requiredSpace: number): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.cachePrefix));

      // Get all cache entries with their timestamps
      const entries: { key: string; timestamp: number; size: number }[] = [];

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const entry = JSON.parse(cached) as CacheEntry<unknown>;
            entries.push({
              key,
              timestamp: entry.timestamp,
              size: new Blob([cached]).size,
            });
          } catch {
            // Invalid entry, mark for removal
            await AsyncStorage.removeItem(key);
          }
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      let freedSpace = 0;
      const keysToRemove: string[] = [];

      for (const entry of entries) {
        keysToRemove.push(entry.key);
        freedSpace += entry.size;

        if (freedSpace >= requiredSpace) {
          break;
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`Purged ${keysToRemove.length} old items to free ${freedSpace} bytes`);
      }
    } catch (error) {
      console.error('Error purging old cache items:', error);
    }
  }

  /**
   * Get total cache size
   */
  private async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.cachePrefix));

      let totalSize = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }

  /**
   * Start automatic cleanup timer
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.purgeExpired();
    }, this.config.checkInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    itemCount: number;
    totalSize: number;
    maxSize: number;
    usage: number;
  }> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(this.cachePrefix));
    const totalSize = await this.getCacheSize();

    return {
      itemCount: cacheKeys.length,
      totalSize,
      maxSize: this.config.maxCacheSize,
      usage: (totalSize / this.config.maxCacheSize) * 100,
    };
  }

  /**
   * Check if key exists in cache (without loading value)
   */
  async has(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(key);
      const keys = await AsyncStorage.getAllKeys();
      return keys.includes(cacheKey);
    } catch {
      return false;
    }
  }

  /**
   * Get multiple items from cache
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * Set multiple items in cache
   */
  async setMany<T>(items: Map<string, T>, ttl?: number): Promise<void> {
    for (const [key, value] of items.entries()) {
      await this.set(key, value, ttl);
    }
  }
}

// Export singleton instance
export default CacheManager.getInstance();