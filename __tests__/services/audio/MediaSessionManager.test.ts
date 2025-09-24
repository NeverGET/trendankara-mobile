import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MediaSessionManager } from '../../../services/audio/MediaSessionManager';
import { MediaSessionMetadata, RemoteCommand } from '../../../services/audio/types';
import { AudioStatus } from '../../../services/audio/AudioService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(),
  },
}));

describe('MediaSessionManager', () => {
  let manager: MediaSessionManager;
  let mockAsyncStorage: jest.Mocked<typeof AsyncStorage>;
  let mockNotifications: jest.Mocked<typeof Notifications>;
  let mockPlatform: jest.Mocked<typeof Platform>;

  // Helper function to create mock notification response
  const createMockNotificationResponse = (actionIdentifier: string, dataType: string = 'media_control') => ({
    actionIdentifier,
    userText: undefined,
    notification: {
      date: Date.now(),
      request: {
        identifier: `test-${actionIdentifier}`,
        content: {
          title: 'Test Song',
          subtitle: 'Test Artist',
          body: 'Test Album',
          data: { type: dataType },
          sound: null,
        },
        trigger: null,
      },
    },
  });

  beforeEach(() => {
    // Clear all previous instances
    (MediaSessionManager as any).instance = undefined;

    mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
    mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
    mockPlatform = Platform as jest.Mocked<typeof Platform>;

    // Reset all mocks
    jest.clearAllMocks();

    // Set default mock implementations
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification-id');
    mockNotifications.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    mockPlatform.OS = 'ios';
    mockPlatform.select.mockImplementation((platforms: any) => platforms.ios || platforms.default);

    manager = MediaSessionManager.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = MediaSessionManager.getInstance();
      const instance2 = MediaSessionManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize session on first instantiation', () => {
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(mockNotifications.setNotificationHandler).toHaveBeenCalledTimes(1);
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Initialization', () => {
    it('should request notification permissions if not granted', async () => {
      // Clear previous instance and create new one with denied permissions
      (MediaSessionManager as any).instance = undefined;
      mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);

      manager = MediaSessionManager.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('should set notification handler correctly', async () => {
      expect(mockNotifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });

      // Test the handler function
      const handlerCall = mockNotifications.setNotificationHandler.mock.calls[0][0];
      const mockNotification = {
        date: Date.now(),
        request: {
          identifier: 'test',
          content: {
            title: 'Test',
            subtitle: null,
            body: null,
            data: {},
            sound: null,
          },
          trigger: null,
        },
      };

      if (handlerCall) {
        const result = await handlerCall.handleNotification(mockNotification as any);

        expect(result).toEqual({
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        });
      }
    });

    it('should add notification response listener', () => {
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should restore session state on initialization', async () => {
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('media_session_state');
    });
  });

  describe('Metadata Management', () => {
    it('should update metadata successfully', async () => {
      const metadata: MediaSessionMetadata = {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
      };

      await manager.updateMetadata(metadata);

      expect(manager.getMetadata()).toEqual(metadata);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'media_session_state',
        expect.stringContaining('Test Song')
      );
    });

    it('should handle metadata update errors gracefully', async () => {
      const metadata: MediaSessionMetadata = {
        title: 'Test Song',
        artist: 'Test Artist',
      };

      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(manager.updateMetadata(metadata)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to persist session state:',
        expect.any(Error)
      );
    });

    it('should return null initially when no metadata is set', () => {
      expect(manager.getMetadata()).toBeNull();
    });
  });

  describe('Playback State Management', () => {
    it('should set playback state to playing', async () => {
      await manager.setPlaybackState('playing');

      expect(manager.getPlaybackState()).toBe('playing');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should set playback state to paused', async () => {
      await manager.setPlaybackState('paused');

      expect(manager.getPlaybackState()).toBe('paused');
    });

    it('should set playback state to stopped', async () => {
      await manager.setPlaybackState('stopped');

      expect(manager.getPlaybackState()).toBe('stopped');
    });

    it('should handle playback state update errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(manager.setPlaybackState('playing')).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to persist session state:',
        expect.any(Error)
      );
    });

    it('should return stopped as initial playback state', () => {
      expect(manager.getPlaybackState()).toBe('stopped');
    });
  });

  describe('Remote Command Handling', () => {
    it('should register remote command handler', () => {
      const playHandler = jest.fn();

      manager.handleRemoteCommand('play', playHandler);

      // Trigger a notification response
      const responseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];
      const mockResponse = createMockNotificationResponse('play');

      responseListener(mockResponse as any);

      expect(playHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple command handlers', () => {
      const playHandler = jest.fn();
      const pauseHandler = jest.fn();

      manager.handleRemoteCommand('play', playHandler);
      manager.handleRemoteCommand('pause', pauseHandler);

      const responseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];

      // Test play command
      const playResponse = createMockNotificationResponse('play');
      responseListener(playResponse as any);

      // Test pause command
      const pauseResponse = createMockNotificationResponse('pause');
      responseListener(pauseResponse as any);

      expect(playHandler).toHaveBeenCalledTimes(1);
      expect(pauseHandler).toHaveBeenCalledTimes(1);
    });

    it('should ignore non-media-control notifications', () => {
      const playHandler = jest.fn();
      manager.handleRemoteCommand('play', playHandler);

      const responseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];
      const mockResponse = createMockNotificationResponse('play', 'other_notification');

      responseListener(mockResponse as any);

      expect(playHandler).not.toHaveBeenCalled();
    });

    it('should warn when no handler is registered for command', () => {
      const responseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];
      const mockResponse = createMockNotificationResponse('unknown_command');

      responseListener(mockResponse as any);

      expect(console.warn).toHaveBeenCalledWith(
        'No handler registered for remote command: unknown_command'
      );
    });
  });

  describe('Notification Controls', () => {
    beforeEach(async () => {
      const metadata: MediaSessionMetadata = {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
      };
      await manager.updateMetadata(metadata);
    });

    it('should create notification when playing', async () => {
      await manager.setPlaybackState('playing');

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: 'Test Song',
          subtitle: 'Test Artist',
          body: 'Test Album',
          data: {
            type: 'media_control',
            state: 'playing',
          },
          categoryIdentifier: 'media_control',
        }),
        trigger: null,
      });
    });

    it('should update existing notification when state changes', async () => {
      // First set to playing
      await manager.setPlaybackState('playing');
      const firstCallCount = mockNotifications.scheduleNotificationAsync.mock.calls.length;

      // Then set to paused
      await manager.setPlaybackState('paused');

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(firstCallCount + 1);
    });

    it('should dismiss notification when stopped', async () => {
      // First set to playing to create notification
      await manager.setPlaybackState('playing');

      // Then stop
      await manager.setPlaybackState('stopped');

      expect(mockNotifications.dismissNotificationAsync).toHaveBeenCalled();
    });

    it('should handle iOS-specific notification options', async () => {
      mockPlatform.OS = 'ios';
      mockPlatform.select.mockImplementation((platforms: any) => platforms.ios);

      await manager.setPlaybackState('playing');

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          sound: false,
          interruptionLevel: 'passive',
        }),
        trigger: null,
      });
    });

    it('should handle Android-specific notification options', async () => {
      mockPlatform.OS = 'android';
      mockPlatform.select.mockImplementation((platforms: any) => platforms.android);

      await manager.setPlaybackState('playing');

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          channelId: 'radio_playback',
          priority: 'high',
          ongoing: true,
          actions: expect.any(Array),
        }),
        trigger: null,
      });
    });

    it('should include pause action when playing', async () => {
      mockPlatform.OS = 'android';
      mockPlatform.select.mockImplementation((platforms: any) => platforms.android);

      await manager.setPlaybackState('playing');

      const call = mockNotifications.scheduleNotificationAsync.mock.calls[0][0];
      expect((call.content as any).actions).toContainEqual(
        expect.objectContaining({
          identifier: 'pause',
          buttonTitle: 'Pause',
        })
      );
    });

    it('should include play action when paused', async () => {
      mockPlatform.OS = 'android';
      mockPlatform.select.mockImplementation((platforms: any) => platforms.android);

      await manager.setPlaybackState('paused');

      const call = mockNotifications.scheduleNotificationAsync.mock.calls[0][0];
      expect((call.content as any).actions).toContainEqual(
        expect.objectContaining({
          identifier: 'play',
          buttonTitle: 'Play',
        })
      );
    });

    it('should always include stop action', async () => {
      mockPlatform.OS = 'android';
      mockPlatform.select.mockImplementation((platforms: any) => platforms.android);

      await manager.setPlaybackState('playing');

      const call = mockNotifications.scheduleNotificationAsync.mock.calls[0][0];
      expect((call.content as any).actions).toContainEqual(
        expect.objectContaining({
          identifier: 'stop',
          buttonTitle: 'Stop',
        })
      );
    });

    it('should handle notification update errors gracefully', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValue(new Error('Notification error'));

      await expect(manager.setPlaybackState('playing')).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to update notification controls:',
        expect.any(Error)
      );
    });
  });

  describe('Audio Status Integration', () => {
    it('should update playback state from playing audio status', async () => {
      const audioStatus: AudioStatus = {
        state: 'playing',
        isPlaying: true,
      };

      await manager.updateFromAudioStatus(audioStatus);

      expect(manager.getPlaybackState()).toBe('playing');
    });

    it('should update playback state from paused audio status', async () => {
      const audioStatus: AudioStatus = {
        state: 'paused',
        isPlaying: false,
      };

      await manager.updateFromAudioStatus(audioStatus);

      expect(manager.getPlaybackState()).toBe('paused');
    });

    it('should update playback state from stopped audio status', async () => {
      const audioStatus: AudioStatus = {
        state: 'stopped',
        isPlaying: false,
      };

      await manager.updateFromAudioStatus(audioStatus);

      expect(manager.getPlaybackState()).toBe('stopped');
    });

    it('should map idle state to stopped', async () => {
      const audioStatus: AudioStatus = {
        state: 'idle',
        isPlaying: false,
      };

      await manager.updateFromAudioStatus(audioStatus);

      expect(manager.getPlaybackState()).toBe('stopped');
    });

    it('should map error state to stopped', async () => {
      const audioStatus: AudioStatus = {
        state: 'error',
        isPlaying: false,
        error: 'Test error',
      };

      await manager.updateFromAudioStatus(audioStatus);

      expect(manager.getPlaybackState()).toBe('stopped');
    });

    it('should not change state for loading audio status', async () => {
      // Set initial state
      await manager.setPlaybackState('playing');

      const audioStatus: AudioStatus = {
        state: 'loading',
        isPlaying: false,
      };

      await manager.updateFromAudioStatus(audioStatus);

      // Should remain unchanged
      expect(manager.getPlaybackState()).toBe('playing');
    });

    it('should not change state for buffering audio status', async () => {
      // Set initial state
      await manager.setPlaybackState('playing');

      const audioStatus: AudioStatus = {
        state: 'buffering',
        isPlaying: false,
      };

      await manager.updateFromAudioStatus(audioStatus);

      // Should remain unchanged
      expect(manager.getPlaybackState()).toBe('playing');
    });
  });

  describe('Session State Persistence', () => {
    it('should persist session state when metadata is updated', async () => {
      const metadata: MediaSessionMetadata = {
        title: 'Test Song',
        artist: 'Test Artist',
      };

      await manager.updateMetadata(metadata);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'media_session_state',
        expect.stringContaining('"title":"Test Song"')
      );
    });

    it('should persist session state when playback state changes', async () => {
      await manager.setPlaybackState('playing');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'media_session_state',
        expect.stringContaining('"playbackState":"playing"')
      );
    });

    it('should restore valid session state from storage', async () => {
      const storedData = {
        metadata: { title: 'Stored Song', artist: 'Stored Artist' },
        playbackState: 'paused',
        timestamp: Date.now() - 1000, // 1 second ago
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      // Create new instance to trigger restoration
      (MediaSessionManager as any).instance = undefined;
      manager = MediaSessionManager.getInstance();

      // Wait for async restoration
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(manager.getMetadata()).toEqual(storedData.metadata);
      expect(manager.getPlaybackState()).toBe('paused');
    });

    it('should not restore old session state (>24 hours)', async () => {
      const storedData = {
        metadata: { title: 'Old Song', artist: 'Old Artist' },
        playbackState: 'playing',
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      // Create new instance to trigger restoration
      (MediaSessionManager as any).instance = undefined;
      manager = MediaSessionManager.getInstance();

      // Wait for async restoration
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(manager.getMetadata()).toBeNull();
      expect(manager.getPlaybackState()).toBe('stopped');
    });

    it('should handle invalid stored data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      // Create new instance to trigger restoration
      (MediaSessionManager as any).instance = undefined;

      expect(() => {
        manager = MediaSessionManager.getInstance();
      }).not.toThrow();
    });

    it('should handle storage errors during persistence', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(manager.setPlaybackState('playing')).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to persist session state:',
        expect.any(Error)
      );
    });

    it('should handle storage errors during restoration', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      // Create new instance to trigger restoration
      (MediaSessionManager as any).instance = undefined;

      expect(() => {
        manager = MediaSessionManager.getInstance();
      }).not.toThrow();
    });
  });

  describe('Session Activity', () => {
    it('should report inactive when stopped with no metadata', () => {
      expect(manager.isActive()).toBe(false);
    });

    it('should report inactive when stopped with metadata', async () => {
      await manager.updateMetadata({ title: 'Test', artist: 'Test' });
      await manager.setPlaybackState('stopped');

      expect(manager.isActive()).toBe(false);
    });

    it('should report inactive when playing with no metadata', async () => {
      await manager.setPlaybackState('playing');

      expect(manager.isActive()).toBe(false);
    });

    it('should report active when playing with metadata', async () => {
      await manager.updateMetadata({ title: 'Test', artist: 'Test' });
      await manager.setPlaybackState('playing');

      expect(manager.isActive()).toBe(true);
    });

    it('should report active when paused with metadata', async () => {
      await manager.updateMetadata({ title: 'Test', artist: 'Test' });
      await manager.setPlaybackState('paused');

      expect(manager.isActive()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup session successfully', async () => {
      // Set up some state
      await manager.updateMetadata({ title: 'Test', artist: 'Test' });
      await manager.setPlaybackState('playing');
      manager.handleRemoteCommand('play', jest.fn());

      await manager.cleanup();

      expect(mockNotifications.dismissNotificationAsync).toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('media_session_state');
      expect(manager.getMetadata()).toBeNull();
      expect(manager.getPlaybackState()).toBe('stopped');
    });

    it('should handle cleanup errors gracefully', async () => {
      // Set up some state first so there's a notification to dismiss
      await manager.updateMetadata({ title: 'Test', artist: 'Test' });
      await manager.setPlaybackState('playing');

      mockNotifications.dismissNotificationAsync.mockRejectedValue(new Error('Cleanup error'));

      await expect(manager.cleanup()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to cleanup media session:',
        expect.any(Error)
      );
    });

    it('should cleanup even when no notification exists', async () => {
      await manager.cleanup();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('media_session_state');
      expect(manager.getMetadata()).toBeNull();
      expect(manager.getPlaybackState()).toBe('stopped');
    });
  });
});