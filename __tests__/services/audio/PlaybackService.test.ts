/**
 * PlaybackService Unit Tests
 * Tests Task 6-7: Remote control event handling and Android metadata detection
 */
import TrackPlayer, { Event } from 'react-native-track-player';
import { Platform } from 'react-native';

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  addEventListener: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  getActiveTrackIndex: jest.fn(() => 0),
  updateMetadataForTrack: jest.fn(),
  Event: {
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
    RemoteDuck: 'remote-duck',
    PlaybackError: 'playback-error',
    AudioCommonMetadataReceived: 'audio-common-metadata-received',
  },
}));

describe('PlaybackService', () => {
  let eventListeners: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    eventListeners = new Map();

    // Mock addEventListener to capture event handlers
    (TrackPlayer.addEventListener as jest.Mock).mockImplementation((event: string, handler: Function) => {
      eventListeners.set(event, handler);
    });
  });

  const loadPlaybackService = async () => {
    // Clear the module cache to reload the service
    jest.resetModules();

    // Re-apply mocks
    jest.mock('react-native', () => ({
      Platform: {
        OS: 'android',
      },
    }));

    jest.mock('react-native-track-player', () => ({
      addEventListener: jest.fn((event: string, handler: Function) => {
        eventListeners.set(event, handler);
      }),
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      getActiveTrackIndex: jest.fn(() => 0),
      updateMetadataForTrack: jest.fn(),
      Event: {
        RemotePlay: 'remote-play',
        RemotePause: 'remote-pause',
        RemoteStop: 'remote-stop',
        RemoteDuck: 'remote-duck',
        PlaybackError: 'playback-error',
        AudioCommonMetadataReceived: 'audio-common-metadata-received',
      },
    }));

    // Import and execute the service module
    const playbackService = require('../../../services/audio/PlaybackService');
    await playbackService();
  };

  describe('Task 6: Remote Control Event Handlers', () => {
    beforeEach(async () => {
      await loadPlaybackService();
    });

    it('should register RemotePlay event handler', () => {
      expect(eventListeners.has(Event.RemotePlay)).toBe(true);
    });

    it('should handle RemotePlay event', async () => {
      const handler = eventListeners.get(Event.RemotePlay);
      expect(handler).toBeDefined();

      await handler!();
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should register RemotePause event handler', () => {
      expect(eventListeners.has(Event.RemotePause)).toBe(true);
    });

    it('should handle RemotePause event', async () => {
      const handler = eventListeners.get(Event.RemotePause);
      expect(handler).toBeDefined();

      await handler!();
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('should register RemoteStop event handler', () => {
      expect(eventListeners.has(Event.RemoteStop)).toBe(true);
    });

    it('should handle RemoteStop event', async () => {
      const handler = eventListeners.get(Event.RemoteStop);
      expect(handler).toBeDefined();

      await handler!();
      expect(TrackPlayer.stop).toHaveBeenCalled();
    });

    it('should register RemoteDuck event handler', () => {
      expect(eventListeners.has(Event.RemoteDuck)).toBe(true);
    });

    it('should handle RemoteDuck with paused flag', async () => {
      const handler = eventListeners.get(Event.RemoteDuck);
      expect(handler).toBeDefined();

      await handler!({ paused: true, permanent: false });
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('should handle RemoteDuck with permanent flag', async () => {
      const handler = eventListeners.get(Event.RemoteDuck);
      expect(handler).toBeDefined();

      await handler!({ paused: false, permanent: true });
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('should register PlaybackError event handler', () => {
      expect(eventListeners.has(Event.PlaybackError)).toBe(true);
    });

    it('should handle PlaybackError event', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const handler = eventListeners.get(Event.PlaybackError);
      expect(handler).toBeDefined();

      const error = { message: 'Playback failed' };
      await handler!(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PlaybackService] Playback error:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Task 7: Android Metadata Detection', () => {
    beforeEach(async () => {
      // Ensure Platform.OS is set to 'android'
      (Platform.OS as any) = 'android';
      await loadPlaybackService();
    });

    it('should register AudioCommonMetadataReceived event handler on Android', () => {
      expect(eventListeners.has(Event.AudioCommonMetadataReceived)).toBe(true);
    });

    it('should update metadata when received from stream', async () => {
      const handler = eventListeners.get(Event.AudioCommonMetadataReceived);
      expect(handler).toBeDefined();

      const metadata = {
        title: 'Test Song',
        artist: 'Test Artist',
      };

      await handler!(metadata);

      expect(TrackPlayer.getActiveTrackIndex).toHaveBeenCalled();
      expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(0, {
        title: 'Test Song',
        artist: 'Test Artist',
      });
    });

    it('should use fallback values for missing metadata', async () => {
      const handler = eventListeners.get(Event.AudioCommonMetadataReceived);
      expect(handler).toBeDefined();

      const metadata = {}; // Empty metadata

      await handler!(metadata);

      expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(0, {
        title: 'Live Stream',
        artist: 'Trend Ankara',
      });
    });

    it('should handle metadata update errors gracefully', async () => {
      (TrackPlayer.updateMetadataForTrack as jest.Mock).mockRejectedValueOnce(
        new Error('Update failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const handler = eventListeners.get(Event.AudioCommonMetadataReceived);

      const metadata = { title: 'Test', artist: 'Test' };

      // Should not throw
      await expect(handler!(metadata)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PlaybackService] Failed to update metadata:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not update metadata when no active track', async () => {
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockReturnValueOnce(undefined);

      const handler = eventListeners.get(Event.AudioCommonMetadataReceived);
      const metadata = { title: 'Test', artist: 'Test' };

      await handler!(metadata);

      expect(TrackPlayer.updateMetadataForTrack).not.toHaveBeenCalled();
    });
  });

  describe('iOS Platform Behavior', () => {
    beforeEach(async () => {
      // Reset event listeners
      eventListeners.clear();

      // Set Platform.OS to 'ios'
      (Platform.OS as any) = 'ios';

      // Reload the service
      await loadPlaybackService();
    });

    it('should not register AudioCommonMetadataReceived handler on iOS', () => {
      // On iOS, metadata events are not supported, so the handler should not be registered
      expect(eventListeners.has(Event.AudioCommonMetadataReceived)).toBe(false);
    });

    it('should still register other event handlers on iOS', () => {
      expect(eventListeners.has(Event.RemotePlay)).toBe(true);
      expect(eventListeners.has(Event.RemotePause)).toBe(true);
      expect(eventListeners.has(Event.RemoteStop)).toBe(true);
      expect(eventListeners.has(Event.RemoteDuck)).toBe(true);
      expect(eventListeners.has(Event.PlaybackError)).toBe(true);
    });
  });

  describe('Console Logging', () => {
    beforeEach(async () => {
      await loadPlaybackService();
    });

    it('should log RemotePlay events', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const handler = eventListeners.get(Event.RemotePlay);

      await handler!();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PlaybackService] Remote play event received'
      );

      consoleLogSpy.mockRestore();
    });

    it('should log metadata updates', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const handler = eventListeners.get(Event.AudioCommonMetadataReceived);

      const metadata = { title: 'Test', artist: 'Test' };
      await handler!(metadata);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PlaybackService] Metadata updated successfully:',
        { title: 'Test', artist: 'Test' }
      );

      consoleLogSpy.mockRestore();
    });
  });
});
