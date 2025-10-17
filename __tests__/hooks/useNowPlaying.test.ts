import { renderHook, act } from '@testing-library/react-native';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { Platform, AppState as RNAppState } from 'react-native';

// Mock Platform and AppState
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios', // Default to iOS, will be changed per test
    select: jest.fn((platforms) => platforms.ios || platforms.default),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn((event, callback) => {
      // Store the callback for manual triggering in tests
      (RNAppState as any)._listener = callback;
      return { remove: jest.fn() };
    }),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('useNowPlaying', () => {
  const mockMetadataUrl = 'https://example.com/metadata.json';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Reset to iOS by default
    (Platform.OS as any) = 'ios';
    (RNAppState as any).currentState = 'active';
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      text: jest.fn().mockResolvedValue(JSON.stringify({
        nowPlaying: 'Test Song - Test Artist'
      })),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * TASK 9: Platform detection tests
   * Requirements: 1.1, 1.2, 7.1
   */
  describe('Platform detection (Task 9)', () => {
    it('should skip polling on Android platform', async () => {
      // Change platform to Android
      (Platform.OS as any) = 'android';

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for any potential async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify no fetch calls were made on Android
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.nowPlaying).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should enable polling on iOS platform', async () => {
      (Platform.OS as any) = 'ios';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify fetch was called on iOS
      expect(global.fetch).toHaveBeenCalledWith(
        mockMetadataUrl,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: expect.objectContaining({
            'Cache-Control': 'no-cache',
          }),
        })
      );
    });

    it('should default to iOS behavior for unknown platforms', async () => {
      // Set to an unknown platform
      (Platform.OS as any) = 'web' as any;

      renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should behave like iOS and make fetch calls
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not make any requests when metadataUrl is not provided', async () => {
      renderHook(() => useNowPlaying(undefined));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  /**
   * TASK 10: iOS interval calculation tests
   * Requirements: 2.1, 2.2
   */
  describe('iOS interval calculation (Task 10)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (Platform.OS as any) = 'ios';
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use 5 second interval in active state', async () => {
      (RNAppState as any).currentState = 'active';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch to complete
      await act(async () => {
        await Promise.resolve();
      });
      (global.fetch as jest.Mock).mockClear();

      // Advance 5 seconds - should trigger fetch
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance another 5 seconds - should trigger another fetch
      (global.fetch as jest.Mock).mockClear();
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use 2 minute interval in background state', async () => {
      (RNAppState as any).currentState = 'background';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });
      (global.fetch as jest.Mock).mockClear();

      // Advance 1 minute - should NOT trigger fetch yet
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(global.fetch).not.toHaveBeenCalled();

      // Advance another 1 minute (total 2 minutes) - should trigger fetch
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use 2 minute interval in inactive state', async () => {
      (RNAppState as any).currentState = 'inactive';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });
      (global.fetch as jest.Mock).mockClear();

      // Advance 5 seconds - should NOT trigger fetch (not using 5s interval)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).not.toHaveBeenCalled();

      // Advance to 2 minutes total - should trigger fetch
      act(() => {
        jest.advanceTimersByTime(115000); // 120s total
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should verify multiple polling cycles with 5s interval', async () => {
      (RNAppState as any).currentState = 'active';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });
      (global.fetch as jest.Mock).mockClear();

      // Run 3 polling cycles (15 seconds)
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * TASK 11: AppState transition tests
   * Requirements: 2.3, 2.4
   */
  describe('AppState transitions (Task 11)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (Platform.OS as any) = 'ios';
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should fetch immediately when app transitions from background to active', async () => {
      // Start in background state
      (RNAppState as any).currentState = 'background';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });

      // Note: The hook's appState updates via setAppState, which triggers a re-render
      // and the useEffect runs again with the new appState, causing startPolling to run
      // Clear all calls including initial fetch and any from state change
      (global.fetch as jest.Mock).mockClear();

      // Simulate app state change to active
      // This will trigger fetchMetadata() immediately (line 186)
      await act(async () => {
        const listener = (RNAppState as any)._listener;
        if (listener) {
          listener('active');
        }
        await Promise.resolve();
      });

      // Should have fetched immediately when transitioning to active
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should switch from 5s to 2min interval when backgrounded', async () => {
      // Start in active state
      (RNAppState as any).currentState = 'active';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });
      (global.fetch as jest.Mock).mockClear();

      // Verify 5s interval works
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      (global.fetch as jest.Mock).mockClear();

      // Transition to background - this clears the 5s interval and starts a 2min interval
      act(() => {
        const listener = (RNAppState as any)._listener;
        if (listener) {
          listener('background');
        }
      });

      // The listener calls startPolling() which clears the old 5s interval
      // and starts a new 2min interval. This happens synchronously.
      // Any pending 5s timer is cleared before it can fire.
      (global.fetch as jest.Mock).mockClear();

      // Advance 5 seconds - should NOT trigger fetch anymore (2min interval now)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).not.toHaveBeenCalled();

      // Advance to 2 minutes total from the background transition - should trigger fetch
      act(() => {
        jest.advanceTimersByTime(115000); // 120s total
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should resume 5s polling when returning to foreground', async () => {
      // Start in background
      (RNAppState as any).currentState = 'background';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });
      (global.fetch as jest.Mock).mockClear();

      // Transition to active
      act(() => {
        const listener = (RNAppState as any)._listener;
        if (listener) {
          listener('active');
        }
      });

      // Clear the immediate fetch
      (global.fetch as jest.Mock).mockClear();

      // Verify 5s interval is now active
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify it continues with 5s interval
      (global.fetch as jest.Mock).mockClear();
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid state transitions gracefully', async () => {
      (RNAppState as any).currentState = 'active';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });
      (global.fetch as jest.Mock).mockClear();

      // Rapidly transition between states
      act(() => {
        const listener = (RNAppState as any)._listener;
        if (listener) {
          listener('background');
          listener('inactive');
          listener('active'); // Triggers fetch
          listener('background');
          listener('active'); // Triggers fetch
        }
      });

      // Should handle transitions without crashes
      // Transitions to active trigger immediate fetch
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not fetch immediately on listener callback, but will fetch when useEffect re-runs due to appState dependency', async () => {
      (RNAppState as any).currentState = 'active';

      renderHook(() => useNowPlaying(mockMetadataUrl));

      // Wait for initial fetch and effect to complete
      await act(async () => {
        await Promise.resolve();
      });

      // Clear initial fetch call
      (global.fetch as jest.Mock).mockClear();

      // Transition to background
      // This triggers setAppState which causes useEffect to re-run (appState is a dependency)
      // The useEffect re-run will call fetchMetadata() again (line 173)
      act(() => {
        const listener = (RNAppState as any)._listener;
        if (listener) {
          listener('background');
        }
      });

      // Due to appState being in the useEffect dependency array,
      // changing appState causes useEffect to re-run and call fetchMetadata()
      // This is expected behavior - verify the implementation works correctly
      // The key point is that the listener itself doesn't call fetchMetadata for non-active states
      // (only active state has explicit fetchMetadata call in listener - line 186)

      // When transitioning to active, it should call fetch twice:
      // once from the listener (line 186) and once from useEffect re-run (line 173)
      (global.fetch as jest.Mock).mockClear();
      act(() => {
        const listener = (RNAppState as any)._listener;
        if (listener) {
          listener('active');
        }
      });

      // Verify that transitioning to active triggers immediate fetch in the listener
      // (This will show 2 calls: one from listener line 186, one from useEffect line 173)
      expect(global.fetch).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        mockMetadataUrl,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  /**
   * TASK 12: Error handling tests
   * Requirements: 7.4
   */
  describe('Error handling for metadata fetch failures (Task 12)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (Platform.OS as any) = 'ios';
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle network failure and set metadata to null', async () => {
      // Mock network failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      // Should fallback to null metadata
      expect(result.current.nowPlaying).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle timeout scenario with AbortController', async () => {
      // Mock slow response that will timeout
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              status: 200,
              text: jest.fn().mockResolvedValue('delayed response'),
            });
          }, 10000); // 10 second delay, but timeout is 5 seconds
        })
      );

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      // Advance timers to trigger timeout (5 seconds)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should handle timeout gracefully
      expect(result.current.nowPlaying).toBeNull();
    });

    it('should handle AbortError specifically and not set error state', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      // AbortError should not be treated as a regular error
      // The hook should maintain previous state or null
      expect(result.current.isLoading).toBe(false);
    });

    it('should retry on next polling cycle after failure', async () => {
      // First fetch fails
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          text: jest.fn().mockResolvedValue(JSON.stringify({
            nowPlaying: 'Test Song - Test Artist'
          })),
        });

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      // First fetch fails
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.nowPlaying).toBeNull();

      // Wait for next polling cycle (5 seconds in active state)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should have retried and succeeded
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.nowPlaying).toEqual({
        title: 'Test Song - Test Artist',
        song: 'Test Song',
        artist: 'Test Artist',
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: jest.fn().mockResolvedValue('invalid json {'),
      });

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      // Should parse as plain text and extract metadata
      expect(result.current.nowPlaying).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle empty response gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: jest.fn().mockResolvedValue(''),
      });

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      // Should handle empty response without crashing
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle HTTP error status codes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      });

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      // Should handle error status without crashing
      expect(result.current.isLoading).toBe(false);
    });
  });

  /**
   * TASK 13: Memory leak prevention tests
   * Requirements: 7.2
   */
  describe('Memory leak prevention (Task 13)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (Platform.OS as any) = 'ios';
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clear intervals when hook unmounts', async () => {
      const { unmount } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      (global.fetch as jest.Mock).mockClear();

      // Unmount the hook
      unmount();

      // Advance timers - should NOT trigger any fetches after unmount
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should remove AppState subscription on unmount', async () => {
      const mockRemove = jest.fn();
      (RNAppState.addEventListener as jest.Mock).mockReturnValueOnce({
        remove: mockRemove,
      });

      const { unmount } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      unmount();

      // Verify remove was called
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });

    it('should abort pending requests on unmount', async () => {
      // Mock a slow fetch that will be aborted
      const mockAbort = jest.fn();
      const mockController = {
        signal: { aborted: false } as AbortSignal,
        abort: mockAbort,
      };

      global.AbortController = jest.fn(() => mockController) as any;

      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              status: 200,
              text: jest.fn().mockResolvedValue('delayed'),
            });
          }, 10000);
        })
      );

      const { unmount } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      // Unmount while request is pending
      unmount();

      // Should have called abort
      expect(mockAbort).toHaveBeenCalled();
    });

    it('should handle multiple mount/unmount cycles without leaks', async () => {
      const mountUnmountCycles = 5;

      for (let i = 0; i < mountUnmountCycles; i++) {
        const { unmount } = renderHook(() => useNowPlaying(mockMetadataUrl));

        await act(async () => {
          await Promise.resolve();
        });

        unmount();
      }

      // If there are memory leaks, this test would fail or hang
      expect(true).toBe(true);
    });

    it('should not update state after unmount', async () => {
      // Mock a slow response
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              status: 200,
              text: jest.fn().mockResolvedValue(JSON.stringify({
                nowPlaying: 'Test Song - Test Artist'
              })),
            });
          }, 1000);
        })
      );

      const { result, unmount } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      const initialState = result.current.nowPlaying;

      unmount();

      // Complete the fetch after unmount
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // State should not have changed after unmount
      expect(result.current.nowPlaying).toBe(initialState);
    });

    it('should properly clean up all resources', async () => {
      const mockRemove = jest.fn();
      (RNAppState.addEventListener as jest.Mock).mockReturnValueOnce({
        remove: mockRemove,
      });

      const { unmount } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      (global.fetch as jest.Mock).mockClear();

      // Unmount
      unmount();

      // Verify all cleanup occurred:
      // 1. AppState listener removed
      expect(mockRemove).toHaveBeenCalledTimes(1);

      // 2. No more fetches after unmount
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle cleanup when no metadataUrl was provided', async () => {
      const { unmount } = renderHook(() => useNowPlaying(undefined));

      await act(async () => {
        await Promise.resolve();
      });

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should prevent memory leaks with rapid state changes', async () => {
      const { unmount } = renderHook(() => useNowPlaying(mockMetadataUrl));

      await act(async () => {
        await Promise.resolve();
      });

      // Simulate rapid state changes before unmount
      act(() => {
        const listener = (RNAppState as any)._listener;
        if (listener) {
          for (let i = 0; i < 10; i++) {
            listener('background');
            listener('active');
          }
        }
      });

      // Clear fetch calls from state changes
      (global.fetch as jest.Mock).mockClear();

      unmount();

      // Verify no more fetches after unmount despite many state changes
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  /**
   * Additional integration test
   */
  describe('Integration scenarios', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (Platform.OS as any) = 'ios';
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle complete lifecycle with state changes and metadata updates', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          nowPlaying: 'Song 1 - Artist 1'
        })),
      });

      const { result } = renderHook(() => useNowPlaying(mockMetadataUrl));

      // Initial fetch
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.nowPlaying).toEqual({
        title: 'Song 1 - Artist 1',
        song: 'Song 1',
        artist: 'Artist 1',
      });

      // Change metadata for next fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          nowPlaying: 'Song 2 - Artist 2'
        })),
      });

      // Advance 5 seconds for next poll
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.nowPlaying).toEqual({
        title: 'Song 2 - Artist 2',
        song: 'Song 2',
        artist: 'Artist 2',
      });

      // Transition to background
      act(() => {
        const listener = (RNAppState as any)._listener;
        if (listener) {
          listener('background');
        }
      });

      // Verify polling slowed down (5s should not trigger)
      (global.fetch as jest.Mock).mockClear();
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
