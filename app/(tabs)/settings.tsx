/**
 * Settings Screen
 * User preferences and app configuration
 * Trend Ankara Mobile Application
 */

import React from 'react';
import {
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Linking,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { CustomSwitch } from '@/components/ui/CustomSwitch';
import { Strings } from '@/constants/strings';
import { Colors } from '@/constants/themes';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createScreenStyles } from '@/constants/screenStyles';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setUseSystemTheme,
  setIsDarkMode,
  setBackgroundPlayEnabled,
  setAutoPlayOnStart,
  resetUserPreferences,
} from '@/store/slices/settingsSlice';

export default function SettingsScreen() {
  // Redux hooks
  const dispatch = useAppDispatch();
  const userPreferences = useAppSelector((state) => state.settings.userPreferences);

  // Get themed colors and styles
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme();
  const screenStyles = createScreenStyles(colorScheme ?? 'light');

  // Extract settings from Redux state
  const { useSystemTheme, isDarkMode, backgroundPlayEnabled, autoPlayOnStart } = userPreferences;

  /**
   * Toggle handlers that dispatch Redux actions
   */
  const handleToggleSystemTheme = (value: boolean) => {
    dispatch(setUseSystemTheme(value));
  };

  const handleToggleDarkMode = (value: boolean) => {
    // Early return if dark mode toggle is disabled (when useSystemTheme is true)
    if (useSystemTheme) {
      return;
    }
    dispatch(setIsDarkMode(value));
  };

  const handleToggleBackgroundPlay = (value: boolean) => {
    dispatch(setBackgroundPlayEnabled(value));
  };

  const handleToggleAutoplay = (value: boolean) => {
    dispatch(setAutoPlayOnStart(value));
  };

  /**
   * Handle restore defaults
   */
  const handleRestoreDefaults = () => {
    Alert.alert(
      Strings.settings.confirmRestoreTitle,
      Strings.settings.confirmRestoreMessage,
      [
        {
          text: Strings.common.cancel,
          style: 'cancel',
        },
        {
          text: Strings.settings.confirmRestoreButton,
          style: 'destructive',
          onPress: () => {
            // Reset to defaults via Redux action
            dispatch(resetUserPreferences());
            Alert.alert(Strings.common.success, Strings.settings.defaultsRestored);
          },
        },
      ]
    );
  };

  /**
   * Handle opening external links
   */
  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          Strings.settings.linkError,
          Strings.settings.linkErrorMessage
        );
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert(
        Strings.settings.linkError,
        Strings.settings.linkErrorMessage
      );
    }
  };

  /**
   * Handle privacy policy link
   */
  const handlePrivacyPolicy = () => {
    handleOpenLink('https://trendankara.com/gizlilik-politikasi');
  };

  /**
   * Handle terms of service link
   */
  const handleTermsOfService = () => {
    handleOpenLink('https://trendankara.com/kullanim-kosullari');
  };

  /**
   * Handle imprint (künye) link
   */
  const handleImprint = () => {
    handleOpenLink('https://trendankara.com/kunye');
  };

  /**
   * Handle about page navigation
   */
  const handleAboutPage = () => {
    router.push('/about');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        {/* Header with title */}
        <View style={screenStyles.headerContainer}>
          <Text style={screenStyles.pageTitle}>Ayarlar</Text>
          <Text style={screenStyles.pageSubtitle}>Uygulama tercihleri ve yapılandırma</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* TEMA Section */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {Strings.settings.themeSection}
            </ThemedText>

            <ThemedView style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>
                {Strings.settings.useSystemSettings}
              </ThemedText>
              <CustomSwitch
                value={useSystemTheme}
                onValueChange={handleToggleSystemTheme}
              />
            </ThemedView>

            <ThemedView style={[styles.settingItem, useSystemTheme && styles.disabledItem]}>
              <ThemedText style={styles.settingLabel}>
                {Strings.settings.darkMode}
              </ThemedText>
              <CustomSwitch
                value={isDarkMode}
                onValueChange={handleToggleDarkMode}
                disabled={useSystemTheme}
              />
            </ThemedView>
          </ThemedView>

          {/* OYNATMA Section */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {Strings.settings.playbackSection}
            </ThemedText>

            <ThemedView style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>
                {Strings.settings.backgroundPlayback}
              </ThemedText>
              <CustomSwitch
                value={backgroundPlayEnabled}
                onValueChange={handleToggleBackgroundPlay}
              />
            </ThemedView>

            <ThemedView style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>
                {Strings.settings.autoplay}
              </ThemedText>
              <CustomSwitch
                value={autoPlayOnStart}
                onValueChange={handleToggleAutoplay}
              />
            </ThemedView>
          </ThemedView>

          {/* YASAL Section */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {Strings.settings.legalSection}
            </ThemedText>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={handlePrivacyPolicy}
            >
              <ThemedView style={styles.linkItemContent}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={Colors.primary}
                  style={styles.linkIcon}
                />
                <ThemedView style={styles.linkText}>
                  <ThemedText style={styles.linkLabel}>
                    {Strings.settings.privacyPolicy}
                  </ThemedText>
                  <ThemedText style={styles.linkDescription}>
                    {Strings.settings.privacyPolicyDescription}
                  </ThemedText>
                </ThemedView>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleTermsOfService}
            >
              <ThemedView style={styles.linkItemContent}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={Colors.primary}
                  style={styles.linkIcon}
                />
                <ThemedView style={styles.linkText}>
                  <ThemedText style={styles.linkLabel}>
                    {Strings.settings.termsOfService}
                  </ThemedText>
                  <ThemedText style={styles.linkDescription}>
                    {Strings.settings.termsOfServiceDescription}
                  </ThemedText>
                </ThemedView>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleImprint}
            >
              <ThemedView style={styles.linkItemContent}>
                <Ionicons
                  name="newspaper-outline"
                  size={22}
                  color={Colors.primary}
                  style={styles.linkIcon}
                />
                <ThemedView style={styles.linkText}>
                  <ThemedText style={styles.linkLabel}>
                    {Strings.settings.imprint}
                  </ThemedText>
                  <ThemedText style={styles.linkDescription}>
                    {Strings.settings.imprintDescription}
                  </ThemedText>
                </ThemedView>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleAboutPage}
            >
              <ThemedView style={styles.linkItemContent}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={Colors.primary}
                  style={styles.linkIcon}
                />
                <ThemedView style={styles.linkText}>
                  <ThemedText style={styles.linkLabel}>
                    {Strings.settings.about}
                  </ThemedText>
                  <ThemedText style={styles.linkDescription}>
                    {Strings.settings.aboutDescription}
                  </ThemedText>
                </ThemedView>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </ThemedView>
            </TouchableOpacity>
          </ThemedView>

          {/* Restore Defaults Button */}
          <ThemedView style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestoreDefaults}
            >
              <ThemedText style={styles.restoreButtonText}>
                {Strings.settings.restoreDefaults}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    opacity: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
    marginRight: 16,
  },
  disabledItem: {
    opacity: 0.4,
  },
  linkItem: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  linkItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    marginRight: 12,
  },
  linkText: {
    flex: 1,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 13,
    opacity: 0.6,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 40,
  },
  restoreButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999, // Pill shape
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restoreButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
