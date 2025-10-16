/**
 * RadioPlayerControls Integration Tests
 * Tests Task 19-21: Service integration and metadata handling
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RadioPlayerControls } from '../../../components/radio/RadioPlayerControls';
import videoPlayerService from '../../../services/audio/VideoPlayerService';
import { trackPlayerService } from '../../../services/audio';
import { FEATURES } from '../../../constants/config';

// Mock the audio services
jest.mock('../../../services/audio/VideoPlayerService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    loadStream: jest.fn().mockResolvedValue(undefined),
    setVolume: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockReturnValue('stopped'),
    addStateListener: jest.fn((listener) => listener('stopped')),
    removeStateListener: jest.fn(),
    addErrorListener: jest.fn(),
    removeErrorListener: jest.fn(),
    updateNowPlayingInfo: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../services/audio/TrackPlayerService', () => ({
  __esModule: true,
  TrackPlayerService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    loadStream: jest.fn().mockResolvedValue(undefined),
    setVolume: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockReturnValue('stopped'),
    addStateListener: jest.fn((listener) => listener('stopped')),
    removeStateListener: jest.fn(),
    addErrorListener: jest.fn(),
    removeErrorListener: jest.fn(),
    updateNowPlayingInfo: jest.fn().mockResolvedValue(undefined),
  })),
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    loadStream: jest.fn().mockResolvedValue(undefined),
    setVolume: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockReturnValue('stopped'),
    addStateListener: jest.fn((listener) => listener('stopped')),
    removeStateListener: jest.fn(),
    addErrorListener: jest.fn(),
    removeErrorListener: jest.fn(),
    updateNowPlayingInfo: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock useNowPlaying hook
jest.mock('../../../hooks/useNowPlaying', () => ({
  useNowPlaying: jest.fn(() => ({
    nowPlaying: null,
    isLoading: false,
    error: null,
  })),
}));

// Mock FEATURES config
jest.mock('../../../constants/config', () => ({
  FEATURES: {
    USE_TRACK_PLAYER: false,
    USE_VIDEO_PLAYER_ONLY: true,
  },
}));

describe('RadioPlayerControls', () => {
  const defaultProps = {
    streamUrl: 'https://example.com/stream',
    metadataUrl: 'https://example.com/metadata',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task 19: Service Selection Logic', () => {
    it('should use VideoPlayerService when USE_TRACK_PLAYER is false', async () => {
      (FEATURES as any).USE_TRACK_PLAYER = false;

      render(<RadioPlayerControls {...defaultProps} />);

      await waitFor(() => {
        expect(videoPlayerService.initialize).toHaveBeenCalled();
      });
    });

    it('should use TrackPlayerService when USE_TRACK_PLAYER is true', async () => {
      (FEATURES as any).USE_TRACK_PLAYER = true;

      render(<RadioPlayerControls {...defaultProps} />);

      await waitFor(() => {
        expect(trackPlayerService.initialize).toHaveBeenCalled();
      });

      // Reset for other tests
      (FEATURES as any).USE_TRACK_PLAYER = false;
    });

    it('should register state listeners on selected service', async () => {
      render(<RadioPlayerControls {...defaultProps} />);

      await waitFor(() => {
        expect(videoPlayerService.addStateListener).toHaveBeenCalled();
      });
    });

    it('should register error listeners on selected service', async () => {
      render(<RadioPlayerControls {...defaultProps} />);

      await waitFor(() => {
        expect(videoPlayerService.addErrorListener).toHaveBeenCalled();
      });
    });
  });

  describe('Task 20: Metadata Handling', () => {
    it('should not update metadata when player is stopped', async () => {
      const { useNowPlaying } = require('../../../hooks/useNowPlaying');
      useNowPlaying.mockReturnValue({
        nowPlaying: { song: 'Test Song', artist: 'Test Artist' },
        isLoading: false,
        error: null,
      });

      render(<RadioPlayerControls {...defaultProps} />);

      await waitFor(() => {
        expect(videoPlayerService.initialize).toHaveBeenCalled();
      });

      // Metadata should not be updated when stopped
      expect(videoPlayerService.updateNowPlayingInfo).not.toHaveBeenCalled();
    });

    it('should update VideoPlayerService with static metadata when USE_VIDEO_PLAYER_ONLY is true', async () => {
      (FEATURES as any).USE_VIDEO_PLAYER_ONLY = true;
      (videoPlayerService.getState as jest.Mock).mockReturnValue('playing');

      const { useNowPlaying } = require('../../../hooks/useNowPlaying');
      useNowPlaying.mockReturnValue({
        nowPlaying: { song: 'Live Song', artist: 'Live Artist' },
        isLoading: false,
        error: null,
      });

      render(<RadioPlayerControls {...defaultProps} />);

      await waitFor(() => {
        expect(videoPlayerService.updateNowPlayingInfo).toHaveBeenCalledWith({
          title: 'Trend Ankara',
          artist: 'Canlı Yayın',
          song: 'Trend Ankara',
        });
      });
    });

    it('should update TrackPlayerService with dynamic metadata when USE_TRACK_PLAYER is true', async () => {
      (FEATURES as any).USE_TRACK_PLAYER = true;
      (trackPlayerService.getState as jest.Mock).mockReturnValue('playing');

      const { useNowPlaying } = require('../../../hooks/useNowPlaying');
      const nowPlayingData = { song: 'Dynamic Song', artist: 'Dynamic Artist' };
      useNowPlaying.mockReturnValue({
        nowPlaying: nowPlayingData,
        isLoading: false,
        error: null,
      });

      render(<RadioPlayerControls {...defaultProps} />);

      await waitFor(() => {
        expect(trackPlayerService.updateNowPlayingInfo).toHaveBeenCalledWith(nowPlayingData);
      });

      // Reset for other tests
      (FEATURES as any).USE_TRACK_PLAYER = false;
    });

    it('should only update metadata when player is active', async () => {
      const states = ['playing', 'paused', 'buffering'];

      for (const state of states) {
        jest.clearAllMocks();
        (videoPlayerService.getState as jest.Mock).mockReturnValue(state);

        const { useNowPlaying } = require('../../../hooks/useNowPlaying');
        useNowPlaying.mockReturnValue({
          nowPlaying: { song: 'Test', artist: 'Test' },
          isLoading: false,
          error: null,
        });

        const { unmount } = render(<RadioPlayerControls {...defaultProps} />);

        await waitFor(() => {
          // Metadata update should happen when player is active
          expect(videoPlayerService.updateNowPlayingInfo).toHaveBeenCalled();
        });

        unmount();
      }
    });
  });

  describe('Playback Control Integration', () => {
    it('should load and play stream on play button press', async () => {
      const { getByA11yHint } = render(<RadioPlayerControls {...defaultProps} />);

      await waitFor(() => {
        expect(videoPlayerService.initialize).toHaveBeenCalled();
      });

      // Find and press the play button (using testID or accessibility props)
      const playButton = getByA11yHint('play-pause-button') || getByA11yHint('main-button');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(videoPlayerService.loadStream).toHaveBeenCalledWith(defaultProps.streamUrl);
        expect(videoPlayerService.play).toHaveBeenCalled();
      });
    });

    it('should pause when playing and play button pressed', async () => {
      (videoPlayerService.getState as jest.Mock).mockReturnValue('playing');

      const { getByA11yHint } = render(<RadioPlayerControls {...defaultProps} />);

      const playButton = getByA11yHint('play-pause-button') || getByA11yHint('main-button');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(videoPlayerService.pause).toHaveBeenCalled();
      });
    });

    it('should stop playback on stop button press', async () => {
      const { getByA11yHint } = render(<RadioPlayerControls {...defaultProps} />);

      const stopButton = getByA11yHint('stop-button');
      if (stopButton) {
        fireEvent.press(stopButton);

        await waitFor(() => {
          expect(videoPlayerService.stop).toHaveBeenCalled();
        });
      }
    });

    it('should toggle mute', async () => {
      const { getByA11yHint } = render(<RadioPlayerControls {...defaultProps} />);

      const muteButton = getByA11yHint('mute-button');
      if (muteButton) {
        fireEvent.press(muteButton);

        await waitFor(() => {
          expect(videoPlayerService.setVolume).toHaveBeenCalledWith(0);
        });
      }
    });
  });

  describe('Task 21: Debug Mode Indicator', () => {
    it('should show debug badge in development mode', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      const { queryByText } = render(<RadioPlayerControls {...defaultProps} />);

      // Debug badge should show the service name
      const badge = queryByText(/TrackPlayer|VideoPlayer/);
      expect(badge).toBeTruthy();

      (global as any).__DEV__ = originalDev;
    });

    it('should not show debug badge in production mode', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;

      const { queryByText } = render(<RadioPlayerControls {...defaultProps} />);

      // Debug badge should not be visible
      const badge = queryByText(/TrackPlayer|VideoPlayer/);
      expect(badge).toBeFalsy();

      (global as any).__DEV__ = originalDev;
    });

    it('should display correct service name in debug badge', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      (FEATURES as any).USE_TRACK_PLAYER = false;
      const { queryByText: queryText1 } = render(<RadioPlayerControls {...defaultProps} />);
      expect(queryText1(/VideoPlayer/)).toBeTruthy();

      (FEATURES as any).USE_TRACK_PLAYER = true;
      const { queryByText: queryText2 } = render(<RadioPlayerControls {...defaultProps} />);
      expect(queryText2(/TrackPlayer/)).toBeTruthy();

      (global as any).__DEV__ = originalDev;
      (FEATURES as any).USE_TRACK_PLAYER = false;
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when initialization fails', async () => {
      const onError = jest.fn();
      (videoPlayerService.initialize as jest.Mock).mockRejectedValueOnce(
        new Error('Init failed')
      );

      render(<RadioPlayerControls {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should call onError callback when playback fails', async () => {
      const onError = jest.fn();
      (videoPlayerService.loadStream as jest.Mock).mockRejectedValueOnce(
        new Error('Load failed')
      );

      const { getByA11yHint } = render(<RadioPlayerControls {...defaultProps} onError={onError} />);

      const playButton = getByA11yHint('play-pause-button') || getByA11yHint('main-button');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('State Change Callback', () => {
    it('should call onStateChange when player state changes', async () => {
      const onStateChange = jest.fn();
      let stateListener: Function;

      (videoPlayerService.addStateListener as jest.Mock).mockImplementation((listener) => {
        stateListener = listener;
        listener('stopped');
      });

      render(<RadioPlayerControls {...defaultProps} onStateChange={onStateChange} />);

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith('stopped');
      });

      // Simulate state change
      stateListener!('playing');

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith('playing');
      });
    });
  });

  describe('Cleanup', () => {
    it('should stop playback on unmount', () => {
      const { unmount } = render(<RadioPlayerControls {...defaultProps} />);

      unmount();

      expect(videoPlayerService.stop).toHaveBeenCalled();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact controls when compact prop is true', () => {
      const { container } = render(<RadioPlayerControls {...defaultProps} compact={true} />);

      // Compact mode should render a simpler UI
      expect(container).toBeTruthy();
    });
  });
});
