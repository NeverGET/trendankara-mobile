/**
 * About Screen
 * App information, version, and contact details
 * Trend Ankara Mobile Application
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// Import theme and utilities
import { useTheme } from '@/contexts/ThemeContext';
import { ShareService } from '@/utils/share';

// App information
const APP_INFO = {
  name: 'Trend Ankara',
  version: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Constants.expoConfig?.ios?.buildNumber || '1',
  description: 'Trend Ankara Radyo resmi mobil uygulaması. En sevdiğiniz müzikleri dinleyin, haberleri takip edin ve anketlere katılın.',
  website: 'https://trendankara.com',
  email: 'info@trendankara.com',
  phone: '+90 312 XXX XX XX',
  address: 'Ankara, Türkiye',

  // Social media links
  social: {
    facebook: 'https://facebook.com/trendankara',
    instagram: 'https://instagram.com/trendankara',
    twitter: 'https://twitter.com/trendankara',
    youtube: 'https://youtube.com/trendankara',
    whatsapp: 'https://wa.me/903121234567',
  },

  // Legal links
  legal: {
    privacy: 'https://trendankara.com/privacy',
    terms: 'https://trendankara.com/terms',
    cookies: 'https://trendankara.com/cookies',
  },

  // Development info
  development: {
    developer: 'Trend Ankara Development Team',
    copyright: `© ${new Date().getFullYear()} Trend Ankara. Tüm hakları saklıdır.`,
    poweredBy: 'React Native & Expo',
  },
};

export default function AboutScreen() {
  const { theme, isDark } = useTheme();

  /**
   * Handle external link opening
   */
  const handleOpenLink = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', `${title} açılamadı. URL desteklenmiyor.`);
      }
    } catch (error) {
      console.error('Link opening error:', error);
      Alert.alert('Hata', `${title} açılırken bir hata oluştu.`);
    }
  };

  /**
   * Handle email contact
   */
  const handleEmailContact = () => {
    const subject = encodeURIComponent('Trend Ankara Mobil Uygulama');
    const body = encodeURIComponent(`
Merhaba Trend Ankara,

Mobil uygulamanız hakkında bir sorum/önerim var:



---
Uygulama Bilgileri:
- Sürüm: ${APP_INFO.version}
- Platform: ${Platform.OS}
- Cihaz: ${Platform.Version}
    `);

    const emailUrl = `mailto:${APP_INFO.email}?subject=${subject}&body=${body}`;
    handleOpenLink(emailUrl, 'E-posta');
  };

  /**
   * Handle phone contact
   */
  const handlePhoneContact = () => {
    Alert.alert(
      'İletişim',
      'Hangi yöntemle iletişim kurmak istersiniz?',
      [
        {
          text: 'Ara',
          onPress: () => handleOpenLink(`tel:${APP_INFO.phone}`, 'Telefon'),
        },
        {
          text: 'WhatsApp',
          onPress: () => handleOpenLink(APP_INFO.social.whatsapp, 'WhatsApp'),
        },
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  /**
   * Handle app sharing
   */
  const handleShareApp = async () => {
    try {
      await ShareService.shareContent({
        type: 'app',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Hata', 'Uygulama paylaşılırken bir hata oluştu.');
    }
  };

  /**
   * Show app info for debugging
   */
  const handleShowDebugInfo = () => {
    if (__DEV__) {
      const debugInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        appVersion: APP_INFO.version,
        buildNumber: APP_INFO.buildNumber,
        expoVersion: Constants.expoVersion,
        deviceName: Constants.deviceName,
        isDevice: Constants.isDevice,
      };

      Alert.alert(
        'Debug Information',
        JSON.stringify(debugInfo, null, 2),
        [{ text: 'OK' }]
      );
    }
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hakkında</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Info */}
        <View style={styles.appInfo}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="radio" size={48} color={theme.colors.primary} />
            </View>
          </View>

          <Text style={styles.appName}>{APP_INFO.name}</Text>
          <Text style={styles.appVersion}>
            Sürüm {APP_INFO.version} ({APP_INFO.buildNumber})
          </Text>
          <Text style={styles.appDescription}>{APP_INFO.description}</Text>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim</Text>
          <View style={styles.sectionContent}>

            <ContactItem
              icon="globe"
              title="Web Sitesi"
              subtitle={APP_INFO.website}
              onPress={() => handleOpenLink(APP_INFO.website, 'Web Sitesi')}
              theme={theme}
            />

            <ContactItem
              icon="mail"
              title="E-posta"
              subtitle={APP_INFO.email}
              onPress={handleEmailContact}
              theme={theme}
            />

            <ContactItem
              icon="call"
              title="Telefon"
              subtitle={APP_INFO.phone}
              onPress={handlePhoneContact}
              theme={theme}
            />

            <ContactItem
              icon="location"
              title="Adres"
              subtitle={APP_INFO.address}
              onPress={() => {}}
              theme={theme}
              disabled
            />
          </View>
        </View>

        {/* Social Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sosyal Medya</Text>
          <View style={styles.socialContainer}>
            <SocialButton
              icon="logo-facebook"
              platform="Facebook"
              url={APP_INFO.social.facebook}
              onPress={handleOpenLink}
              theme={theme}
            />
            <SocialButton
              icon="logo-instagram"
              platform="Instagram"
              url={APP_INFO.social.instagram}
              onPress={handleOpenLink}
              theme={theme}
            />
            <SocialButton
              icon="logo-twitter"
              platform="Twitter"
              url={APP_INFO.social.twitter}
              onPress={handleOpenLink}
              theme={theme}
            />
            <SocialButton
              icon="logo-youtube"
              platform="YouTube"
              url={APP_INFO.social.youtube}
              onPress={handleOpenLink}
              theme={theme}
            />
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eylemler</Text>
          <View style={styles.sectionContent}>

            <ActionItem
              icon="share"
              title="Uygulamayı Paylaş"
              subtitle="Arkadaşlarınla paylaş"
              onPress={handleShareApp}
              theme={theme}
            />

            <ActionItem
              icon="star"
              title="Uygulamayı Değerlendir"
              subtitle="App Store'da değerlendir"
              onPress={() => {
                const storeUrl = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/trend-ankara'
                  : 'https://play.google.com/store/apps/details?id=com.trendankara.mobile';
                handleOpenLink(storeUrl, 'App Store');
              }}
              theme={theme}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yasal</Text>
          <View style={styles.sectionContent}>

            <ActionItem
              icon="shield-checkmark"
              title="Gizlilik Politikası"
              subtitle="Veri koruma ve gizlilik"
              onPress={() => handleOpenLink(APP_INFO.legal.privacy, 'Gizlilik Politikası')}
              theme={theme}
            />

            <ActionItem
              icon="document-text"
              title="Kullanım Şartları"
              subtitle="Hizmet kullanım koşulları"
              onPress={() => handleOpenLink(APP_INFO.legal.terms, 'Kullanım Şartları')}
              theme={theme}
            />

            <ActionItem
              icon="information-circle"
              title="Çerez Politikası"
              subtitle="Çerez kullanımı hakkında"
              onPress={() => handleOpenLink(APP_INFO.legal.cookies, 'Çerez Politikası')}
              theme={theme}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleShowDebugInfo}>
            <Text style={styles.footerText}>{APP_INFO.development.copyright}</Text>
            <Text style={styles.footerSubtext}>
              {APP_INFO.development.poweredBy}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Contact Item Component
 */
interface ContactItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  theme: any;
  disabled?: boolean;
}

function ContactItem({ icon, title, subtitle, onPress, theme, disabled }: ContactItemProps) {
  return (
    <TouchableOpacity
      style={[styles.item, disabled && styles.itemDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={22}
        color={disabled ? theme.colors.textMuted : theme.colors.primary}
        style={styles.itemIcon}
      />
      <View style={styles.itemText}>
        <Text style={[styles.itemTitle, disabled && styles.textDisabled]}>
          {title}
        </Text>
        <Text style={[styles.itemSubtitle, disabled && styles.textDisabled]}>
          {subtitle}
        </Text>
      </View>
      {!disabled && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

/**
 * Social Button Component
 */
interface SocialButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  platform: string;
  url: string;
  onPress: (url: string, title: string) => void;
  theme: any;
}

function SocialButton({ icon, platform, url, onPress, theme }: SocialButtonProps) {
  return (
    <TouchableOpacity
      style={styles.socialButton}
      onPress={() => onPress(url, platform)}
    >
      <Ionicons name={icon} size={28} color={theme.colors.primary} />
      <Text style={styles.socialButtonText}>{platform}</Text>
    </TouchableOpacity>
  );
}

/**
 * Action Item Component
 */
interface ActionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  theme: any;
}

function ActionItem({ icon, title, subtitle, onPress, theme }: ActionItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={theme.colors.primary}
        style={styles.itemIcon}
      />
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
    </TouchableOpacity>
  );
}

/**
 * Styles Factory
 */
function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    headerRight: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    appInfo: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 16,
    },
    logoContainer: {
      marginBottom: 16,
    },
    logoPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    appVersion: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    appDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginHorizontal: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    sectionContent: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      borderRadius: 12,
      overflow: 'hidden',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    itemDisabled: {
      opacity: 0.6,
    },
    itemIcon: {
      marginRight: 12,
    },
    itemText: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    itemSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    textDisabled: {
      opacity: 0.6,
    },
    socialContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      justifyContent: 'space-around',
    },
    socialButton: {
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      minWidth: 60,
    },
    socialButtonText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 16,
    },
    footerText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
    footerSubtext: {
      fontSize: 10,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
  });
}