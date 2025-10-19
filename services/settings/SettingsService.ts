/**
 * Settings Service
 * Manages remote configuration and feature flags
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { handleApiResponse, handleApiError } from '../api/client';
import { SETTINGS_ENDPOINTS } from '../api/endpoints';
import type { MobileSettings, SettingsResponse, ApiResponse } from '@/types/api';

class SettingsService {
  private static instance: SettingsService;
  private settings: MobileSettings | null = null;
  private cacheKey = 'mobile_settings';
  private cacheExpiryKey = 'mobile_settings_expiry';
  private listeners = new Set<(settings: MobileSettings) => void>();
  private isLoading = false;
  private loadPromise: Promise<MobileSettings> | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Fetch settings from API
   */
  async fetchSettings(): Promise<MobileSettings> {
    // If already loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this._fetchSettingsInternal();

    try {
      const settings = await this.loadPromise;
      return settings;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Internal fetch implementation
   */
  private async _fetchSettingsInternal(): Promise<MobileSettings> {
    try {
      console.log('Fetching settings from API...');
      const response = await apiClient.get<ApiResponse<MobileSettings>>(
        SETTINGS_ENDPOINTS.GET_CONFIG
      );

      // API returns { success: true, data: MobileSettings }
      if (response.data?.success && response.data?.data) {
        this.settings = response.data.data;
        await this.cacheSettings(this.settings);
        this.notifyListeners();
        console.log('Settings fetched and cached successfully');
        return this.settings;
      } else {
        throw new Error('Invalid settings response');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);

      // Fallback to cached settings
      const cached = await this.getCachedSettings();
      if (cached) {
        console.log('Using cached settings');
        this.settings = cached;
        return cached;
      }

      // If no cache, use defaults
      console.log('Using default settings');
      const defaults = this.getDefaultSettings();
      this.settings = defaults;
      return defaults;
    }
  }

  /**
   * Get cached settings
   */
  async getCachedSettings(): Promise<MobileSettings | null> {
    try {
      const [cached, expiry] = await Promise.all([
        AsyncStorage.getItem(this.cacheKey),
        AsyncStorage.getItem(this.cacheExpiryKey),
      ]);

      if (!cached) {
        return null;
      }

      // Check if cache has expired (7 days)
      if (expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() > expiryTime) {
          console.log('Cache expired, clearing...');
          await this.clearCache();
          return null;
        }
      }

      const settings = JSON.parse(cached) as MobileSettings;
      this.settings = settings;
      return settings;
    } catch (error) {
      console.error('Error loading cached settings:', error);
      return null;
    }
  }

  /**
   * Cache settings with TTL
   */
  async cacheSettings(settings: MobileSettings): Promise<void> {
    try {
      const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      await Promise.all([
        AsyncStorage.setItem(this.cacheKey, JSON.stringify(settings)),
        AsyncStorage.setItem(this.cacheExpiryKey, expiryTime.toString()),
      ]);
    } catch (error) {
      console.error('Error caching settings:', error);
    }
  }

  /**
   * Clear cached settings
   */
  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.cacheKey),
        AsyncStorage.removeItem(this.cacheExpiryKey),
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings(): MobileSettings {
    return {
      // Poll Settings
      enablePolls: true,
      showOnlyLastActivePoll: false,

      // News Settings
      enableNews: true,
      maxNewsCount: 100,

      // Player Settings
      playerLogoUrl: null,
      enableLiveInfo: true,
      playerFacebookUrl: null,
      playerInstagramUrl: null,
      playerWhatsappNumber: null,
      liveCallPhoneNumber: null,

      // Card Settings
      maxFeaturedCards: 5,
      cardDisplayMode: 'grid',
      enableCardAnimation: false,

      // App Settings
      minimumAppVersion: '1.0.0',
      maintenanceMode: false,

      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get current settings (from memory, cache, or defaults)
   */
  async getSettings(): Promise<MobileSettings> {
    if (this.settings) {
      return this.settings;
    }

    const cached = await this.getCachedSettings();
    if (cached) {
      return cached;
    }

    return this.getDefaultSettings();
  }

  /**
   * Force refresh settings from API
   */
  async refreshSettings(): Promise<MobileSettings> {
    await this.clearCache();
    this.settings = null;
    return this.fetchSettings();
  }

  /**
   * Subscribe to settings updates
   */
  subscribe(listener: (settings: MobileSettings) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current settings if available
    if (this.settings) {
      listener(this.settings);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of settings changes
   */
  private notifyListeners(): void {
    if (this.settings) {
      this.listeners.forEach(listener => listener(this.settings!));
    }
  }

  // ============= Helper Methods =============

  /**
   * Check if polls feature is enabled
   */
  isPollsEnabled(): boolean {
    return this.settings?.enablePolls ?? true;
  }

  /**
   * Check if news feature is enabled
   */
  isNewsEnabled(): boolean {
    return this.settings?.enableNews ?? true;
  }

  /**
   * Check if live info display is enabled
   */
  isLiveInfoEnabled(): boolean {
    return this.settings?.enableLiveInfo ?? true;
  }

  /**
   * Check if app is in maintenance mode
   */
  isMaintenanceMode(): boolean {
    return this.settings?.maintenanceMode ?? false;
  }

  /**
   * Get social media links
   */
  getSocialLinks() {
    return {
      facebook: this.settings?.playerFacebookUrl || null,
      instagram: this.settings?.playerInstagramUrl || null,
      whatsapp: this.settings?.playerWhatsappNumber || null,
      liveCall: this.settings?.liveCallPhoneNumber || null,
    };
  }

  /**
   * Get player logo URL
   */
  getPlayerLogo(): string | null {
    return this.settings?.playerLogoUrl || null;
  }

  /**
   * Get card display settings
   */
  getCardSettings() {
    return {
      maxFeatured: this.settings?.maxFeaturedCards ?? 5,
      displayMode: this.settings?.cardDisplayMode ?? 'grid',
      animated: this.settings?.enableCardAnimation ?? false,
    };
  }

  /**
   * Get news settings
   */
  getNewsSettings() {
    return {
      enabled: this.isNewsEnabled(),
      maxCount: this.settings?.maxNewsCount ?? 100,
    };
  }

  /**
   * Get poll settings
   */
  getPollSettings() {
    return {
      enabled: this.isPollsEnabled(),
      showOnlyLastActive: this.settings?.showOnlyLastActivePoll ?? false,
    };
  }

  /**
   * Check if minimum app version requirement is met
   */
  isVersionSupported(currentVersion: string): boolean {
    if (!this.settings?.minimumAppVersion) {
      return true;
    }

    const parseVersion = (v: string) => v.split('.').map(n => parseInt(n) || 0);
    const current = parseVersion(currentVersion);
    const minimum = parseVersion(this.settings.minimumAppVersion);

    for (let i = 0; i < Math.max(current.length, minimum.length); i++) {
      const currentPart = current[i] || 0;
      const minimumPart = minimum[i] || 0;

      if (currentPart > minimumPart) return true;
      if (currentPart < minimumPart) return false;
    }

    return true; // Versions are equal
  }

  /**
   * Get all feature flags
   */
  getFeatureFlags() {
    return {
      polls: this.isPollsEnabled(),
      news: this.isNewsEnabled(),
      liveInfo: this.isLiveInfoEnabled(),
      maintenance: this.isMaintenanceMode(),
      cardAnimation: this.settings?.enableCardAnimation ?? false,
    };
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: 'polls' | 'news' | 'liveInfo' | 'cardAnimation'): boolean {
    const flags = this.getFeatureFlags();
    return flags[feature] ?? false;
  }
}

// Export singleton instance
export default SettingsService.getInstance();