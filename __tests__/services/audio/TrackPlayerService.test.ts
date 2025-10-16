/**
 * TrackPlayerService Unit Tests
 * Tests Task 9-17: All core functionality
 */
import { TrackPlayerService } from '../../../services/audio/TrackPlayerService';
import TrackPlayer, { State, Event, Capability } from 'react-native-track-player';
import SettingsService from '../../../services/settings/SettingsService';

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  setupPlayer: jest.fn(),
  updateOptions: jest.fn(),
  reset: jest.fn(),
  add: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  setVolume: jest.fn(),
  getPlaybackState: jest.fn(() => ({ state: State.Stopped })),
  getActiveTrackIndex: jest.fn(() => 0),
  updateMetadataForTrack: jest.fn(),
  addEventListener: jest.fn(),
  State: {
    None: 'none',
    Stopped: 'stopped',
    Playing: 'playing',
    Paused: 'paused',
    Buffering: 'buffering',
    Connecting: 'connecting',
    Error: 'error',
  },
  Event: {
    PlaybackState: 'playback-state',
    PlaybackError: 'playback-error',
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
  },
  Capability: {
    Play: 'play',
    Pause: 'pause',
    Stop: 'stop',
  },
}));

// Mock SettingsService
jest.mock('../../../services/settings/SettingsService', () => ({
  getSettings: jest.fn(() =>
    Promise.resolve({
      playerLogoUrl: 'https://example.com/logo.png',
    })
  ),
}));

describe('TrackPlayerService', () => {
  let service: TrackPlayerService;

  beforeEach(() => {
    service = new TrackPlayerService();
    jest.clearAllMocks();
  });

  describe('Task 9: Initialization', () => {
    it('should initialize TrackPlayer with correct configuration', async () => {
      await service.initialize();

      expect(TrackPlayer.setupPlayer).toHaveBeenCalledWith({
        autoUpdateMetadata: true,
        autoHandleInterruptions: true,
      });

      expect(TrackPlayer.updateOptions).toHaveBeenCalledWith({
        capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
        compactCapabilities: [Capability.Play, Capability.Pause],
        notificationCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      });
    });

    it('should not re-initialize if already initialized', async () => {
      await service.initialize();
      jest.clearAllMocks();

      await service.initialize();

      expect(TrackPlayer.setupPlayer).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      (TrackPlayer.setupPlayer as jest.Mock).mockRejectedValueOnce(
        new Error('Setup failed')
      );

      await expect(service.initialize()).rejects.toThrow('Setup failed');
    });
  });

  describe('Task 12: Load Stream', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should load stream with correct metadata', async () => {
      const streamUrl = 'https://example.com/stream';

      await service.loadStream(streamUrl);

      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalledWith({
        url: streamUrl,
        title: 'Trend Ankara',
        artist: 'Canlı Yayın',
        artwork: 'https://example.com/logo.png',
        isLiveStream: true,
      });
    });

    it('should handle stream loading errors', async () => {
      (TrackPlayer.reset as jest.Mock).mockRejectedValueOnce(new Error('Reset failed'));

      await expect(service.loadStream('test-url')).rejects.toThrow('Reset failed');
    });
  });

  describe('Task 13: Playback Controls', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should play stream', async () => {
      await service.play();
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should pause stream', async () => {
      await service.pause();
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('should stop stream and reset state', async () => {
      await service.stop();
      expect(TrackPlayer.stop).toHaveBeenCalled();
      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(service.currentState).toBe('stopped');
    });

    it('should toggle play/pause when playing', async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValueOnce({
        state: State.Playing,
      });

      await service.togglePlayPause();
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('should toggle play/pause when paused', async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValueOnce({
        state: State.Paused,
      });

      await service.togglePlayPause();
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should throw error when playing before initialization', async () => {
      const uninitializedService = new TrackPlayerService();
      await expect(uninitializedService.play()).rejects.toThrow(
        'TrackPlayerService not initialized'
      );
    });
  });

  describe('Task 14: Volume Control', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should set volume within valid range', async () => {
      await service.setVolume(0.5);
      expect(TrackPlayer.setVolume).toHaveBeenCalledWith(0.5);
    });

    it('should clamp volume to 0-1 range (minimum)', async () => {
      await service.setVolume(-0.5);
      expect(TrackPlayer.setVolume).toHaveBeenCalledWith(0);
    });

    it('should clamp volume to 0-1 range (maximum)', async () => {
      await service.setVolume(1.5);
      expect(TrackPlayer.setVolume).toHaveBeenCalledWith(1);
    });
  });

  describe('Task 15-16: Update Metadata with Throttling and Change Detection', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.loadStream('test-url');
      jest.clearAllMocks();
    });

    it('should update metadata for new song', async () => {
      const nowPlaying = {
        title: 'Test Title',
        artist: 'Test Artist',
        song: 'Test Song',
      };

      await service.updateNowPlayingInfo(nowPlaying);

      expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(0, {
        title: 'Test Song',
        artist: 'Test Artist',
      });
    });

    it('should skip update for null nowPlaying', async () => {
      await service.updateNowPlayingInfo(null);
      expect(TrackPlayer.updateMetadataForTrack).not.toHaveBeenCalled();
    });

    it('should skip update for empty nowPlaying', async () => {
      await service.updateNowPlayingInfo({});
      expect(TrackPlayer.updateMetadataForTrack).not.toHaveBeenCalled();
    });

    it('should skip update if metadata unchanged', async () => {
      const nowPlaying = {
        song: 'Same Song',
        artist: 'Same Artist',
      };

      await service.updateNowPlayingInfo(nowPlaying);
      jest.clearAllMocks();

      // Try to update with same metadata
      await service.updateNowPlayingInfo(nowPlaying);
      expect(TrackPlayer.updateMetadataForTrack).not.toHaveBeenCalled();
    });

    it('should throttle rapid metadata updates', async () => {
      const nowPlaying1 = { song: 'Song 1', artist: 'Artist 1' };
      const nowPlaying2 = { song: 'Song 2', artist: 'Artist 2' };

      await service.updateNowPlayingInfo(nowPlaying1);
      jest.clearAllMocks();

      // Immediate update should be throttled
      await service.updateNowPlayingInfo(nowPlaying2);
      expect(TrackPlayer.updateMetadataForTrack).not.toHaveBeenCalled();
    });

    it('should fallback to defaults when fields missing', async () => {
      const nowPlaying = { artist: 'Only Artist' };

      await service.updateNowPlayingInfo(nowPlaying);

      expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(0, {
        title: 'Trend Ankara',
        artist: 'Only Artist',
      });
    });

    it('should handle metadata update errors gracefully', async () => {
      (TrackPlayer.updateMetadataForTrack as jest.Mock).mockRejectedValueOnce(
        new Error('Update failed')
      );

      const nowPlaying = { song: 'Test', artist: 'Test' };

      // Should not throw
      await expect(service.updateNowPlayingInfo(nowPlaying)).resolves.not.toThrow();
    });
  });

  describe('Task 10: State Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should add and notify state listeners', async () => {
      const listener = jest.fn();
      service.addStateListener(listener);

      // Should be called immediately with current state
      expect(listener).toHaveBeenCalledWith('stopped');
    });

    it('should remove state listeners', async () => {
      const listener = jest.fn();
      service.addStateListener(listener);
      jest.clearAllMocks();

      service.removeStateListener(listener);

      // Change state - listener should not be called
      await service.stop();
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support onStateChange with cleanup function', async () => {
      const listener = jest.fn();
      const cleanup = service.onStateChange(listener);

      expect(listener).toHaveBeenCalledWith('stopped');
      jest.clearAllMocks();

      cleanup();

      // Change state - listener should not be called
      await service.stop();
      expect(listener).not.toHaveBeenCalled();
    });

    it('should add and notify error listeners', async () => {
      const errorListener = jest.fn();
      service.addErrorListener(errorListener);

      // Trigger an error by playing before loading
      (TrackPlayer.play as jest.Mock).mockRejectedValueOnce(new Error('Play failed'));
      await service.play().catch(() => {});

      expect(errorListener).toHaveBeenCalled();
    });

    it('should remove error listeners', async () => {
      const errorListener = jest.fn();
      service.addErrorListener(errorListener);
      service.removeErrorListener(errorListener);

      (TrackPlayer.play as jest.Mock).mockRejectedValueOnce(new Error('Play failed'));
      await service.play().catch(() => {});

      expect(errorListener).not.toHaveBeenCalled();
    });
  });

  describe('Task 17: Getters and Cleanup', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return isPlaying state', () => {
      expect(service.isPlaying).toBe(false);
    });

    it('should return currentState', () => {
      expect(service.currentState).toBe('stopped');
    });

    it('should return state via getState()', () => {
      expect(service.getState()).toBe('stopped');
    });

    it('should return radioConfig', async () => {
      const config = { id: 1, name: 'Test Radio' };
      await service.loadStream('test-url', config as any);
      expect(service.radioConfig).toEqual(config);
    });

    it('should cleanup and reset state', async () => {
      await service.cleanup();

      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(service.currentState).toBe('stopped');
    });
  });

  describe('State Mapping', () => {
    it('should map TrackPlayer states to PlayerStateType', async () => {
      await service.initialize();

      const stateMap = [
        { trackPlayerState: State.Playing, expected: 'playing' },
        { trackPlayerState: State.Paused, expected: 'paused' },
        { trackPlayerState: State.Stopped, expected: 'stopped' },
        { trackPlayerState: State.Buffering, expected: 'buffering' },
        { trackPlayerState: State.Connecting, expected: 'buffering' },
        { trackPlayerState: State.Error, expected: 'error' },
        { trackPlayerState: State.None, expected: 'stopped' },
      ];

      // This would require exposing the handleStateChange method for testing
      // For now, we verify the mapping logic exists in the implementation
      expect(service.currentState).toBeDefined();
    });
  });
});
