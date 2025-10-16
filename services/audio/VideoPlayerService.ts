import { createVideoPlayer, VideoPlayer, VideoSource } from 'expo-video';
import { Platform } from 'react-native';
import SettingsService from '../settings/SettingsService';
import type { RadioConfig } from '@/types/api';
import type { PlayerStateType } from '@/types/models';

/**
 * VideoPlayerService uses expo-video to handle audio streaming
 * with native media controls support via showNowPlayingNotification
 */
export class VideoPlayerService {
  private player: VideoPlayer | null = null;
  private isInitialized = false;
  private currentConfig: RadioConfig | null = null;
  private playerState: PlayerStateType = 'stopped';
  private stateListeners = new Set<(state: PlayerStateType) => void>();
  private errorListeners = new Set<(error: Error) => void>();
  private currentNowPlaying: { title?: string; artist?: string; song?: string } | null = null;
  private lastMetadataTitle: string = '';
  private currentStreamUrl: string | null = null;

  async initialize(): Promise<void> {
    try {
      // Don't create the player here - we'll create it when loading the stream
      // Just mark as initialized
      this.isInitialized = true;
      this.updatePlayerState('stopped');
      console.log('VideoPlayerService initialized - player will be created on load');
    } catch (error) {
      console.error('Failed to initialize VideoPlayerService:', error);
      this.isInitialized = false;
      this.notifyError(new Error('Failed to initialize player'));
    }
  }

  private setupPlayerListeners(): void {
    if (!this.player) return;

    // Listen to playback status changes
    this.player.addListener('playingChange', (event) => {
      // The event is an object with {isPlaying: boolean, oldIsPlaying: boolean}
      const isPlaying = typeof event === 'object' ? event.isPlaying : event;
      console.log('[VideoPlayerService] ========== playingChange event ==========');
      console.log('[VideoPlayerService] Event:', event);
      console.log('[VideoPlayerService] isPlaying:', isPlaying);
      console.log('[VideoPlayerService] Current state:', this.playerState);
      console.log('[VideoPlayerService] Timestamp:', new Date().toISOString());

      // Allow transition from buffering to playing
      if (isPlaying && this.playerState !== 'playing') {
        console.log('[VideoPlayerService] Updating state to playing (from playingChange)');
        this.updatePlayerState('playing');
      } else if (!isPlaying && this.playerState === 'playing') {
        console.log('[VideoPlayerService] Updating state to paused (from playingChange)');
        this.updatePlayerState('paused');
      } else {
        console.log('[VideoPlayerService] No state update needed');
      }
      console.log('[VideoPlayerService] ========== playingChange event finished ==========');
    });

    // Listen to playback errors
    this.player.addListener('statusChange', (status) => {
      if (status === 'error') {
        this.notifyError(new Error('Playback error occurred'));
        this.updatePlayerState('error');
      }
    });
  }

  async loadStream(url: string, config?: RadioConfig): Promise<void> {
    try {
      console.log('Loading stream URL:', url);

      // Store stream URL and configuration
      this.currentStreamUrl = url;
      if (config) {
        this.currentConfig = config;
      }

      // Create player with the stream URL if not already created
      if (!this.player) {
        // Get initial metadata for native controls
        const settings = await SettingsService.getSettings();
        const artwork = settings.playerLogoUrl;

        const videoSource: VideoSource = {
          uri: url,
          metadata: {
            title: 'Trend Ankara',
            artwork: artwork,
          }
        };
        this.player = createVideoPlayer(videoSource);

        if (!this.player) {
          throw new Error('Failed to create VideoPlayer with stream URL');
        }

        // Configure player for audio streaming with media controls
        try {
          this.player.staysActiveInBackground = true;
          this.player.showNowPlayingNotification = true; // This enables native media controls!
          this.player.muted = false; // Ensure not muted
        } catch (configError) {
          console.warn('Failed to configure player properties:', configError);
        }

        // Set up player event listeners
        this.setupPlayerListeners();
      } else {
        // Replace the current source with the new stream URL (preserve metadata)
        const settings = await SettingsService.getSettings();
        const artwork = settings.playerLogoUrl;

        // Use existing now playing info if available
        const titleString = this.currentNowPlaying
          ? (this.currentNowPlaying.artist
              ? `${this.currentNowPlaying.song || this.currentNowPlaying.title} - ${this.currentNowPlaying.artist}`
              : (this.currentNowPlaying.song || this.currentNowPlaying.title || 'Trend Ankara'))
          : 'Trend Ankara';

        const videoSource: VideoSource = {
          uri: url,
          metadata: {
            title: titleString,
            artwork: artwork,
          }
        };
        await this.player.replaceAsync(videoSource);
      }

      // Update metadata for native media controls
      await this.updateNowPlayingMetadata();

      this.updatePlayerState('buffering');
      console.log('Stream loaded with native media controls enabled');
    } catch (error) {
      console.error('Failed to load stream:', error);
      this.updatePlayerState('error');
      this.notifyError(error as Error);
      throw error;
    }
  }

  /**
   * Update now playing metadata for native media controls (iOS lock screen, Control Center, Android notification)
   * This should be called whenever the song/track changes
   * Uses platform-specific workarounds to force native controls to refresh
   */
  async updateNowPlayingInfo(nowPlaying: { title?: string; artist?: string; song?: string } | null): Promise<void> {
    if (!this.player || !nowPlaying || !(nowPlaying.song || nowPlaying.title)) {
      console.log('[VideoPlayerService] Skipping metadata update - missing player or metadata');
      return;
    }

    try {
      this.currentNowPlaying = nowPlaying;

      // Build the title string (combining song and artist)
      const titleString = nowPlaying.artist
        ? `${nowPlaying.song || nowPlaying.title} - ${nowPlaying.artist}`
        : (nowPlaying.song || nowPlaying.title || 'Trend Ankara');

      // Only update if the metadata actually changed
      if (titleString === this.lastMetadataTitle) {
        console.log('[VideoPlayerService] Metadata unchanged, skipping update');
        return;
      }

      console.log('[VideoPlayerService] Updating native controls:', {
        title: titleString,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      });

      this.lastMetadataTitle = titleString;

      // Get current playback state
      const wasPlaying = this.player.playing;

      // Get artwork URL
      const settings = await SettingsService.getSettings();
      const artwork = settings.playerLogoUrl;

      // Get current stream URI from stored value
      const streamUri = this.currentStreamUrl;

      if (!streamUri) {
        console.log('[VideoPlayerService] No stream URI found');
        return;
      }

      // Create updated source with new metadata
      const updatedSource: VideoSource = {
        uri: streamUri,
        metadata: {
          title: titleString,
          artwork: artwork,
        }
      };

      // Platform-specific update strategy
      if (Platform.OS === 'android') {
        // Android: Disable/re-enable notification to force update
        console.log('[VideoPlayerService] Applying Android-specific metadata update');

        // 1. Disable notification
        this.player.showNowPlayingNotification = false;

        // 2. Replace source with new metadata (using replaceAsync for proper promise handling)
        await this.player.replaceAsync(updatedSource);

        // 3. Wait for notification system to settle (promisified delay to maintain async chain)
        await new Promise<void>(resolve => setTimeout(resolve, 200));

        // 4. Re-enable notification (forces recreation with new metadata)
        if (this.player) {
          this.player.showNowPlayingNotification = true;

          // 5. Resume playback if it was playing (check current state, not stale wasPlaying)
          if (this.player.playing || wasPlaying) {
            await this.player.play();
          }

          console.log('[VideoPlayerService] Android native controls updated');
        }

      } else {
        // iOS: Replace and continue playing
        console.log('[VideoPlayerService] Applying iOS-specific metadata update');

        // Use replaceAsync for proper promise handling
        await this.player.replaceAsync(updatedSource);

        // Resume playback if it was playing
        if (wasPlaying) {
          await this.player.play();
        }

        console.log('[VideoPlayerService] iOS native controls updated');
      }

    } catch (error) {
      console.error('[VideoPlayerService] Failed to update now playing metadata:', {
        error,
        platform: Platform.OS,
        playerState: this.playerState,
      });
    }
  }

  private async updateNowPlayingMetadata(): Promise<void> {
    try {
      // Get player logo from settings
      const settings = await SettingsService.getSettings();
      const logoUrl = settings.playerLogoUrl;

      // Note: expo-video's showNowPlayingNotification handles basic metadata
      // For more advanced control, we might need to use expo-av or a custom solution
      // The notification will show the app name and basic controls by default

      if (this.currentConfig) {
        console.log('Radio config loaded:', {
          name: this.currentConfig.name,
          logo: logoUrl,
        });
      }
    } catch (error) {
      console.error('Failed to update now playing metadata:', error);
    }
  }

  async play(): Promise<void> {
    console.log('[VideoPlayerService] ========== PLAY METHOD CALLED ==========');
    console.log('[VideoPlayerService] Is initialized:', this.isInitialized);
    console.log('[VideoPlayerService] Player exists:', !!this.player);
    console.log('[VideoPlayerService] Player is playing:', this.player?.playing);
    console.log('[VideoPlayerService] Current state:', this.playerState);
    console.log('[VideoPlayerService] Timestamp:', new Date().toISOString());

    if (!this.isInitialized) {
      console.error('[VideoPlayerService] Player service not initialized');
      throw new Error('VideoPlayerService not initialized');
    }

    if (!this.player) {
      console.error('[VideoPlayerService] Player not created yet - stream must be loaded first');
      throw new Error('Stream must be loaded before playing');
    }

    try {
      console.log('[VideoPlayerService] About to call this.player.play()');
      this.player.play();
      console.log('[VideoPlayerService] this.player.play() called');
      console.log('[VideoPlayerService] Player is playing after play():', this.player.playing);

      this.updatePlayerState('playing');
      console.log('[VideoPlayerService] State updated to playing');
      console.log('[VideoPlayerService] Final player.playing value:', this.player.playing);
      console.log('[VideoPlayerService] ========== PLAY METHOD FINISHED ==========');
    } catch (error) {
      console.error('[VideoPlayerService] Failed to start playback:', error);
      this.updatePlayerState('error');
      this.notifyError(error as Error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    console.log('[VideoPlayerService] ========== PAUSE METHOD CALLED ==========');
    console.log('[VideoPlayerService] Player exists:', !!this.player);
    console.log('[VideoPlayerService] Player is playing:', this.player?.playing);
    console.log('[VideoPlayerService] Current state:', this.playerState);
    console.log('[VideoPlayerService] Timestamp:', new Date().toISOString());

    if (!this.player) {
      console.warn('[VideoPlayerService] Cannot pause - player not initialized');
      return;
    }

    try {
      console.log('[VideoPlayerService] About to call this.player.pause()');
      this.player.pause();
      console.log('[VideoPlayerService] this.player.pause() called');
      console.log('[VideoPlayerService] Player is playing after pause():', this.player.playing);

      this.updatePlayerState('paused');
      console.log('[VideoPlayerService] State updated to paused');
      console.log('[VideoPlayerService] Final player.playing value:', this.player.playing);
      console.log('[VideoPlayerService] ========== PAUSE METHOD FINISHED ==========');
    } catch (error) {
      console.error('[VideoPlayerService] Failed to pause playback:', error);
      this.notifyError(error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.player) {
      return;
    }

    try {
      this.player.pause();
      // Clear the source by replacing with null
      await this.player.replaceAsync(null);
      this.updatePlayerState('stopped');
      this.currentConfig = null;
      this.currentStreamUrl = null;
      console.log('Playback stopped');
    } catch (error) {
      console.error('Failed to stop playback:', error);
      this.notifyError(error as Error);
    }
  }

  async togglePlayPause(): Promise<void> {
    if (this.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  get isPlaying(): boolean {
    return this.player?.playing ?? false;
  }

  get isMuted(): boolean {
    return this.player?.muted ?? false;
  }

  set isMuted(value: boolean) {
    if (this.player) {
      this.player.muted = value;
    }
  }

  get volume(): number {
    return this.player?.volume ?? 1.0;
  }

  set volume(value: number) {
    if (this.player) {
      this.player.volume = Math.max(0, Math.min(1, value));
    }
  }

  async setVolume(value: number): Promise<void> {
    if (this.player) {
      this.player.volume = Math.max(0, Math.min(1, value));
    }
  }

  async cleanup(): Promise<void> {
    await this.stop();

    // Remove all listeners
    this.stateListeners.clear();
    this.errorListeners.clear();

    // Release the player instance to prevent memory leaks
    // This is required when using Video.createVideoPlayer()
    if (this.player) {
      this.player.release();
    }

    this.player = null;
    this.isInitialized = false;
    this.currentConfig = null;
  }

  // State management methods
  private updatePlayerState(state: PlayerStateType): void {
    this.playerState = state;
    this.notifyStateListeners(state);
  }

  private notifyStateListeners(state: PlayerStateType): void {
    this.stateListeners.forEach(listener => listener(state));
  }

  private notifyError(error: Error): void {
    this.errorListeners.forEach(listener => listener(error));
  }

  // Public subscription methods
  addStateListener(listener: (state: PlayerStateType) => void): void {
    this.stateListeners.add(listener);
    // Immediately notify with current state
    listener(this.playerState);
  }

  removeStateListener(listener: (state: PlayerStateType) => void): void {
    this.stateListeners.delete(listener);
  }

  addErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.add(listener);
  }

  removeErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.delete(listener);
  }

  onStateChange(listener: (state: PlayerStateType) => void): () => void {
    this.stateListeners.add(listener);
    // Immediately notify with current state
    listener(this.playerState);

    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  // Getters for current state
  get currentState(): PlayerStateType {
    return this.playerState;
  }

  getState(): PlayerStateType {
    return this.playerState;
  }

  get radioConfig(): RadioConfig | null {
    return this.currentConfig;
  }

  // Settings-based configuration
  async configureFromSettings(): Promise<void> {
    try {
      const settings = await SettingsService.getSettings();

      // Apply any player-specific settings
      if (settings.enableLiveInfo) {
        console.log('Live info enabled for player');
      }

      // Store player logo URL for later use
      if (settings.playerLogoUrl) {
        console.log('Player logo URL:', settings.playerLogoUrl);
      }
    } catch (error) {
      console.error('Failed to configure player from settings:', error);
    }
  }

  // Helper method to get radio config from API (placeholder)
  async fetchRadioConfig(): Promise<RadioConfig | null> {
    // This will be implemented when we create the radio service
    // For now, return a default config with a working test stream
    return {
      id: 1,
      name: 'Trend Ankara',
      streamUrl: __DEV__
        ? 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service'
        : 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service', // Fallback working stream
      logoUrl: null,
      description: null,
      website: null,
      socialLinks: {
        facebook: null,
        instagram: null,
        twitter: null,
      },
      currentProgram: null,
      isLive: true,
      listenerCount: null,
    };
  }
}

// Create and export singleton instance
const videoPlayerService = new VideoPlayerService();
export default videoPlayerService;