import * as Notifications from 'expo-notifications';
import { Platform, Subscription } from 'react-native';
import { Audio } from 'expo-av';

/**
 * Media notification service for Android
 * Creates a foreground service notification with media controls
 */
export class MediaNotificationService {
  private notificationId: string | null = null;
  private isInitialized = false;
  private responseListener: Subscription | null = null;
  private onPlayCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onStopCallback: (() => void) | null = null;

  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('MediaNotificationService is Android-only');
      return;
    }

    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Create notification channel for media
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('media-playback', {
          name: 'Media Playback',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [0],
          sound: null,
        });
      }

      // Set up notification response listener
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        this.handleNotificationResponse(response);
      });

      this.isInitialized = true;
      console.log('MediaNotificationService initialized');
    } catch (error) {
      console.error('Failed to initialize MediaNotificationService:', error);
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const actionId = response.actionIdentifier;

    console.log('Notification action received:', actionId);

    switch (actionId) {
      case 'play':
        if (this.onPlayCallback) {
          this.onPlayCallback();
        }
        break;
      case 'pause':
        if (this.onPauseCallback) {
          this.onPauseCallback();
        }
        break;
      case 'stop':
        if (this.onStopCallback) {
          this.onStopCallback();
        }
        break;
      case 'default':
        // Tapped on notification body - do nothing or toggle play/pause
        break;
    }
  }

  public setCallbacks(callbacks: {
    onPlay?: () => void;
    onPause?: () => void;
    onStop?: () => void;
  }): void {
    this.onPlayCallback = callbacks.onPlay || null;
    this.onPauseCallback = callbacks.onPause || null;
    this.onStopCallback = callbacks.onStop || null;
  }

  async showMediaNotification(metadata: {
    title: string;
    artist?: string;
    isPlaying: boolean;
  }): Promise<void> {
    if (!this.isInitialized || Platform.OS !== 'android') {
      return;
    }

    try {
      // Build actions array dynamically based on playback state
      const actions = [];

      if (metadata.isPlaying) {
        actions.push({
          title: 'Duraklat',
          icon: 'pause',
          pressAction: {
            id: 'pause',
          },
        });
      } else {
        actions.push({
          title: 'Oynat',
          icon: 'play_arrow',
          pressAction: {
            id: 'play',
          },
        });
      }

      actions.push({
        title: 'Durdur',
        icon: 'stop',
        pressAction: {
          id: 'stop',
        },
      });

      const notificationContent = {
        title: metadata.title,
        body: metadata.artist || 'TrendAnkara Radyo',
        data: { type: 'media-control', isPlaying: metadata.isPlaying },
        android: {
          channelId: 'media-playback',
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          actions: actions,
          sticky: true,
          ongoing: metadata.isPlaying, // Only ongoing when playing
          priority: metadata.isPlaying ? 'high' : 'low',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          showWhen: false,
          usesChronometer: false,
        },
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: notificationContent as any,
        trigger: null,
      });

      // Cancel previous notification if exists
      if (this.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.notificationId);
      }

      this.notificationId = id;
    } catch (error) {
      console.error('Failed to show media notification:', error);
    }
  }

  async hideMediaNotification(): Promise<void> {
    if (this.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(this.notificationId);
        this.notificationId = null;
      } catch (error) {
        console.error('Failed to hide media notification:', error);
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.hideMediaNotification();
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    this.isInitialized = false;
  }
}

export default MediaNotificationService;