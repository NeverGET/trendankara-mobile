import { radioApi, RadioConfig, RadioConfigResponse } from '@/services/api/radio';
import { apiCache, CACHE_KEYS, CACHE_TTL } from '@/services/cache/apiCache';
import apiClient from '@/services/api/client';

// Mock dependencies
jest.mock('@/services/api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('@/services/cache/apiCache', () => ({
  apiCache: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  },
  CACHE_KEYS: {
    RADIO_CONFIG: 'radio_config',
  },
  CACHE_TTL: {
    RADIO_CONFIG: 5 * 60 * 1000, // 5 minutes
  },
}));

jest.mock('@/services/api/endpoints', () => ({
  RADIO_ENDPOINTS: {
    GET_RADIO_CONFIG: '/api/radio/config',
    GET_STREAM_STATUS: '/api/radio/status',
    REPORT_STREAM_ERROR: '/api/radio/error',
  },
  buildUrl: jest.fn((endpoint: string) => endpoint),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockApiCache = apiCache as jest.Mocked<typeof apiCache>;

describe('Background Refresh with radioApi', () => {
  const mockRadioConfig: RadioConfig = {
    stream_url: 'https://example.com/stream',
    metadata_url: 'https://example.com/metadata',
    station_name: 'Test Radio Station',
    connection_status: 'active',
    last_tested: '2024-01-01T00:00:00Z',
    playerLogoUrl: 'https://example.com/logo.png',
  };

  const mockApiResponse: RadioConfigResponse = {
    success: true,
    data: mockRadioConfig,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful refresh cycle', () => {
    it('should fetch radio config from API when no cache exists', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      const result = await radioApi.getRadioConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/radio/config');
      expect(mockApiCache.set).toHaveBeenCalledWith(
        CACHE_KEYS.RADIO_CONFIG,
        mockRadioConfig,
        CACHE_TTL.RADIO_CONFIG
      );
      expect(result).toEqual(mockRadioConfig);
    });

    it('should return cached config when available and not forcing refresh', async () => {
      mockApiCache.get.mockResolvedValue(mockRadioConfig);

      const result = await radioApi.getRadioConfig(false);

      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockRadioConfig);
      expect(console.log).toHaveBeenCalledWith('Using cached radio config:', mockRadioConfig);
    });

    it('should force refresh when explicitly requested', async () => {
      mockApiCache.get.mockResolvedValue(mockRadioConfig);
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      const result = await radioApi.getRadioConfig(true);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/radio/config');
      expect(mockApiCache.set).toHaveBeenCalledWith(
        CACHE_KEYS.RADIO_CONFIG,
        mockRadioConfig,
        CACHE_TTL.RADIO_CONFIG
      );
      expect(result).toEqual(mockRadioConfig);
    });

    it('should log successful API fetch', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      await radioApi.getRadioConfig();

      expect(console.log).toHaveBeenCalledWith('Radio config fetched from API:', mockRadioConfig);
    });

    it('should cache successful API responses', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      await radioApi.getRadioConfig();

      expect(mockApiCache.set).toHaveBeenCalledWith(
        CACHE_KEYS.RADIO_CONFIG,
        mockRadioConfig,
        CACHE_TTL.RADIO_CONFIG
      );
    });
  });

  describe('Error handling', () => {
    it('should use expired cache as fallback when API fails', async () => {
      const expiredConfig = { ...mockRadioConfig, station_name: 'Expired Station' };

      mockApiCache.get
        .mockResolvedValueOnce(null) // First call (fresh cache check)
        .mockResolvedValueOnce(expiredConfig); // Second call (expired cache fallback)

      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await radioApi.getRadioConfig();

      expect(result).toEqual(expiredConfig);
      expect(console.error).toHaveBeenCalledWith('Error fetching radio config:', expect.any(Error));
      expect(console.log).toHaveBeenCalledWith('Using expired cache due to network error');
    });

    it('should use fallback config when both API and cache fail', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await radioApi.getRadioConfig();

      expect(result).toEqual({
        stream_url: 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
        station_name: 'Trend Ankara Radyo',
        connection_status: 'active',
        last_tested: expect.any(String),
      });
      expect(console.log).toHaveBeenCalledWith('Using fallback radio configuration');
    });

    it('should cache fallback config with short TTL', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await radioApi.getRadioConfig();

      expect(mockApiCache.set).toHaveBeenCalledWith(
        CACHE_KEYS.RADIO_CONFIG,
        expect.objectContaining({
          stream_url: 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
          station_name: 'Trend Ankara Radyo',
        }),
        5 * 60 * 1000 // 5 minutes
      );
    });

    it('should handle invalid API response format', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockResolvedValue({
        data: { success: false, data: null }
      });

      const result = await radioApi.getRadioConfig();

      expect(result).toEqual(expect.objectContaining({
        station_name: 'Trend Ankara Radyo',
        connection_status: 'active',
      }));
      expect(console.log).toHaveBeenCalledWith('Using fallback radio configuration');
    });

    it('should handle missing data in API response', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: null }
      });

      const result = await radioApi.getRadioConfig();

      expect(result).toEqual(expect.objectContaining({
        station_name: 'Trend Ankara Radyo',
        connection_status: 'active',
      }));
    });

    it('should handle network timeout errors', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      });

      const result = await radioApi.getRadioConfig();

      expect(result).toEqual(expect.objectContaining({
        station_name: 'Trend Ankara Radyo',
      }));
      expect(console.error).toHaveBeenCalledWith('Error fetching radio config:', expect.any(Object));
    });
  });

  describe('Background refresh scenarios', () => {
    it('should handle background refresh with cache hit', async () => {
      mockApiCache.get.mockResolvedValue(mockRadioConfig);

      // Simulate background refresh (not forcing)
      const result = await radioApi.getRadioConfig(false);

      expect(result).toEqual(mockRadioConfig);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('should handle background refresh with cache miss', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      // Simulate background refresh with cache miss
      const result = await radioApi.getRadioConfig(false);

      expect(result).toEqual(mockRadioConfig);
      expect(mockApiClient.get).toHaveBeenCalled();
      expect(mockApiCache.set).toHaveBeenCalled();
    });

    it('should handle periodic forced refresh', async () => {
      mockApiCache.get.mockResolvedValue(mockRadioConfig);
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      // Simulate periodic forced refresh
      const result = await radioApi.getRadioConfig(true);

      expect(result).toEqual(mockRadioConfig);
      expect(mockApiClient.get).toHaveBeenCalled();
      expect(mockApiCache.set).toHaveBeenCalled();
    });

    it('should handle multiple concurrent refresh requests', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      // Simulate multiple concurrent requests
      const promises = [
        radioApi.getRadioConfig(),
        radioApi.getRadioConfig(),
        radioApi.getRadioConfig(),
      ];

      const results = await Promise.all(promises);

      // All should return the same config
      results.forEach(result => {
        expect(result).toEqual(mockRadioConfig);
      });

      // API should be called for each request (no request deduplication in current implementation)
      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Stream status and error reporting', () => {
    it('should fetch stream status successfully', async () => {
      const mockStatusResponse = { status: 'live', listeners: 100 };
      mockApiClient.get.mockResolvedValue({ data: mockStatusResponse });

      const result = await radioApi.getStreamStatus();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/radio/status');
      expect(result).toEqual(mockStatusResponse);
    });

    it('should handle stream status fetch errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Status fetch failed'));

      const result = await radioApi.getStreamStatus();

      expect(result).toEqual({ status: 'unknown' });
      expect(console.error).toHaveBeenCalledWith('Error fetching stream status:', expect.any(Error));
    });

    it('should report stream errors successfully', async () => {
      const errorReport = {
        message: 'Stream connection failed',
        code: 'STREAM_ERROR',
      };

      mockApiClient.post.mockResolvedValue({ data: { success: true } });

      await radioApi.reportStreamError(errorReport);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/radio/error',
        expect.objectContaining({
          ...errorReport,
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle error reporting failures gracefully', async () => {
      const errorReport = {
        message: 'Stream connection failed',
        code: 'STREAM_ERROR',
      };

      mockApiClient.post.mockRejectedValue(new Error('Report failed'));

      // Should not throw
      await expect(radioApi.reportStreamError(errorReport)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalledWith('Error reporting stream error:', expect.any(Error));
    });
  });

  describe('Cache integration', () => {
    it('should respect cache TTL for normal operations', async () => {
      mockApiCache.get.mockResolvedValue(mockRadioConfig);

      await radioApi.getRadioConfig();

      expect(mockApiCache.get).toHaveBeenCalledWith(CACHE_KEYS.RADIO_CONFIG);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('should handle cache failures gracefully', async () => {
      mockApiCache.get.mockRejectedValue(new Error('Cache error'));
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      const result = await radioApi.getRadioConfig();

      expect(result).toEqual(mockRadioConfig);
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    it('should handle cache set failures gracefully', async () => {
      mockApiCache.get.mockResolvedValue(null);
      mockApiCache.set.mockRejectedValue(new Error('Cache set error'));
      mockApiClient.get.mockResolvedValue({ data: mockApiResponse });

      const result = await radioApi.getRadioConfig();

      expect(result).toEqual(mockRadioConfig);
      // Should still attempt to cache despite the error
      expect(mockApiCache.set).toHaveBeenCalled();
    });
  });
});