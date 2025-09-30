import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocialLinks } from '@/hooks/useSettings';

interface SocialMediaButtonsProps {
  style?: any;
  iconSize?: number;
  iconColor?: string;
  showLabels?: boolean;
  vertical?: boolean;
}

export const SocialMediaButtons: React.FC<SocialMediaButtonsProps> = ({
  style,
  iconSize = 28,
  iconColor = '#fff',
  showLabels = false,
  vertical = false,
}) => {
  const socialLinks = useSocialLinks();

  const openURL = async (url: string, appUrl?: string) => {
    try {
      // Try to open app-specific URL first (deep linking)
      if (appUrl) {
        const canOpen = await Linking.canOpenURL(appUrl);
        if (canOpen) {
          await Linking.openURL(appUrl);
          return;
        }
      }

      // Fallback to web URL
      const canOpenWeb = await Linking.canOpenURL(url);
      if (canOpenWeb) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Bu bağlantı açılamıyor');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Hata', 'Bağlantı açılırken bir hata oluştu');
    }
  };

  const handleFacebook = () => {
    if (!socialLinks.facebook) return;

    const pageId = socialLinks.facebook.split('/').pop();
    const appUrl = `fb://page/${pageId}`;
    const webUrl = socialLinks.facebook.startsWith('http')
      ? socialLinks.facebook
      : `https://facebook.com/${socialLinks.facebook}`;

    openURL(webUrl, Platform.OS === 'ios' ? appUrl : undefined);
  };

  const handleInstagram = () => {
    if (!socialLinks.instagram) return;

    const username = socialLinks.instagram
      .replace('https://instagram.com/', '')
      .replace('https://www.instagram.com/', '')
      .replace('@', '');

    const appUrl = `instagram://user?username=${username}`;
    const webUrl = `https://instagram.com/${username}`;

    openURL(webUrl, appUrl);
  };

  const handleWhatsApp = () => {
    if (!socialLinks.whatsapp) return;

    // Clean phone number (remove spaces, dashes, etc.)
    const phoneNumber = socialLinks.whatsapp.replace(/[^0-9]/g, '');

    // Add country code if not present
    const formattedNumber = phoneNumber.startsWith('90')
      ? phoneNumber
      : `90${phoneNumber}`;

    const message = 'Merhaba, Trend Ankara radyosu hakkında bilgi almak istiyorum.';
    const url = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(
      message
    )}`;
    const webUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(
      message
    )}`;

    openURL(webUrl, url);
  };

  const handleLiveCall = () => {
    if (!socialLinks.liveCall) return;

    // Clean phone number
    const phoneNumber = socialLinks.liveCall.replace(/[^0-9]/g, '');

    const url = `tel:${phoneNumber}`;

    Alert.alert(
      'Canlı Yayın Hattı',
      `${socialLinks.liveCall} numarasını aramak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ara',
          onPress: () => {
            Linking.openURL(url).catch(() =>
              Alert.alert('Hata', 'Arama yapılamadı')
            );
          },
        },
      ]
    );
  };

  const buttons = [
    {
      id: 'facebook',
      icon: 'logo-facebook',
      onPress: handleFacebook,
      visible: !!socialLinks.facebook,
      color: '#1877F2',
    },
    {
      id: 'instagram',
      icon: 'logo-instagram',
      onPress: handleInstagram,
      visible: !!socialLinks.instagram,
      color: '#E4405F',
    },
    {
      id: 'whatsapp',
      icon: 'logo-whatsapp',
      onPress: handleWhatsApp,
      visible: !!socialLinks.whatsapp,
      color: '#25D366',
    },
    {
      id: 'call',
      icon: 'call',
      onPress: handleLiveCall,
      visible: !!socialLinks.liveCall,
      color: '#FF0000',
    },
  ];

  const visibleButtons = buttons.filter(b => b.visible);

  if (visibleButtons.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        vertical ? styles.containerVertical : styles.containerHorizontal,
        style,
      ]}
    >
      {visibleButtons.map((button, index) => (
        <TouchableOpacity
          key={button.id}
          style={[
            styles.button,
            vertical && index > 0 && styles.buttonVerticalSpacing,
            !vertical && index > 0 && styles.buttonHorizontalSpacing,
          ]}
          onPress={button.onPress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: button.color },
            ]}
          >
            <Ionicons
              name={button.icon as any}
              size={iconSize}
              color={iconColor}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    padding: 4,
  },
  buttonHorizontalSpacing: {
    marginLeft: 12,
  },
  buttonVerticalSpacing: {
    marginTop: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default SocialMediaButtons;