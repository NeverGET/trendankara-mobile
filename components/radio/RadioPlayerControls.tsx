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
import { trackPlayerService } from '@/services/audio';
import { FEATURES } from '@/constants/config';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import type { PlayerStateType } from '@/types/models';


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

  // Select audio service based on feature flag
  const audioService = FEATURES.USE_TRACK_PLAYER ? trackPlayerService : videoPlayerService;

  // Get now playing info
  const { nowPlaying } = useNowPlaying(metadataUrl);

  // Update now playing metadata when it changes
  useEffect(() => {
    console.log('[RadioPlayerControls] metadataUrl:', metadataUrl);
    console.log('[RadioPlayerControls] nowPlaying updated:', nowPlaying);

    // Only update if player is active (not stopped or error)
    if (playerState === 'playing' || playerState === 'paused' || playerState === 'buffering') {
      if (FEATURES.USE_TRACK_PLAYER) {
        // TrackPlayerService: Updates metadata WITHOUT interrupting playback
        trackPlayerService.updateNowPlayingInfo(nowPlaying);
      } else if (FEATURES.USE_VIDEO_PLAYER_ONLY) {
        // VideoPlayerService: Static metadata only (no dynamic updates)
        videoPlayerService.updateNowPlayingInfo({
          title: 'Trend Ankara',
          artist: 'Canlı Yayın',
          song: 'Trend Ankara'
        });
      }
    }
  }, [nowPlaying, playerState]);

  // Notify parent component when player state changes
  useEffect(() => {
    onStateChange?.(playerState);
  }, [playerState, onStateChange]);

  // Get display text for now playing
  const getNowPlayingText = () => {
    const text = nowPlaying?.song || nowPlaying?.title || 'Now Playing info goes here';
    console.log('[RadioPlayerControls] getNowPlayingText returning:', text);
    return text;
  };

  useEffect(() => {
    // Initialize audio on mount
    initializeAudio();

    return () => {
      // Cleanup on unmount - just stop, don't cleanup the singleton
      audioService.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAudio = async () => {
    try {
      setIsInitializing(true);

      // Initialize the selected audio service
      await audioService.initialize();

      // Subscribe to state changes
      audioService.addStateListener((state) => {
        setPlayerState(state);
      });

      // Subscribe to errors
      audioService.addErrorListener((error) => {
        console.error('Player error:', error);
        onError?.(error);
      });

      setIsInitializing(false);

      const serviceName = FEATURES.USE_TRACK_PLAYER ? 'TrackPlayerService' : 'VideoPlayerService';
      console.log(`[RadioPlayerControls] ${serviceName} initialized with background playback`);
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

      // Get the actual current state from the player service
      const actualPlayerState = audioService.getState();

      if (actualPlayerState === 'stopped' || actualPlayerState === 'error') {
        // Load and play stream
        setPlayerState('buffering');
        await audioService.loadStream(streamUrl);
        await audioService.play();
        console.log('[RadioPlayerControls] Stream loaded and playing');
      } else if (actualPlayerState === 'playing') {
        // Pause the stream - state will update via listener
        await audioService.pause();
      } else if (actualPlayerState === 'paused' || actualPlayerState === 'buffering') {
        // Resume playback - state will update via listener
        await audioService.play();
      }
    } catch (error) {
      console.error('Failed to toggle playback:', error);
      setPlayerState('error');
      onError?.(error as Error);
    }
  };

  const handleStop = async () => {
    try {
      await audioService.stop();
      setPlayerState('stopped');
    } catch (error) {
      console.error('Failed to stop playback:', error);
      onError?.(error as Error);
    }
  };


  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await audioService.setVolume(newMuted ? 0 : volume);
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
      {/* Debug Mode Indicator - Only shown in development */}
      {__DEV__ && (
        <View style={[styles.debugBadge, isDark && styles.debugBadgeDark]}>
          <Text style={[styles.debugText, isDark && styles.debugTextDark]}>
            {FEATURES.USE_TRACK_PLAYER ? '🎵 TrackPlayer' : '📹 VideoPlayer'}
          </Text>
        </View>
      )}

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
        <View style={styles.nowPlayingTextContainer}>
          {nowPlaying?.song || nowPlaying?.title ? (
            <>
              <Text style={[
                styles.nowPlayingSong,
                isDark && styles.nowPlayingTextDark,
                playerState === 'playing' && styles.nowPlayingTextActive
              ]} numberOfLines={1}>
                {nowPlaying.song || nowPlaying.title}
              </Text>
              {nowPlaying.artist && (
                <Text style={[
                  styles.nowPlayingArtist,
                  isDark && styles.nowPlayingArtistDark,
                  playerState === 'playing' && styles.nowPlayingArtistActive
                ]} numberOfLines={1}>
                  {nowPlaying.artist}
                </Text>
              )}
            </>
          ) : (
            <Text style={[
              styles.nowPlayingText,
              isDark && styles.nowPlayingTextDark,
              playerState === 'playing' && styles.nowPlayingTextActive
            ]}>
              Now Playing info goes here
            </Text>
          )}
        </View>
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
  debugBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugBadgeDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  debugText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  debugTextDark: {
    color: '#9CA3AF',
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
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#D9D9D9',  // Neutral light gray for light mode
    maxWidth: '100%',
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
    marginRight: 12,
    flexShrink: 0,
  },
  nowPlayingIndicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  nowPlayingTextContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
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
  nowPlayingSong: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  nowPlayingArtist: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.2,
  },
  nowPlayingArtistDark: {
    color: '#CCCCCC',
  },
  nowPlayingArtistActive: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

export default RadioPlayerControls;