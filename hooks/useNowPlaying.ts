/**
 * @fileoverview Smart Context-Aware Metadata Polling Hook
 *
 * Cross-platform metadata polling with intelligent interval adjustment based on:
 * - App state (foreground/background)
 * - Charging status
 * - User interaction with media controls
 *
 * SMART POLLING STRATEGY (Android + iOS):
 * 1. App is active (user in our app) → 10 seconds
 * 2. Device is charging → 10 seconds (power is unlimited)
 * 3. Background + not charging → 2 minutes (maximize battery savings)
 * 4. Remote control interaction → Immediate update (when on 2min interval)
 *
 * POWER OPTIMIZATION:
 * - Foreground: 360 requests/hour (was 720) - 50% reduction
 * - Charging: 360 requests/hour - power unlimited, prioritize UX
 * - Background + not charging: 30 requests/hour (was 720) - 95% reduction
 *
 * PRODUCTION MONITORING LOGS:
 * Interval changes:
 *   [useNowPlaying] Starting polling with 10000ms interval (active, charging: false)
 *   [useNowPlaying] Starting polling with 10000ms interval (background, charging: true)
 *   [useNowPlaying] Starting polling with 120000ms interval (background, charging: false)
 *
 * Remote interactions:
 *   [useNowPlaying] Remote control interaction detected - triggering immediate fetch
 *
 * State transitions:
 *   [useNowPlaying] App state transition: active → background
 *   [useNowPlaying] Charging state changed: false → true
 *
 * @see services/audio/TrackPlayerService.ts for metadata update throttling
 */

import { useState, useEffect, useRef } from 'react';
import { Platform, AppState as RNAppState, AppStateStatus } from 'react-native';
import * as Battery from 'expo-battery';
import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Metadata information for currently playing track
 */
interface NowPlayingInfo {
  /** Display title (usually "SONG - ARTIST" format) */
  title?: string;
  /** Artist name */
  artist?: string;
  /** Song name */
  song?: string;
}

/**
 * Custom hook for fetching and managing now playing metadata with smart, context-aware
 * power optimization that balances UX with battery efficiency.
 *
 * @param metadataUrl - Optional URL endpoint that returns current metadata
 *                      (supports JSON or plain text "SONG - ARTIST" format)
 *
 * @returns Object containing current metadata and loading state
 *
 * @example
 * ```typescript
 * const { nowPlaying, isLoading } = useNowPlaying('https://api.example.com/metadata');
 *
 * // Updates every 10s when: app active OR charging
 * // Updates every 2min when: background AND not charging
 * // Immediate update when: user interacts with lock screen controls
 * ```
 *
 * SMART INTERVAL BEHAVIOR:
 * - App active: 10 seconds (360 req/hour) - Real-time UX for active users
 * - Charging: 10 seconds (360 req/hour) - Power unlimited, prioritize UX
 * - Background + not charging: 2 minutes (30 req/hour) - Maximum battery savings
 * - Remote control tap: Immediate - Fresh metadata when user checks lock screen
 *
 * POWER IMPACT vs ORIGINAL (720 req/hour baseline):
 * - Foreground: 50% reduction (720 → 360 req/hour)
 * - Charging: 50% reduction + unlimited power ✅
 * - Background: 95% reduction (720 → 30 req/hour) ✅
 *
 * CROSS-PLATFORM:
 * Works identically on Android and iOS with smart, battery-aware intervals.
 */
export const useNowPlaying = (metadataUrl?: string) => {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(RNAppState.currentState);
  const [isCharging, setIsCharging] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIntervalRef = useRef<number>(0); // Track current interval for remote event logic
  const previousAppStateRef = useRef<AppStateStatus>(RNAppState.currentState); // Track previous state for logging

  useEffect(() => {
    if (!metadataUrl) {
      console.log('[useNowPlaying] No metadataUrl provided');
      return;
    }

    console.log('[useNowPlaying] Starting smart metadata polling with URL:', metadataUrl);
    console.log('[useNowPlaying] Platform:', Platform.OS);
    let isMounted = true;

    // Initialize battery state
    Battery.getBatteryStateAsync().then((state) => {
      const charging = state === Battery.BatteryState.CHARGING ||
                      state === Battery.BatteryState.FULL;
      setIsCharging(charging);
      console.log('[useNowPlaying] Initial charging state:', charging);
    }).catch((error) => {
      console.error('[useNowPlaying] Failed to get battery state:', error);
      // Default to false (power-safe fallback)
      setIsCharging(false);
    });

    /**
     * Calculate polling interval based on app state and charging status.
     *
     * SMART INTERVAL LOGIC:
     * 1. Priority: App active → 10 seconds (user expects real-time updates)
     * 2. Priority: Charging → 10 seconds (power is unlimited, maximize UX)
     * 3. Fallback: Background + not charging → 2 minutes (maximize battery life)
     *
     * POWER OPTIMIZATION RATIONALE:
     * - 10s interval: 360 requests/hour - acceptable when user is engaged or power unlimited
     * - 2min interval: 30 requests/hour - 95% reduction for background battery savings
     *
     * Trade-off: Background metadata may be up to 2 minutes stale when not charging,
     * but this is acceptable as users rarely check lock screen metadata frequently.
     * Remote control interactions trigger immediate updates to mitigate staleness.
     *
     * @param state - App state to evaluate
     * @param charging - Whether device is currently charging
     * @returns Polling interval in milliseconds
     */
    const getPollingInterval = (state?: AppStateStatus, charging?: boolean): number => {
      const currentState = state ?? appState;
      const currentCharging = charging ?? isCharging;

      // Rule 1: App active → 10 seconds (user in our app, expects real-time)
      if (currentState === 'active') {
        return 10000;
      }

      // Rule 2: Charging → 10 seconds (power unlimited, prioritize UX)
      if (currentCharging) {
        return 10000;
      }

      // Rule 3: Background + not charging → 2 minutes (maximize battery)
      return 120000;
    };

    /**
     * Fetch metadata from the provided URL endpoint.
     *
     * Features:
     * - Aborts previous in-flight requests to prevent race conditions
     * - 5-second timeout to prevent hanging requests
     * - Supports multiple metadata formats:
     *   - JSON with nowPlaying field: {"nowPlaying": "SONG - ARTIST"}
     *   - Standard JSON: {"title": "...", "artist": "...", "song": "..."}
     *   - Plain text: "SONG - ARTIST"
     * - Graceful error handling (preserves previous metadata on failure)
     *
     * @async
     * @returns {Promise<void>} Updates nowPlaying state on success
     */
    const fetchMetadata = async () => {
      // Abort previous request if it exists (prevents race conditions)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        if (isMounted) {
          setIsLoading(true);
        }

        console.log('[useNowPlaying] Fetching metadata from:', metadataUrl);
        const response = await fetch(metadataUrl, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        console.log('[useNowPlaying] Response status:', response.status);

        // Add timeout for the response
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 5000); // 5 second timeout

        const text = await response.text();
        clearTimeout(timeoutId);

        console.log('[useNowPlaying] Received text:', text);

        /**
         * METADATA PARSING:
         * The endpoint can return metadata in multiple formats. We try to parse
         * each format in order of specificity to ensure maximum compatibility.
         *
         * Supported formats:
         * 1. TrendAnkara JSON: {"nowPlaying": "SONG - ARTIST"}
         * 2. Standard JSON: {"title": "...", "artist": "...", "song": "..."}
         * 3. Plain text: "SONG - ARTIST"
         * 4. Plain text (single field): "Title"
         */
        if (text && isMounted) {
          // Try to parse as JSON first (most structured format)
          try {
            const json = JSON.parse(text);
            console.log('[useNowPlaying] Parsed JSON:', json);

            // Format 1: TrendAnkara JSON format: {"nowPlaying":"SONG - ARTIST"}
            if (json.nowPlaying) {
              const nowPlayingText = json.nowPlaying;
              const parts = nowPlayingText.split(' - ');
              if (parts.length >= 2) {
                // Split format: "SONG - ARTIST"
                const newData = {
                  song: parts[0].trim(),
                  artist: parts[1].trim(),
                  title: nowPlayingText, // Keep full text for display
                };
                console.log('[useNowPlaying] Setting now playing (TrendAnkara format):', newData);
                setNowPlaying(newData);
              } else {
                // Single field: just a title
                const newData = {
                  title: nowPlayingText.trim(),
                  song: nowPlayingText.trim(),
                };
                console.log('[useNowPlaying] Setting now playing (single field):', newData);
                setNowPlaying(newData);
              }
            } else {
              // Format 2: Standard JSON format with separate fields
              const newData = {
                title: json.title || json.song,
                artist: json.artist,
                song: json.song || json.title,
              };
              console.log('[useNowPlaying] Setting now playing (standard format):', newData);
              setNowPlaying(newData);
            }
          } catch {
            // Format 3 & 4: Not JSON, parse as plain text
            console.log('[useNowPlaying] Not JSON, parsing as plain text');
            const parts = text.split(' - ');
            if (parts.length >= 2) {
              // Plain text with delimiter: "SONG - ARTIST"
              const newData = {
                song: parts[0].trim(),
                artist: parts.slice(1).join(' - ').trim(),
                title: text,
              };
              console.log('[useNowPlaying] Setting now playing (plain text):', newData);
              setNowPlaying(newData);
            } else {
              // Plain text, single field: just a title
              const newData = {
                title: text.trim(),
                song: text.trim(),
              };
              console.log('[useNowPlaying] Setting now playing (single text):', newData);
              setNowPlaying(newData);
            }
          }
        }
      } catch (error: any) {
        // Handle fetch errors (network issues, timeouts, etc.)
        if (error.name !== 'AbortError') {
          console.error('Error fetching now playing metadata:', error);
          if (isMounted) {
            setNowPlaying(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    /**
     * Start or restart metadata polling with smart interval based on context.
     *
     * This function is called:
     * 1. Initially when the hook mounts
     * 2. When app state changes (active ↔ background)
     * 3. When charging state changes
     *
     * Behavior:
     * - Clears any existing polling interval to prevent memory leaks
     * - Calculates new interval based on app state and charging status
     * - Starts new interval timer
     * - Stores current interval for remote event logic
     *
     * @param state - Optional app state to use
     * @param charging - Optional charging state to use
     * @returns {void}
     */
    const startPolling = (state?: AppStateStatus, charging?: boolean) => {
      // Clear existing interval if present
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const currentState = state ?? appState;
      const currentCharging = charging ?? isCharging;
      const interval = getPollingInterval(currentState, currentCharging);

      // Store current interval for remote event logic
      currentIntervalRef.current = interval;

      console.log(
        `[useNowPlaying] Starting polling with ${interval}ms interval ` +
        `(appState: ${currentState}, charging: ${currentCharging})`
      );

      intervalRef.current = setInterval(fetchMetadata, interval);
    };

    // Initial metadata fetch (happens immediately on mount)
    fetchMetadata();

    // Start polling with smart interval
    startPolling();

    /**
     * APP STATE LISTENER:
     * Monitor app state transitions to dynamically adjust polling frequency.
     *
     * State transitions:
     * - active → background: Reduce to 2min (if not charging)
     * - background → active: Increase to 10s + immediate fetch
     * - active → inactive: Notification center opened or system dialog → immediate fetch (if on 2min interval)
     * - inactive → active: Returning from notification center → immediate fetch (if on 2min interval)
     *
     * IMPORTANT: 'inactive' state is used as a heuristic for notification center opening.
     * This also fires for other system dialogs, but that's acceptable for UX.
     *
     * Wake-up optimization:
     * Immediate fetch when app becomes active provides fresh metadata.
     */
    const appStateSubscription = RNAppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const prevState = previousAppStateRef.current;
      console.log(`[useNowPlaying] App state transition: ${prevState} → ${nextAppState}`);

      // Update refs BEFORE state updates
      previousAppStateRef.current = nextAppState;
      setAppState(nextAppState);

      // Handle different state transitions
      if (nextAppState === 'active') {
        // Coming back to active from background or inactive
        if (prevState === 'background') {
          console.log('[useNowPlaying] App returned from background - fetching metadata immediately');
          fetchMetadata();
        } else if (prevState === 'inactive') {
          console.log('[useNowPlaying] App returned from inactive (notification center?) - fetching metadata immediately');
          fetchMetadata();
        } else {
          console.log('[useNowPlaying] App became active - fetching metadata immediately');
          fetchMetadata();
        }
      } else if (nextAppState === 'inactive') {
        // App went inactive - might be notification center opening
        // Only fetch if we're on slow interval (2min) - avoid duplicate fetches on fast interval
        if (currentIntervalRef.current === 120000) {
          console.log('[useNowPlaying] App became inactive (notification center?) - triggering fetch on 2min interval');
          fetchMetadata();
        } else {
          console.log('[useNowPlaying] App became inactive - skipping fetch (already on fast interval)');
        }
      }

      // Restart polling with new interval
      startPolling(nextAppState, undefined);
    });

    /**
     * BATTERY STATE LISTENER:
     * Monitor charging state changes to adjust polling frequency.
     *
     * When device starts/stops charging:
     * - Switch between 10s and 2min intervals based on charging + app state
     * - Prioritize UX when power is unlimited (charging)
     * - Maximize battery savings when on battery power
     */
    const batterySubscription = Battery.addBatteryStateListener((state) => {
      const charging = state.batteryState === Battery.BatteryState.CHARGING ||
                      state.batteryState === Battery.BatteryState.FULL;

      if (charging !== isCharging) {
        console.log(`[useNowPlaying] Charging state changed: ${isCharging} → ${charging}`);
        setIsCharging(charging);

        // Restart polling with new interval
        startPolling(undefined, charging);
      }
    });

    /**
     * REMOTE CONTROL EVENT LISTENERS:
     * Trigger immediate metadata fetch when user interacts with lock screen/notification controls.
     *
     * Events monitored:
     * - RemotePlay: User taps play button on lock screen/notification
     * - RemotePause: User taps pause button on lock screen/notification
     * - RemoteStop: User taps stop button (if available)
     *
     * IMPORTANT: These events only fire when user TAPS buttons, not when they just
     * open notification center. There's no way to detect notification center opening.
     *
     * Behavior:
     * - Only triggers immediate fetch when currently on 2-minute interval (power-saving mode)
     * - Does nothing when on 10-second interval (already getting frequent updates)
     * - Provides fresh metadata without waiting up to 2 minutes
     */
    const handleRemoteControlEvent = (eventName: string) => {
      console.log(`[useNowPlaying] Remote control event fired: ${eventName} (current interval: ${currentIntervalRef.current}ms)`);

      // Only fetch immediately if we're on the slow (2min) interval
      if (currentIntervalRef.current === 120000) {
        console.log('[useNowPlaying] On 2min interval - triggering immediate metadata fetch');
        fetchMetadata();
      } else {
        console.log('[useNowPlaying] On fast interval (10s) - skipping immediate fetch');
      }
    };

    console.log('[useNowPlaying] Registering remote control event listeners...');
    const remotePlayListener = TrackPlayer.addEventListener(Event.RemotePlay, () => handleRemoteControlEvent('RemotePlay'));
    const remotePauseListener = TrackPlayer.addEventListener(Event.RemotePause, () => handleRemoteControlEvent('RemotePause'));
    const remoteStopListener = TrackPlayer.addEventListener(Event.RemoteStop, () => handleRemoteControlEvent('RemoteStop'));
    console.log('[useNowPlaying] Remote control listeners registered successfully');

    /**
     * CLEANUP FUNCTION:
     * Properly clean up all resources to prevent memory leaks.
     *
     * Critical cleanup steps:
     * 1. Set isMounted flag to false
     * 2. Clear polling interval
     * 3. Abort in-flight HTTP requests
     * 4. Remove all event listeners (AppState, Battery, TrackPlayer)
     */
    return () => {
      isMounted = false;

      // Clear polling interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Abort pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Clean up all listeners
      appStateSubscription.remove();
      batterySubscription.remove();
      remotePlayListener.remove();
      remotePauseListener.remove();
      remoteStopListener.remove();
    };
  }, [metadataUrl]); // Re-run only when URL changes

  return { nowPlaying, isLoading };
};
