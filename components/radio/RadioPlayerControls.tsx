import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import videoPlayerService from '@/services/audio/VideoPlayerService';
import { FEATURES } from '@/constants/config';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import type { PlayerStateType } from '@/types/models';

// Fallback audio service imports (commented for now, available for rollback)
// import { Audio } from 'expo-av';
// import { AudioService } from '@/services/audio/AudioService';

interface RadioPlayerControlsProps {
  streamUrl: string;
  metadataUrl?: string;
  onError?: (error: Error) => void;
  onStateChange?: (state: PlayerStateType) => void;
  style?: any;
  compact?: boolean;
}

export const RadioPlayerControls: React.FC<RadioPlayerControlsProps> = ({
  streamUrl,
  metadataUrl,
  onError,
  onStateChange,
  style,
  compact = false,
}) => {
  const [playerState, setPlayerState] = useState<PlayerStateType>('stopped');
  const [isInitializing, setIsInitializing] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get now playing info
  const { nowPlaying } = useNowPlaying(metadataUrl);

  // Notify parent component when player state changes
  useEffect(() => {
    onStateChange?.(playerState);
  }, [playerState, onStateChange]);

  // Get display text for now playing
  const getNowPlayingText = () => {
    if (nowPlaying?.song || nowPlaying?.title) {
      return nowPlaying.song || nowPlaying.title;
    }
    return 'Now Playing info goes here';
  };

  useEffect(() => {
    // Initialize audio on mount
    initializeAudio();

    return () => {
      // Cleanup on unmount - just stop, don't cleanup the singleton
      videoPlayerService.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAudio = async () => {
    try {
      setIsInitializing(true);

      if (FEATURES.USE_VIDEO_PLAYER_ONLY) {
        // Use VideoPlayerService singleton
        await videoPlayerService.initialize();

        // Subscribe to state changes
        videoPlayerService.addStateListener((state) => {
          setPlayerState(state);
        });

        // Subscribe to errors
        videoPlayerService.addErrorListener((error) => {
          console.error('Player error:', error);
          onError?.(error);
        });

        setIsInitializing(false);
        console.log('VideoPlayerService initialized with background playback support');
      } else {
        // Fallback to dual system (expo-av + custom service)
        // This code path is available for rollback if needed
        console.log('Feature flag disabled: falling back to dual audio system');
        console.warn('Dual audio system fallback not fully implemented - requires expo-av setup');
        setIsInitializing(false);
        // TODO: Implement fallback audio service initialization
        // await initializeFallbackAudio();
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setIsInitializing(false);
      onError?.(error as Error);
    }
  };

  const handlePlayPause = async () => {
    try {
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (FEATURES.USE_VIDEO_PLAYER_ONLY) {
        // Use VideoPlayerService singleton
        // Get the actual current state from the player service
        const actualPlayerState = videoPlayerService.getState();

        if (actualPlayerState === 'stopped' || actualPlayerState === 'error') {
          // Load and play stream
          setPlayerState('buffering');
          await videoPlayerService.loadStream(streamUrl);
          await videoPlayerService.play();
          console.log('Stream loaded and playing');
        } else if (actualPlayerState === 'playing') {
          // Pause the stream - state will update via listener
          await videoPlayerService.pause();
        } else if (actualPlayerState === 'paused' || actualPlayerState === 'buffering') {
          // Resume playback - state will update via listener
          await videoPlayerService.play();
        }
      } else {
        // Fallback to dual system handling
        console.log('Using fallback audio system for playback');
        console.warn('Fallback audio system not fully implemented');
        // TODO: Implement fallback audio playback logic
        // await handleFallbackPlayPause();
      }
    } catch (error) {
      console.error('Failed to toggle playback:', error);
      setPlayerState('error');
      onError?.(error as Error);
    }
  };

  const handleStop = async () => {
    try {
      if (FEATURES.USE_VIDEO_PLAYER_ONLY) {
        await videoPlayerService.stop();
        setPlayerState('stopped');
      } else {
        // Fallback to dual system handling
        console.log('Using fallback audio system for stop');
        console.warn('Fallback audio system not fully implemented');
        setPlayerState('stopped');
        // TODO: Implement fallback audio stop logic
        // await handleFallbackStop();
      }
    } catch (error) {
      console.error('Failed to stop playback:', error);
      onError?.(error as Error);
    }
  };


  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (FEATURES.USE_VIDEO_PLAYER_ONLY) {
      await videoPlayerService.setVolume(newMuted ? 0 : volume);
    } else {
      // Fallback mute toggle
      console.log('Using fallback audio system for mute toggle');
      // TODO: Implement fallback audio mute toggle
      // await handleFallbackMuteToggle(newMuted);
    }
  };

  const getPlayPauseIcon = () => {
    switch (playerState) {
      case 'playing':
        return 'pause';
      case 'buffering':
        return 'hourglass';
      default:
        return 'play';
    }
  };

  const getStateText = () => {
    switch (playerState) {
      case 'playing':
        return 'CANLI YAYIN';
      case 'paused':
        return 'DURAKLATILDI';
      case 'buffering':
        return 'YÜKLENİYOR...';
      case 'error':
        return 'BAĞLANTI HATASI';
      default:
        return 'BAŞLAT';
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={handlePlayPause}
          disabled={isInitializing}
        >
          {isInitializing || playerState === 'buffering' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={getPlayPauseIcon()} size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* State Display */}
      <View style={[
        styles.stateContainer,
        isDark && styles.stateContainerDark,
        playerState === 'playing' && styles.stateContainerActive
      ]}>
        <View style={[styles.stateIndicator, playerState === 'playing' && styles.stateActive]} />
        <Text style={[
          styles.stateText,
          isDark && styles.stateTextDark,
          playerState === 'playing' && styles.stateTextActive
        ]}>
          {getStateText()}
        </Text>
      </View>

      {/* Main Control Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            playerState === 'playing' && styles.mainButtonActive,
            playerState === 'error' && styles.mainButtonError,
          ]}
          onPress={handlePlayPause}
          disabled={isInitializing}
        >
          {isInitializing || playerState === 'buffering' ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Ionicons name={getPlayPauseIcon()} size={48} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={handleStop}>
          <Ionicons name="stop" size={20} color={isDark ? '#E6E6E6' : '#666666'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={toggleMute}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color={isDark ? '#E6E6E6' : '#666666'} />
        </TouchableOpacity>
      </View>

      {/* Now Playing Info */}
      <View style={[
        styles.nowPlayingContainer,
        isDark && styles.nowPlayingContainerDark,
        playerState === 'playing' && styles.nowPlayingContainerActive
      ]}>
        <View style={[styles.nowPlayingIndicator, playerState === 'playing' && styles.nowPlayingIndicatorActive]} />
        <Text style={[
          styles.nowPlayingText,
          isDark && styles.nowPlayingTextDark,
          playerState === 'playing' && styles.nowPlayingTextActive
        ]}>
          {getNowPlayingText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#D9D9D9',  // Neutral light gray for light mode
  },
  stateContainerDark: {
    backgroundColor: '#404040',  // Neutral dark gray for dark mode
  },
  stateContainerActive: {
    backgroundColor: '#EF4444',  // Pale red background when playing (same for both modes)
  },
  stateIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999999',  // Neutral medium gray
    marginRight: 8,
  },
  stateActive: {
    backgroundColor: '#FFFFFF',  // White indicator when playing
  },
  stateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 0.5,
  },
  stateTextDark: {
    color: '#E6E6E6',  // Neutral light gray text for dark mode
  },
  stateTextActive: {
    color: '#FFFFFF',  // White text when playing (same for both modes)
  },
  mainButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  mainButtonActive: {
    backgroundColor: '#DC2626',
  },
  mainButtonError: {
    backgroundColor: '#EF4444',
  },
  secondaryControls: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D9D9D9',  // Neutral light gray for light mode
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonDark: {
    backgroundColor: '#404040',  // Neutral dark gray for dark mode
  },
  nowPlayingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#D9D9D9',  // Neutral light gray for light mode
  },
  nowPlayingContainerDark: {
    backgroundColor: '#404040',  // Neutral dark gray for dark mode
  },
  nowPlayingContainerActive: {
    backgroundColor: '#DC2626',  // Red when playing (same for both modes)
  },
  nowPlayingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999999',  // Neutral medium gray
    marginRight: 8,
  },
  nowPlayingIndicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  nowPlayingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nowPlayingTextDark: {
    color: '#E6E6E6',  // Neutral light gray text for dark mode
  },
  nowPlayingTextActive: {
    color: '#FFFFFF',  // White when playing (same for both modes)
  },
});

export default RadioPlayerControls;