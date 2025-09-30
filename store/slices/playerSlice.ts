/**
 * Player Slice
 * Redux state management for audio player
 * Trend Ankara Mobile Application
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PlayerState, TrackInfo } from '@/types/models';

// Extended player state for Redux
interface ReduxPlayerState extends PlayerState {
  volume: number;
  isMuted: boolean;
  repeatMode: 'none' | 'all' | 'one';
  isBuffering: boolean;
  position: number;
  duration: number;
  networkState: 'online' | 'offline' | 'reconnecting';
  autoPlayOnStart: boolean;
  lastError: {
    message: string;
    timestamp: number;
  } | null;
}

// Initial state
const initialState: ReduxPlayerState = {
  isPlaying: false,
  isLoading: false,
  isBuffering: false,
  error: null,
  currentTrack: null,
  volume: 1.0,
  isMuted: false,
  repeatMode: 'none',
  position: 0,
  duration: 0,
  networkState: 'online',
  autoPlayOnStart: false,
  lastError: null,
};

// Async thunks for player actions
export const playAudio = createAsyncThunk(
  'player/playAudio',
  async (streamUrl?: string, { rejectWithValue }) => {
    try {
      // This would integrate with VideoPlayerService
      // For now, we'll use a mock implementation
      console.log('Playing audio:', streamUrl);

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        streamUrl: streamUrl || 'https://stream.trendankara.com/live',
      };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to play audio',
        timestamp: Date.now(),
      });
    }
  }
);

export const pauseAudio = createAsyncThunk(
  'player/pauseAudio',
  async (_, { rejectWithValue }) => {
    try {
      // This would integrate with VideoPlayerService
      console.log('Pausing audio');

      await new Promise(resolve => setTimeout(resolve, 50));

      return { success: true };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to pause audio',
        timestamp: Date.now(),
      });
    }
  }
);

export const stopAudio = createAsyncThunk(
  'player/stopAudio',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Stopping audio');

      await new Promise(resolve => setTimeout(resolve, 50));

      return { success: true };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to stop audio',
        timestamp: Date.now(),
      });
    }
  }
);

export const setVolume = createAsyncThunk(
  'player/setVolume',
  async (volume: number, { rejectWithValue }) => {
    try {
      // Validate volume range
      const normalizedVolume = Math.max(0, Math.min(1, volume));

      console.log('Setting volume:', normalizedVolume);

      return { volume: normalizedVolume };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to set volume',
        timestamp: Date.now(),
      });
    }
  }
);

// Player slice
const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    // Synchronous actions
    updateTrackInfo: (state, action: PayloadAction<TrackInfo>) => {
      state.currentTrack = action.payload;
    },

    updatePosition: (state, action: PayloadAction<number>) => {
      state.position = action.payload;
    },

    updateDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },

    setBuffering: (state, action: PayloadAction<boolean>) => {
      state.isBuffering = action.payload;
    },

    setMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },

    setRepeatMode: (state, action: PayloadAction<'none' | 'all' | 'one'>) => {
      state.repeatMode = action.payload;
    },

    setNetworkState: (state, action: PayloadAction<'online' | 'offline' | 'reconnecting'>) => {
      state.networkState = action.payload;
    },

    setAutoPlayOnStart: (state, action: PayloadAction<boolean>) => {
      state.autoPlayOnStart = action.payload;
    },

    clearError: (state) => {
      state.error = null;
      state.lastError = null;
    },

    resetPlayer: (state) => {
      return {
        ...initialState,
        volume: state.volume,
        isMuted: state.isMuted,
        repeatMode: state.repeatMode,
        autoPlayOnStart: state.autoPlayOnStart,
      };
    },

    // Quick actions for UI responsiveness
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },

    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
  },
  extraReducers: (builder) => {
    // Play audio
    builder
      .addCase(playAudio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(playAudio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isPlaying = true;
        state.error = null;
        state.networkState = 'online';
      })
      .addCase(playAudio.rejected, (state, action) => {
        state.isLoading = false;
        state.isPlaying = false;
        state.error = action.payload?.message || 'Failed to play audio';
        state.lastError = action.payload || null;
      });

    // Pause audio
    builder
      .addCase(pauseAudio.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(pauseAudio.fulfilled, (state) => {
        state.isLoading = false;
        state.isPlaying = false;
        state.error = null;
      })
      .addCase(pauseAudio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to pause audio';
        state.lastError = action.payload || null;
      });

    // Stop audio
    builder
      .addCase(stopAudio.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(stopAudio.fulfilled, (state) => {
        state.isLoading = false;
        state.isPlaying = false;
        state.position = 0;
        state.currentTrack = null;
        state.error = null;
      })
      .addCase(stopAudio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to stop audio';
        state.lastError = action.payload || null;
      });

    // Set volume
    builder
      .addCase(setVolume.fulfilled, (state, action) => {
        state.volume = action.payload.volume;
        state.error = null;
      })
      .addCase(setVolume.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to set volume';
        state.lastError = action.payload || null;
      });
  },
});

// Export actions
export const {
  updateTrackInfo,
  updatePosition,
  updateDuration,
  setBuffering,
  setMuted,
  setRepeatMode,
  setNetworkState,
  setAutoPlayOnStart,
  clearError,
  resetPlayer,
  togglePlay,
  toggleMute,
} = playerSlice.actions;

// Selectors
export const selectPlayer = (state: { player: ReduxPlayerState }) => state.player;
export const selectIsPlaying = (state: { player: ReduxPlayerState }) => state.player.isPlaying;
export const selectCurrentTrack = (state: { player: ReduxPlayerState }) => state.player.currentTrack;
export const selectVolume = (state: { player: ReduxPlayerState }) => state.player.volume;
export const selectNetworkState = (state: { player: ReduxPlayerState }) => state.player.networkState;

// Export reducer
export default playerSlice.reducer;

/**
 * Player Slice Features:
 *
 * State Management:
 * - Audio playback state (playing, loading, buffering)
 * - Track information and metadata
 * - Volume and mute controls
 * - Repeat modes and playback options
 * - Network connectivity status
 * - Error handling and recovery
 *
 * Async Actions:
 * - playAudio: Start audio playback
 * - pauseAudio: Pause current playback
 * - stopAudio: Stop and reset player
 * - setVolume: Adjust playback volume
 *
 * Sync Actions:
 * - updateTrackInfo: Update current track metadata
 * - updatePosition/Duration: Track playback progress
 * - setBuffering: Handle buffering state
 * - togglePlay/toggleMute: Quick UI actions
 *
 * Integration Points:
 * - VideoPlayerService for actual audio playback
 * - Network monitoring for connectivity
 * - Error tracking and reporting
 * - UI responsiveness optimizations
 */