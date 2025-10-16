/**
 * TrackPlayerService - Audio streaming service using react-native-track-player
 * Provides seamless metadata updates without audio interruption
 * Mirrors VideoPlayerService API for easy service switching via feature flag
 */
import TrackPlayer, {
  Capability,
  AppKilledPlaybackBehavior,
  State,
  Event,
} from 'react-native-track-player';
import { Platform } from 'react-native';
import SettingsService from '../settings/SettingsService';
import type { RadioConfig } from '@/types/api';
import type { PlayerStateType } from '@/types/models';
import { getArtwork } from '@/constants/artwork';

/**
 * TrackPlayerService Class
 * Singleton service that manages audio playback using react-native-track-player
 * Implements the same interface as VideoPlayerService for compatibility
 */
export class TrackPlayerService {
  // Initialization state
  private isInitialized = false;

  // Current configuration
  private currentConfig: RadioConfig | null = null;

  // Player state management
  private playerState: PlayerStateType = 'stopped';

  // State change listeners
  private stateListeners = new Set<(state: PlayerStateType) => void>();

  // Error listeners
  private errorListeners = new Set<(error: Error) => void>();

  // Metadata tracking for change detection
  private lastMetadataTitle: string = '';
  private lastMetadataUpdate: number = 0;
  private readonly METADATA_THROTTLE_MS = 1000; // 1 second minimum between updates

  // Stream URL tracking
  private currentStreamUrl: string | null = null;

  // Artwork tracking
  private currentArtwork: string | number | null = null;

  /**
   * Task 9: Initialize TrackPlayer
   * Sets up player with background playback and media controls
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[TrackPlayerService] Already initialized');
        return;
      }

      // Setup player with configuration
      await TrackPlayer.setupPlayer({
        autoUpdateMetadata: true, // Automatically update media controls
        autoHandleInterruptions: true, // Handle phone calls, etc.
      });

      // Configure player capabilities (buttons shown in media controls)
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        notificationCapabilities: [Capability.Play, Capability.Pause],
        // Android specific options
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
      });

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.updatePlayerState('stopped');
      console.log('[TrackPlayerService] Initialized successfully');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to initialize:', error);
      this.isInitialized = false;
      this.notifyError(new Error('Failed to initialize player'));
      throw error;
    }
  }

  /**
   * Task 11: Setup event listeners
   * Handles state changes and errors from TrackPlayer
   */
  private setupEventListeners(): void {
    // Listen for playback state changes
    TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
      console.log('[TrackPlayerService] Playback state changed:', data);
      this.handleStateChange(data.state);
    });

    // Listen for errors
    TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
      console.error('[TrackPlayerService] Playback error:', error);
      this.updatePlayerState('error');
      this.notifyError(new Error((error as any).message || 'Playback error'));
    });

    // NOTE: Remote control events (RemotePlay, RemotePause, RemoteStop) are handled
    // in PlaybackService.ts, which is registered via TrackPlayer.registerPlaybackService()
    // in index.js. Do NOT add duplicate event listeners here as they will interfere
    // with the PlaybackService handlers.
  }

  /**
   * Map TrackPlayer State to PlayerStateType
   */
  private handleStateChange(state: State): void {
    let mappedState: PlayerStateType;

    switch (state) {
      case State.Playing:
        mappedState = 'playing';
        break;
      case State.Paused:
        mappedState = 'paused';
        break;
      case State.Stopped:
      case State.None:
        mappedState = 'stopped';
        break;
      case State.Buffering:
      case State.Connecting:
        mappedState = 'buffering';
        break;
      case State.Error:
        mappedState = 'error';
        break;
      default:
        mappedState = 'stopped';
    }

    this.updatePlayerState(mappedState);
  }

  /**
   * Task 12: Load stream
   * Prepares TrackPlayer with stream URL and metadata
   */
  async loadStream(url: string, config?: RadioConfig): Promise<void> {
    try {
      console.log('[TrackPlayerService] Loading stream:', url);

      if (config) {
        this.currentConfig = config;
      }

      // Store stream URL
      this.currentStreamUrl = url;

      // Reset metadata tracking to allow fresh metadata updates
      this.lastMetadataTitle = '';
      this.lastMetadataUpdate = 0;

      // Get artwork - uses bundled image with fallback to remote URL from settings
      const settings = await SettingsService.getSettings();
      const artwork = getArtwork(settings.playerLogoUrl);

      // Store artwork for metadata updates
      this.currentArtwork = artwork;

      console.log('[TrackPlayerService] Using artwork:', typeof artwork === 'number' ? 'bundled image' : artwork);

      // Clear existing queue
      await TrackPlayer.reset();

      // Add stream as a track
      await TrackPlayer.add({
        url: url,
        title: 'Trend Ankara',
        artist: 'Canlı Yayın',
        artwork: artwork,
        isLiveStream: true, // Important for live streams!
      });

      console.log('[TrackPlayerService] Stream loaded successfully');
      this.updatePlayerState('buffering');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to load stream:', error);
      this.updatePlayerState('error');
      this.notifyError(error as Error);
      throw error;
    }
  }

  /**
   * Task 13: Playback control methods
   * play(), pause(), stop(), togglePlayPause()
   */
  async play(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('TrackPlayerService not initialized');
    }

    try {
      await TrackPlayer.play();
      console.log('[TrackPlayerService] Playback started');

      // Poll state multiple times to ensure we catch the state change
      this.pollPlaybackState();
    } catch (error) {
      console.error('[TrackPlayerService] Failed to start playback:', error);
      this.updatePlayerState('error');
      this.notifyError(error as Error);
      throw error;
    }
  }

  /**
   * Poll playback state to update UI
   * react-native-track-player doesn't always emit events reliably
   */
  private pollPlaybackState(): void {
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 200;

    const poll = async () => {
      try {
        const state = await TrackPlayer.getPlaybackState();
        console.log('[TrackPlayerService] Polled state:', state.state);
        this.handleStateChange(state.state);

        // Keep polling if still buffering
        if ((state.state === State.Buffering || state.state === State.Connecting) && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error('[TrackPlayerService] Failed to poll state:', error);
      }
    };

    setTimeout(poll, 100);
  }

  async pause(): Promise<void> {
    try {
      await TrackPlayer.pause();
      console.log('[TrackPlayerService] Playback paused');
      this.updatePlayerState('paused');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to pause playback:', error);
      this.notifyError(error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await TrackPlayer.stop();
      await TrackPlayer.reset();
      this.updatePlayerState('stopped');
      this.currentConfig = null;
      this.currentStreamUrl = null;
      this.currentArtwork = null;
      console.log('[TrackPlayerService] Playback stopped');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to stop playback:', error);
      this.notifyError(error as Error);
    }
  }

  async togglePlayPause(): Promise<void> {
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Playing) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  /**
   * Task 14: Volume control
   */
  async setVolume(value: number): Promise<void> {
    await TrackPlayer.setVolume(Math.max(0, Math.min(1, value)));
  }

  /**
   * Task 15-16: Update metadata with throttling and change detection
   * This is the CORE FEATURE that solves audio interruption!
   */
  async updateNowPlayingInfo(nowPlaying: {
    title?: string;
    artist?: string;
    song?: string;
  } | null): Promise<void> {
    if (!nowPlaying || !(nowPlaying.song || nowPlaying.title)) {
      console.log('[TrackPlayerService] Skipping metadata update - missing data');
      return;
    }

    try {
      // Build display strings
      const titleString = nowPlaying.song || nowPlaying.title || 'Trend Ankara';
      const artistString = nowPlaying.artist || 'Canlı Yayın';

      // Task 16: Check if metadata changed (skip if unchanged)
      const fullTitle = `${titleString} - ${artistString}`;
      if (fullTitle === this.lastMetadataTitle) {
        console.log('[TrackPlayerService] Metadata unchanged, skipping update');
        return;
      }

      // Task 16: Throttle updates (minimum 1 second between updates)
      const now = Date.now();
      if (now - this.lastMetadataUpdate < this.METADATA_THROTTLE_MS) {
        console.log('[TrackPlayerService] Throttling metadata update');
        return;
      }

      const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
      if (currentTrackIndex === undefined) {
        console.log('[TrackPlayerService] No active track to update');
        return;
      }

      console.log('[TrackPlayerService] Updating metadata:', {
        title: titleString,
        artist: artistString,
        artwork: this.currentArtwork ? (typeof this.currentArtwork === 'number' ? 'bundled image' : 'URL') : 'none',
      });

      // Update metadata - NO PLAYBACK INTERRUPTION!
      // IMPORTANT: Include artwork to prevent it from being cleared
      await TrackPlayer.updateMetadataForTrack(currentTrackIndex, {
        title: titleString,
        artist: artistString,
        ...(this.currentArtwork && { artwork: this.currentArtwork }),
      });

      // Update tracking variables
      this.lastMetadataTitle = fullTitle;
      this.lastMetadataUpdate = now;

      console.log('[TrackPlayerService] Metadata updated successfully');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to update metadata:', error);
      // Don't throw - metadata update failure shouldn't break playback
    }
  }

  /**
   * Task 17: Cleanup and getters
   */
  async cleanup(): Promise<void> {
    await this.stop();
    this.stateListeners.clear();
    this.errorListeners.clear();

    // Reset player
    await TrackPlayer.reset();
    this.isInitialized = false;
  }

  get isPlaying(): boolean {
    return this.playerState === 'playing';
  }

  get currentState(): PlayerStateType {
    return this.playerState;
  }

  getState(): PlayerStateType {
    return this.playerState;
  }

  get radioConfig(): RadioConfig | null {
    return this.currentConfig;
  }

  /**
   * Task 10: State management methods
   * Listener registration and notification
   */
  addStateListener(listener: (state: PlayerStateType) => void): void {
    this.stateListeners.add(listener);
    listener(this.playerState);
  }

  removeStateListener(listener: (state: PlayerStateType) => void): void {
    this.stateListeners.delete(listener);
  }

  onStateChange(listener: (state: PlayerStateType) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.playerState);
    return () => this.stateListeners.delete(listener);
  }

  addErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.add(listener);
  }

  removeErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.delete(listener);
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Private helper methods
   */
  private updatePlayerState(state: PlayerStateType): void {
    this.playerState = state;
    this.notifyStateListeners(state);
  }

  private notifyStateListeners(state: PlayerStateType): void {
    this.stateListeners.forEach((listener) => listener(state));
  }

  private notifyError(error: Error): void {
    this.errorListeners.forEach((listener) => listener(error));
  }
}

// Create and export singleton instance
const trackPlayerService = new TrackPlayerService();
export default trackPlayerService;
