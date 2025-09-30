/**
 * Radio API Service
 * Handles radio configuration and stream management
 */

import apiClient from './client';
import { RADIO_ENDPOINTS, buildUrl } from './endpoints';
import { apiCache, CACHE_KEYS, CACHE_TTL } from '@/services/cache/apiCache';

export interface RadioConfig {
  stream_url: string;
  metadata_url?: string;
  station_name: string;
  connection_status: 'active' | 'inactive';
  last_tested: string;
  playerLogoUrl?: string;
}

export interface RadioConfigResponse {
  success: boolean;
  data: RadioConfig;
}

// Hardcoded fallback configuration
const FALLBACK_RADIO_CONFIG: RadioConfig = {
  stream_url: 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service', // Test fallback stream
  station_name: 'Trend Ankara Radyo',
  connection_status: 'active',
  last_tested: new Date().toISOString(),
};

class RadioApiService {
  /**
   * Get radio configuration from API with caching
   */
  async getRadioConfig(forceRefresh = false): Promise<RadioConfig> {
    // If not forcing refresh, try cache first
    if (!forceRefresh) {
      const cached = await apiCache.get<RadioConfig>(CACHE_KEYS.RADIO_CONFIG);
      if (cached) {
        console.log('Using cached radio config:', cached);
        return cached;
      }
    }

    try {
      const response = await apiClient.get<RadioConfigResponse>(
        buildUrl(RADIO_ENDPOINTS.GET_RADIO_CONFIG)
      );

      if (response.data.success && response.data.data) {
        const config = response.data.data;

        // Log the fetched configuration
        console.log('Radio config fetched from API:', config);

        // Cache the configuration
        await apiCache.set(CACHE_KEYS.RADIO_CONFIG, config, CACHE_TTL.RADIO_CONFIG);

        return config;
      }

      throw new Error('Invalid radio configuration response');
    } catch (error) {
      console.error('Error fetching radio config:', error);

      // Try to get expired cache as fallback
      const expiredCache = await apiCache.get<RadioConfig>(CACHE_KEYS.RADIO_CONFIG);
      if (expiredCache) {
        console.log('Using expired cache due to network error');
        return expiredCache;
      }

      // Return hardcoded fallback configuration if everything fails
      console.log('Using fallback radio configuration');

      // Cache the fallback for short duration
      await apiCache.set(CACHE_KEYS.RADIO_CONFIG, FALLBACK_RADIO_CONFIG, 5 * 60 * 1000);

      return FALLBACK_RADIO_CONFIG;
    }
  }

  /**
   * Get stream status
   */
  async getStreamStatus() {
    try {
      const response = await apiClient.get(
        buildUrl(RADIO_ENDPOINTS.GET_STREAM_STATUS)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching stream status:', error);
      return { status: 'unknown' };
    }
  }

  /**
   * Report stream error
   */
  async reportStreamError(error: {
    message: string;
    code?: string;
    timestamp?: string;
  }) {
    try {
      await apiClient.post(
        buildUrl(RADIO_ENDPOINTS.REPORT_STREAM_ERROR),
        {
          ...error,
          timestamp: error.timestamp || new Date().toISOString(),
        }
      );
    } catch (err) {
      console.error('Error reporting stream error:', err);
    }
  }
}

export const radioApi = new RadioApiService();
export default radioApi;