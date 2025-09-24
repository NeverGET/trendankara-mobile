import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Strings } from '@/constants/strings';
import { useAudioWithNativeControls } from '@/hooks/useAudioWithNativeControls';
import { AnimatedLogoContainer } from '@/components/player/AnimatedLogoContainer';
import { AnimationErrorBoundary } from '@/components/player/AnimationErrorBoundary';

export default function RadioScreen() {
  const { play, pause, stop, isPlaying, state, error } = useAudioWithNativeControls();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <AnimationErrorBoundary>
        <AnimatedLogoContainer
          isPlaying={isPlaying}
          style={styles.logoContainer}
        />
      </AnimationErrorBoundary>

      <View style={styles.playerContainer}>
        <TouchableOpacity
          onPress={handlePlayPause}
          style={styles.playButton}
          disabled={state === 'loading'}
        >
          {state === 'loading' ? (
            <ActivityIndicator size="large" color="#DC2626" />
          ) : (
            <IconSymbol
              name={isPlaying ? 'pause.circle.fill' : 'play.circle.fill'}
              size={80}
              color="#DC2626"
            />
          )}
        </TouchableOpacity>

        {state === 'buffering' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#DC2626" />
            <ThemedText style={styles.statusText}>Yükleniyor...</ThemedText>
          </View>
        )}

        {state === 'error' && error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        {isPlaying && (
          <ThemedText style={styles.statusText}>Şu anda çalıyor</ThemedText>
        )}

        {false && (
          <View style={styles.backgroundModeContainer}>
            <IconSymbol
              name="circle.fill"
              size={8}
              color="#10B981"
              style={styles.backgroundModeIcon}
            />
            <ThemedText style={styles.backgroundModeText}>
              {Strings.player.backgroundMode}
            </ThemedText>
          </View>
        )}

        {false && (
          <View style={styles.audioFocusContainer}>
            <IconSymbol
              name="exclamationmark.triangle.fill"
              size={16}
              color="#F59E0B"
              style={styles.audioFocusIcon}
            />
            <ThemedText style={styles.audioFocusText}>
              {Strings.player.audioFocusLost}
            </ThemedText>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={stop}
        style={styles.stopButton}
        disabled={state === 'idle' || state === 'stopped'}
      >
        <ThemedText style={styles.stopButtonText}>Durdur</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  playerContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  playButton: {
    marginVertical: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  statusText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#666',
  },
  errorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  stopButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    marginTop: 20,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backgroundModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  backgroundModeIcon: {
    marginRight: 6,
  },
  backgroundModeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  audioFocusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  audioFocusIcon: {
    marginRight: 6,
  },
  audioFocusText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
});