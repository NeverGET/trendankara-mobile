import { useVideoPlayer, VideoPlayer, VideoSource } from 'expo-video';
import * as Audio from 'expo-audio';
import { Platform } from 'react-native';
import { AudioConfig } from '@/constants/audio';

export type AudioState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'buffering'
  | 'error';

export interface AudioStatus {
  state: AudioState;
  isPlaying: boolean;
  duration?: number;
  position?: number;
  error?: string;
}

/**
 * ExpoVideoAudioService - Uses expo-video for audio streaming with native media controls
 * This is a workaround for expo-av's lack of native media control support
 */
class ExpoVideoAudioService {
  private static instance: ExpoVideoAudioService;
  private player: VideoPlayer | null = null;
  private listeners: Set<(status: AudioStatus) => void> = new Set();
  private currentStatus: AudioStatus = {
    state: 'idle',
    isPlaying: false,
  };
  private isInitialized: boolean = false;
  private statusCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeAudio();
  }

  public static getInstance(): ExpoVideoAudioService {
    if (!ExpoVideoAudioService.instance) {
      ExpoVideoAudioService.instance = new ExpoVideoAudioService();
    }
    return ExpoVideoAudioService.instance;
  }

  private async initializeAudio(): Promise<void> {
    try {
      // Configure audio mode for background playback
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 1, // InterruptionModeIOS.DuckOthers
        shouldDuckAndroid: true,
        interruptionModeAndroid: 2, // INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log('ExpoVideoAudioService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ExpoVideoAudioService:', error);
    }
  }

  /**
   * Create and configure the video player for audio streaming
   */
  private createPlayer(): VideoPlayer {
    const source: VideoSource = {
      uri: AudioConfig.STREAM_URL,
      metadata: {
        title: 'TrendAnkara Radyo',
        artist: 'Canlı Yayın',
      },
    };

    // Create player with configuration
    const player = useVideoPlayer(source, (p) => {
      p.staysActiveInBackground = true;
      p.showNowPlayingNotification = true; // This enables native media controls
      p.volume = 1.0;

      // Set initial metadata for now playing info
      if (Platform.OS === 'ios') {
        // iOS-specific configuration
        p.allowsExternalPlayback = false;
      }
    });

    // Set up event listeners
    this.setupPlayerListeners(player);

    return player;
  }

  /**
   * Set up event listeners for the video player
   */
  private setupPlayerListeners(player: VideoPlayer): void {
    // Start monitoring player status
    this.startStatusMonitoring(player);
  }

  /**
   * Monitor player status periodically
   */
  private startStatusMonitoring(player: VideoPlayer): void {
    // Clear any existing interval
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }

    // Check status every 500ms
    this.statusCheckInterval = setInterval(() => {
      if (!player) return;

      const isPlaying = player.playing;
      const currentTime = player.currentTime;
      const duration = player.duration;

      // Determine state based on player properties
      let state: AudioState = 'idle';

      if (isPlaying) {
        state = 'playing';
      } else if (currentTime > 0) {
        state = 'paused';
      } else if (this.currentStatus.state === 'loading') {
        state = 'buffering';
      }

      // Update status if changed
      if (state !== this.currentStatus.state || isPlaying !== this.currentStatus.isPlaying) {
        this.updateStatus({
          state,
          isPlaying,
          position: currentTime * 1000, // Convert to milliseconds
          duration: duration * 1000, // Convert to milliseconds
        });
      }
    }, 500);
  }

  public async play(): Promise<void> {
    try {
      console.log('ExpoVideoAudioService: Starting playback');

      // Update status to loading
      this.updateStatus({ state: 'loading', isPlaying: false });

      if (!this.player) {
        // Create new player instance
        this.player = this.createPlayer();

        // Wait a moment for the player to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Start playback
      this.player.play();

      // Update metadata for lock screen
      this.updateNowPlayingMetadata();

      console.log('ExpoVideoAudioService: Playback started successfully');
    } catch (error) {
      console.error('ExpoVideoAudioService: Play failed:', error);
      this.updateStatus({
        state: 'error',
        isPlaying: false,
        error: error instanceof Error ? error.message : 'Playback failed',
      });
      throw error;
    }
  }

  public async pause(): Promise<void> {
    try {
      console.log('ExpoVideoAudioService: Pausing playback');

      if (this.player) {
        this.player.pause();
        this.updateStatus({ state: 'paused', isPlaying: false });
      }
    } catch (error) {
      console.error('ExpoVideoAudioService: Pause failed:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      console.log('ExpoVideoAudioService: Stopping playback');

      if (this.player) {
        this.player.pause();
        this.player.replace({
          uri: AudioConfig.STREAM_URL,
          metadata: {
            title: 'TrendAnkara Radyo',
            artist: 'Canlı Yayın',
          },
        });

        // Clear status monitoring
        if (this.statusCheckInterval) {
          clearInterval(this.statusCheckInterval);
          this.statusCheckInterval = null;
        }

        this.updateStatus({ state: 'stopped', isPlaying: false });
      }
    } catch (error) {
      console.error('ExpoVideoAudioService: Stop failed:', error);
      throw error;
    }
  }

  /**
   * Update now playing metadata for lock screen controls
   */
  private updateNowPlayingMetadata(): void {
    if (!this.player) return;

    try {
      // The metadata is already set in the source configuration
      // expo-video handles updating the native now playing info automatically
      // when showNowPlayingNotification is true

      // We can update metadata dynamically if needed:
      this.player.replace({
        uri: AudioConfig.STREAM_URL,
        metadata: {
          title: 'TrendAnkara Radyo',
          artist: 'Canlı Yayın',
          artwork: Platform.select({
            ios: require('@/assets/images/Trendankara3.png'),
            android: require('@/assets/images/Trendankara3.png'),
          }),
        },
      });

      console.log('Updated now playing metadata for lock screen');
    } catch (error) {
      console.error('Failed to update now playing metadata:', error);
    }
  }

  public getStatus(): AudioStatus {
    return this.currentStatus;
  }

  public isPlaying(): boolean {
    return this.currentStatus.isPlaying;
  }

  public subscribe(listener: (status: AudioStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus); // Send current status immediately
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  private updateStatus(status: Partial<AudioStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...status };
    this.notifyListeners();
  }

  public async cleanup(): Promise<void> {
    await this.stop();

    // Clear status monitoring
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }

    this.listeners.clear();
    this.player = null;
  }
}

export default ExpoVideoAudioService;