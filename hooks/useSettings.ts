/**
 * useSettings Hook
 * React hook for accessing and managing app settings
 */

import { useEffect, useState, useCallback } from 'react';
import SettingsService from '@/services/settings/SettingsService';
import type { MobileSettings } from '@/types/api';

interface UseSettingsReturn {
  settings: MobileSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Feature flags
  isPollsEnabled: boolean;
  isNewsEnabled: boolean;
  isLiveInfoEnabled: boolean;
  isMaintenanceMode: boolean;

  // Settings data
  socialLinks: ReturnType<typeof SettingsService.getSocialLinks>;
  playerLogo: string | null;
  cardSettings: ReturnType<typeof SettingsService.getCardSettings>;
  newsSettings: ReturnType<typeof SettingsService.getNewsSettings>;
  pollSettings: ReturnType<typeof SettingsService.getPollSettings>;
  featureFlags: ReturnType<typeof SettingsService.getFeatureFlags>;
}

/**
 * Hook for accessing app settings
 */
export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<MobileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get cached settings first for immediate display
        const cached = await SettingsService.getSettings();
        if (cached && mounted) {
          setSettings(cached);
          setLoading(false);
        }

        // Then fetch fresh settings from API
        const fresh = await SettingsService.fetchSettings();
        if (mounted) {
          setSettings(fresh);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load settings');

          // Try to use defaults if everything fails
          const defaults = SettingsService.getDefaultSettings();
          setSettings(defaults);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    // Subscribe to settings updates
    const unsubscribe = SettingsService.subscribe((newSettings) => {
      if (mounted) {
        setSettings(newSettings);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Refetch settings
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fresh = await SettingsService.refreshSettings();
      setSettings(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute derived values
  const isPollsEnabled = settings?.enablePolls ?? true;
  const isNewsEnabled = settings?.enableNews ?? true;
  const isLiveInfoEnabled = settings?.enableLiveInfo ?? true;
  const isMaintenanceMode = settings?.maintenanceMode ?? false;

  const socialLinks = {
    facebook: settings?.playerFacebookUrl || null,
    instagram: settings?.playerInstagramUrl || null,
    whatsapp: settings?.playerWhatsappNumber || null,
    liveCall: settings?.liveCallPhoneNumber || null,
  };

  const playerLogo = settings?.playerLogoUrl || null;

  const cardSettings = {
    maxFeatured: settings?.maxFeaturedCards ?? 5,
    displayMode: settings?.cardDisplayMode ?? 'grid',
    animated: settings?.enableCardAnimation ?? false,
  };

  const newsSettings = {
    enabled: isNewsEnabled,
    maxCount: settings?.maxNewsCount ?? 100,
  };

  const pollSettings = {
    enabled: isPollsEnabled,
    showOnlyLastActive: settings?.showOnlyLastActivePoll ?? false,
  };

  const featureFlags = {
    polls: isPollsEnabled,
    news: isNewsEnabled,
    liveInfo: isLiveInfoEnabled,
    maintenance: isMaintenanceMode,
    cardAnimation: settings?.enableCardAnimation ?? false,
  };

  return {
    settings,
    loading,
    error,
    refetch,
    isPollsEnabled,
    isNewsEnabled,
    isLiveInfoEnabled,
    isMaintenanceMode,
    socialLinks,
    playerLogo,
    cardSettings,
    newsSettings,
    pollSettings,
    featureFlags,
  };
};

/**
 * Hook for checking if a specific feature is enabled
 */
export const useFeatureFlag = (feature: keyof ReturnType<typeof SettingsService.getFeatureFlags>): boolean => {
  const { featureFlags } = useSettings();
  return featureFlags[feature] ?? false;
};

/**
 * Hook for checking maintenance mode
 */
export const useMaintenanceMode = (): { isMaintenanceMode: boolean; loading: boolean } => {
  const { isMaintenanceMode, loading } = useSettings();
  return { isMaintenanceMode, loading };
};

/**
 * Hook for getting social links
 */
export const useSocialLinks = () => {
  const { socialLinks } = useSettings();
  return socialLinks;
};

/**
 * Hook for getting card display settings
 */
export const useCardSettings = () => {
  const { cardSettings } = useSettings();
  return cardSettings;
};