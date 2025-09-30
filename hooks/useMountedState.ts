/**
 * Hook to handle safe state updates for components
 * Prevents state updates after component unmount
 */

import { useRef, useEffect, useCallback } from 'react';

interface UseMountedStateReturn {
  isMounted: () => boolean;
  setStateIfMounted: (setter: () => void) => void;
  signal?: AbortSignal;
}

/**
 * Custom hook that provides safe state update functionality
 * Prevents React warnings about state updates on unmounted components
 *
 * @returns {UseMountedStateReturn} Object with isMounted check, safe setState wrapper, and abort signal
 *
 * @example
 * ```tsx
 * const { isMounted, setStateIfMounted, signal } = useMountedState();
 *
 * // Use in async operations
 * const fetchData = async () => {
 *   try {
 *     const response = await fetch(url, { signal });
 *     const data = await response.json();
 *
 *     setStateIfMounted(() => {
 *       setData(data);
 *       setLoading(false);
 *     });
 *   } catch (error) {
 *     if (error.name !== 'AbortError') {
 *       setStateIfMounted(() => setError(error));
 *     }
 *   }
 * };
 * ```
 */
export const useMountedState = (): UseMountedStateReturn => {
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController for this component lifecycle
    abortControllerRef.current = new AbortController();

    // Cleanup function
    return () => {
      // Mark component as unmounted
      mountedRef.current = false;

      // Abort any pending requests
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Safely execute state updates only if component is still mounted
   * @param setter Function containing state updates to execute
   */
  const setStateIfMounted = useCallback((setter: () => void) => {
    if (mountedRef.current) {
      setter();
    }
  }, []);

  return {
    isMounted: () => mountedRef.current,
    setStateIfMounted,
    signal: abortControllerRef.current?.signal
  };
};

export default useMountedState;