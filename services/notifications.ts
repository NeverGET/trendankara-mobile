/**
 * Notification Service
 * Handle push notifications and local notifications
 * Trend Ankara Mobile Application
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationHelper } from '@/utils/navigation';

// Notification types
export type NotificationType =
  | 'news_published'
  | 'poll_created'
  | 'poll_ending'
  | 'player_update'
  | 'maintenance_alert'
  | 'app_update'
  | 'general';

// Notification data structure
export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  categoryId?: string;
  scheduledTime?: Date;
}

// Push notification token response
export interface PushTokenResponse {
  token: string;
  type: 'expo' | 'android' | 'ios';
}

// Notification settings
export interface NotificationSettings {
  enabled: boolean;
  newsUpdates: boolean;
  pollNotifications: boolean;
  playerUpdates: boolean;
  maintenanceAlerts: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

/**
 * Notification Service Class
 */
export class NotificationService {
  private static instance: NotificationService;
  private static readonly STORAGE_KEY = 'notification_settings';
  private static readonly TOKEN_KEY = 'push_token';

  private isInitialized = false;
  private pushToken: string | null = null;
  private settings: NotificationSettings = {
    enabled: true,
    newsUpdates: true,
    pollNotifications: true,
    playerUpdates: false,
    maintenanceAlerts: true,
    sound: true,
    vibration: true,
    badge: true,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          console.log('Handling notification:', notification);

          return {
            shouldShowAlert: this.settings.enabled,
            shouldPlaySound: this.settings.enabled && this.settings.sound,
            shouldSetBadge: this.settings.enabled && this.settings.badge,
          };
        },
      });

      // Load settings
      await this.loadSettings();

      // Request permissions if enabled
      if (this.settings.enabled) {
        await this.requestPermissions();
      }

      // Register for push notifications
      await this.registerForPushNotifications();

      // Setup notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('Notification service initialized');

      return true;
    } catch (error) {
      console.error('Notification service initialization error:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      console.log('Notification permission granted');
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '55f2a9e8-b926-416c-9eaf-213c127638dc', // From app.json
      });

      this.pushToken = tokenData.data;

      // Store token locally
      await AsyncStorage.setItem(NotificationService.TOKEN_KEY, this.pushToken);

      console.log('Push token:', this.pushToken);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      return this.pushToken;
    } catch (error) {
      console.error('Push notification registration error:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channel
   */
  private async setupAndroidChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: this.settings.vibration,
    });

    // News notifications channel
    await Notifications.setNotificationChannelAsync('news', {
      name: 'Haberler',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      description: 'Yeni haber bildirimleri',
    });

    // Poll notifications channel
    await Notifications.setNotificationChannelAsync('polls', {
      name: 'Anketler',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      description: 'Anket bildirimleri',
    });

    // Maintenance alerts channel
    await Notifications.setNotificationChannelAsync('maintenance', {
      name: 'Bakım Bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      description: 'Sistem bakım bildirimleri',
    });
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification tapped/clicked
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification received
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    // Update badge count
    if (this.settings.badge) {
      this.updateBadgeCount();
    }

    // Custom handling based on notification type
    const notificationType = notification.request.content.data?.type as NotificationType;

    switch (notificationType) {
      case 'news_published':
        // Could trigger news refresh
        break;
      case 'poll_created':
        // Could trigger polls refresh
        break;
      default:
        break;
    }
  }

  /**
   * Handle notification response (tapped)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    const notificationType = data?.type as NotificationType;

    // Navigate based on notification type
    switch (notificationType) {
      case 'news_published':
        if (data?.articleId) {
          NavigationHelper.goToArticle(data.articleId);
        } else {
          NavigationHelper.goToTab('news');
        }
        break;

      case 'poll_created':
      case 'poll_ending':
        if (data?.pollId) {
          NavigationHelper.goToPoll(data.pollId);
        } else {
          NavigationHelper.goToTab('polls');
        }
        break;

      case 'maintenance_alert':
        NavigationHelper.goToAbout();
        break;

      case 'app_update':
        // Could open app store or settings
        NavigationHelper.goToSettings();
        break;

      default:
        NavigationHelper.goHome();
        break;
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(data: NotificationData): Promise<string | null> {
    try {
      if (!this.settings.enabled) {
        console.log('Notifications disabled');
        return null;
      }

      const channelId = this.getChannelId(data.type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: data.sound || 'default',
          badge: data.badge,
          categoryIdentifier: data.categoryId,
        },
        trigger: data.scheduledTime ? {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: data.scheduledTime,
        } : null,
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Local notification error:', error);
      return null;
    }
  }

  /**
   * Get channel ID for notification type
   */
  private getChannelId(type: NotificationType): string {
    switch (type) {
      case 'news_published':
        return 'news';
      case 'poll_created':
      case 'poll_ending':
        return 'polls';
      case 'maintenance_alert':
        return 'maintenance';
      default:
        return 'default';
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Cancel notification error:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Cancel all notifications error:', error);
    }
  }

  /**
   * Update badge count
   */
  async updateBadgeCount(count?: number): Promise<void> {
    try {
      if (!this.settings.badge) {
        return;
      }

      if (count !== undefined) {
        await Notifications.setBadgeCountAsync(count);
      } else {
        // Auto-calculate badge count
        const delivered = await Notifications.getPresentedNotificationsAsync();
        await Notifications.setBadgeCountAsync(delivered.length);
      }
    } catch (error) {
      console.error('Badge count update error:', error);
    }
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await this.updateBadgeCount(0);
  }

  /**
   * Get notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();

      // Re-register if enabled status changed
      if ('enabled' in newSettings) {
        if (newSettings.enabled) {
          await this.registerForPushNotifications();
        }
      }

      console.log('Notification settings updated:', this.settings);
    } catch (error) {
      console.error('Settings update error:', error);
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NotificationService.STORAGE_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        NotificationService.STORAGE_KEY,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('Save settings error:', error);
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * Test notification (development only)
   */
  async testNotification(): Promise<void> {
    if (!__DEV__) {
      return;
    }

    await this.sendLocalNotification({
      type: 'general',
      title: 'Test Bildirimi',
      body: 'Bu bir test bildirimidir.',
      data: { test: true },
    });
  }
}

// Export singleton instance
export default NotificationService.getInstance();

/**
 * Notification Helper Functions
 */
export const NotificationHelpers = {
  /**
   * Create news notification
   */
  createNewsNotification(title: string, articleId: number): NotificationData {
    return {
      type: 'news_published',
      title: 'Yeni Haber',
      body: title,
      data: { articleId },
    };
  },

  /**
   * Create poll notification
   */
  createPollNotification(question: string, pollId: number, isEnding = false): NotificationData {
    return {
      type: isEnding ? 'poll_ending' : 'poll_created',
      title: isEnding ? 'Anket Sona Eriyor' : 'Yeni Anket',
      body: question,
      data: { pollId },
    };
  },

  /**
   * Create maintenance notification
   */
  createMaintenanceNotification(message: string): NotificationData {
    return {
      type: 'maintenance_alert',
      title: 'Bakım Bildirimi',
      body: message,
    };
  },
};

/**
 * Usage Examples:
 *
 * Initialize notifications:
 * ```tsx
 * import NotificationService from '@/services/notifications';
 *
 * // In App.tsx or root component
 * useEffect(() => {
 *   NotificationService.initialize();
 * }, []);
 * ```
 *
 * Send local notification:
 * ```tsx
 * const sendNewsNotification = async (article: NewsArticle) => {
 *   const notification = NotificationHelpers.createNewsNotification(
 *     article.title,
 *     article.id
 *   );
 *
 *   await NotificationService.sendLocalNotification(notification);
 * };
 * ```
 *
 * Update settings:
 * ```tsx
 * const updateNotificationSettings = async () => {
 *   await NotificationService.updateSettings({
 *     newsUpdates: false,
 *     sound: true,
 *   });
 * };
 * ```
 */