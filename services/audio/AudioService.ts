import { Audio, AVPlaybackStatus } from 'expo-av';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { AudioConfig } from '@/constants/audio';
import { StreamController } from './StreamController';
import { AudioErrorHandler, AudioError } from './ErrorHandler';
import { AudioFocusState } from './AudioFocusState';
import { MediaSessionManager } from './MediaSessionManager';
import { BrandColors } from '@/constants/theme';

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

class AudioService {
  private static instance: AudioService;
  private sound: Audio.Sound | null = null;
  private streamController: StreamController;
  private listeners: Set<(status: AudioStatus) => void> = new Set();
  private currentStatus: AudioStatus = {
    state: 'idle',
    isPlaying: false,
  };
  private retryCount = 0;

  // Background playback components
  private nativeMediaControls: any | null = null; // Native OS media controls
  private mediaSessionManager: MediaSessionManager | null = null;
  private notificationService: any = null;

  // Remote command tracking
  private commandSource: 'user' | 'remote' = 'user';
  private lastUserCommandTime: number = 0;

  // App state management
  private appStateSubscription: any = null;
  private currentAppState: AppStateStatus = AppState.currentState;

  private constructor() {
    this.streamController = new StreamController();
    this.initializeAudio();
    this.initializeBackground();
    this.initializeAppStateHandling();
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private async initializeAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync(AudioConfig.AUDIO_MODE);
    } catch (error) {
      console.error('Failed to initialize audio mode:', error);
    }
  }

  /**
   * Initialize background playback components
   * Sets up BackgroundHandler, MediaSessionManager, and NotificationService
   * with platform detection
   */
  private async initializeBackground(): Promise<void> {
    try {
      // Initialize native media controls (OS-level controls)
      const { NativeMediaControls } = await import('./NativeMediaControls');
      this.nativeMediaControls = new NativeMediaControls();
      await this.nativeMediaControls.initialize();

      // Initialize MediaSessionManager (singleton)
      this.mediaSessionManager = MediaSessionManager.getInstance();

      // Initialize MediaNotificationService for Android
      if (Platform.OS === 'android') {
        const { MediaNotificationService } = await import('./MediaNotificationService');
        this.notificationService = new MediaNotificationService();
        await this.notificationService.initialize();

        // Set up callbacks for notification controls
        this.notificationService.setCallbacks({
          onPlay: () => this.play(),
          onPause: () => this.pause(),
          onStop: () => this.stop(),
        });
      }

      // Subscribe to remote commands from MediaSessionManager
      this.subscribeToRemoteCommands();

      // Set custom artwork with logo
      this.mediaSessionManager.setCustomArtwork(
        require('@/assets/images/Trendankara3.png'),
        BrandColors.primary // #DC2626
      );

      // Set initial metadata for media session
      await this.setInitialMetadata();

      console.log('Background playback components initialized successfully');
    } catch (error) {
      console.error('Failed to initialize background components:', error);
      // Don't throw error to prevent breaking basic audio functionality
      // Background features will simply not be available
    }
  }


  /**
   * Subscribe to remote commands from MediaSessionManager
   * Maps media control commands to AudioService methods
   */
  private subscribeToRemoteCommands(): void {
    if (!this.mediaSessionManager) {
      console.warn('MediaSessionManager not available for remote command subscription');
      return;
    }

    // Register play command handler
    this.mediaSessionManager.handleRemoteCommand('play', () => {
      this.commandSource = 'remote';
      this.play().catch(error => {
        console.error('Remote play command failed:', error);
      }).finally(() => {
        this.commandSource = 'user';
      });
    });

    // Register pause command handler
    this.mediaSessionManager.handleRemoteCommand('pause', () => {
      this.commandSource = 'remote';
      this.pause().catch(error => {
        console.error('Remote pause command failed:', error);
      }).finally(() => {
        this.commandSource = 'user';
      });
    });

    // Register stop command handler
    this.mediaSessionManager.handleRemoteCommand('stop', () => {
      this.commandSource = 'remote';
      this.stop().catch(error => {
        console.error('Remote stop command failed:', error);
      }).finally(() => {
        this.commandSource = 'user';
      });
    });

    console.log('Remote command handlers registered successfully');
  }

  /**
   * Initialize AppState handling for background mode management
   * Sets up listener for app lifecycle transitions
   */
  private initializeAppStateHandling(): void {
    try {
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      );

      console.log('AppState handling initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AppState handling:', error);
    }
  }

  /**
   * Handle app state changes and update background mode accordingly
   * Updates background mode based on app lifecycle transitions
   */
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    const previousAppState = this.currentAppState;
    this.currentAppState = nextAppState;

    // Update StreamController's background mode
    this.streamController.updateBackgroundMode(nextAppState === 'background');

    if (__DEV__) {
      console.log(`App state changed from ${previousAppState} to ${nextAppState}`);
    }

    try {
      // Handle transition to background
      if (previousAppState === 'active' && nextAppState.match(/inactive|background/)) {
        await this.enableBackgroundMode();
      }

      // Handle transition to foreground
      if (previousAppState.match(/inactive|background/) && nextAppState === 'active') {
        await this.handleForegroundTransition();
      }
    } catch (error) {
      console.error('Failed to handle app state change:', error);
    }
  }

  /**
   * Enable background mode when app goes to background
   */
  private async enableBackgroundMode(): Promise<void> {
    if (!this.nativeMediaControls) {
      console.warn('NativeMediaControls not available for background mode');
      return;
    }

    try {
      // Only enable background mode if audio is currently playing
      if (this.currentStatus.isPlaying) {
        // Show media notification on Android for native controls
        if (Platform.OS === 'android' && this.notificationService) {
          await this.notificationService.showMediaNotification({
            title: 'TrendAnkara Radyo',
            artist: 'Canlı Yayın',
            isPlaying: true,
          });
        }
        console.log('Media notification shown for background playback');
      }
    } catch (error) {
      console.error('Failed to enable background mode:', error);
    }
  }

  /**
   * Handle transition from background to foreground
   * Ensures UI reflects current playback state per requirement 5.1
   */
  private async handleForegroundTransition(): Promise<void> {
    try {
      // Refresh current audio status when returning to foreground
      // This ensures UI reflects current playback state (requirement 5.1)
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        this.onPlaybackStatusUpdate(status);
      }

      // Update background UI to ensure consistency
      await this.updateBackgroundUI(this.currentStatus);

      console.log('Foreground transition handled - UI updated with current playback state');
    } catch (error) {
      console.error('Failed to handle foreground transition:', error);
    }
  }

  /**
   * Set initial metadata for the media session
   * This provides default radio station information for media controls
   */
  private async setInitialMetadata(): Promise<void> {
    if (!this.mediaSessionManager) {
      return;
    }

    try {
      await this.mediaSessionManager.updateMetadata({
        title: 'TrendAnkara Radio',
        artist: 'Live Stream',
        album: 'TrendAnkara Radio',
        genre: 'Radio',
      });
    } catch (error) {
      console.error('Failed to set initial metadata:', error);
    }
  }

  /**
   * Enable background mode for playback start
   * Activates background capabilities, creates foreground service, and updates media session
   * Implements requirements 1.1, 2.1, and 3.1
   */
  private async enableBackgroundModeForPlayback(): Promise<void> {
    try {
      console.log('Enabling background mode for playback start');

      // 1. Enable background mode through BackgroundHandler (requirement 1.1, 2.1)
      if (this.nativeMediaControls) {
        const playbackMetadata = {
          title: 'TrendAnkara Radio',
          artist: 'Canlı Yayın',
          album: 'TrendAnkara Radio',
          genre: 'Radio',
        };

        // Update metadata for native controls (shows in OS media controls)
        await this.nativeMediaControls.updateMetadata({
          title: playbackMetadata.title,
          artist: playbackMetadata.artist,
          albumArtwork: require('@/assets/images/Trendankara3.png')
        });
        console.log('Background mode enabled via BackgroundHandler');
      } else {
        console.warn('BackgroundHandler not available - background mode not enabled');
      }

      // 2. Update media session metadata for lock screen controls (requirement 3.1)
      if (this.mediaSessionManager) {
        await this.mediaSessionManager.updateMetadata({
          title: 'TrendAnkara Radio',
          artist: 'Canlı Yayın',
          album: 'TrendAnkara Radio',
          genre: 'Radio',
        });
        console.log('Media session metadata updated for playback');
      } else {
        console.warn('MediaSessionManager not available - media controls not updated');
      }

      console.log('Background mode for playback successfully enabled');
    } catch (error) {
      console.error('Failed to enable background mode for playback:', error);
      // Don't throw error to prevent breaking audio playback
      // Background features will simply not be available
    }
  }

  public async play(): Promise<void> {
    try {
      // Track user command timing for external app detection
      if (this.commandSource === 'user') {
        this.lastUserCommandTime = Date.now();
      }

      console.log(`Audio play initiated from ${this.commandSource} source`);
      const loadingStatus = { state: 'loading' as AudioState, isPlaying: false };
      this.updateStatus(loadingStatus);

      // Enable background mode when playback starts (requirement 1.1, 2.1)
      await this.enableBackgroundModeForPlayback();

      // Update background UI without awaiting to avoid blocking audio loading
      this.updateBackgroundUI(loadingStatus).catch(bgError => {
        console.error('Failed to update background UI for loading state:', bgError);
      });

      if (!this.sound) {
        // Use StreamController to load with retry logic
        this.sound = await this.streamController.loadStream(
          AudioConfig.STREAM_URL,
          this.onPlaybackStatusUpdate.bind(this)
        );
        await this.sound.playAsync();

        // Pass the sound object to NativeMediaControls for media session integration
        if (this.nativeMediaControls) {
          this.nativeMediaControls.setSound(this.sound);
        }

        // Set progress update interval only (don't specify androidImplementation as it can cause delays)
        await this.sound.setStatusAsync({
          progressUpdateIntervalMillis: 1000,
        });
      } else {
        await this.sound.playAsync();
      }

      this.retryCount = 0; // Reset retry count on successful play
    } catch (error) {
      const handledError = AudioErrorHandler.handleError(error);
      console.error('Play failed:', handledError.message);

      const errorStatus = {
        state: 'error' as AudioState,
        isPlaying: false,
        error: handledError.message
      };
      this.updateStatus(errorStatus);

      // Update background UI without awaiting to avoid blocking retry logic
      this.updateBackgroundUI(errorStatus).catch(bgError => {
        console.error('Failed to update background UI for error state:', bgError);
      });

      // Auto-retry for certain error types
      if (AudioErrorHandler.shouldRetry(handledError.type) && this.retryCount < AudioConfig.MAX_RETRIES) {
        this.retryCount++;
        const retryDelay = AudioErrorHandler.getRetryDelay(handledError.type, this.retryCount);
        console.log(`Retrying in ${retryDelay}ms (attempt ${this.retryCount}/${AudioConfig.MAX_RETRIES})`);

        setTimeout(() => {
          if (this.currentStatus.state === 'error') {
            this.play();
          }
        }, retryDelay);
      } else {
        this.retryCount = 0;
      }

      throw error;
    }
  }

  public async pause(): Promise<void> {
    try {
      // Track user command timing for external app detection
      if (this.commandSource === 'user') {
        this.lastUserCommandTime = Date.now();
      }

      console.log(`Audio pause initiated from ${this.commandSource} source`);
      if (this.sound) {
        await this.sound.pauseAsync();
        const pausedStatus = { state: 'paused' as AudioState, isPlaying: false };
        this.updateStatus(pausedStatus);

        // Update media session state for lock screen controls (requirement 3.2)
        await this.updateBackgroundUI(pausedStatus);

        // Update media session manager playback state
        if (this.mediaSessionManager) {
          await this.mediaSessionManager.setPlaybackState('paused');
          console.log('Media session state updated to paused');
        }
      }
    } catch (error) {
      console.error('Pause failed:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      // Track user command timing for external app detection
      if (this.commandSource === 'user') {
        this.lastUserCommandTime = Date.now();
      }

      console.log(`Audio stop initiated from ${this.commandSource} source`);
      if (this.sound) {
        await this.streamController.unloadStream();
        this.sound = null;
        const stoppedStatus = { state: 'stopped' as AudioState, isPlaying: false };
        this.updateStatus(stoppedStatus);

        // Destroy foreground service when user explicitly stops playback (requirement 2.5)
        if (this.notificationService) {
          await this.notificationService.hideMediaNotification();
        }
        if (this.nativeMediaControls) {
          // Native controls hide automatically when audio stops
          console.log('Foreground service terminated on stop');
        }

        // Clear media session on stop (requirement 3.3)
        if (this.mediaSessionManager) {
          await this.mediaSessionManager.setPlaybackState('stopped');
          console.log('Media session cleared on stop');
        }

        await this.updateBackgroundUI(stoppedStatus);
        this.retryCount = 0;
      }
    } catch (error) {
      console.error('Stop failed:', error);
      throw error;
    }
  }

  public getStatus(): AudioStatus {
    return this.currentStatus;
  }

  public isPlaying(): boolean {
    return this.currentStatus.isPlaying;
  }

  public getCommandSource(): 'user' | 'remote' {
    return this.commandSource;
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

  private onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (status.isLoaded) {
      const wasPlaying = this.currentStatus.isPlaying;
      const previousState = this.currentStatus.state;
      let state: AudioState = 'idle';

      if (status.isPlaying) {
        state = 'playing';
        this.retryCount = 0; // Reset on successful playing
      } else if (status.isBuffering && !status.isPlaying) {
        state = 'buffering';
      } else if (this.currentStatus.state === 'loading') {
        state = 'playing'; // Just loaded and started
      } else if (this.currentStatus.state !== 'stopped') {
        state = 'paused';
      }

      const newStatus: AudioStatus = {
        state,
        isPlaying: status.isPlaying,
        duration: status.durationMillis,
        position: status.positionMillis,
      };

      // Only update if state actually changed to avoid spam
      if (previousState !== state || wasPlaying !== status.isPlaying) {
        this.updateStatus(newStatus);

        // Update background UI components with the new status
        this.updateBackgroundUI(newStatus).catch(error => {
          console.error('Failed to update background UI:', error);
        });
      }
    } else {
      // Handle unloaded status (includes error states)
      const errorStatus = status as any;
      if (errorStatus.error) {
        const handledError = AudioErrorHandler.handleError(errorStatus.error);
        const errorAudioStatus: AudioStatus = {
          state: 'error',
          isPlaying: false,
          error: handledError.message,
        };

        this.updateStatus(errorAudioStatus);

        // Update background UI to reflect error state
        this.updateBackgroundUI(errorAudioStatus).catch(error => {
          console.error('Failed to update background UI for error state:', error);
        });
      }
    }
  }

  /**
   * Detect and handle audio focus changes due to external apps
   * Determines whether playback interruption is due to external app starting
   * @param wasPlaying Whether audio was playing before the interruption
   */
  private async detectAudioFocusChange(wasPlaying: boolean): Promise<void> {
    if (!this.nativeMediaControls) {
      return;
    }

    try {
      // For expo-av, when external apps start playing, our audio stops
      // We detect this by monitoring unexpected playback stops

      // Check if this interruption suggests external app playback
      // In expo-av, permanent audio focus loss typically indicates external app started
      const currentTime = Date.now();
      const timeSinceLastCommand = currentTime - (this.lastUserCommandTime || 0);

      // If audio stopped unexpectedly (not due to recent user command)
      // and we were playing, it's likely due to external app
      if (wasPlaying && timeSinceLastCommand > 1000) { // 1 second threshold
        console.log('Detected potential external app audio interruption');

        // Audio focus is handled automatically by expo-av
        // External app detection simplified - just abandon focus
        await this.nativeMediaControls.abandonAudioFocus();
      } else {
        // Audio focus is handled automatically by expo-av
        // Transient interruption will auto-pause via expo-av
      }
    } catch (error) {
      console.error('Failed to handle audio focus change detection:', error);
    }
  }

  /**
   * Update background UI components (media session and notifications) with current playback state
   * Handles background-specific states like buffering with loading indicators
   */
  private async updateBackgroundUI(status: AudioStatus): Promise<void> {
    try {
      // Update MediaSessionManager with new status
      if (this.mediaSessionManager) {
        await this.mediaSessionManager.updateFromAudioStatus(status);
      }

      // Update Android notification state if available
      if (Platform.OS === 'android' && this.notificationService) {
        // For buffering state, show loading indicator in notification
        // For error state, show error message
        // For other states, show normal playback controls
        await this.notificationService.showMediaNotification({
          title: 'TrendAnkara Radyo',
          artist: 'Canlı Yayın',
          isPlaying: status.isPlaying,
        });
      }

      // Only log state changes, not every update
      if (__DEV__ && status.state !== this.currentStatus.state) {
        console.log(`Background UI updated for state: ${status.state}, playing: ${status.isPlaying}`);
      }
    } catch (error) {
      console.error('Failed to update background UI:', error);
      // Don't throw error to prevent breaking audio playback
    }
  }

  public async cleanup(): Promise<void> {
    await this.stop();
    this.listeners.clear();

    // Cleanup StreamController
    this.streamController.cleanup();

    // Cleanup AppState listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Cleanup background components
    try {
      if (this.nativeMediaControls) {
        // Native controls hide automatically when audio stops
      }
      if (this.mediaSessionManager) {
        await this.mediaSessionManager.cleanup();
      }

      if (this.notificationService) {
        await this.notificationService.cleanup();
      }
    } catch (error) {
      console.error('Failed to cleanup background components:', error);
    }
  }
}

export default AudioService;