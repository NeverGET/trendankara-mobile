import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export interface AudioStatus {
  state: AudioState;
  isPlaying: boolean;
  error?: string;
}

/**
 * Working audio service using expo-av with manual media notifications
 */
class WorkingAudioService {
  private static instance: WorkingAudioService;
  private sound: Audio.Sound | null = null;
  private listeners: Set<(status: AudioStatus) => void> = new Set();
  private currentStatus: AudioStatus = { state: 'idle', isPlaying: false };
  // Actual TrendAnkara stream URL
  private streamUrl = 'https://radyo.yayin.com.tr:5132/';
  private notificationId: string | null = null;

  // Android buffering recovery
  private bufferingTimeout: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  private constructor() {
    this.initializeAudio();
  }

  public static getInstance(): WorkingAudioService {
    if (!WorkingAudioService.instance) {
      WorkingAudioService.instance = new WorkingAudioService();
    }
    return WorkingAudioService.instance;
  }

  private async initializeAudio(): Promise<void> {
    try {
      // Configure expo-av for background playback
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
      });

      // Note: Notifications for media controls don't work in Expo Go
      // They work in development builds and production builds
      if (Platform.OS === 'android' && !__DEV__) {
        await this.setupNotifications();
      }

      console.log('WorkingAudioService initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private async setupNativeMediaControls(): Promise<void> {
    try {
      // Check if we're in development build or production
      const isExpoGo = typeof __DEV__ !== 'undefined' && __DEV__;

      if (Platform.OS === 'ios' && this.sound) {
        // Set iOS media center metadata
        await this.sound.setStatusAsync({
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 250,
        });

        // Set Now Playing Info for iOS lock screen and control center
        // This only works in development builds, not Expo Go
        if (!isExpoGo && typeof Audio.setNowPlayingInfoAsync === 'function') {
          await Audio.setNowPlayingInfoAsync({
            title: 'TrendAnkara Radyo',
            artist: 'Canlı Yayın',
            album: 'TrendAnkara',
            genre: 'Radio',
            isLiveStream: true,
          });
          console.log('iOS native media controls enabled');
        } else if (isExpoGo) {
          console.warn('Native media controls require development build. Currently running in Expo Go.');
        }
      }

      if (Platform.OS === 'android') {
        if (isExpoGo) {
          console.warn('Android native media controls require development build. Currently running in Expo Go.');
        } else {
          // In production/development builds, Android native controls work through
          // the MediaSession API which is handled automatically by expo-av
          console.log('Android native media controls should be available in development build');
        }
      }
    } catch (error) {
      console.error('Failed to setup native media controls:', error);
    }
  }

  private async setupNotifications(): Promise<void> {
    try {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await Notifications.setNotificationChannelAsync('media-playback', {
          name: 'Media Playback',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [0],
          sound: null,
        });

        // Listen for notification responses
        Notifications.addNotificationResponseReceivedListener(response => {
          this.handleNotificationAction(response.actionIdentifier);
        });
      }
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }

  private handleNotificationAction(actionId: string): void {
    switch (actionId) {
      case 'play':
        this.play();
        break;
      case 'pause':
        this.pause();
        break;
      case 'stop':
        this.stop();
        break;
    }
  }

  private async showMediaNotification(isPlaying: boolean): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const actions = isPlaying
        ? [
            { title: 'Duraklat', icon: 'pause', pressAction: { id: 'pause' } },
            { title: 'Durdur', icon: 'stop', pressAction: { id: 'stop' } },
          ]
        : [
            { title: 'Oynat', icon: 'play_arrow', pressAction: { id: 'play' } },
            { title: 'Durdur', icon: 'stop', pressAction: { id: 'stop' } },
          ];

      // Cancel previous notification
      if (this.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.notificationId);
      }

      this.notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'TrendAnkara Radyo',
          body: 'Canlı Yayın',
          data: { type: 'media-control' },
          android: {
            channelId: 'media-playback',
            actions: actions as any,
            sticky: true,
            ongoing: isPlaying,
            priority: isPlaying ? 'high' : 'low',
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show media notification:', error);
    }
  }

  private async hideMediaNotification(): Promise<void> {
    if (this.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(this.notificationId);
        this.notificationId = null;
      } catch (error) {
        console.error('Failed to hide notification:', error);
      }
    }
  }

  public async play(): Promise<void> {
    try {
      console.log('Starting audio playback');
      this.updateStatus({ state: 'loading', isPlaying: false });

      if (!this.sound) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: this.streamUrl },
          {
            shouldPlay: true, // Start playing immediately to reduce startup time
            progressUpdateIntervalMillis: 250, // Very responsive status updates for UI
            volume: 1.0,
            isLooping: false
          },
          this.onPlaybackStatusUpdate.bind(this)
        );
        this.sound = sound;
      } else {
        await this.sound.playAsync();
      }
      // Set up native media controls
      await this.setupNativeMediaControls();

      // Show notification only in production builds
      if (!__DEV__) {
        await this.showMediaNotification(true);
      }

      // Reset retry count on successful play
      this.retryCount = 0;

      console.log('Audio playback started');
    } catch (error) {
      console.error('Play failed:', error);
      this.updateStatus({
        state: 'error',
        isPlaying: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  public async pause(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();

        // Force immediate UI update
        this.updateStatus({ state: 'paused', isPlaying: false });

        if (!__DEV__) {
          await this.showMediaNotification(false);
        }
        console.log('Audio paused');
      }
    } catch (error) {
      console.error('Pause failed:', error);
    }
  }

  public async stop(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      if (!__DEV__) {
        await this.hideMediaNotification();
      }
      this.updateStatus({ state: 'stopped', isPlaying: false });
      console.log('Audio stopped');
    } catch (error) {
      console.error('Stop failed:', error);
    }
  }

  private onPlaybackStatusUpdate(status: any): void {
    if (status.isLoaded) {
      let state: AudioState;

      if (status.isPlaying) {
        state = 'playing';
      } else if (status.isBuffering) {
        state = 'loading';
        // Android buffering recovery: if buffering for too long, try to recover
        if (Platform.OS === 'android') {
          this.handleAndroidBuffering();
        }
      } else if (status.shouldPlay && !status.isPlaying) {
        state = 'loading'; // Should be playing but isn't - still loading
      } else {
        state = 'paused';
      }

      const newStatus: AudioStatus = {
        state,
        isPlaying: status.isPlaying,
      };

      // Only update if status actually changed
      const hasChanged =
        this.currentStatus.state !== newStatus.state ||
        this.currentStatus.isPlaying !== newStatus.isPlaying;

      if (hasChanged) {
        this.updateStatus(newStatus);

        if (__DEV__) {
          console.log(`Audio status changed: ${this.currentStatus.state} → ${state}, playing: ${this.currentStatus.isPlaying} → ${status.isPlaying}`);
        }
      }
    } else if (status.error) {
      const errorStatus = {
        state: 'error' as AudioState,
        isPlaying: false,
        error: status.error
      };

      // Only update if this is a new error
      if (this.currentStatus.state !== 'error' || this.currentStatus.error !== status.error) {
        this.updateStatus(errorStatus);
        console.error('Audio playback error:', status.error);

        // Auto-retry on error after a delay
        if (Platform.OS === 'android') {
          this.scheduleRetry();
        }
      }
    }
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

  public addListener(callback: (status: AudioStatus) => void): void {
    this.listeners.add(callback);
  }

  public removeListener(callback: (status: AudioStatus) => void): void {
    this.listeners.delete(callback);
  }

  public get isPlaying(): boolean {
    return this.currentStatus.isPlaying;
  }

  private handleAndroidBuffering(): void {
    // Clear previous timeout
    if (this.bufferingTimeout) {
      clearTimeout(this.bufferingTimeout);
    }

    // Set a timeout to recover from buffering if it takes too long
    this.bufferingTimeout = setTimeout(() => {
      if (this.currentStatus.state === 'loading' && this.sound) {
        console.log('Android buffering recovery: attempting to restart playback');
        this.restartPlayback();
      }
    }, 5000); // 5 second timeout
  }

  private async restartPlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Brief delay before restarting
      setTimeout(() => {
        this.play();
      }, 1000);
    } catch (error) {
      console.error('Failed to restart playback:', error);
    }
  }

  private scheduleRetry(): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;

      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }

      this.retryTimeout = setTimeout(() => {
        console.log(`Retry attempt ${this.retryCount}/${this.maxRetries}`);
        this.play();
      }, 2000 * this.retryCount); // Exponential backoff
    } else {
      console.error('Max retries reached, giving up');
      this.retryCount = 0;
    }
  }

  public async cleanup(): Promise<void> {
    // Clear timeouts
    if (this.bufferingTimeout) {
      clearTimeout(this.bufferingTimeout);
      this.bufferingTimeout = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    await this.stop();
    this.listeners.clear();
  }
}

export default WorkingAudioService;