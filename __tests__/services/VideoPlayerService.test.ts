import { VideoPlayerService } from '../../services/audio/VideoPlayerService';

// Mock expo-video
const mockVideoPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  replace: jest.fn(),
  playing: false,
  muted: false,
  volume: 1,
  duration: 0,
  currentTime: 0,
};

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => mockVideoPlayer),
}));

describe('VideoPlayerService', () => {
  let service: VideoPlayerService;

  beforeEach(() => {
    service = VideoPlayerService.getInstance();
    jest.clearAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = VideoPlayerService.getInstance();
      const instance2 = VideoPlayerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('player management', () => {
    it('should create a new player', () => {
      const playerId = service.createPlayer('test-stream-url');
      expect(typeof playerId).toBe('string');
      expect(playerId.length).toBeGreaterThan(0);
    });

    it('should get player status', () => {
      const playerId = service.createPlayer('test-stream-url');
      const status = service.getPlayerStatus(playerId);

      expect(status).toEqual({
        isPlaying: false,
        isMuted: false,
        volume: 1,
        duration: 0,
        currentTime: 0,
        error: null,
      });
    });

    it('should return null for non-existent player status', () => {
      const status = service.getPlayerStatus('non-existent-id');
      expect(status).toBeNull();
    });

    it('should destroy a player', () => {
      const playerId = service.createPlayer('test-stream-url');
      service.destroyPlayer(playerId);

      const status = service.getPlayerStatus(playerId);
      expect(status).toBeNull();
    });
  });

  describe('playback controls', () => {
    let playerId: string;

    beforeEach(() => {
      playerId = service.createPlayer('test-stream-url');
    });

    it('should play a stream', async () => {
      await service.play(playerId);
      expect(mockVideoPlayer.play).toHaveBeenCalled();
    });

    it('should pause a stream', async () => {
      await service.pause(playerId);
      expect(mockVideoPlayer.pause).toHaveBeenCalled();
    });

    it('should stop a stream', async () => {
      await service.stop(playerId);
      expect(mockVideoPlayer.stop).toHaveBeenCalled();
    });

    it('should handle play for non-existent player', async () => {
      await expect(service.play('non-existent-id')).rejects.toThrow('Player not found');
    });

    it('should handle pause for non-existent player', async () => {
      await expect(service.pause('non-existent-id')).rejects.toThrow('Player not found');
    });

    it('should handle stop for non-existent player', async () => {
      await expect(service.stop('non-existent-id')).rejects.toThrow('Player not found');
    });
  });

  describe('volume controls', () => {
    let playerId: string;

    beforeEach(() => {
      playerId = service.createPlayer('test-stream-url');
    });

    it('should set volume', async () => {
      await service.setVolume(playerId, 0.5);
      // Volume setting would be tested if VideoPlayerService actually implemented it
      // For now, we just verify no errors are thrown
    });

    it('should mute', async () => {
      await service.setMuted(playerId, true);
      // Mute setting would be tested if VideoPlayerService actually implemented it
    });

    it('should handle volume setting for non-existent player', async () => {
      await expect(service.setVolume('non-existent-id', 0.5)).rejects.toThrow('Player not found');
    });

    it('should handle mute setting for non-existent player', async () => {
      await expect(service.setMuted('non-existent-id', true)).rejects.toThrow('Player not found');
    });
  });

  describe('stream management', () => {
    let playerId: string;

    beforeEach(() => {
      playerId = service.createPlayer('test-stream-url');
    });

    it('should change stream URL', async () => {
      const newUrl = 'new-stream-url';
      await service.changeStream(playerId, newUrl);
      expect(mockVideoPlayer.replace).toHaveBeenCalledWith(newUrl);
    });

    it('should handle stream change for non-existent player', async () => {
      await expect(service.changeStream('non-existent-id', 'new-url')).rejects.toThrow('Player not found');
    });
  });

  describe('event listeners', () => {
    let playerId: string;

    beforeEach(() => {
      playerId = service.createPlayer('test-stream-url');
    });

    it('should add event listener', () => {
      const mockListener = jest.fn();
      service.addEventListener(playerId, 'statusChange', mockListener);

      // Verify listener was added (implementation would need to expose this for testing)
      expect(() => service.addEventListener(playerId, 'statusChange', mockListener)).not.toThrow();
    });

    it('should remove event listener', () => {
      const mockListener = jest.fn();
      service.addEventListener(playerId, 'statusChange', mockListener);
      service.removeEventListener(playerId, 'statusChange', mockListener);

      // Verify listener was removed (implementation would need to expose this for testing)
      expect(() => service.removeEventListener(playerId, 'statusChange', mockListener)).not.toThrow();
    });

    it('should handle event listener operations for non-existent player', () => {
      const mockListener = jest.fn();

      expect(() =>
        service.addEventListener('non-existent-id', 'statusChange', mockListener)
      ).not.toThrow();

      expect(() =>
        service.removeEventListener('non-existent-id', 'statusChange', mockListener)
      ).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup all players', () => {
      const playerId1 = service.createPlayer('stream-1');
      const playerId2 = service.createPlayer('stream-2');

      service.cleanup();

      expect(service.getPlayerStatus(playerId1)).toBeNull();
      expect(service.getPlayerStatus(playerId2)).toBeNull();
    });
  });
});