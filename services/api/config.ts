/**
 * Config API Service
 * Handles app configuration and settings from API
 */

import apiClient, { handleApiResponse } from './client';
import { buildUrl } from './endpoints';
import { apiCache, CACHE_KEYS, CACHE_TTL } from '@/services/cache/apiCache';
import { ApiResponse } from '@/types/api';

// Config endpoints
const CONFIG_ENDPOINTS = {
  GET_APP_CONFIG: '/config'
} as const;

export interface AppConfig {
  version: string;
  minimumVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  features: {
    polls: boolean;
    news: boolean;
    cards: boolean;
    radio: boolean;
    sponsors: boolean;
  };
  socialLinks: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  termsUrl?: string;
  privacyUrl?: string;
}

class ConfigApiService {
  /**
   * Get app configuration with caching
   */
  async getAppConfig(forceRefresh = false): Promise<AppConfig> {
    // Try cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = await apiCache.get<AppConfig>(CACHE_KEYS.APP_CONFIG);
      if (cached) {
        console.log('Using cached app config');
        return cached;
      }
    }

    try {
      const response = await apiClient.get<ApiResponse<AppConfig>>(
        buildUrl(CONFIG_ENDPOINTS.GET_APP_CONFIG)
      );

      const config = handleApiResponse(response);

      // Cache the configuration
      await apiCache.set(CACHE_KEYS.APP_CONFIG, config, CACHE_TTL.CONFIG);

      console.log('App config fetched from API');
      return config;
    } catch (error) {
      console.error('Error fetching app config:', error);

      // Try expired cache as fallback
      const expiredCache = await apiCache.get<AppConfig>(CACHE_KEYS.APP_CONFIG);
      if (expiredCache) {
        console.log('Using expired app config due to error');
        return expiredCache;
      }

      // Return default config as last resort
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AppConfig {
    return {
      version: '1.0.0',
      minimumVersion: '1.0.0',
      maintenanceMode: false,
      features: {
        polls: true,
        news: true,
        cards: true,
        radio: true,
        sponsors: true,
      },
      socialLinks: {
        twitter: 'https://twitter.com/trendankara',
        instagram: 'https://instagram.com/trendankara',
        facebook: 'https://facebook.com/trendankara',
        youtube: 'https://youtube.com/@trendankara',
      },
      contactInfo: {
        email: 'info@trendankara.com',
      },
    };
  }

  /**
   * Check if app needs update
   */
  async checkForUpdate(currentVersion: string): Promise<{
    needsUpdate: boolean;
    forceUpdate: boolean;
    latestVersion: string;
  }> {
    try {
      const config = await this.getAppConfig();

      const needsUpdate = this.compareVersions(currentVersion, config.version) < 0;
      const forceUpdate = this.compareVersions(currentVersion, config.minimumVersion) < 0;

      return {
        needsUpdate,
        forceUpdate,
        latestVersion: config.version,
      };
    } catch (error) {
      console.error('Error checking for update:', error);
      return {
        needsUpdate: false,
        forceUpdate: false,
        latestVersion: currentVersion,
      };
    }
  }

  /**
   * Compare version strings
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }
}

export const configApi = new ConfigApiService();
export default configApi;