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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createScreenStyles } from '@/constants/screenStyles';
import { Colors } from '@/constants/themes';
import { useSocialLinks } from '@/hooks/useSettings';
import { SocialMediaSection } from '@/components/social/SocialMediaSection';

// Company information (Künye)
const COMPANY_INFO = {
  company: {
    name: 'SÜPER ŞOV GAZETE RADYO TELEVİZYON YAY.SANAYİ VE TİC. A.Ş.',
  },
  broadcast: {
    logo: 'TRENDANKARA',
    medium: 'İNTERNET / DİJİTAL',
    type: 'TEMATİK (MÜZİK - EĞLENCE)',
  },
  contact: {
    address: 'ERYAMAN MAH. 2. CAD. NO :19 ETİMESGUT / ANKARA',
    phone: '0312 279 11 10',
    website: 'www.trendankara.com',
    email: 'pasa.akbuga@gmail.com',
    kep: 'supersovgazete@hs01.kep.tr',
  },
  management: {
    responsibleManager: 'Paşa AKBUĞA',
    viewerRepresentative: 'Paşa AKBUĞA',
  },
  legal: {
    privacy: 'https://trendankara.com/gizlilik-politikasi',
    terms: 'https://trendankara.com/kullanim-kosullari',
    imprint: 'https://trendankara.com/kunye',
  },
};

// App version info
const APP_VERSION = {
  version: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Constants.expoConfig?.ios?.buildNumber || '1',
};

export default function AboutScreen() {
  const { theme, isDark } = useTheme();
  const colorScheme = useColorScheme();
  const screenStyles = createScreenStyles(colorScheme ?? 'light');
  const socialLinks = useSocialLinks();

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
   * Handle phone call
   */
  const handlePhoneCall = () => {
    handleOpenLink(`tel:${COMPANY_INFO.contact.phone}`, 'Telefon');
  };

  /**
   * Handle email
   */
  const handleEmail = () => {
    const emailUrl = `mailto:${COMPANY_INFO.contact.email}`;
    handleOpenLink(emailUrl, 'E-posta');
  };

  /**
   * Handle website
   */
  const handleWebsite = () => {
    handleOpenLink(`https://${COMPANY_INFO.contact.website}`, 'Web Sitesi');
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with title and back button */}
      <View style={[screenStyles.headerContainer, styles.headerWithBack]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={screenStyles.pageTitle}>Hakkında</Text>
          <Text style={screenStyles.pageSubtitle}>Uygulama bilgileri ve iletişim</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Version */}
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/logo/TrendAnkaraLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>{COMPANY_INFO.broadcast.logo}</Text>
          <Text style={styles.version}>Sürüm {APP_VERSION.version} ({APP_VERSION.buildNumber})</Text>
        </View>

        {/* Social Media Section - Dynamic from API */}
        {(socialLinks.instagram || socialLinks.facebook) && (
          <SocialMediaSection
            instagramUrl={socialLinks.instagram}
            facebookUrl={socialLinks.facebook}
            style={styles.socialSection}
          />
        )}

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ŞİRKET BİLGİLERİ</Text>
          <View style={styles.infoCard}>
            <Text style={styles.companyName}>{COMPANY_INFO.company.name}</Text>
          </View>
        </View>

        {/* Broadcast Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YAYIN BİLGİLERİ</Text>
          <View style={styles.infoCard}>
            <InfoRow label="LOGO / ÇAĞRI İŞARETİ" value={COMPANY_INFO.broadcast.logo} />
            <InfoRow label="YAYIN ORTAMI" value={COMPANY_INFO.broadcast.medium} />
            <InfoRow label="YAYIN TÜRÜ" value={COMPANY_INFO.broadcast.type} />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İLETİŞİM BİLGİLERİ</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Adres" value={COMPANY_INFO.contact.address} />
            <TouchableOpacity onPress={handlePhoneCall}>
              <InfoRow
                label="Telefon"
                value={COMPANY_INFO.contact.phone}
                isLink
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleWebsite}>
              <InfoRow
                label="İnternet Adresi"
                value={COMPANY_INFO.contact.website}
                isLink
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEmail}>
              <InfoRow
                label="E-Posta"
                value={COMPANY_INFO.contact.email}
                isLink
              />
            </TouchableOpacity>
            <InfoRow label="KEP" value={COMPANY_INFO.contact.kep} />
          </View>
        </View>

        {/* Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YÖNETİM</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Sorumlu Müdür" value={COMPANY_INFO.management.responsibleManager} />
            <InfoRow label="İzleyici Temsilcisi" value={COMPANY_INFO.management.viewerRepresentative} />
          </View>
        </View>

        {/* Postal Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İLETİŞİM VE POSTA ADRESİ</Text>
          <View style={styles.infoCard}>
            <Text style={styles.address}>{COMPANY_INFO.contact.address}</Text>
          </View>
        </View>

        {/* Legal Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YASAL BELGELER</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => handleOpenLink(COMPANY_INFO.legal.privacy, 'Gizlilik Politikası')}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              <Text style={styles.legalLinkText}>Gizlilik Politikası</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => handleOpenLink(COMPANY_INFO.legal.terms, 'Kullanım Koşulları')}
            >
              <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
              <Text style={styles.legalLinkText}>Kullanım Koşulları</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.legalLink, styles.lastLegalLink]}
              onPress={() => handleOpenLink(COMPANY_INFO.legal.imprint, 'Künye')}
            >
              <Ionicons name="newspaper-outline" size={20} color={Colors.primary} />
              <Text style={styles.legalLinkText}>Künye</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} {COMPANY_INFO.broadcast.logo}
          </Text>
          <Text style={styles.footerSubtext}>
            Tüm hakları saklıdır
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Info Row Component
 */
interface InfoRowProps {
  label: string;
  value: string;
  isLink?: boolean;
}

function InfoRow({ label, value, isLink }: InfoRowProps) {
  return (
    <View style={infoRowStyles.container}>
      <Text style={infoRowStyles.label}>{label}:</Text>
      <Text style={[infoRowStyles.value, isLink && infoRowStyles.link]}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000',
    lineHeight: 22,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});

/**
 * Styles Factory
 */
function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerWithBack: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      padding: 4,
      marginLeft: -4,
    },
    headerTitleContainer: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    logoSection: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 16,
    },
    appName: {
      fontSize: 24,
      fontWeight: '700',
      color: Colors.primary, // RED
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    version: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '400',
    },
    socialSection: {
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    section: {
      paddingTop: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.primary, // RED section titles
      marginBottom: 12,
      letterSpacing: 1,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    companyName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      lineHeight: 20,
      textAlign: 'center',
    },
    address: {
      fontSize: 15,
      fontWeight: '400',
      color: theme.colors.text,
      lineHeight: 22,
      textAlign: 'center',
    },
    legalLink: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
      gap: 12,
    },
    lastLegalLink: {
      borderBottomWidth: 0,
    },
    legalLinkText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.text,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
    },
    footerText: {
      fontSize: 13,
      color: theme.colors.textTertiary,
      fontWeight: '600',
      marginBottom: 4,
    },
    footerSubtext: {
      fontSize: 11,
      color: theme.colors.textMuted,
      fontWeight: '400',
    },
  });
}
