import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AnimatedLogoContainer } from '@/components/player/AnimatedLogoContainer';
import { AnimationErrorBoundary } from '@/components/player/AnimationErrorBoundary';
import RadioPlayerControls from '@/components/radio/RadioPlayerControls';
import SocialMediaButtons from '@/components/social/SocialMediaButtons';
import { useSettings, useMaintenanceMode } from '@/hooks/useSettings';
import { radioApi } from '@/services/api/radio';

export default function RadioScreen() {
  const { playerLogo, loading: settingsLoading } = useSettings();
  const { isMaintenanceMode } = useMaintenanceMode();
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [radioConfig, setRadioConfig] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch radio configuration from API
  useEffect(() => {
    const loadRadioConfig = async () => {
      try {
        const config = await radioApi.getRadioConfig();
        console.log('Radio config loaded:', config);
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
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.container}>
          <ThemedText>Yükleniyor...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
        {/* Logo Section */}
        <AnimationErrorBoundary>
          {playerLogo ? (
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: playerLogo }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <AnimatedLogoContainer
              isPlaying={isPlaying}
              style={styles.logoContainer}
            />
          )}
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
        <View style={styles.socialSection}>
          <ThemedText style={styles.sectionTitle}>Bizi Takip Edin</ThemedText>
          <SocialMediaButtons style={styles.socialButtons} />
        </View>


        {/* Maintenance Mode Banner */}
        {isMaintenanceMode && (
          <View style={styles.maintenanceBanner}>
            <ThemedText style={styles.maintenanceText}>
              Bakım Modu Aktif
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
    width: 324,  // 180% of 180 = 324
    height: 182,  // 16:9 aspect ratio (324 / 16 * 9 = 182.25)
    overflow: 'visible',  // Allow spotlight effects to show outside bounds
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',  // Preserve aspect ratio
  },
  playerControls: {
    marginVertical: 30,
    width: '100%',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  socialSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  socialButtons: {
    marginTop: 10,
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