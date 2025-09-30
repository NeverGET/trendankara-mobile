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
      console.log('playingChange event:', { isPlaying, currentState: this.playerState });

      // Allow transition from buffering to playing
      if (isPlaying && this.playerState !== 'playing') {
        this.updatePlayerState('playing');
      } else if (!isPlaying && this.playerState === 'playing') {
        this.updatePlayerState('paused');
      }
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

      // Store configuration
      if (config) {
        this.currentConfig = config;
      }

      // Create player with the stream URL if not already created
      if (!this.player) {
        const videoSource: VideoSource = { uri: url };
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
        // Replace the current source with the new stream URL
        const videoSource: VideoSource = { uri: url };
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
    if (!this.isInitialized) {
      console.error('Player service not initialized');
      throw new Error('VideoPlayerService not initialized');
    }

    if (!this.player) {
      console.error('Player not created yet - stream must be loaded first');
      throw new Error('Stream must be loaded before playing');
    }

    try {
      // Only call play() if not already playing
      if (this.playerState !== 'playing') {
        this.player.play();
        // State will be updated by playingChange listener
        console.log('Playback started');
      }
    } catch (error) {
      console.error('Failed to start playback:', error);
      this.updatePlayerState('error');
      this.notifyError(error as Error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (!this.player) {
      throw new Error('VideoPlayerService not initialized');
    }

    try {
      // Only call pause() if currently playing
      if (this.playerState === 'playing') {
        this.player.pause();
        // State will be updated by playingChange listener
        console.log('Playback paused');
      }
    } catch (error) {
      console.error('Failed to pause playback:', error);
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