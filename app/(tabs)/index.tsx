import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Alert, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AnimatedLogoContainer } from '@/components/player/AnimatedLogoContainer';
import { AnimationErrorBoundary } from '@/components/player/AnimationErrorBoundary';
import RadioPlayerControls from '@/components/radio/RadioPlayerControls';
import { PlayerContactSection } from '@/components/social/PlayerContactSection';
import { useSettings, useMaintenanceMode } from '@/hooks/useSettings';
import { radioApi } from '@/services/api/radio';
import { useAppSelector } from '@/store/hooks';
import { trackPlayerService } from '@/services/audio';
import { store } from '@/store';
import TrackPlayer, { Capability } from 'react-native-track-player';

export default function RadioScreen() {
  const { loading: settingsLoading } = useSettings();
  const { isMaintenanceMode } = useMaintenanceMode();
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [radioConfig, setRadioConfig] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get themed background color
  const backgroundColor = useThemeColor({}, 'background');

  // Autoplay settings from Redux
  const autoPlayOnStart = useAppSelector((state) => state.settings.userPreferences.autoPlayOnStart);
  const backgroundPlayEnabled = useAppSelector((state) => state.settings.userPreferences.backgroundPlayEnabled);

  // Autoplay state management
  const hasAttemptedAutoplay = useRef(false);

  // Fetch radio configuration from API
  useEffect(() => {
    const loadRadioConfig = async () => {
      try {
        const config = await radioApi.getRadioConfig();
        setStreamUrl(config.stream_url);
        setRadioConfig(config);
      } catch (error) {
        console.error('Failed to load radio config:', error);
        // Fallback to a default stream if API fails
        setStreamUrl('https://radyo.yayin.com.tr:5132/stream');
      }
    };
    loadRadioConfig();
  }, []);

  // Autoplay on launch
  useEffect(() => {
    // Only attempt autoplay once
    if (hasAttemptedAutoplay.current) {
      return;
    }

    // Don't autoplay if setting is disabled
    if (!autoPlayOnStart) {
      return;
    }

    // Don't autoplay if in maintenance mode
    if (isMaintenanceMode) {
      return;
    }

    // Don't autoplay if settings are still loading
    if (settingsLoading) {
      return;
    }

    // Don't autoplay if stream URL is not ready
    if (!streamUrl) {
      return;
    }

    const attemptAutoplay = async () => {
      try {
        // Mark that we've attempted autoplay
        hasAttemptedAutoplay.current = true;

        // Get current app state
        const currentAppState = AppState.currentState;

        // AC 4.6: If app is launched in background
        if (currentAppState === 'background' || currentAppState === 'inactive') {
          // Only autoplay if background play is enabled
          if (!backgroundPlayEnabled) {
            return;
          }
        }

        // Initialize TrackPlayer if needed
        await trackPlayerService.initialize();

        // Load stream
        await trackPlayerService.loadStream(streamUrl, radioConfig);

        // AC 4.2: Start playback within 3 seconds
        await trackPlayerService.play();
      } catch (error) {
        console.error('[RadioScreen] Autoplay failed:', error);

        // AC 4.4: Show error message for network issues
        // AC 4.7: Show permission request dialog for audio permissions
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
        const isPermissionError = errorMessage.toLowerCase().includes('permission');
        const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                               errorMessage.toLowerCase().includes('connection');

        if (isPermissionError) {
          // AC 4.7: Audio permission error
          Alert.alert(
            'Ses İzni Gerekli',
            'Otomatik oynatma için ses izni gereklidir. Lütfen ayarlardan izin veriniz.',
            [{ text: 'Tamam' }]
          );
        } else if (isNetworkError) {
          // AC 4.4: Network error - do not retry automatically
          Alert.alert(
            'Bağlantı Hatası',
            'Otomatik oynatma başlatılamadı. Lütfen internet bağlantınızı kontrol ediniz.',
            [{ text: 'Tamam' }]
          );
        } else {
          // Generic error
          Alert.alert(
            'Oynatma Hatası',
            'Otomatik oynatma başlatılamadı. Lütfen manuel olarak başlatmayı deneyiniz.',
            [{ text: 'Tamam' }]
          );
        }
      }
    };

    // Delay autoplay slightly to allow UI to settle
    const timer = setTimeout(() => {
      attemptAutoplay();
    }, 500);

    return () => clearTimeout(timer);
  }, [autoPlayOnStart, backgroundPlayEnabled, isMaintenanceMode, settingsLoading, streamUrl, radioConfig]);

  // Subscribe to background play setting changes to update notification capabilities
  useEffect(() => {
    const updateNotificationCapabilities = async () => {
      try {
        // Update notification capabilities based on background play setting
        // AC 3.6/3.7: Control notification controls based on background play setting
        await TrackPlayer.updateOptions({
          capabilities: [Capability.Play, Capability.Pause],
          compactCapabilities: [Capability.Play, Capability.Pause],
          notificationCapabilities: backgroundPlayEnabled
            ? [Capability.Play, Capability.Pause]
            : [],
        });
      } catch (error) {
        console.error('[RadioScreen] Failed to update notification capabilities:', error);
      }
    };

    // Update capabilities when background play setting changes
    updateNotificationCapabilities();
  }, [backgroundPlayEnabled]);

  // Handle app state changes for background playback control
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // AC 3.3: When toggle is OFF AND audio is playing AND user minimizes app, pause audio
      // Read current setting from store to avoid stale closure values
      const currentBackgroundPlayEnabled = store.getState().settings.userPreferences.backgroundPlayEnabled;

      if (nextAppState === 'background' && !currentBackgroundPlayEnabled) {
        try {
          const state = await TrackPlayer.getPlaybackState();
          if (state.state === 'playing') {
            await trackPlayerService.pause();
            console.log('[RadioScreen] Paused playback due to background play disabled');
          }
        } catch (error) {
          console.error('[RadioScreen] Failed to pause on background:', error);
        }
      }
      // Note: We don't auto-resume when coming back to foreground - user controls play/pause
    });

    return () => {
      subscription.remove();
    };
  }, []); // Empty deps - subscription reads from store directly

  useEffect(() => {
    // Check if app is in maintenance mode
    if (isMaintenanceMode && !settingsLoading) {
      Alert.alert(
        'Bakım Modu',
        'Uygulama şu anda bakım modundadır. Lütfen daha sonra tekrar deneyiniz.',
        [{ text: 'Tamam' }]
      );
    }
  }, [isMaintenanceMode, settingsLoading]);

  const handlePlayerError = (error: Error) => {
    console.error('Player error:', error);
    Alert.alert(
      'Oynatıcı Hatası',
      'Yayın oynatılırken bir hata oluştu. Lütfen tekrar deneyiniz.',
      [{ text: 'Tamam' }]
    );
  };

  // Build metadata URL by replacing /stream with /currentsong or adding /currentsong
  // Examples:
  //   https://radyo.yayin.com.tr:5132/stream -> https://radyo.yayin.com.tr:5132/currentsong
  //   https://radyo.yayin.com.tr:5132/ -> https://radyo.yayin.com.tr:5132/currentsong
  const metadataUrl = streamUrl
    ? (streamUrl.includes('/stream')
        ? streamUrl.replace(/\/stream\/?$/, '/currentsong')
        : streamUrl.replace(/\/?$/, '/currentsong'))
    : undefined;

  if (settingsLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.container}>
          <ThemedText>Yükleniyor...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        {/* Logo Section */}
        <AnimationErrorBoundary>
          <AnimatedLogoContainer
            isPlaying={isPlaying}
            logoSize={240}
            style={styles.logoContainer}
          />
        </AnimationErrorBoundary>

        {/* Player Controls */}
        {streamUrl ? (
          <RadioPlayerControls
            streamUrl={streamUrl}
            metadataUrl={metadataUrl}
            onError={handlePlayerError}
            onStateChange={(state) => setIsPlaying(state === 'playing')}
            style={styles.playerControls}
          />
        ) : (
          <ThemedText style={styles.loadingText}>Yayın yükleniyor...</ThemedText>
        )}

        {/* Social Media Links */}
        <PlayerContactSection style={styles.socialSection} />

        {/* Maintenance Mode Banner */}
        {isMaintenanceMode && (
          <View style={styles.maintenanceBanner}>
            <ThemedText style={styles.maintenanceText}>
              Bakım Modu Aktif
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerControls: {
    marginVertical: 15,
    width: '100%',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  socialSection: {
    marginTop: 20,
  },
  maintenanceBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  maintenanceText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});