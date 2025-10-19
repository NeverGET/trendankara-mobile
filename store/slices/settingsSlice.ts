/**
 * Settings Slice
 * Redux state management for app settings
 * Trend Ankara Mobile Application
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createMigrate, PersistConfig } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileSettings } from '@/types/api';
import SettingsService from '@/services/settings/SettingsService';

// Local user preferences (stored in Redux)
interface UserPreferences {
  useSystemTheme: boolean;
  isDarkMode: boolean;
  backgroundPlayEnabled: boolean;
  autoPlayOnStart: boolean;
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
    useSystemTheme: true,
    isDarkMode: false,
    backgroundPlayEnabled: true,
    autoPlayOnStart: false,
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
    setUseSystemTheme: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.useSystemTheme = action.payload;
    },

    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.isDarkMode = action.payload;
    },

    setBackgroundPlayEnabled: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.backgroundPlayEnabled = action.payload;
    },

    setAutoPlayOnStart: (state, action: PayloadAction<boolean>) => {
      state.userPreferences.autoPlayOnStart = action.payload;
    },

    // Notification settings
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notifications.enabled = action.payload;
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
  setUseSystemTheme,
  setIsDarkMode,
  setBackgroundPlayEnabled,
  setAutoPlayOnStart,
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
 * Redux Persist Migration Configuration
 * Handles backward compatibility with old settings structure
 */

// Old settings state structure (for migration reference)
interface LegacySettingsState {
  userPreferences?: {
    theme?: 'light' | 'dark' | 'system';
    backgroundPlayEnabled?: boolean;
    autoPlayOnStart?: boolean;
    audioQuality?: string;
    notificationsEnabled?: boolean;
    cacheSize?: number;
  };
  // ... other legacy fields
}

// Migration functions
const migrations = {
  // Version 1: Transform old theme format to new useSystemTheme/isDarkMode format
  1: (state: unknown): SettingsState => {
    // Type guard and safe casting
    const legacyState = state as LegacySettingsState;
    const oldPreferences = legacyState.userPreferences || {};

    // Map old theme setting to new format
    let useSystemTheme = true;
    let isDarkMode = false;

    if (oldPreferences.theme) {
      switch (oldPreferences.theme) {
        case 'system':
          useSystemTheme = true;
          isDarkMode = false; // Will be determined by system
          break;
        case 'dark':
          useSystemTheme = false;
          isDarkMode = true;
          break;
        case 'light':
          useSystemTheme = false;
          isDarkMode = false;
          break;
        default:
          // Unknown theme, use defaults
          useSystemTheme = true;
          isDarkMode = false;
      }
    }

    // Create new state structure
    const newState: SettingsState = {
      ...initialState,
      userPreferences: {
        useSystemTheme,
        isDarkMode,
        // Migrate existing values or use defaults
        backgroundPlayEnabled: oldPreferences.backgroundPlayEnabled ?? initialState.userPreferences.backgroundPlayEnabled,
        autoPlayOnStart: oldPreferences.autoPlayOnStart ?? initialState.userPreferences.autoPlayOnStart,
      },
      // Preserve notification settings if they exist in old structure
      notifications: oldPreferences.notificationsEnabled !== undefined
        ? {
            ...initialState.notifications,
            enabled: oldPreferences.notificationsEnabled,
          }
        : initialState.notifications,
      // Preserve other state fields if they exist
      remoteSettings: (legacyState as unknown as SettingsState).remoteSettings || null,
      isLoading: (legacyState as unknown as SettingsState).isLoading || false,
      isLoaded: (legacyState as unknown as SettingsState).isLoaded || false,
      error: (legacyState as unknown as SettingsState).error || null,
      lastSynced: (legacyState as unknown as SettingsState).lastSynced || null,
      features: (legacyState as unknown as SettingsState).features || initialState.features,
    };

    return newState;
  },
};

// Export persist configuration
export const settingsPersistConfig: PersistConfig<SettingsState> = {
  key: 'settings',
  version: 1,
  storage: AsyncStorage,
  migrate: createMigrate(migrations, { debug: __DEV__ }),
};

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
 * - System theme preference (useSystemTheme)
 * - Manual dark/light mode toggle (isDarkMode)
 * - Background playback control (backgroundPlayEnabled)
 * - Autoplay on launch (autoPlayOnStart)
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
 *
 * Migration:
 * - Version 1: Transforms old theme format (light/dark/system) to new useSystemTheme/isDarkMode structure
 * - Preserves backgroundPlayEnabled and autoPlayOnStart settings
 * - Removes deprecated settings (audioQuality, cacheSize)
 * - No data loss for core functionality
 */