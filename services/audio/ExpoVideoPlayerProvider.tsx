import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useVideoPlayer, VideoPlayer } from 'expo-video';
import { Platform, AppState, AppStateStatus, Image } from 'react-native';
import { AudioConfig } from '@/constants/audio';

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
  const appStateRef = useRef(AppState.currentState);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve artwork URI from local asset
  const artworkUri = Image.resolveAssetSource(require('@/assets/images/Trendankara3.png'))?.uri;

  // Create video player with audio-only source and metadata
  const player = useVideoPlayer(
    {
      uri: AudioConfig.STREAM_URL,
      metadata: {
        title: 'TrendAnkara Radyo',
        artist: 'Canlı Yayın',
        ...(artworkUri ? { artwork: artworkUri } : {}),
      },
    },
    (p) => {
      p.staysActiveInBackground = true;
      p.showNowPlayingNotification = true; // Enables native media controls
      p.volume = 1.0;

      if (Platform.OS === 'ios') {
        p.allowsExternalPlayback = false;
      }
    }
  );

  // Initialize component
  useEffect(() => {
    // expo-video handles audio session configuration internally
    // when staysActiveInBackground and showNowPlayingNotification are set
    setIsInitialized(true);
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

    // Start monitoring
    statusCheckIntervalRef.current = setInterval(checkStatus, 500);

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
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
      setStatus(prev => ({ ...prev, state: 'loading', isPlaying: false }));

      // Update source with metadata including artwork
      const source = {
        uri: AudioConfig.STREAM_URL,
        metadata: {
          title: 'TrendAnkara Radyo',
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
  }, [player, artworkUri]);

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
      player.pause();

      // Reset to initial source with metadata
      const source = {
        uri: AudioConfig.STREAM_URL,
        metadata: {
          title: 'TrendAnkara Radyo',
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
  }, [player, artworkUri]);

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