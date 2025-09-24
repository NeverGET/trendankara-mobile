import { Platform } from 'react-native';
import { AudioStatus } from './AudioService';
import { MediaSessionMetadata } from './types';

/**
 * iOS-specific notification service stub for audio playback
 * iOS uses native media controls via Control Center and Lock Screen,
 * so this service provides no-op implementations to maintain platform abstraction
 */
export class IOSNotificationService {
  private static instance: IOSNotificationService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): IOSNotificationService {
    if (!IOSNotificationService.instance) {
      IOSNotificationService.instance = new IOSNotificationService();
    }
    return IOSNotificationService.instance;
  }

  /**
   * Initialize the notification service
   * No-op for iOS as it uses native controls
   */
  public async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      throw new Error('IOSNotificationService can only be used on iOS platform');
    }

    this.isInitialized = true;
    console.log('[NotificationService] iOS initialized - using native controls');
  }

  /**
   * Create a notification for audio playback
   * No-op for iOS - native controls are handled by the media session
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

    console.log('[NotificationService] iOS using native controls, no notification created');
    return 'ios-native-controls';
  }

  /**
   * Update notification state based on current playback status
   * No-op for iOS - native controls update automatically
   * @param status Current audio status
   * @param metadata Optional updated metadata
   */
  public async updateNotificationState(
    status: AudioStatus,
    metadata?: MediaSessionMetadata
  ): Promise<void> {
    console.log('[NotificationService] iOS native controls update automatically');
  }

  /**
   * Clear the current notification
   * No-op for iOS - native controls are managed by the system
   */
  public async clearNotification(): Promise<void> {
    console.log('[NotificationService] iOS native controls cleared automatically');
  }

  /**
   * Check if notification is currently active
   * Always returns true for iOS as native controls are system-managed
   */
  public isNotificationActive(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current notification ID
   * Returns static ID for iOS as there's no actual notification
   */
  public getCurrentNotificationId(): string | null {
    return this.isInitialized ? 'ios-native-controls' : null;
  }

  /**
   * Handle notification action press
   * No-op for iOS - actions are handled by the media session directly
   */
  public async handleNotificationAction(actionId: string): Promise<void> {
    console.log('[NotificationService] iOS action handled by native controls:', actionId);
  }

  /**
   * Cleanup the notification service
   * No-op for iOS - native controls are cleaned up by the system
   */
  public async cleanup(): Promise<void> {
    this.isInitialized = false;
    console.log('[NotificationService] iOS cleanup completed');
  }
}

export default IOSNotificationService;