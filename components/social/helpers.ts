import { Linking, Alert } from 'react-native';

/**
 * Opens a URL with deep link to native app, falling back to web URL if app is not installed
 *
 * @param appUrl - The deep link URL for the native app (e.g., "whatsapp://send?phone=...")
 * @param webUrl - The fallback web URL (e.g., "https://wa.me/...")
 * @param appName - The name of the app for error messages (e.g., "WhatsApp")
 * @throws Displays an alert if both app and web URLs fail to open
 */
export const openWithDeepLink = async (
  appUrl: string,
  webUrl: string,
  appName: string
): Promise<void> => {
  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    if (canOpenApp) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error(`Error opening ${appName}:`, error);
    Alert.alert('Hata', `${appName} açılırken bir hata oluştu`);
  }
};

/**
 * Cleans and formats a phone number for Turkish mobile (adds country code if missing)
 *
 * @param phone - The phone number to format (may contain spaces, dashes, etc.)
 * @returns Formatted phone number with country code (e.g., "905551234567")
 * @example
 * formatPhoneNumber("555 123 45 67") // Returns "905551234567"
 * formatPhoneNumber("905551234567") // Returns "905551234567"
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Add country code if not present
  if (!cleaned.startsWith('90')) {
    return `90${cleaned}`;
  }

  return cleaned;
};

/**
 * Extracts Instagram username from various URL formats
 *
 * @param url - The Instagram URL (e.g., "https://instagram.com/username")
 * @returns The Instagram username without @ symbol or URL parts
 * @example
 * extractInstagramUsername("https://instagram.com/trendankara") // Returns "trendankara"
 * extractInstagramUsername("https://www.instagram.com/@trendankara/") // Returns "trendankara"
 */
export const extractInstagramUsername = (url: string): string => {
  return url
    .replace('https://instagram.com/', '')
    .replace('https://www.instagram.com/', '')
    .replace('@', '')
    .split('/')[0]; // Handle trailing slashes
};

/**
 * Shows a confirmation dialog before making a phone call
 *
 * @param phoneNumber - The phone number to display in the confirmation (formatted for display)
 * @param onConfirm - Callback function to execute when user confirms the call
 * @example
 * showCallConfirmation("0555 123 45 67", () => Linking.openURL("tel:05551234567"))
 */
export const showCallConfirmation = (
  phoneNumber: string,
  onConfirm: () => void
): void => {
  Alert.alert(
    'Canlı Yayın Hattı',
    `${phoneNumber} numarasını aramak istiyor musunuz?`,
    [
      { text: 'İptal', style: 'cancel' },
      { text: 'Ara', onPress: onConfirm },
    ]
  );
};
