# Cache Strategy Guide

## Overview
This guide outlines the caching strategy for the TrendAnkara mobile application, including ETag support, memory caching, persistent storage, and cache invalidation patterns.

## Cache Layers

### 1. HTTP Cache (ETag)
Server-side caching using ETags for efficient data transfer.

### 2. Memory Cache
In-memory caching for frequently accessed data during app session.

### 3. Persistent Cache
AsyncStorage-based caching for offline support and app restarts.

### 4. Image Cache
Specialized caching for images using FastImage library.

## ETag Implementation

### Server Response with ETag
```json
{
  "success": true,
  "data": { /* response data */ },
  "cache": {
    "etag": "\"abc123def456\"",
    "maxAge": 300
  }
}
```

### ETag Cache Manager
```javascript
// utils/etagCache.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

class ETagCache {
  constructor() {
    this.memoryCache = new Map();
    this.cachePrefix = '@cache_';
    this.etagPrefix = '@etag_';
  }

  // Generate cache key from URL and params
  getCacheKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}?${paramString}`;
  }

  // Get data with ETag support
  async getWithETag(url, fetcher, options = {}) {
    const { params = {}, forceRefresh = false, cacheDuration = 300000 } = options;
    const cacheKey = this.getCacheKey(url, params);

    // Check if force refresh requested
    if (forceRefresh) {
      return this.fetchAndCache(url, fetcher, cacheKey, params);
    }

    // Check memory cache first
    const memoryData = this.getFromMemory(cacheKey, cacheDuration);
    if (memoryData) {
      return memoryData;
    }

    // Check persistent cache
    const cachedData = await this.getFromStorage(cacheKey, cacheDuration);
    if (cachedData) {
      // Store in memory for quick access
      this.setInMemory(cacheKey, cachedData);
      return cachedData;
    }

    // Get stored ETag
    const storedETag = await this.getETag(cacheKey);

    // Make request with If-None-Match header
    try {
      const response = await fetcher(url, {
        params,
        headers: storedETag ? { 'If-None-Match': storedETag } : {}
      });

      // Check if not modified
      if (response.status === 304) {
        const cachedData = await this.getFromStorage(cacheKey);
        if (cachedData) {
          this.setInMemory(cacheKey, cachedData);
          return cachedData;
        }
      }

      // Store new data and ETag
      if (response.data) {
        await this.cacheData(cacheKey, response.data, response.headers?.etag);
        return response.data;
      }
    } catch (error) {
      // On error, return cached data if available
      const fallbackData = await this.getFromStorage(cacheKey);
      if (fallbackData) {
        console.log('Using cached data due to error:', error.message);
        return fallbackData;
      }
      throw error;
    }
  }

  // Fetch and cache data
  async fetchAndCache(url, fetcher, cacheKey, params) {
    const response = await fetcher(url, { params });

    if (response.data) {
      await this.cacheData(cacheKey, response.data, response.headers?.etag);
    }

    return response.data;
  }

  // Cache data in both memory and storage
  async cacheData(key, data, etag) {
    const timestamp = Date.now();
    const cacheEntry = {
      data,
      timestamp,
      etag
    };

    // Memory cache
    this.setInMemory(key, cacheEntry);

    // Persistent cache
    try {
      await AsyncStorage.setItem(
        `${this.cachePrefix}${key}`,
        JSON.stringify(cacheEntry)
      );

      if (etag) {
        await AsyncStorage.setItem(
          `${this.etagPrefix}${key}`,
          etag
        );
      }
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  // Get from memory cache
  getFromMemory(key, maxAge) {
    const cached = this.memoryCache.get(key);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < maxAge) {
        return cached.data;
      }
      // Remove expired entry
      this.memoryCache.delete(key);
    }

    return null;
  }

  // Set in memory cache
  setInMemory(key, data) {
    // Limit memory cache size
    if (this.memoryCache.size > 100) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data: data.data || data,
      timestamp: data.timestamp || Date.now()
    });
  }

  // Get from persistent storage
  async getFromStorage(key, maxAge) {
    try {
      const cached = await AsyncStorage.getItem(`${this.cachePrefix}${key}`);

      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;

        if (age < maxAge) {
          return parsed.data;
        }

        // Remove expired entry
        await this.removeFromStorage(key);
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }

    return null;
  }

  // Get stored ETag
  async getETag(key) {
    try {
      return await AsyncStorage.getItem(`${this.etagPrefix}${key}`);
    } catch (error) {
      return null;
    }
  }

  // Remove from storage
  async removeFromStorage(key) {
    try {
      await AsyncStorage.multiRemove([
        `${this.cachePrefix}${key}`,
        `${this.etagPrefix}${key}`
      ]);
    } catch (error) {
      console.error('Cache removal error:', error);
    }
  }

  // Clear all cache
  async clearAll() {
    this.memoryCache.clear();

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith(this.cachePrefix) ||
        key.startsWith(this.etagPrefix)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }

  // Clear cache by pattern
  async clearByPattern(pattern) {
    // Clear memory cache
    for (const [key] of this.memoryCache) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear storage cache
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key =>
        (key.startsWith(this.cachePrefix) ||
         key.startsWith(this.etagPrefix)) &&
        key.includes(pattern)
      );
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      console.error('Pattern clear error:', error);
    }
  }

  // Get cache size
  async getCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith(this.cachePrefix)
      );

      let totalSize = 0;
      const values = await AsyncStorage.multiGet(cacheKeys);

      values.forEach(([key, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });

      return {
        itemCount: cacheKeys.length,
        sizeInBytes: totalSize,
        sizeInMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Cache size error:', error);
      return { itemCount: 0, sizeInBytes: 0, sizeInMB: '0' };
    }
  }
}

export default new ETagCache();
```

## Service Implementation with Cache

```javascript
// services/cachedPollService.js
import apiClient from '../api/client';
import etagCache from '../utils/etagCache';

class CachedPollService {
  constructor() {
    this.cacheConfig = {
      polls: 300000,      // 5 minutes
      voteStatus: 3600000, // 1 hour
    };
  }

  async getActivePolls(forceRefresh = false) {
    return etagCache.getWithETag(
      '/polls',
      (url, options) => apiClient.get(url, options.params),
      {
        forceRefresh,
        cacheDuration: this.cacheConfig.polls
      }
    );
  }

  async submitVote(pollId, itemId, deviceInfo) {
    // Submit vote
    const response = await apiClient.post(`/polls/${pollId}/vote`, {
      itemId,
      deviceInfo
    });

    // Invalidate polls cache after voting
    await etagCache.clearByPattern('/polls');

    // Cache vote status
    const voteKey = `vote_${pollId}_${deviceInfo.deviceId}`;
    await AsyncStorage.setItem(voteKey, JSON.stringify({
      voted: true,
      itemId,
      timestamp: Date.now()
    }));

    return response;
  }

  async hasVoted(pollId, deviceId) {
    const voteKey = `vote_${pollId}_${deviceId}`;

    try {
      const voteData = await AsyncStorage.getItem(voteKey);
      if (voteData) {
        const parsed = JSON.parse(voteData);
        return parsed.voted === true;
      }
    } catch (error) {
      console.error('Vote check error:', error);
    }

    return false;
  }
}

export default new CachedPollService();
```

## Cache Hook

```javascript
// hooks/useCache.js
import { useState, useEffect, useCallback } from 'react';
import etagCache from '../utils/etagCache';

export const useCache = (
  fetcher,
  url,
  options = {}
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    params = {},
    cacheDuration = 300000,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled && !forceRefresh) return;

    setLoading(true);
    setError(null);

    try {
      const result = await etagCache.getWithETag(
        url,
        fetcher,
        {
          params,
          forceRefresh,
          cacheDuration
        }
      );

      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err);

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, params, cacheDuration, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh
  };
};
```

## Image Caching

```javascript
// utils/imageCache.js
import FastImage from 'react-native-fast-image';

class ImageCache {
  // Preload images
  async preloadImages(urls) {
    const images = urls.map(url => ({
      uri: url,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable
    }));

    await FastImage.preload(images);
  }

  // Clear image cache
  async clearCache() {
    await FastImage.clearMemoryCache();
    await FastImage.clearDiskCache();
  }

  // Get cache size (iOS only)
  async getCacheSize() {
    // Implementation depends on platform
    return '0 MB';
  }
}

export default new ImageCache();
```

## Cache Configuration by Endpoint

| Endpoint | Cache Duration | Strategy | Invalidation |
|----------|---------------|----------|--------------|
| /config | 1 hour | ETag + Persistent | App restart |
| /polls | 5 minutes | ETag + Memory | After voting |
| /news | 10 minutes | ETag + Persistent | Pull to refresh |
| /news/:id | 30 minutes | ETag + Persistent | Manual refresh |
| /content/cards | 5 minutes | ETag + Memory | Config change |
| /radio | 30 seconds | Memory only | Real-time |
| /radio/schedule | 1 hour | ETag + Persistent | Day change |
| /radio/history | 1 minute | Memory only | New song |

## Cache Management Screen

```javascript
// screens/CacheManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import etagCache from '../utils/etagCache';
import imageCache from '../utils/imageCache';

const CacheManagementScreen = () => {
  const [cacheInfo, setCacheInfo] = useState({
    itemCount: 0,
    sizeInMB: '0'
  });

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    const info = await etagCache.getCacheSize();
    setCacheInfo(info);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Önbelleği Temizle',
      'Tüm önbellek verileri silinecek. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            await etagCache.clearAll();
            await imageCache.clearCache();
            await loadCacheInfo();
            Alert.alert('Başarılı', 'Önbellek temizlendi');
          }
        }
      ]
    );
  };

  const handleClearImages = async () => {
    await imageCache.clearCache();
    Alert.alert('Başarılı', 'Görsel önbelleği temizlendi');
  };

  const handleClearPolls = async () => {
    await etagCache.clearByPattern('/polls');
    await loadCacheInfo();
    Alert.alert('Başarılı', 'Anket önbelleği temizlendi');
  };

  const handleClearNews = async () => {
    await etagCache.clearByPattern('/news');
    await loadCacheInfo();
    Alert.alert('Başarılı', 'Haber önbelleği temizlendi');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Önbellek Bilgisi</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Toplam Öğe:</Text>
          <Text style={styles.value}>{cacheInfo.itemCount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Boyut:</Text>
          <Text style={styles.value}>{cacheInfo.sizeInMB} MB</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Önbellek Yönetimi</Text>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearCache}
        >
          <Text style={styles.buttonText}>Tüm Önbelleği Temizle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleClearImages}
        >
          <Text style={styles.buttonText}>Görsel Önbelleğini Temizle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleClearPolls}
        >
          <Text style={styles.buttonText}>Anket Önbelleğini Temizle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleClearNews}
        >
          <Text style={styles.buttonText}>Haber Önbelleğini Temizle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Önbellek Politikası</Text>
        <Text style={styles.description}>
          • Anketler: 5 dakika{'\n'}
          • Haberler: 10 dakika{'\n'}
          • Kartlar: 5 dakika{'\n'}
          • Yapılandırma: 1 saat{'\n'}
          • Radyo programı: 1 saat
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default CacheManagementScreen;
```

## Offline Support

```javascript
// utils/offlineQueue.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class OfflineQueue {
  constructor() {
    this.queueKey = '@offline_queue';
    this.isProcessing = false;
  }

  async addToQueue(request) {
    const queue = await this.getQueue();
    queue.push({
      ...request,
      timestamp: Date.now(),
      id: Date.now().toString()
    });
    await AsyncStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  async getQueue() {
    try {
      const queue = await AsyncStorage.getItem(this.queueKey);
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }

  async processQueue() {
    if (this.isProcessing) return;

    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    this.isProcessing = true;
    const queue = await this.getQueue();

    for (const request of queue) {
      try {
        // Process request
        await this.executeRequest(request);
        // Remove from queue
        await this.removeFromQueue(request.id);
      } catch (error) {
        console.error('Queue processing error:', error);
      }
    }

    this.isProcessing = false;
  }

  async executeRequest(request) {
    // Implement request execution
    const { method, url, data } = request;
    // Execute API call
  }

  async removeFromQueue(id) {
    const queue = await this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(this.queueKey, JSON.stringify(filtered));
  }
}

export default new OfflineQueue();
```

## Best Practices

1. **Cache Headers**: Always respect cache headers from server
2. **Cache Size**: Monitor and limit cache size to prevent storage issues
3. **Cache Invalidation**: Clear related caches when data changes
4. **Offline First**: Always check cache before making network requests
5. **Progressive Loading**: Show cached data immediately, update when fresh data arrives
6. **Error Handling**: Fallback to cached data on network errors
7. **Cache Expiry**: Implement proper TTL for different data types
8. **User Control**: Provide cache management options in settings