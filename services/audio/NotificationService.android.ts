import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AudioStatus } from './AudioService';
import { MediaSessionMetadata } from './types';
import { BACKGROUND_CONFIG } from '@/constants/audio';

/**
 * Android-specific notification service for audio playback
 * Manages foreground service notifications with media controls
 */
export class AndroidNotificationService {
  private static instance: AndroidNotificationService;
  private notificationId: string | null = null;
  private channelId: string;
  private isInitialized: boolean = false;
  private currentStatus: AudioStatus | null = null;
  private currentMetadata: MediaSessionMetadata | null = null;

  private constructor() {
    this.channelId = BACKGROUND_CONFIG.android.notificationChannelId;
  }

  public static getInstance(): AndroidNotificationService {
    if (!AndroidNotificationService.instance) {
      AndroidNotificationService.instance = new AndroidNotificationService();
    }
    return AndroidNotificationService.instance;
  }

  /**
   * Initialize the notification service
   * Sets up notification channel and permissions
   */
  public async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidNotificationService can only be used on Android platform');
    }

    if (this.isInitialized) {
      return;
    }

    try {
      // Request notification permissions
      await this.requestPermissions();

      // Setup notification channel
      await this.setupNotificationChannel();

      this.isInitialized = true;
      console.log('[NotificationService] Initialized successfully');
    } catch (error) {
      console.error('[NotificationService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Create a notification for audio playback
   * @param status Current audio status
   * @param metadata Optional media metadata
   */
  public async createNotification(
    status: AudioStatus,
    metadata?: MediaSessionMetadata
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const notificationContent = this.buildNotificationContent(status, metadata);

      const notificationResult = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
      });

      this.notificationId = notificationResult;
      this.currentStatus = status;
      this.currentMetadata = metadata || null;

      console.log('[NotificationService] Notification created:', this.notificationId);
      return notificationResult;
    } catch (error) {
      console.error('[NotificationService] Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Update notification state based on current playback status
   * @param status Current audio status
   * @param metadata Optional updated metadata
   */
  public async updateNotificationState(
    status: AudioStatus,
    metadata?: MediaSessionMetadata
  ): Promise<void> {
    if (!this.notificationId || !this.isInitialized) {
      return;
    }

    try {
      // Update stored state
      this.currentStatus = status;
      if (metadata) {
        this.currentMetadata = metadata;
      }

      // Recreate notification with updated content
      const notificationContent = this.buildNotificationContent(status, this.currentMetadata || undefined);

      // Dismiss current notification and create new one
      await Notifications.dismissNotificationAsync(this.notificationId);

      const notificationResult = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null,
      });

      this.notificationId = notificationResult;
      console.log('[NotificationService] Notification state updated');
    } catch (error) {
      console.error('[NotificationService] Failed to update notification state:', error);
      throw error;
    }
  }

  /**
   * Clear the current notification
   */
  public async clearNotification(): Promise<void> {
    if (!this.notificationId) {
      return;
    }

    try {
      await Notifications.dismissNotificationAsync(this.notificationId);
      this.notificationId = null;
      this.currentStatus = null;
      this.currentMetadata = null;
      console.log('[NotificationService] Notification cleared');
    } catch (error) {
      console.error('[NotificationService] Failed to clear notification:', error);
      throw error;
    }
  }

  /**
   * Check if notification is currently active
   */
  public isNotificationActive(): boolean {
    return this.notificationId !== null;
  }

  /**
   * Get current notification ID
   */
  public getCurrentNotificationId(): string | null {
    return this.notificationId;
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<void> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Notification permissions are required for background playback');
      }
      console.log('[NotificationService] Permissions granted');
    } catch (error) {
      console.error('[NotificationService] Failed to request permissions:', error);
      throw error;
    }
  }

  /**
   * Setup notification channel for media playback
   */
  private async setupNotificationChannel(): Promise<void> {
    try {
      const importance = BACKGROUND_CONFIG.android.notificationPriority === 'high'
        ? Notifications.AndroidImportance.HIGH
        : Notifications.AndroidImportance.DEFAULT;

      await Notifications.setNotificationChannelAsync(this.channelId, {
        name: 'Radio Playback',
        description: 'Controls for radio playback',
        importance,
        sound: null, // No sound for media controls
        enableVibrate: false,
        showBadge: false,
      });

      console.log('[NotificationService] Notification channel setup completed');
    } catch (error) {
      console.error('[NotificationService] Failed to setup notification channel:', error);
      throw error;
    }
  }

  /**
   * Build notification content based on current status and metadata
   */
  private buildNotificationContent(
    status: AudioStatus,
    metadata?: MediaSessionMetadata
  ): Notifications.NotificationContentInput {
    const title = metadata?.title || 'TrendAnkara Radio';
    const artist = metadata?.artist || 'Radio Stream';
    const isPlaying = status.isPlaying;

    // Determine status text based on current state
    let statusText = artist;
    switch (status.state) {
      case 'loading':
        statusText = 'Loading...';
        break;
      case 'buffering':
        statusText = 'Buffering...';
        break;
      case 'error':
        statusText = status.error || 'Error occurred';
        break;
      case 'stopped':
        statusText = 'Stopped';
        break;
      default:
        statusText = artist;
    }

    return {
      title,
      body: statusText,
      categoryIdentifier: 'media',
      sound: false,
      priority: 'high',
      sticky: true,
      data: {
        type: 'media_playback',
        status: status.state,
        isPlaying,
        metadata: metadata || {},
      },
      android: {
        channelId: this.channelId,
        autoCancel: false,
        ongoing: true, // Makes notification persistent (foreground service)
        actions: this.buildNotificationActions(status),
        largeIcon: metadata?.artwork,
        progress: {
          max: 100,
          current: status.position && status.duration
            ? Math.round((status.position / status.duration) * 100)
            : 0,
          indeterminate: status.state === 'loading' || status.state === 'buffering',
        },
      },
    };
  }

  /**
   * Build notification actions based on current playback state
   */
  private buildNotificationActions(status: AudioStatus): Notifications.NotificationAction[] {
    if (!BACKGROUND_CONFIG.mediaControls.enableNotificationControls) {
      return [];
    }

    const actions: Notifications.NotificationAction[] = [];
    const compactActions = BACKGROUND_CONFIG.mediaControls.compactActions;

    // Add play/pause button based on current state
    if (status.isPlaying && compactActions.includes('pause')) {
      actions.push({
        title: 'Pause',
        pressAction: { id: 'pause' },
        icon: 'pause',
      });
    } else if (!status.isPlaying && compactActions.includes('play')) {
      actions.push({
        title: 'Play',
        pressAction: { id: 'play' },
        icon: 'play_arrow',
      });
    }

    // Add stop button
    if (compactActions.includes('stop')) {
      actions.push({
        title: 'Stop',
        pressAction: { id: 'stop' },
        icon: 'stop',
      });
    }

    // Add open app action (tap notification to open app)
    actions.push({
      title: 'Open App',
      pressAction: { id: 'open_app' },
      icon: 'radio',
    });

    return actions;
  }

  /**
   * Handle notification action press
   * This method can be called by the main audio service when notification actions are pressed
   */
  public async handleNotificationAction(actionId: string): Promise<void> {
    console.log('[NotificationService] Handling notification action:', actionId);

    // This service doesn't handle the actual audio control logic
    // It just logs the action for debugging purposes
    // The actual handling should be done by the AudioService or BackgroundHandler

    switch (actionId) {
      case 'play':
      case 'pause':
      case 'stop':
        console.log(`[NotificationService] ${actionId} action received`);
        break;
      case 'open_app':
        console.log('[NotificationService] Open app action received');
        break;
      default:
        console.log('[NotificationService] Unknown action:', actionId);
    }
  }

  /**
   * Cleanup the notification service
   */
  public async cleanup(): Promise<void> {
    try {
      await this.clearNotification();
      this.isInitialized = false;
      console.log('[NotificationService] Cleanup completed');
    } catch (error) {
      console.error('[NotificationService] Failed to cleanup:', error);
      throw error;
    }
  }
}

export default AndroidNotificationService;