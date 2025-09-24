import { useCallback } from 'react';
import { useExpoVideoPlayer } from '@/services/audio/ExpoVideoPlayerProvider';

/**
 * Hook for audio playback with native media controls using expo-video
 * This provides lock screen controls and notification controls
 */
export function useAudioWithNativeControls() {
  const { play, pause, stop, status, isPlaying } = useExpoVideoPlayer();

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  return {
    status,
    play,
    pause,
    stop,
    togglePlayPause,
    isPlaying,
    state: status.state,
    error: status.error,
  };
}