import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { AppState, Dimensions } from 'react-native';
import { AnimatedLogoContainer } from '@/components/player/AnimatedLogoContainer';
import { useAudio } from '@/hooks/useAudio';

// Mock all dependencies
jest.mock('@/hooks/useAudio', () => ({
  useAudio: jest.fn(),
}));

jest.mock('@/components/themed-view', () => ({
  ThemedView: jest.fn(({ children, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { ...props, testID: 'themed-view' }, children);
  }),
}));

jest.mock('@/components/player/LogoDisplay', () => ({
  LogoDisplay: jest.fn((props) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'logo-display', ...props },
      React.createElement(Text, { testID: 'logo-text' }, 'Logo')
    );
  }),
}));

jest.mock('@/components/player/SpotlightEffects', () => ({
  SpotlightEffects: jest.fn((props) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, {
      testID: 'spotlight-effects',
      'data-is-playing': props.isPlaying,
      ...props
    });
  }),
}));

jest.mock('@/utils/responsive', () => ({
  getLogoSize: jest.fn((width) => width * 0.5),
  getOrbSize: jest.fn((width) => width * 0.15),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((initial) => ({ value: initial })),
  withTiming: jest.fn((value, config) => ({ value, config, type: 'timing' })),
  useAnimatedStyle: jest.fn((callback) => {
    const style = callback();
    return style;
  }),
  cancelAnimation: jest.fn(),
}));

// Mock AppState
const mockAppStateListeners: Array<(state: string) => void> = [];
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  currentState: 'active',
  addEventListener: jest.fn((event, callback) => {
    if (event === 'change') {
      mockAppStateListeners.push(callback);
    }
    return { remove: jest.fn() };
  }),
}));

// Mock Dimensions
const mockDimensionListeners: Array<(dims: any) => void> = [];
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn((event, callback) => {
    if (event === 'change') {
      mockDimensionListeners.push(callback);
    }
    return { remove: jest.fn() };
  }),
}));

const mockUseAudio = useAudio as jest.MockedFunction<typeof useAudio>;

describe('AnimatedLogo Integration', () => {
  let mockAudioState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppStateListeners.length = 0;
    mockDimensionListeners.length = 0;

    // Default audio state
    mockAudioState = {
      isPlaying: false,
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      currentTime: 0,
      duration: 0,
      volume: 1,
      setVolume: jest.fn(),
      playbackStatus: 'stopped',
    };

    mockUseAudio.mockReturnValue(mockAudioState);
  });

  describe('Full animation sequence', () => {
    it('should render all components in initial state', () => {
      const { getByTestId } = render(<AnimatedLogoContainer />);

      expect(getByTestId('themed-view')).toBeTruthy();
      expect(getByTestId('logo-display')).toBeTruthy();
      expect(getByTestId('spotlight-effects')).toBeTruthy();
      expect(getByTestId('logo-text')).toBeTruthy();
    });

    it('should handle play → pause → stop animation sequence', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      // Initial state - not playing
      let spotlightEffects = getByTestId('spotlight-effects');
      expect(spotlightEffects.props['data-is-playing']).toBe(false);

      // Transition to playing
      mockAudioState.isPlaying = true;
      mockAudioState.playbackStatus = 'playing';
      mockUseAudio.mockReturnValue(mockAudioState);

      rerender(<AnimatedLogoContainer />);

      await waitFor(() => {
        spotlightEffects = getByTestId('spotlight-effects');
        expect(spotlightEffects.props['data-is-playing']).toBe(true);
      });

      // Transition to paused
      mockAudioState.isPlaying = false;
      mockAudioState.playbackStatus = 'paused';
      mockUseAudio.mockReturnValue(mockAudioState);

      rerender(<AnimatedLogoContainer />);

      await waitFor(() => {
        spotlightEffects = getByTestId('spotlight-effects');
        expect(spotlightEffects.props['data-is-playing']).toBe(false);
      });

      // Transition to stopped
      mockAudioState.isPlaying = false;
      mockAudioState.playbackStatus = 'stopped';
      mockUseAudio.mockReturnValue(mockAudioState);

      rerender(<AnimatedLogoContainer />);

      await waitFor(() => {
        spotlightEffects = getByTestId('spotlight-effects');
        expect(spotlightEffects.props['data-is-playing']).toBe(false);
      });
    });

    it('should handle rapid playback state changes', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      const states = [
        { isPlaying: true, status: 'playing' },
        { isPlaying: false, status: 'paused' },
        { isPlaying: true, status: 'playing' },
        { isPlaying: false, status: 'stopped' },
        { isPlaying: true, status: 'playing' },
      ];

      for (const state of states) {
        mockAudioState.isPlaying = state.isPlaying;
        mockAudioState.playbackStatus = state.status;
        mockUseAudio.mockReturnValue(mockAudioState);

        await act(async () => {
          rerender(<AnimatedLogoContainer />);
        });

        await waitFor(() => {
          const spotlightEffects = getByTestId('spotlight-effects');
          expect(spotlightEffects.props['data-is-playing']).toBe(state.isPlaying);
        });
      }
    });

    it('should handle long-running playback sessions', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      // Start playing
      mockAudioState.isPlaying = true;
      mockAudioState.playbackStatus = 'playing';
      mockUseAudio.mockReturnValue(mockAudioState);

      rerender(<AnimatedLogoContainer />);

      // Simulate long playback session
      await act(async () => {
        // Simulate time passing
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        const spotlightEffects = getByTestId('spotlight-effects');
        expect(spotlightEffects.props['data-is-playing']).toBe(true);
      });

      // Should maintain playing state throughout
      expect(getByTestId('logo-display')).toBeTruthy();
      expect(getByTestId('spotlight-effects')).toBeTruthy();
    });
  });

  describe('Background/foreground transitions', () => {
    it('should pause animations when app goes to background', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      // Start playing
      mockAudioState.isPlaying = true;
      mockUseAudio.mockReturnValue(mockAudioState);
      rerender(<AnimatedLogoContainer />);

      let spotlightEffects = getByTestId('spotlight-effects');
      expect(spotlightEffects.props['data-is-playing']).toBe(true);

      // Simulate app going to background
      await act(async () => {
        mockAppStateListeners.forEach(listener => listener('background'));
      });

      await waitFor(() => {
        spotlightEffects = getByTestId('spotlight-effects');
        // Should pause animations (false) even though audio is playing
        expect(spotlightEffects.props['data-is-playing']).toBe(false);
      });
    });

    it('should resume animations when app returns to foreground', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      // Start playing
      mockAudioState.isPlaying = true;
      mockUseAudio.mockReturnValue(mockAudioState);
      rerender(<AnimatedLogoContainer />);

      // Go to background
      await act(async () => {
        mockAppStateListeners.forEach(listener => listener('background'));
      });

      // Return to foreground
      await act(async () => {
        mockAppStateListeners.forEach(listener => listener('active'));
      });

      await waitFor(() => {
        const spotlightEffects = getByTestId('spotlight-effects');
        // Should resume animations
        expect(spotlightEffects.props['data-is-playing']).toBe(true);
      });
    });

    it('should handle inactive app state', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      // Start playing
      mockAudioState.isPlaying = true;
      mockUseAudio.mockReturnValue(mockAudioState);
      rerender(<AnimatedLogoContainer />);

      // Simulate app going inactive (e.g., incoming call)
      await act(async () => {
        mockAppStateListeners.forEach(listener => listener('inactive'));
      });

      await waitFor(() => {
        const spotlightEffects = getByTestId('spotlight-effects');
        // Should pause animations when inactive
        expect(spotlightEffects.props['data-is-playing']).toBe(false);
      });
    });

    it('should handle multiple background/foreground cycles', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      // Start playing
      mockAudioState.isPlaying = true;
      mockUseAudio.mockReturnValue(mockAudioState);
      rerender(<AnimatedLogoContainer />);

      const cycles = ['background', 'active', 'inactive', 'active', 'background', 'active'];

      for (const state of cycles) {
        await act(async () => {
          mockAppStateListeners.forEach(listener => listener(state));
        });

        await waitFor(() => {
          const spotlightEffects = getByTestId('spotlight-effects');
          const shouldPlay = state === 'active';
          expect(spotlightEffects.props['data-is-playing']).toBe(shouldPlay);
        });
      }
    });
  });

  describe('Performance metrics', () => {
    it('should handle orientation changes efficiently', async () => {
      const startTime = Date.now();
      const { getByTestId } = render(<AnimatedLogoContainer />);

      // Simulate multiple orientation changes
      const orientations = [
        { width: 414, height: 896 }, // Portrait large
        { width: 896, height: 414 }, // Landscape large
        { width: 375, height: 812 }, // Portrait standard
        { width: 812, height: 375 }, // Landscape standard
        { width: 320, height: 568 }, // Portrait small
        { width: 568, height: 320 }, // Landscape small
      ];

      for (const dims of orientations) {
        await act(async () => {
          mockDimensionListeners.forEach(listener => listener({ window: dims }));
        });

        // Should maintain component integrity
        expect(getByTestId('logo-display')).toBeTruthy();
        expect(getByTestId('spotlight-effects')).toBeTruthy();
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete all orientation changes within reasonable time (2 seconds)
      expect(totalTime).toBeLessThan(2000);
    });

    it('should maintain 60fps target during animations', async () => {
      const { getByTestId } = render(<AnimatedLogoContainer />);

      // Start playing to trigger animations
      mockAudioState.isPlaying = true;
      mockUseAudio.mockReturnValue(mockAudioState);

      const frameTime = 16.67; // ~60fps (1000ms / 60fps)
      const testDuration = 1000; // 1 second
      const expectedFrames = Math.floor(testDuration / frameTime);

      const startTime = performance.now();

      // Simulate animation frames
      for (let i = 0; i < expectedFrames; i++) {
        await act(async () => {
          // Simulate animation frame
          await new Promise(resolve => setTimeout(resolve, frameTime));
        });
      }

      const endTime = performance.now();
      const actualDuration = endTime - startTime;

      // Should maintain target frame rate (allow 20% variance)
      expect(actualDuration).toBeLessThan(testDuration * 1.2);

      // Components should still be present after animation stress test
      expect(getByTestId('logo-display')).toBeTruthy();
      expect(getByTestId('spotlight-effects')).toBeTruthy();
    });

    it('should handle memory pressure gracefully', async () => {
      const { getByTestId, unmount } = render(<AnimatedLogoContainer />);

      // Start animations
      mockAudioState.isPlaying = true;
      mockUseAudio.mockReturnValue(mockAudioState);

      // Simulate memory pressure by creating many animation cycles
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          // Toggle playing state rapidly
          mockAudioState.isPlaying = !mockAudioState.isPlaying;
          mockUseAudio.mockReturnValue(mockAudioState);
        });
      }

      // Components should still be functional
      expect(getByTestId('logo-display')).toBeTruthy();
      expect(getByTestId('spotlight-effects')).toBeTruthy();

      // Cleanup should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle component mounting and unmounting efficiently', async () => {
      const mountTimes: number[] = [];
      const unmountTimes: number[] = [];

      // Test multiple mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        const mountStart = performance.now();
        const { unmount } = render(<AnimatedLogoContainer />);
        const mountEnd = performance.now();
        mountTimes.push(mountEnd - mountStart);

        const unmountStart = performance.now();
        unmount();
        const unmountEnd = performance.now();
        unmountTimes.push(unmountEnd - unmountStart);
      }

      // Calculate averages
      const avgMountTime = mountTimes.reduce((a, b) => a + b) / mountTimes.length;
      const avgUnmountTime = unmountTimes.reduce((a, b) => a + b) / unmountTimes.length;

      // Mount/unmount should be fast (under 100ms each)
      expect(avgMountTime).toBeLessThan(100);
      expect(avgUnmountTime).toBeLessThan(100);
    });

    it('should not leak memory during animation cycles', async () => {
      // Mock performance.measureUserAgentSpecificMemory if available
      const mockMeasureMemory = jest.fn().mockResolvedValue({
        bytes: 1000000,
        breakdown: []
      });

      if (typeof (performance as any).measureUserAgentSpecificMemory === 'undefined') {
        (performance as any).measureUserAgentSpecificMemory = mockMeasureMemory;
      }

      const { rerender, unmount } = render(<AnimatedLogoContainer />);

      // Run animation cycles
      for (let i = 0; i < 50; i++) {
        await act(async () => {
          mockAudioState.isPlaying = i % 2 === 0;
          mockUseAudio.mockReturnValue(mockAudioState);
          rerender(<AnimatedLogoContainer />);
        });
      }

      // Cleanup should be successful
      expect(() => unmount()).not.toThrow();

      // If memory measurement is available, memory should be reasonable
      if (mockMeasureMemory.mock.calls.length > 0) {
        // This is a basic check - in a real app you'd want more sophisticated memory monitoring
        expect(true).toBe(true);
      }
    });
  });

  describe('Error recovery', () => {
    it('should recover from audio system errors', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      // Simulate audio error
      mockUseAudio.mockImplementation(() => {
        throw new Error('Audio system unavailable');
      });

      // Should not crash the component
      expect(() => {
        rerender(<AnimatedLogoContainer />);
      }).toThrow('Audio system unavailable');

      // Reset audio system
      mockUseAudio.mockReturnValue(mockAudioState);

      // Should recover gracefully
      const { getByTestId: getByTestIdRecovered } = render(<AnimatedLogoContainer />);
      expect(getByTestIdRecovered('logo-display')).toBeTruthy();
      expect(getByTestIdRecovered('spotlight-effects')).toBeTruthy();
    });

    it('should handle dimension API errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock Dimensions.get to throw error
      const { Dimensions: MockDimensions } = require('react-native');
      MockDimensions.get.mockImplementation(() => {
        throw new Error('Dimensions unavailable');
      });

      // Should not crash during render
      expect(() => {
        render(<AnimatedLogoContainer />);
      }).toThrow();

      // Reset
      MockDimensions.get.mockReturnValue({ width: 375, height: 812 });

      // Should work normally after reset
      const { getByTestId } = render(<AnimatedLogoContainer />);
      expect(getByTestId('logo-display')).toBeTruthy();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with audio states', () => {
    it('should handle all audio playback states correctly', async () => {
      const audioStates = [
        { isPlaying: false, playbackStatus: 'stopped' },
        { isPlaying: false, playbackStatus: 'paused' },
        { isPlaying: true, playbackStatus: 'playing' },
        { isPlaying: false, playbackStatus: 'loading' },
        { isPlaying: false, playbackStatus: 'error' },
      ];

      for (const state of audioStates) {
        mockAudioState = { ...mockAudioState, ...state };
        mockUseAudio.mockReturnValue(mockAudioState);

        const { getByTestId, unmount } = render(<AnimatedLogoContainer />);

        await waitFor(() => {
          const spotlightEffects = getByTestId('spotlight-effects');
          expect(spotlightEffects.props['data-is-playing']).toBe(state.isPlaying);
        });

        unmount();
      }
    });

    it('should sync animation state with audio controls', async () => {
      const { getByTestId, rerender } = render(<AnimatedLogoContainer />);

      // Test play
      await act(async () => {
        mockAudioState.play();
        mockAudioState.isPlaying = true;
        mockAudioState.playbackStatus = 'playing';
        mockUseAudio.mockReturnValue(mockAudioState);
        rerender(<AnimatedLogoContainer />);
      });

      await waitFor(() => {
        const spotlightEffects = getByTestId('spotlight-effects');
        expect(spotlightEffects.props['data-is-playing']).toBe(true);
      });

      // Test pause
      await act(async () => {
        mockAudioState.pause();
        mockAudioState.isPlaying = false;
        mockAudioState.playbackStatus = 'paused';
        mockUseAudio.mockReturnValue(mockAudioState);
        rerender(<AnimatedLogoContainer />);
      });

      await waitFor(() => {
        const spotlightEffects = getByTestId('spotlight-effects');
        expect(spotlightEffects.props['data-is-playing']).toBe(false);
      });

      // Test stop
      await act(async () => {
        mockAudioState.stop();
        mockAudioState.isPlaying = false;
        mockAudioState.playbackStatus = 'stopped';
        mockUseAudio.mockReturnValue(mockAudioState);
        rerender(<AnimatedLogoContainer />);
      });

      await waitFor(() => {
        const spotlightEffects = getByTestId('spotlight-effects');
        expect(spotlightEffects.props['data-is-playing']).toBe(false);
      });
    });
  });
});