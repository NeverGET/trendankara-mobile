import { VideoPlayer } from 'expo-video';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { VideoPlayerService } from './VideoPlayerService';

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
 * SimpleAudioService using expo-video for native media controls
 */
class SimpleAudioService {
  private static instance: SimpleAudioService;
  private videoPlayerService: VideoPlayerService;
  private listeners: Set<(status: AudioStatus) => void> = new Set();
  private currentStatus: AudioStatus = {
    state: 'idle',
    isPlaying: false,
  };
  private streamUrl = 'https://canli.trendankara.com.tr:8443/trendankara';

  // App state management
  private appStateSubscription: any = null;
  private currentAppState: AppStateStatus = AppState.currentState;

  private constructor() {
    this.videoPlayerService = new VideoPlayerService();
    this.initializeService();
  }

  public static getInstance(): SimpleAudioService {
    if (!SimpleAudioService.instance) {
      SimpleAudioService.instance = new SimpleAudioService();
    }
    return SimpleAudioService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      // Initialize VideoPlayerService with native media controls
      await this.videoPlayerService.initialize();

      // Set up app state handling
      this.initializeAppStateHandling();

      console.log('SimpleAudioService initialized with native media controls');
    } catch (error) {
      console.error('Failed to initialize SimpleAudioService:', error);
    }
  }

  private initializeAppStateHandling(): void {
    try {
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      );

      if (__DEV__) {
        console.log('AppState handling initialized');
      }
    } catch (error) {
      console.error('Failed to initialize AppState handling:', error);
    }
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    const previousAppState = this.currentAppState;
    this.currentAppState = nextAppState;

    if (__DEV__) {
      console.log(`App state changed from ${previousAppState} to ${nextAppState}`);
    }

    // Handle background/foreground transitions
    if (previousAppState === 'active' && nextAppState.match(/inactive|background/)) {
      // App going to background - native controls will handle this automatically
      if (__DEV__) {
        console.log('App moved to background - native media controls active');
      }
    }

    if (previousAppState.match(/inactive|background/) && nextAppState === 'active') {
      // App returning to foreground
      if (__DEV__) {
        console.log('App returned to foreground');
      }
    }
  }

  public async play(): Promise<void> {
    try {
      console.log('Audio play initiated');

      const loadingStatus = { state: 'loading' as AudioState, isPlaying: false };
      this.updateStatus(loadingStatus);

      // Load the stream if not already loaded
      await this.videoPlayerService.loadStream(this.streamUrl);

      // Start playback
      await this.videoPlayerService.play();

      const playingStatus = { state: 'playing' as AudioState, isPlaying: true };
      this.updateStatus(playingStatus);

      console.log('Playback started with native media controls');
    } catch (error) {
      console.error('Play failed:', error);
      const errorStatus = {
        state: 'error' as AudioState,
        isPlaying: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      this.updateStatus(errorStatus);
      throw error;
    }
  }

  public async pause(): Promise<void> {
    try {
      console.log('Audio pause initiated');

      await this.videoPlayerService.pause();

      const pausedStatus = { state: 'paused' as AudioState, isPlaying: false };
      this.updateStatus(pausedStatus);

      console.log('Playback paused');
    } catch (error) {
      console.error('Pause failed:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      console.log('Audio stop initiated');

      await this.videoPlayerService.stop();

      const stoppedStatus = { state: 'stopped' as AudioState, isPlaying: false };
      this.updateStatus(stoppedStatus);

      console.log('Playback stopped');
    } catch (error) {
      console.error('Stop failed:', error);
      throw error;
    }
  }

  public get isPlaying(): boolean {
    return this.videoPlayerService.isPlaying;
  }

  public get currentAudioStatus(): AudioStatus {
    return this.currentStatus;
  }

  public addListener(callback: (status: AudioStatus) => void): void {
    this.listeners.add(callback);
  }

  public removeListener(callback: (status: AudioStatus) => void): void {
    this.listeners.delete(callback);
  }

  private updateStatus(status: AudioStatus): void {
    this.currentStatus = status;
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  public async cleanup(): Promise<void> {
    await this.stop();
    this.listeners.clear();

    // Cleanup app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Cleanup video player service
    await this.videoPlayerService.cleanup();

    console.log('SimpleAudioService cleaned up');
  }
}

export default SimpleAudioService;