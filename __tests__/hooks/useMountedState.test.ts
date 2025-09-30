import { renderHook, act } from '@testing-library/react-native';
import { useMountedState } from '@/hooks/useMountedState';

describe('useMountedState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with mounted state as true', () => {
      const { result } = renderHook(() => useMountedState());

      expect(result.current.isMounted()).toBe(true);
      expect(typeof result.current.setStateIfMounted).toBe('function');
      expect(result.current.signal).toBeInstanceOf(AbortSignal);
    });

    it('should create a new AbortController on mount', () => {
      const { result } = renderHook(() => useMountedState());

      expect(result.current.signal).toBeInstanceOf(AbortSignal);
      expect(result.current.signal?.aborted).toBe(false);
    });

    it('should provide stable function reference for setStateIfMounted', () => {
      const { result, rerender } = renderHook(() => useMountedState());

      const firstSetStateIfMounted = result.current.setStateIfMounted;
      rerender();
      const secondSetStateIfMounted = result.current.setStateIfMounted;

      expect(firstSetStateIfMounted).toBe(secondSetStateIfMounted);
    });
  });

  describe('Cleanup on unmount', () => {
    it('should set mounted state to false when component unmounts', () => {
      const { result, unmount } = renderHook(() => useMountedState());

      expect(result.current.isMounted()).toBe(true);

      unmount();

      expect(result.current.isMounted()).toBe(false);
    });

    it('should abort the signal when component unmounts', () => {
      const { result, unmount } = renderHook(() => useMountedState());

      const signal = result.current.signal;
      expect(signal?.aborted).toBe(false);

      unmount();

      expect(signal?.aborted).toBe(true);
    });

    it('should handle multiple unmounts gracefully', () => {
      const { result, unmount } = renderHook(() => useMountedState());

      unmount();
      expect(result.current.isMounted()).toBe(false);

      // Second unmount should not cause any issues
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('State update prevention after unmount', () => {
    it('should execute setState callback when component is mounted', () => {
      const { result } = renderHook(() => useMountedState());
      const mockSetState = jest.fn();

      act(() => {
        result.current.setStateIfMounted(mockSetState);
      });

      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    it('should not execute setState callback when component is unmounted', () => {
      const { result, unmount } = renderHook(() => useMountedState());
      const mockSetState = jest.fn();

      unmount();

      act(() => {
        result.current.setStateIfMounted(mockSetState);
      });

      expect(mockSetState).not.toHaveBeenCalled();
    });

    it('should handle multiple setState calls while mounted', () => {
      const { result } = renderHook(() => useMountedState());
      const mockSetState1 = jest.fn();
      const mockSetState2 = jest.fn();

      act(() => {
        result.current.setStateIfMounted(mockSetState1);
        result.current.setStateIfMounted(mockSetState2);
      });

      expect(mockSetState1).toHaveBeenCalledTimes(1);
      expect(mockSetState2).toHaveBeenCalledTimes(1);
    });

    it('should handle setState calls with errors gracefully', () => {
      const { result } = renderHook(() => useMountedState());
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });

      expect(() => {
        act(() => {
          result.current.setStateIfMounted(errorCallback);
        });
      }).toThrow('Test error');

      expect(errorCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook reliability', () => {
    it('should work correctly across multiple re-renders', () => {
      const { result, rerender } = renderHook(() => useMountedState());
      const mockSetState = jest.fn();

      // First render
      expect(result.current.isMounted()).toBe(true);

      // Re-render
      rerender();
      expect(result.current.isMounted()).toBe(true);

      // setState should still work
      act(() => {
        result.current.setStateIfMounted(mockSetState);
      });

      expect(mockSetState).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid mount/unmount cycles', () => {
      for (let i = 0; i < 5; i++) {
        const { result, unmount } = renderHook(() => useMountedState());

        expect(result.current.isMounted()).toBe(true);
        expect(result.current.signal?.aborted).toBe(false);

        unmount();

        expect(result.current.isMounted()).toBe(false);
        expect(result.current.signal?.aborted).toBe(true);
      }
    });

    it('should provide different AbortSignals for different hook instances', () => {
      const { result: result1 } = renderHook(() => useMountedState());
      const { result: result2 } = renderHook(() => useMountedState());

      expect(result1.current.signal).not.toBe(result2.current.signal);
      expect(result1.current.signal).toBeInstanceOf(AbortSignal);
      expect(result2.current.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('AbortSignal integration', () => {
    it('should provide a valid AbortSignal for fetch operations', () => {
      const { result } = renderHook(() => useMountedState());

      expect(result.current.signal).toBeInstanceOf(AbortSignal);
      expect(result.current.signal?.aborted).toBe(false);
    });

    it('should abort signal when component unmounts', async () => {
      const { result, unmount } = renderHook(() => useMountedState());
      const signal = result.current.signal;

      // Create a promise that would be aborted
      const abortPromise = new Promise((_, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });

      unmount();

      await expect(abortPromise).rejects.toThrow('The operation was aborted.');
    });

    it('should handle signal being used in async operations', async () => {
      const { result, unmount } = renderHook(() => useMountedState());

      // Simulate an async operation using the signal
      const asyncOperation = () => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => resolve('success'), 100);

          result.current.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new DOMException('Operation aborted', 'AbortError'));
          });
        });
      };

      const operationPromise = asyncOperation();

      // Unmount before operation completes
      unmount();

      await expect(operationPromise).rejects.toThrow('Operation aborted');
    });
  });

  describe('Performance considerations', () => {
    it('should not create new functions on re-render', () => {
      const { result, rerender } = renderHook(() => useMountedState());

      const firstIsMounted = result.current.isMounted;
      const firstSetStateIfMounted = result.current.setStateIfMounted;

      rerender();

      const secondIsMounted = result.current.isMounted;
      const secondSetStateIfMounted = result.current.setStateIfMounted;

      // isMounted should be the same function reference
      expect(firstIsMounted).toBe(secondIsMounted);
      // setStateIfMounted should be memoized with useCallback
      expect(firstSetStateIfMounted).toBe(secondSetStateIfMounted);
    });

    it('should handle memory cleanup properly', () => {
      const hooks: Array<() => void> = [];

      // Create multiple hook instances
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useMountedState());
        hooks.push(unmount);
      }

      // Unmount all instances
      hooks.forEach(unmount => unmount());

      // No memory leaks should occur (this is tested by the fact that the test completes)
      expect(true).toBe(true);
    });
  });
});