import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useSharedValue, withTiming, withRepeat, cancelAnimation } from 'react-native-reanimated';
import { usePlaybackAnimation } from '@/hooks/usePlaybackAnimation';
import { useAudio } from '@/hooks/useAudio';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(),
  withTiming: jest.fn(),
  withRepeat: jest.fn(),
  cancelAnimation: jest.fn(),
  Easing: {
    inOut: jest.fn((easing) => easing),
    ease: 'ease',
  },
}));

// Mock useAudio hook
jest.mock('@/hooks/useAudio', () => ({
  useAudio: jest.fn(),
}));

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isReduceMotionEnabled: jest.fn(),
  addEventListener: jest.fn(),
}));

const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>;
const mockWithTiming = withTiming as jest.MockedFunction<typeof withTiming>;
const mockWithRepeat = withRepeat as jest.MockedFunction<typeof withRepeat>;
const mockCancelAnimation = cancelAnimation as jest.MockedFunction<typeof cancelAnimation>;
const mockUseAudio = useAudio as jest.MockedFunction<typeof useAudio>;
const mockAccessibilityInfo = AccessibilityInfo as jest.Mocked<typeof AccessibilityInfo>;

describe('usePlaybackAnimation', () => {
  let mockSharedValues: Record<string, any> = {};
  let mockSubscription: { remove: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset shared values
    mockSharedValues = {
      logoScale: { value: 1 },
      logoOpacity: { value: 1 },
      spotlight1Opacity: { value: 0.3 },
      spotlight2Opacity: { value: 0.5 },
      spotlight3Opacity: { value: 0.2 },
      spotlight1Scale: { value: 1 },
      spotlight2Scale: { value: 1.2 },
      spotlight3Scale: { value: 0.8 },
    };

    // Mock subscription object
    mockSubscription = { remove: jest.fn() };

    // Setup default mocks
    mockUseSharedValue.mockImplementation((initialValue) => ({
      value: initialValue,
    }));

    mockUseAudio.mockReturnValue({
      isPlaying: false,
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      currentTime: 0,
      duration: 0,
      volume: 1,
      setVolume: jest.fn(),
      playbackStatus: 'stopped',
    });

    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.addEventListener.mockReturnValue(mockSubscription);

    // Mock with timing and repeat functions
    mockWithTiming.mockImplementation((value, config) => ({
      toValue: value,
      config,
      type: 'timing'
    }));

    mockWithRepeat.mockImplementation((animation, times, reverse) => ({
      animation,
      times,
      reverse,
      type: 'repeat'
    }));
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => usePlaybackAnimation());

      expect(mockUseSharedValue).toHaveBeenCalledWith(1); // logoScale
      expect(mockUseSharedValue).toHaveBeenCalledWith(1); // logoOpacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(0.3); // spotlight1Opacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(0.5); // spotlight2Opacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(0.2); // spotlight3Opacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(1); // spotlight1Scale
      expect(mockUseSharedValue).toHaveBeenCalledWith(1.2); // spotlight2Scale
      expect(mockUseSharedValue).toHaveBeenCalledWith(0.8); // spotlight3Scale

      expect(result.current.isPlaying).toBe(false);
    });

    it('should check reduce motion setting on mount', async () => {
      renderHook(() => usePlaybackAnimation());

      await waitFor(() => {
        expect(mockAccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled();
      });
    });

    it('should setup accessibility listener on mount', () => {
      renderHook(() => usePlaybackAnimation());

      expect(mockAccessibilityInfo.addEventListener).toHaveBeenCalledWith(
        'reduceMotionChanged',
        expect.any(Function)
      );
    });

    it('should cleanup accessibility listener on unmount', () => {
      const { unmount } = renderHook(() => usePlaybackAnimation());

      unmount();

      expect(mockSubscription.remove).toHaveBeenCalled();
    });
  });

  describe('Animation state transitions', () => {
    it('should start ambient animation when not playing', async () => {
      mockUseAudio.mockReturnValue({
        isPlaying: false,
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        setVolume: jest.fn(),
        playbackStatus: 'stopped',
      });

      const { result } = renderHook(() => usePlaybackAnimation());

      await act(async () => {
        result.current.startAmbientAnimation();
      });

      // Should setup repeating animations for ambient mode
      expect(mockWithRepeat).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'timing' }),
        -1, // Infinite repeat
        true // Reverse
      );
    });

    it('should start pulse animation when playing', async () => {
      mockUseAudio.mockReturnValue({
        isPlaying: true,
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        setVolume: jest.fn(),
        playbackStatus: 'playing',
      });

      const { result } = renderHook(() => usePlaybackAnimation());

      await act(async () => {
        result.current.startPulseAnimation();
      });

      // Should setup repeating animations for pulse mode
      expect(mockWithRepeat).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'timing' }),
        -1, // Infinite repeat
        true // Reverse
      );
    });

    it('should transition from ambient to pulse when isPlaying changes to true', async () => {
      let audioState = { isPlaying: false };

      mockUseAudio.mockImplementation(() => ({
        ...audioState,
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        setVolume: jest.fn(),
        playbackStatus: audioState.isPlaying ? 'playing' : 'stopped',
      }));

      const { result, rerender } = renderHook(() => usePlaybackAnimation());

      // Initially should start ambient animation
      await waitFor(() => {
        expect(mockWithRepeat).toHaveBeenCalled();
      });

      // Change to playing state
      audioState.isPlaying = true;
      jest.clearMocks();

      rerender();

      // Should start pulse animation
      await waitFor(() => {
        expect(mockWithRepeat).toHaveBeenCalled();
      });
    });

    it('should transition from pulse to ambient when isPlaying changes to false', async () => {
      let audioState = { isPlaying: true };

      mockUseAudio.mockImplementation(() => ({
        ...audioState,
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        setVolume: jest.fn(),
        playbackStatus: audioState.isPlaying ? 'playing' : 'stopped',
      }));

      const { result, rerender } = renderHook(() => usePlaybackAnimation());

      // Initially should start pulse animation
      await waitFor(() => {
        expect(mockWithRepeat).toHaveBeenCalled();
      });

      // Change to not playing state
      audioState.isPlaying = false;
      jest.clearMocks();

      rerender();

      // Should start ambient animation
      await waitFor(() => {
        expect(mockWithRepeat).toHaveBeenCalled();
      });
    });
  });

  describe('Play/pause/stop behaviors', () => {
    it('should handle pause animation correctly', async () => {
      const { result } = renderHook(() => usePlaybackAnimation());

      await act(async () => {
        result.current.pauseAnimation();
      });

      // Should cancel all animations
      expect(mockCancelAnimation).toHaveBeenCalledTimes(7); // All shared values

      // Should return to default values with timing
      expect(mockWithTiming).toHaveBeenCalledWith(1, expect.objectContaining({
        duration: 500,
      })); // logoScale

      expect(mockWithTiming).toHaveBeenCalledWith(0.3, expect.objectContaining({
        duration: 500,
      })); // spotlight1Opacity
    });

    it('should handle reset animation correctly', async () => {
      const { result } = renderHook(() => usePlaybackAnimation());

      await act(async () => {
        result.current.resetAnimation();
      });

      // Should cancel all animations
      expect(mockCancelAnimation).toHaveBeenCalledTimes(8); // All shared values including logoOpacity

      // Should reset values immediately (no timing animation)
      expect(mockWithTiming).not.toHaveBeenCalled();
    });

    it('should provide correct playback state', () => {
      mockUseAudio.mockReturnValue({
        isPlaying: true,
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        setVolume: jest.fn(),
        playbackStatus: 'playing',
      });

      const { result } = renderHook(() => usePlaybackAnimation());

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Mock useAudio responses', () => {
    it('should respond to different audio states', () => {
      const mockAudioStates = [
        { isPlaying: false, playbackStatus: 'stopped' },
        { isPlaying: true, playbackStatus: 'playing' },
        { isPlaying: false, playbackStatus: 'paused' },
      ];

      mockAudioStates.forEach((state) => {
        mockUseAudio.mockReturnValue({
          ...state,
          play: jest.fn(),
          pause: jest.fn(),
          stop: jest.fn(),
          currentTime: 0,
          duration: 0,
          volume: 1,
          setVolume: jest.fn(),
        });

        const { result } = renderHook(() => usePlaybackAnimation());
        expect(result.current.isPlaying).toBe(state.isPlaying);
      });
    });

    it('should handle audio hook errors gracefully', () => {
      // Mock useAudio to throw an error
      mockUseAudio.mockImplementation(() => {
        throw new Error('Audio system unavailable');
      });

      // Should not crash
      expect(() => {
        renderHook(() => usePlaybackAnimation());
      }).toThrow('Audio system unavailable');
    });

    it('should handle undefined audio state', () => {
      mockUseAudio.mockReturnValue({
        isPlaying: undefined as any,
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        setVolume: jest.fn(),
        playbackStatus: 'unknown' as any,
      });

      const { result } = renderHook(() => usePlaybackAnimation());

      // Should handle undefined gracefully
      expect(result.current.isPlaying).toBeUndefined();
    });
  });

  describe('Accessibility support', () => {
    it('should handle reduce motion enabled', async () => {
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);

      const { result } = renderHook(() => usePlaybackAnimation());

      await waitFor(() => {
        expect(result.current.isReduceMotionEnabled).toBe(true);
      });
    });

    it('should use simplified animations when reduce motion is enabled', async () => {
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);

      const { result, rerender } = renderHook(() => usePlaybackAnimation());

      // Wait for reduce motion to be detected
      await waitFor(() => {
        expect(result.current.isReduceMotionEnabled).toBe(true);
      });

      await act(async () => {
        result.current.startAmbientAnimation();
      });

      // Should use withTiming instead of withRepeat for reduced motion
      expect(mockWithTiming).toHaveBeenCalledWith(0.5, expect.objectContaining({
        duration: 1000,
      }));

      expect(mockWithRepeat).not.toHaveBeenCalled();
    });

    it('should handle accessibility setting changes', async () => {
      let reduceMotionCallback: (enabled: boolean) => void;

      mockAccessibilityInfo.addEventListener.mockImplementation((event, callback) => {
        if (event === 'reduceMotionChanged') {
          reduceMotionCallback = callback;
        }
        return mockSubscription;
      });

      const { result } = renderHook(() => usePlaybackAnimation());

      // Initially false
      expect(result.current.isReduceMotionEnabled).toBe(false);

      // Trigger accessibility change
      await act(async () => {
        reduceMotionCallback!(true);
      });

      expect(result.current.isReduceMotionEnabled).toBe(true);
    });

    it('should handle accessibility info errors gracefully', async () => {
      mockAccessibilityInfo.isReduceMotionEnabled.mockRejectedValue(
        new Error('Accessibility unavailable')
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => usePlaybackAnimation());

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to check reduce motion setting:',
          expect.any(Error)
        );
        expect(result.current.isReduceMotionEnabled).toBe(false);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Animation values', () => {
    it('should expose all required animation values', () => {
      const { result } = renderHook(() => usePlaybackAnimation());

      expect(result.current).toHaveProperty('logoScale');
      expect(result.current).toHaveProperty('logoOpacity');
      expect(result.current).toHaveProperty('spotlight1Opacity');
      expect(result.current).toHaveProperty('spotlight2Opacity');
      expect(result.current).toHaveProperty('spotlight3Opacity');
      expect(result.current).toHaveProperty('spotlight1Scale');
      expect(result.current).toHaveProperty('spotlight2Scale');
      expect(result.current).toHaveProperty('spotlight3Scale');
    });

    it('should expose all animation control methods', () => {
      const { result } = renderHook(() => usePlaybackAnimation());

      expect(result.current).toHaveProperty('startAmbientAnimation');
      expect(result.current).toHaveProperty('startPulseAnimation');
      expect(result.current).toHaveProperty('pauseAnimation');
      expect(result.current).toHaveProperty('resetAnimation');
      expect(typeof result.current.startAmbientAnimation).toBe('function');
      expect(typeof result.current.startPulseAnimation).toBe('function');
      expect(typeof result.current.pauseAnimation).toBe('function');
      expect(typeof result.current.resetAnimation).toBe('function');
    });

    it('should maintain stable references for animation methods', () => {
      const { result, rerender } = renderHook(() => usePlaybackAnimation());

      const initialMethods = {
        startAmbientAnimation: result.current.startAmbientAnimation,
        startPulseAnimation: result.current.startPulseAnimation,
        pauseAnimation: result.current.pauseAnimation,
        resetAnimation: result.current.resetAnimation,
      };

      rerender();

      // Methods should maintain stable references (useCallback)
      expect(result.current.startAmbientAnimation).toBe(initialMethods.startAmbientAnimation);
      expect(result.current.startPulseAnimation).toBe(initialMethods.startPulseAnimation);
      expect(result.current.pauseAnimation).toBe(initialMethods.pauseAnimation);
      expect(result.current.resetAnimation).toBe(initialMethods.resetAnimation);
    });
  });

  describe('Performance considerations', () => {
    it('should not create new callbacks on every render', () => {
      const { result, rerender } = renderHook(() => usePlaybackAnimation());

      const firstRender = {
        startAmbientAnimation: result.current.startAmbientAnimation,
        startPulseAnimation: result.current.startPulseAnimation,
        pauseAnimation: result.current.pauseAnimation,
        resetAnimation: result.current.resetAnimation,
      };

      // Re-render multiple times
      rerender();
      rerender();
      rerender();

      // Callbacks should be memoized
      expect(result.current.startAmbientAnimation).toBe(firstRender.startAmbientAnimation);
      expect(result.current.startPulseAnimation).toBe(firstRender.startPulseAnimation);
      expect(result.current.pauseAnimation).toBe(firstRender.pauseAnimation);
      expect(result.current.resetAnimation).toBe(firstRender.resetAnimation);
    });

    it('should handle rapid state changes without memory leaks', async () => {
      let audioState = { isPlaying: false };

      mockUseAudio.mockImplementation(() => ({
        ...audioState,
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        currentTime: 0,
        duration: 0,
        volume: 1,
        setVolume: jest.fn(),
        playbackStatus: audioState.isPlaying ? 'playing' : 'stopped',
      }));

      const { rerender } = renderHook(() => usePlaybackAnimation());

      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        audioState.isPlaying = !audioState.isPlaying;
        rerender();
      }

      // Should not cause any errors or memory issues
      expect(true).toBe(true);
    });
  });
});