import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useVideoPlayer, VideoPlayer } from 'expo-video';
import { Platform, AppState, AppStateStatus, Image } from 'react-native';
import { AudioConfig } from '@/constants/audio';
import { radioApi } from '@/services/api/radio';

export type AudioState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'buffering'
  | 'error';

export interface AudioStatus {
  state: AudioState;
  isPlaying: boolean;
  duration?: number;
  position?: number;
  error?: string;
}

interface ExpoVideoPlayerContextType {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  status: AudioStatus;
  isPlaying: boolean;
}

const ExpoVideoPlayerContext = createContext<ExpoVideoPlayerContextType | null>(null);

/**
 * Provider component that manages expo-video player for audio streaming with native controls
 */
export const ExpoVideoPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AudioStatus>({
    state: 'idle',
    isPlaying: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [stationName, setStationName] = useState('TrendAnkara Radyo');
  const appStateRef = useRef(AppState.currentState);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve artwork URI from local asset
  const artworkUri = Image.resolveAssetSource(require('@/assets/images/Trendankara3.png'))?.uri;

  // Create video player with audio-only source and metadata
  const player = useVideoPlayer(
    streamUrl ? {
      uri: streamUrl,
      metadata: {
        title: stationName,
        artist: 'Canlı Yayın',
        ...(artworkUri ? { artwork: artworkUri } : {}),
      },
    } : null,
    (p) => {
      if (p) {
        p.staysActiveInBackground = true;
        p.showNowPlayingNotification = true; // Enables native media controls
        p.volume = 1.0;

        if (Platform.OS === 'ios') {
          p.allowsExternalPlayback = false;
        }
      }
    }
  );

  // Initialize component and fetch radio configuration
  useEffect(() => {
    const initializeRadio = async () => {
      try {
        // Fetch radio configuration from API
        const radioConfig = await radioApi.getRadioConfig();

        console.log('Fetched radio config:', radioConfig);

        // Update stream URL and station name from API
        setStreamUrl(radioConfig.stream_url);
        if (radioConfig.station_name) {
          setStationName(radioConfig.station_name);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to fetch radio config:', error);
        // Use fallback URL if API fails
        setStreamUrl(AudioConfig.STREAM_URL);
        setIsInitialized(true);
      }
    };

    initializeRadio();
  }, []);

  // Monitor player status
  useEffect(() => {
    const checkStatus = () => {
      if (!player) return;

      const isPlaying = player.playing;
      const currentTime = player.currentTime;
      const duration = player.duration;

      let newState: AudioState = 'idle';

      if (isPlaying) {
        newState = 'playing';
      } else if (currentTime > 0) {
        newState = 'paused';
      } else if (status.state === 'loading') {
        newState = 'buffering';
      }

      setStatus(prev => {
        if (prev.state !== newState || prev.isPlaying !== isPlaying) {
          return {
            state: newState,
            isPlaying,
            position: currentTime * 1000,
            duration: duration * 1000,
          };
        }
        return prev;
      });
    };

    // Start monitoring with longer interval to reduce CPU/memory usage
    // Only check every 2 seconds when playing, stop when not playing
    if (status.state === 'playing') {
      statusCheckIntervalRef.current = setInterval(checkStatus, 2000);
    }

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [player, status.state]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const play = useCallback(async () => {
    try {
      if (!streamUrl) {
        console.warn('Stream URL not loaded yet');
        return;
      }

      setStatus(prev => ({ ...prev, state: 'loading', isPlaying: false }));

      // Update source with metadata including artwork
      const source = {
        uri: streamUrl,
        metadata: {
          title: stationName,
          artist: 'Canlı Yayın',
          ...(artworkUri ? { artwork: artworkUri } : {}),
        },
      };

      // Replace source
      player.replace(source);

      // Start playback
      player.play();
    } catch (error) {
      console.error('Play failed:', error);
      setStatus({
        state: 'error',
        isPlaying: false,
        error: error instanceof Error ? error.message : 'Playback failed',
      });
      throw error;
    }
  }, [player, artworkUri, streamUrl, stationName]);

  const pause = useCallback(async () => {
    try {
      player.pause();
      setStatus(prev => ({ ...prev, state: 'paused', isPlaying: false }));
    } catch (error) {
      console.error('Pause failed:', error);
      throw error;
    }
  }, [player]);

  const stop = useCallback(async () => {
    try {
      if (!streamUrl) {
        console.warn('Stream URL not loaded yet');
        return;
      }

      player.pause();

      // Reset to initial source with metadata
      const source = {
        uri: streamUrl,
        metadata: {
          title: stationName,
          artist: 'Canlı Yayın',
          ...(artworkUri ? { artwork: artworkUri } : {}),
        },
      };

      player.replace(source);

      setStatus({ state: 'stopped', isPlaying: false });
    } catch (error) {
      console.error('Stop failed:', error);
      throw error;
    }
  }, [player, artworkUri, streamUrl, stationName]);

  const contextValue: ExpoVideoPlayerContextType = {
    play,
    pause,
    stop,
    status,
    isPlaying: status.isPlaying,
  };

  return (
    <ExpoVideoPlayerContext.Provider value={contextValue}>
      {children}
    </ExpoVideoPlayerContext.Provider>
  );
};

/**
 * Hook to use the expo video player context
 */
export const useExpoVideoPlayer = () => {
  const context = useContext(ExpoVideoPlayerContext);
  if (!context) {
    throw new Error('useExpoVideoPlayer must be used within ExpoVideoPlayerProvider');
  }
  return context;
};