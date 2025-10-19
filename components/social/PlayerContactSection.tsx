import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useSocialLinks } from '@/hooks/useSettings';
import { RequestLineSection } from './RequestLineSection';
import { SocialMediaSection } from './SocialMediaSection';

/**
 * Props for PlayerContactSection component
 */
export interface PlayerContactSectionProps {
  /** Optional additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * PlayerContactSection - Main wrapper for social contact functionality
 *
 * This component orchestrates the display of both request line and social media sections
 * based on available configuration data. It fetches social links from settings and
 * conditionally renders the appropriate sections.
 *
 * The component follows these visibility rules:
 * - Shows RequestLineSection if WhatsApp OR Phone number is available
 * - Shows SocialMediaSection if Instagram OR Facebook URL is available
 * - Hides entirely if no social contact data is available
 *
 * @example
 * <PlayerContactSection style={styles.socialSection} />
 */
export const PlayerContactSection: React.FC<PlayerContactSectionProps> = ({ style }) => {
  // Fetch social links from settings
  const socialLinks = useSocialLinks();

  // Determine which sections to display
  const hasRequestLine = !!(socialLinks.whatsapp || socialLinks.liveCall);
  const hasSocialMedia = !!(socialLinks.instagram || socialLinks.facebook);

  // Hide entire component if no social contact data available
  if (!hasRequestLine && !hasSocialMedia) {
    return null;
  }

  return (
    <ThemedView style={[styles.container, style]}>
      {hasRequestLine && (
        <RequestLineSection
          whatsappNumber={socialLinks.whatsapp}
          phoneNumber={socialLinks.liveCall}
        />
      )}
      {hasSocialMedia && (
        <SocialMediaSection
          instagramUrl={socialLinks.instagram}
          facebookUrl={socialLinks.facebook}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    // Minimal container styling - sections handle their own layout
  },
});
