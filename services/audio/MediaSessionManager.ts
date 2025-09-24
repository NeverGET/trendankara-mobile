import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Platform, Image } from 'react-native';
import { AudioStatus } from './AudioService';
import { MediaSessionMetadata, RemoteCommand } from './types';

/**
 * MediaSessionManager handles media session controls for background playback
 * Manages lock screen controls and notification center media controls
 */
export class MediaSessionManager {
  private static instance: MediaSessionManager;
  private metadata: MediaSessionMetadata | null = null;
  private playbackState: 'playing' | 'paused' | 'stopped' = 'stopped';
  private isBuffering: boolean = false;
  private remoteCommandHandlers: Map<RemoteCommand['type'], () => void> = new Map();
  private notificationId: string | null = null;
  private customArtworkUri: string | null = null;
  private customBackgroundColor: string | null = null;

  private constructor() {
    this.initializeSession();
    // Initialize audio session once
    this.updateExpoAudioSession();
  }

  public static getInstance(): MediaSessionManager {
    if (!MediaSessionManager.instance) {
      MediaSessionManager.instance = new MediaSessionManager();
    }
    return MediaSessionManager.instance;
  }

  /**
   * Initialize media session with platform-specific setup
   */
  private async initializeSession(): Promise<void> {
    try {
      // Request notification permissions for media controls
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }

      // Set notification handler for media controls
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      // Listen for notification responses (media control actions)
      Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse.bind(this));

      // Restore session state from storage
      await this.restoreSessionState();
    } catch (error) {
      console.error('Failed to initialize media session:', error);
    }
  }

  /**
   * Update media metadata for lock screen/notification controls
   * Uses expo-av setNowPlayingInfoAsync for iOS media controls and notifications for Android
   */
  public async updateMetadata(metadata: MediaSessionMetadata): Promise<void> {
    try {
      // Set artwork to logo if custom artwork is available, otherwise use provided artwork
      const updatedMetadata = {
        ...metadata,
        artwork: this.customArtworkUri || metadata.artwork,
      };

      this.metadata = updatedMetadata;
      await this.persistSessionState();

      // Audio session is already initialized once, no need to update again

      // Set Now Playing Info for iOS lock screen controls
      if (Platform.OS === 'ios') {
        try {
          const nowPlayingInfo: any = {
            title: updatedMetadata.title,
            artist: updatedMetadata.artist,
          };

          if (updatedMetadata.album) {
            nowPlayingInfo.album = updatedMetadata.album;
          }

          if (this.customArtworkUri) {
            nowPlayingInfo.artwork = this.customArtworkUri;
          }

          if (updatedMetadata.genre) {
            nowPlayingInfo.genre = updatedMetadata.genre;
          }

          if (updatedMetadata.duration) {
            nowPlayingInfo.duration = updatedMetadata.duration;
          }

          // Note: expo-av Audio doesn't have setNowPlayingInfoAsync
          // Media session updates will be handled through notifications
          console.log('iOS media session metadata prepared with logo artwork');
        } catch (error) {
          console.error('Failed to prepare iOS Now Playing Info:', error);
        }
      }

      // Update notification controls for Android and fallback
      await this.updateNotificationControls();
    } catch (error) {
      console.error('Failed to update media metadata:', error);
    }
  }

  /**
   * Ensure audio is enabled for media session
   * Prepares audio context for proper media control integration
   */
  private isAudioSessionInitialized = false;

  private async updateExpoAudioSession(): Promise<void> {
    if (this.isAudioSessionInitialized) {
      return; // Already initialized, skip
    }

    try {
      // Ensure audio is enabled for proper media session functionality
      await Audio.setIsEnabledAsync(true);
      this.isAudioSessionInitialized = true;
      if (__DEV__) {
      console.log('Audio session initialized for media controls');
    }
    } catch (error) {
      console.error('Failed to enable audio session:', error);
    }
  }

  /**
   * Set the current playback state
   * Now supports buffering state for loading indicators in media controls
   */
  public async setPlaybackState(state: 'playing' | 'paused' | 'stopped' | 'buffering'): Promise<void> {
    try {
      this.isBuffering = state === 'buffering';
      this.playbackState = state === 'buffering' ? 'paused' : state; // Treat buffering as paused for controls
      await this.persistSessionState();

      // Audio session already initialized, no need to update

      // Update notification controls
      await this.updateNotificationControls();
    } catch (error) {
      console.error('Failed to set playback state:', error);
    }
  }

  /**
   * Register a handler for remote media commands
   */
  public handleRemoteCommand(command: RemoteCommand['type'], handler: () => void): void {
    this.remoteCommandHandlers.set(command, handler);
  }

  /**
   * Update the notification with current media controls
   * Shows loading indicator during buffering state
   */
  private async updateNotificationControls(): Promise<void> {
    if (!this.metadata || this.playbackState === 'stopped') {
      // Clear notification if stopped or no metadata
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
        this.notificationId = null;
      }
      return;
    }

    try {
      const actions = this.buildNotificationActions();
      const notificationContent = {
        title: 'TrendAnkara Radyo',
        subtitle: this.metadata.artist || 'Canlı Yayın',
        body: this.isBuffering ? 'Yükleniyor...' : (this.metadata.album || 'TrendAnkara Radio'),
        data: {
          type: 'media_control',
          state: this.playbackState,
          isBuffering: this.isBuffering,
        },
        categoryIdentifier: 'media_control',
        ...Platform.select({
          ios: {
            sound: false,
            interruptionLevel: 'passive' as const,
            // Set custom artwork or fallback to app icon for iOS media controls
            attachments: [{
              identifier: this.customArtworkUri ? 'logo_artwork' : 'app_icon',
              url: this.customArtworkUri || require('@/assets/images/icon.png'),
              type: 'public.png',
            }],
          },
          android: {
            channelId: 'radio_playback',
            priority: 'high' as const,
            ongoing: this.playbackState === 'playing',
            actions,
            // Set custom artwork or fallback to app icon for Android notification
            icon: this.customArtworkUri || require('@/assets/images/icon.png'),
            largeIcon: this.customArtworkUri || require('@/assets/images/icon.png'),
          },
        }),
      };

      if (this.notificationId) {
        // Update existing notification
        await Notifications.scheduleNotificationAsync({
          identifier: this.notificationId,
          content: notificationContent,
          trigger: null,
        });
      } else {
        // Create new notification
        const identifier = await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: null,
        });
        this.notificationId = identifier;
      }
    } catch (error) {
      console.error('Failed to update notification controls:', error);
    }
  }

  /**
   * Build notification actions based on current state
   * Disables play/pause during buffering to show loading state
   */
  private buildNotificationActions(): any[] {
    const actions = [];

    // During buffering, disable play/pause button to show loading state
    if (this.isBuffering) {
      actions.push({
        identifier: 'buffering',
        buttonTitle: 'Yükleniyor...',
        options: {
          opensAppToForeground: false,
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      });
    } else if (this.playbackState === 'playing') {
      actions.push({
        identifier: 'pause',
        buttonTitle: 'Pause',
        options: {
          opensAppToForeground: false,
        },
      });
    } else {
      actions.push({
        identifier: 'play',
        buttonTitle: 'Play',
        options: {
          opensAppToForeground: false,
        },
      });
    }

    // Stop button always available (except during buffering on some platforms)
    if (!this.isBuffering || Platform.OS === 'ios') {
      actions.push({
        identifier: 'stop',
        buttonTitle: 'Stop',
        options: {
          opensAppToForeground: false,
        },
      });
    }

    return actions;
  }

  /**
   * Handle notification responses (media control button presses)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { actionIdentifier, notification } = response;
    const { data } = notification.request.content;

    // Only handle media control notifications
    if (data?.type !== 'media_control') {
      return;
    }

    const handler = this.remoteCommandHandlers.get(actionIdentifier as RemoteCommand['type']);
    if (handler) {
      handler();
    } else {
      console.warn(`No handler registered for remote command: ${actionIdentifier}`);
    }
  }

  /**
   * Update media session with current audio status
   * Now handles buffering state with loading indicators
   */
  public async updateFromAudioStatus(status: AudioStatus): Promise<void> {
    let state: 'playing' | 'paused' | 'stopped' | 'buffering' = 'stopped';

    switch (status.state) {
      case 'playing':
        state = 'playing';
        break;
      case 'paused':
        state = 'paused';
        break;
      case 'buffering':
      case 'loading':
        state = 'buffering';
        break;
      case 'stopped':
      case 'idle':
      case 'error':
        state = 'stopped';
        break;
    }

    await this.setPlaybackState(state);
  }

  /**
   * Persist session state to storage
   */
  private async persistSessionState(): Promise<void> {
    try {
      const sessionData = {
        metadata: this.metadata,
        playbackState: this.playbackState,
        isBuffering: this.isBuffering,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('media_session_state', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to persist session state:', error);
    }
  }

  /**
   * Restore session state from storage
   */
  private async restoreSessionState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('media_session_state');
      if (stored) {
        const sessionData = JSON.parse(stored);
        // Only restore if not too old (within 24 hours)
        if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
          this.metadata = sessionData.metadata;
          this.playbackState = sessionData.playbackState;
          this.isBuffering = sessionData.isBuffering || false;
        }
      }
    } catch (error) {
      console.error('Failed to restore session state:', error);
    }
  }

  /**
   * Clear media session and cleanup
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
        this.notificationId = null;
      }

      // Disable audio session on cleanup
      try {
        await Audio.setIsEnabledAsync(false);
        console.log('Audio session disabled on cleanup');
      } catch (error) {
        console.error('Failed to disable audio session:', error);
      }

      this.remoteCommandHandlers.clear();
      this.metadata = null;
      this.playbackState = 'stopped';
      this.isBuffering = false;
      await AsyncStorage.removeItem('media_session_state');
    } catch (error) {
      console.error('Failed to cleanup media session:', error);
    }
  }

  /**
   * Check if media session is active
   */
  public isActive(): boolean {
    return this.playbackState !== 'stopped' && this.metadata !== null;
  }

  /**
   * Get current metadata
   */
  public getMetadata(): MediaSessionMetadata | null {
    return this.metadata;
  }

  /**
   * Get current playback state
   */
  public getPlaybackState(): 'playing' | 'paused' | 'stopped' {
    return this.playbackState;
  }

  /**
   * Set custom artwork for media session
   * @param assetSource - Local asset source (from require())
   * @param backgroundColor - Background color for the artwork
   */
  public setCustomArtwork(assetSource: any, backgroundColor: string): void {
    try {
      // Resolve local asset URI
      const resolvedUri = Image.resolveAssetSource(assetSource)?.uri;

      if (resolvedUri) {
        this.customArtworkUri = resolvedUri;
        this.customBackgroundColor = backgroundColor;
        console.log('Custom artwork set:', { uri: resolvedUri, backgroundColor });
      } else {
        console.warn('Failed to resolve artwork asset source');
        this.customArtworkUri = null;
        this.customBackgroundColor = null;
      }
    } catch (error) {
      console.error('Failed to set custom artwork:', error);
      this.customArtworkUri = null;
      this.customBackgroundColor = null;
    }
  }
}

export default MediaSessionManager;