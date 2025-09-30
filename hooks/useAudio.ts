import { useExpoVideoPlayer } from '@/services/audio/ExpoVideoPlayerProvider';

/**
 * Audio hook that uses the ExpoVideoPlayer context
 * Provides a simpler interface for audio playback control
 */
export function useAudio() {
  const {
    play,
    pause,
    stop,
    status,
    isPlaying
  } = useExpoVideoPlayer();

  const togglePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

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