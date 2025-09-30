/**
 * Settings Screen
 * User preferences and app configuration
 * Trend Ankara Mobile Application
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Import services and utilities
import NotificationService from '@/services/notifications';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setTheme,
  setAudioQuality,
  setAutoPlayOnStart,
  setBackgroundPlayEnabled,
  setNotificationsEnabled,
  setDataUsageWarning,
  setCacheSize,
  setClearCacheOnClose,
  type ThemeMode,
  type AudioQuality,
} from '@/store/slices/settingsSlice';

// Settings section data
interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'switch' | 'select' | 'action' | 'info';
  value?: any;
  options?: Array<{ label: string; value: any }>;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
}

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const userPreferences = useAppSelector(state => state.settings.userPreferences);
  const notifications = useAppSelector(state => state.settings.notifications);
  const remoteSettings = useAppSelector(state => state.settings.remoteSettings);

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle theme change
   */
  const handleThemeChange = (theme: ThemeMode) => {
    dispatch(setTheme(theme));
  };

  /**
   * Handle audio quality change
   */
  const handleAudioQualityChange = (quality: AudioQuality) => {
    dispatch(setAudioQuality(quality));
  };

  /**
   * Handle cache clearing
   */
  const handleClearCache = () => {
    Alert.alert(
      'Önbelleği Temizle',
      'Tüm önbellek verileri silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Clear cache logic would go here
              await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
              Alert.alert('Başarılı', 'Önbellek temizlendi.');
            } catch (error) {
              Alert.alert('Hata', 'Önbellek temizlenirken hata oluştu.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle notification test
   */
  const handleTestNotification = async () => {
    try {
      await NotificationService.testNotification();
      Alert.alert('Test Bildirimi', 'Test bildirimi gönderildi!');
    } catch (error) {
      Alert.alert('Hata', 'Test bildirimi gönderilemedi.');
    }
  };

  /**
   * Handle option selection
   */
  const handleOptionSelect = (
    title: string,
    options: Array<{ label: string; value: any }>,
    currentValue: any,
    onSelect: (value: any) => void
  ) => {
    const optionLabels = options.map(option => option.label);

    Alert.alert(
      title,
      'Seçeneklerden birini seçin:',
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => onSelect(option.value),
          style: option.value === currentValue ? 'default' : undefined,
        })),
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  // Define settings sections
  const settingsSections: SettingsSection[] = [
    {
      title: 'Görünüm',
      items: [
        {
          id: 'theme',
          title: 'Tema',
          subtitle: getThemeLabel(userPreferences.theme),
          type: 'select',
          value: userPreferences.theme,
          options: [
            { label: 'Açık', value: 'light' },
            { label: 'Koyu', value: 'dark' },
            { label: 'Sistem', value: 'system' },
          ],
          icon: 'color-palette',
          onPress: () =>
            handleOptionSelect(
              'Tema Seçin',
              [
                { label: 'Açık', value: 'light' },
                { label: 'Koyu', value: 'dark' },
                { label: 'Sistem', value: 'system' },
              ],
              userPreferences.theme,
              handleThemeChange
            ),
        },
      ],
    },
    {
      title: 'Ses ve Çalma',
      items: [
        {
          id: 'audio_quality',
          title: 'Ses Kalitesi',
          subtitle: getAudioQualityLabel(userPreferences.audioQuality),
          type: 'select',
          value: userPreferences.audioQuality,
          options: [
            { label: 'Düşük (64 kbps)', value: 'low' },
            { label: 'Orta (128 kbps)', value: 'medium' },
            { label: 'Yüksek (256 kbps)', value: 'high' },
          ],
          icon: 'musical-notes',
          onPress: () =>
            handleOptionSelect(
              'Ses Kalitesi',
              [
                { label: 'Düşük (64 kbps)', value: 'low' },
                { label: 'Orta (128 kbps)', value: 'medium' },
                { label: 'Yüksek (256 kbps)', value: 'high' },
              ],
              userPreferences.audioQuality,
              handleAudioQualityChange
            ),
        },
        {
          id: 'auto_play',
          title: 'Otomatik Başlat',
          subtitle: 'Uygulama açıldığında radyoyu başlat',
          type: 'switch',
          value: userPreferences.autoPlayOnStart,
          icon: 'play-circle',
          onPress: () => dispatch(setAutoPlayOnStart(!userPreferences.autoPlayOnStart)),
        },
        {
          id: 'background_play',
          title: 'Arka Plan Çalma',
          subtitle: 'Uygulama arka plandayken çalmaya devam et',
          type: 'switch',
          value: userPreferences.backgroundPlayEnabled,
          icon: 'layers',
          onPress: () => dispatch(setBackgroundPlayEnabled(!userPreferences.backgroundPlayEnabled)),
        },
      ],
    },
    {
      title: 'Bildirimler',
      items: [
        {
          id: 'notifications_enabled',
          title: 'Bildirimleri Etkinleştir',
          subtitle: 'Tüm bildirimleri aç/kapat',
          type: 'switch',
          value: notifications.enabled,
          icon: 'notifications',
          onPress: () => dispatch(setNotificationsEnabled(!notifications.enabled)),
        },
        {
          id: 'news_notifications',
          title: 'Haber Bildirimleri',
          subtitle: 'Yeni haberler için bildirim al',
          type: 'switch',
          value: notifications.newsUpdates,
          icon: 'newspaper',
          disabled: !notifications.enabled,
        },
        {
          id: 'poll_notifications',
          title: 'Anket Bildirimleri',
          subtitle: 'Yeni anketler için bildirim al',
          type: 'switch',
          value: notifications.newPolls,
          icon: 'bar-chart',
          disabled: !notifications.enabled,
        },
        {
          id: 'test_notification',
          title: 'Test Bildirimi Gönder',
          subtitle: 'Bildirimlerin çalışıp çalışmadığını test et',
          type: 'action',
          icon: 'send',
          onPress: handleTestNotification,
          disabled: !notifications.enabled,
        },
      ],
    },
    {
      title: 'Veri ve Depolama',
      items: [
        {
          id: 'data_warning',
          title: 'Veri Kullanım Uyarısı',
          subtitle: 'Mobil veri kullanırken uyar',
          type: 'switch',
          value: userPreferences.dataUsageWarning,
          icon: 'cellular',
          onPress: () => dispatch(setDataUsageWarning(!userPreferences.dataUsageWarning)),
        },
        {
          id: 'cache_size',
          title: 'Önbellek Boyutu',
          subtitle: `${userPreferences.cacheSize} MB`,
          type: 'info',
          icon: 'archive',
        },
        {
          id: 'clear_cache_on_close',
          title: 'Çıkışta Önbelleği Temizle',
          subtitle: 'Uygulama kapatıldığında önbelleği otomatik temizle',
          type: 'switch',
          value: userPreferences.clearCacheOnClose,
          icon: 'trash',
          onPress: () => dispatch(setClearCacheOnClose(!userPreferences.clearCacheOnClose)),
        },
        {
          id: 'clear_cache',
          title: 'Önbelleği Şimdi Temizle',
          subtitle: 'Tüm önbellek verilerini sil',
          type: 'action',
          icon: 'refresh',
          onPress: handleClearCache,
        },
      ],
    },
    {
      title: 'Hakkında',
      items: [
        {
          id: 'app_version',
          title: 'Uygulama Sürümü',
          subtitle: '1.0.0',
          type: 'info',
          icon: 'information-circle',
        },
        {
          id: 'about',
          title: 'Hakkında',
          subtitle: 'Uygulama bilgileri ve iletişim',
          type: 'action',
          icon: 'help-circle',
          onPress: () => router.push('/about'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <SettingsItem
                  key={item.id}
                  item={item}
                  isLast={itemIndex === section.items.length - 1}
                  isLoading={isLoading}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Settings Item Component
 */
interface SettingsItemProps {
  item: SettingsItem;
  isLast: boolean;
  isLoading: boolean;
}

function SettingsItem({ item, isLast, isLoading }: SettingsItemProps) {
  const renderRightComponent = () => {
    switch (item.type) {
      case 'switch':
        return (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            disabled={item.disabled || isLoading}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={item.value ? '#f5dd4b' : '#f4f3f4'}
          />
        );

      case 'select':
        return (
          <View style={styles.selectContainer}>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        );

      case 'action':
        return (
          <View style={styles.actionContainer}>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        );

      case 'info':
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.item, isLast && styles.itemLast]}
      onPress={item.onPress}
      disabled={item.disabled || isLoading || !item.onPress}
    >
      <View style={styles.itemLeft}>
        {item.icon && (
          <Ionicons
            name={item.icon}
            size={22}
            color={item.disabled ? '#ccc' : '#666'}
            style={styles.itemIcon}
          />
        )}
        <View style={styles.itemText}>
          <Text style={[styles.itemTitle, item.disabled && styles.itemDisabled]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.itemSubtitle, item.disabled && styles.itemDisabled]}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
      {renderRightComponent()}
    </TouchableOpacity>
  );
}

/**
 * Helper functions
 */
function getThemeLabel(theme: ThemeMode): string {
  switch (theme) {
    case 'light':
      return 'Açık';
    case 'dark':
      return 'Koyu';
    case 'system':
      return 'Sistem';
    default:
      return 'Sistem';
  }
}

function getAudioQualityLabel(quality: AudioQuality): string {
  switch (quality) {
    case 'low':
      return 'Düşük (64 kbps)';
    case 'medium':
      return 'Orta (128 kbps)';
    case 'high':
      return 'Yüksek (256 kbps)';
    default:
      return 'Yüksek (256 kbps)';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    color: '#000',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemDisabled: {
    opacity: 0.5,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});