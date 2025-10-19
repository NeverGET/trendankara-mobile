import React from 'react';
import { View, Linking, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ContactButton } from './ContactButton';
import { extractInstagramUsername, openWithDeepLink } from './helpers';

/**
 * Props for SocialMediaSection component
 */
export interface SocialMediaSectionProps {
  /** Instagram profile URL */
  instagramUrl: string | null;
  /** Facebook page URL */
  facebookUrl: string | null;
  /** Optional additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * SocialMediaSection - Displays Sosyal Medya section with Instagram and Facebook buttons
 *
 * This section provides links to follow the station on social media platforms.
 * Shows Instagram and/or Facebook buttons based on available configuration.
 * Uses deep links to open native apps when available, falling back to web URLs.
 *
 * @example
 * <SocialMediaSection
 *   instagramUrl="https://instagram.com/trendankara"
 *   facebookUrl="https://facebook.com/trendankara"
 * />
 */
export const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({
  instagramUrl,
  facebookUrl,
  style,
}) => {
  // Hide section if no social media data available
  if (!instagramUrl && !facebookUrl) return null;

  /**
   * Handles Instagram button press - opens Instagram app or web profile
   */
  const handleInstagram = async () => {
    if (!instagramUrl) return;

    try {
      const username = extractInstagramUsername(instagramUrl);
      const appUrl = `instagram://user?username=${username}`;
      const webUrl = `https://instagram.com/${username}`;

      await openWithDeepLink(appUrl, webUrl, 'Instagram');
    } catch (error) {
      console.error('Error opening Instagram:', error);
    }
  };

  /**
   * Handles Facebook button press - opens Facebook app or web page
   */
  const handleFacebook = async () => {
    if (!facebookUrl) return;

    try {
      // Ensure URL has https protocol
      const webUrl = facebookUrl.startsWith('http')
        ? facebookUrl
        : `https://facebook.com/${facebookUrl}`;

      // Extract page ID from URL (last segment)
      const pageId = facebookUrl.split('/').pop();
      const appUrl = `fb://profile/${pageId}`;

      await openWithDeepLink(appUrl, webUrl, 'Facebook');
    } catch (error) {
      console.error('Error opening Facebook:', error);
    }
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText type="subtitle" style={styles.title} accessibilityRole="header">
        {'Sosyal Medya'}
      </ThemedText>
      <View style={styles.buttonsContainer}>
        {instagramUrl && (
          <ContactButton
            icon="logo-instagram"
            label={'Instagram'}
            color="#E4405F"
            onPress={handleInstagram}
            accessibilityLabel={'Instagram\'da takip et'}
          />
        )}
        {facebookUrl && (
          <ContactButton
            icon="logo-facebook"
            label={'Facebook'}
            color="#1877F2"
            onPress={handleFacebook}
            accessibilityLabel={'Facebook\'ta takip et'}
          />
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
