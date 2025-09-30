/**
 * Settings Slice
 * Redux state management for app settings
 * Trend Ankara Mobile Application
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MobileSettings } from '@/types/api';
import SettingsService from '@/services/settings/SettingsService';

// Theme configuration
export type ThemeMode = 'light' | 'dark' | 'system';

// Audio quality options
export type AudioQuality = 'low' | 'medium' | 'high';

// Local user preferences (stored in Redux)
interface UserPreferences {
  theme: ThemeMode;
  audioQuality: AudioQuality;
  autoPlayOnStart: boolean;
  backgroundPlayEnabled: boolean;
  notificationsEnabled: boolean;
  dataUsageWarning: boolean;
  onboardingCompleted: boolean;
  cacheSize: number; // in MB
  clearCacheOnClose: boolean;
}

// Notification settings
interface NotificationSettings {
  enabled: boolean;
  newPolls: boolean;
  newsUpdates: boolean;
  playerUpdates: boolean;
  maintenanceAlerts: boolean;
}

// Settings state
interface SettingsState {
  // Remote settings from API
  remoteSettings: MobileSettings | null;

  // Local user preferences
  userPreferences: UserPreferences;

  // Notification settings
  notifications: NotificationSettings;

  // Loading and error states
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  lastSynced: number | null;

  // Feature flags (computed from remote + local settings)
  features: {
    polls: boolean;
    news: boolean;
    liveInfo: boolean;
    cards: boolean;
    analytics: boolean;
  };
}

// Initial state
const initialState: SettingsState = {
  remoteSettings: null,
  userPreferences: {
    theme: 'system',
    audioQuality: 'high',
    autoPlayOnStart: false,
    backgroundPlayEnabled: true,
    notificationsEnabled: true,
    dataUsageWarning: true,
    onboardingCompleted: false,
    cacheSize: 100, // 100 MB default
    clearCacheOnClose: false,
  },
  notifications: {
    enabled: true,
    newPolls: true,
    newsUpdates: true,
    playerUpdates: false,
    maintenanceAlerts: true,
  },
  isLoading: false,
  isLoaded: false,
  error: null,
  lastSynced: null,
  features: {
    polls: true,
    news: true,
    liveInfo: true,
    cards: true,
    analytics: false,
  },
};

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      // Load remote settings from SettingsService
      const remoteSettings = await SettingsService.getSettings();

      return {
        remoteSettings,
        timestamp: Date.now(),
      };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to load settings',
        timestamp: Date.now(),
      });
    }
  }
);

export const refreshSettings = createAsyncThunk(
  'settings/refreshSettings',
  async (_, { rejectWithValue }) => {
    try {
      // Force refresh from API
      const remoteSettings = await SettingsService.refreshSettings();

      return {
        remoteSettings,
        timestamp: Date.now(),
      };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to refresh settings',
        timestamp: Date.now(),
      });
    }
  }
);

export const syncSettings = createAsyncThunk(
  'settings/syncSettings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };

      // In a real app, this would sync local preferences to backend
      console.log('Syncing settings:', state.settings.userPreferences);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to sync settings',
        timestamp: Date.now(),
      });
    }
  }
);

// Settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // User preferences
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.userPreferences.theme = action.payload;
    },

    setAudioQuality: (state, action: PayloadAction<AudioQuality>) => {
      state.userPreferences.audioQuality = action.payload;
    },

    setAutoPlayOnStart: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.autoPlayOnStart = action.payload;
    },

    setBackgroundPlayEnabled: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.backgroundPlayEnabled = action.payload;
    },

    setDataUsageWarning: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.dataUsageWarning = action.payload;
    },

    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.onboardingCompleted = action.payload;
    },

    setCacheSize: (state, action: PayloadAction<number>) => {
      state.userPreferences.cacheSize = Math.max(50, Math.min(500, action.payload));
    },

    setClearCacheOnClose: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.clearCacheOnClose = action.payload;
    },

    // Notification settings
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notifications.enabled = action.payload;
      state.userPreferences.notificationsEnabled = action.payload;
    },

    setNotificationSetting: (
      state,
      action: PayloadAction<{ key: keyof NotificationSettings; value: boolean }>
    ) => {
      const { key, value } = action.payload;
      state.notifications[key] = value;
    },

    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },

    // Feature flags
    updateFeatureFlags: (state) => {
      const remote = state.remoteSettings;
      if (remote) {
        state.features = {
          polls: remote.enablePolls,
          news: remote.enableNews,
          liveInfo: remote.enableLiveInfo,
          cards: true, // Always enabled for now
          analytics: !__DEV__, // Disabled in development
        };
      }
    },

    // Error handling
    clearError: (state) => {
      state.error = null;
    },

    // Reset to defaults
    resetUserPreferences: (state) => {
      state.userPreferences = initialState.userPreferences;
    },

    resetNotificationSettings: (state) => {
      state.notifications = initialState.notifications;
    },

    // Bulk update preferences
    updateUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.userPreferences = { ...state.userPreferences, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Load settings
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoaded = true;
        state.remoteSettings = action.payload.remoteSettings;
        state.lastSynced = action.payload.timestamp;
        state.error = null;

        // Update feature flags based on remote settings
        settingsSlice.caseReducers.updateFeatureFlags(state);
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load settings';

        // Use default feature flags if remote settings fail
        state.features = initialState.features;
      });

    // Refresh settings
    builder
      .addCase(refreshSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.remoteSettings = action.payload.remoteSettings;
        state.lastSynced = action.payload.timestamp;
        state.error = null;

        // Update feature flags
        settingsSlice.caseReducers.updateFeatureFlags(state);
      })
      .addCase(refreshSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to refresh settings';
      });

    // Sync settings
    builder
      .addCase(syncSettings.pending, (state) => {
        // Don't show loading for sync operations
      })
      .addCase(syncSettings.fulfilled, (state, action) => {
        state.lastSynced = action.payload.timestamp;
        state.error = null;
      })
      .addCase(syncSettings.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to sync settings';
      });
  },
});

// Export actions
export const {
  setTheme,
  setAudioQuality,
  setAutoPlayOnStart,
  setBackgroundPlayEnabled,
  setDataUsageWarning,
  setOnboardingCompleted,
  setCacheSize,
  setClearCacheOnClose,
  setNotificationsEnabled,
  setNotificationSetting,
  updateNotificationSettings,
  updateFeatureFlags,
  clearError,
  resetUserPreferences,
  resetNotificationSettings,
  updateUserPreferences,
} = settingsSlice.actions;

// Selectors
export const selectSettings = (state: { settings: SettingsState }) => state.settings;
export const selectUserPreferences = (state: { settings: SettingsState }) => state.settings.userPreferences;
export const selectNotificationSettings = (state: { settings: SettingsState }) => state.settings.notifications;
export const selectFeatureFlags = (state: { settings: SettingsState }) => state.settings.features;
export const selectRemoteSettings = (state: { settings: SettingsState }) => state.settings.remoteSettings;
export const selectIsSettingsLoaded = (state: { settings: SettingsState }) => state.settings.isLoaded;

// Export reducer
export default settingsSlice.reducer;

/**
 * Settings Slice Features:
 *
 * Remote Settings:
 * - Sync with SettingsService
 * - Feature flag management
 * - Admin-controlled configuration
 * - Maintenance mode detection
 *
 * User Preferences:
 * - Theme selection (light/dark/system)
 * - Audio quality settings
 * - Playback preferences
 * - Cache management
 * - Onboarding state
 *
 * Notifications:
 * - Global notification toggle
 * - Granular notification settings
 * - Push notification preferences
 *
 * Features:
 * - Automatic feature flag updates
 * - Graceful degradation on errors
 * - Local-first approach with sync
 * - Development/production variants
 */