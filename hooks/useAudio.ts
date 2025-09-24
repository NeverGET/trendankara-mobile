import { useEffect, useState, useCallback } from 'react';
import WorkingAudioService, { AudioStatus } from '@/services/audio/WorkingAudioService';

export function useAudio() {
  const [status, setStatus] = useState<AudioStatus>({
    state: 'idle',
    isPlaying: false,
  });

  const audioService = WorkingAudioService.getInstance();

  useEffect(() => {
    // Add listener for status updates
    const handleStatusUpdate = (newStatus: AudioStatus) => {
      setStatus(newStatus);
    };

    audioService.addListener(handleStatusUpdate);

    return () => {
      audioService.removeListener(handleStatusUpdate);
    };
  }, [audioService]);

  const play = useCallback(async () => {
    try {
      await audioService.play();
    } catch (error) {
      console.error('Play failed:', error);
    }
  }, [audioService]);

  const pause = useCallback(async () => {
    try {
      await audioService.pause();
    } catch (error) {
      console.error('Pause failed:', error);
    }
  }, [audioService]);

  const stop = useCallback(async () => {
    try {
      await audioService.stop();
    } catch (error) {
      console.error('Stop failed:', error);
    }
  }, [audioService]);

  const togglePlayPause = useCallback(async () => {
    if (status.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [status.isPlaying, play, pause]);

  return {
    status,
    play,
    pause,
    stop,
    togglePlayPause,
    isPlaying: status.isPlaying,
    state: status.state,
    error: status.error,
  };
}