import React from 'react';
import { View, Alert, Linking, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ContactButton } from './ContactButton';
import { formatPhoneNumber, showCallConfirmation, openWithDeepLink } from './helpers';

/**
 * Props for RequestLineSection component
 */
export interface RequestLineSectionProps {
  /** WhatsApp phone number for song requests */
  whatsappNumber: string | null;
  /** Phone number for live call-in to the station */
  phoneNumber: string | null;
  /** Optional additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * RequestLineSection - Displays İstek Hattı section with WhatsApp and Phone buttons
 *
 * This section provides direct communication channels for listeners to request songs
 * or call into the live broadcast. Shows WhatsApp and/or Phone buttons based on
 * available configuration.
 *
 * @example
 * <RequestLineSection
 *   whatsappNumber="905551234567"
 *   phoneNumber="05551234567"
 * />
 */
export const RequestLineSection: React.FC<RequestLineSectionProps> = ({
  whatsappNumber,
  phoneNumber,
  style,
}) => {
  // Hide section if no request line data available
  if (!whatsappNumber && !phoneNumber) return null;

  /**
   * Handles WhatsApp button press - opens WhatsApp with pre-filled song request message
   */
  const handleWhatsApp = async () => {
    if (!whatsappNumber) return;

    try {
      const formattedNumber = formatPhoneNumber(whatsappNumber);
      const message = 'Merhaba! Şarkı isteğim var.';
      const encodedMessage = encodeURIComponent(message);
      const appUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;
      const webUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

      await openWithDeepLink(appUrl, webUrl, 'WhatsApp');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
    }
  };

  /**
   * Handles Phone button press - shows confirmation dialog then initiates call
   */
  const handlePhone = () => {
    if (!phoneNumber) return;

    const cleanedNumber = phoneNumber.replace(/\s/g, '');
    const onConfirm = () => {
      const telUrl = `tel:${cleanedNumber}`;
      Linking.openURL(telUrl).catch(() => {
        Alert.alert('Hata', 'Arama yapılamadı');
      });
    };

    showCallConfirmation(phoneNumber, onConfirm);
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText type="subtitle" style={styles.title} accessibilityRole="header">
        {'İstek Hattı'}
      </ThemedText>
      <View style={styles.buttonsContainer}>
        {whatsappNumber && (
          <ContactButton
            icon="logo-whatsapp"
            label={'WhatsApp'}
            color="#25D366"
            onPress={handleWhatsApp}
            accessibilityLabel={'WhatsApp ile şarkı iste'}
          />
        )}
        {phoneNumber && (
          <ContactButton
            icon="call"
            label={'Ara'}
            color="#DC2626"
            onPress={handlePhone}
            accessibilityLabel={'Canlı yayını ara'}
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
