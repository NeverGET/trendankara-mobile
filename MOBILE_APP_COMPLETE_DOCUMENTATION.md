# Trend Ankara Mobile Application - Complete Documentation
Version: 2.0.0
Last Updated: September 28, 2025

## Table of Contents
1. [Overview](#overview)
2. [ReUI Design System Guidelines](#reui-design-system-guidelines)
3. [API Endpoints & Integration](#api-endpoints--integration)
4. [Mobile Settings Configuration](#mobile-settings-configuration)
5. [Implementation Guidelines](#implementation-guidelines)
6. [UI/UX Standards](#uiux-standards)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Performance Optimization](#performance-optimization)
10. [Testing Guidelines](#testing-guidelines)

---

## 1. Overview

Trend Ankara Mobile Application is a comprehensive radio streaming and content platform built with React Native. The application follows the ReUI design philosophy for consistent user experience across web and mobile platforms.

### Key Features
- Live radio streaming with fallback support
- Dynamic content cards management
- News feed with categories
- Interactive polls system
- Social media integration
- Push notifications
- Offline mode support
- Dark theme (primary)

### Technology Stack
- **Framework**: React Native 0.72+
- **State Management**: Redux Toolkit / Context API
- **Navigation**: React Navigation 6
- **Audio Streaming**: react-native-track-player
- **Storage**: AsyncStorage
- **Networking**: Axios with interceptors
- **UI Components**: Custom ReUI-based components

---

## 2. ReUI Design System Guidelines

### 2.1 Color Palette

#### Primary Brand Colors
```javascript
const colors = {
  // Core Brand Colors (MUST USE THESE)
  brand: {
    primary: '#DC2626',     // Brand Red (rgb(220, 38, 38))
    secondary: '#000000',   // Pure Black
    tertiary: '#FFFFFF',    // Pure White
  },

  // Red Shades for States (Use for different intensities)
  red: {
    50: '#FEF2F2',   // Lightest red for backgrounds
    100: '#FEE2E2',  // Very light red
    200: '#FECACA',  // Light red
    300: '#FCA5A5',  // Medium light red
    400: '#F87171',  // Medium red
    500: '#EF4444',  // Standard red
    600: '#DC2626',  // PRIMARY BRAND RED
    700: '#B91C1C',  // Dark red
    800: '#991B1B',  // Darker red
    900: '#7F1D1D',  // Darkest red
  },

  // Dark Mode Colors (PRIMARY THEME)
  dark: {
    // Backgrounds (use these for layering)
    bgPrimary: '#000000',      // Main background
    bgSecondary: '#0A0A0A',    // Slightly elevated
    bgTertiary: '#141414',     // More elevated

    // Surfaces (for cards, modals, etc.)
    surfacePrimary: '#1A1A1A',    // Card background
    surfaceSecondary: '#242424',  // Elevated card
    surfaceTertiary: '#2E2E2E',   // Highest elevation

    // Borders
    borderPrimary: '#333333',     // Default border
    borderSecondary: '#404040',   // Emphasized border

    // Text Hierarchy (IMPORTANT)
    textPrimary: '#FFFFFF',       // Main text
    textSecondary: '#A0A0A0',     // Secondary text
    textTertiary: '#707070',      // Disabled/hint text
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',    // Green for success
    warning: '#F59E0B',    // Amber for warnings
    error: '#DC2626',      // Use brand red for errors
    info: '#3B82F6',       // Blue for information
  },

  // State Colors
  states: {
    hover: 'rgba(220, 38, 38, 0.1)',      // Red tinted hover
    active: 'rgba(220, 38, 38, 0.2)',     // Red tinted active
    disabled: 'rgba(255, 255, 255, 0.3)', // White with opacity
    focus: '#DC2626',                      // Brand red for focus rings
  }
};
```

### 2.2 Border Radius System

```javascript
const borderRadius = {
  none: 0,
  sm: 6,    // Small components (badges, chips)
  md: 8,    // Default (buttons, inputs)
  lg: 10,   // Cards, modals
  xl: 12,   // Large cards
  '2xl': 16, // Extra large elements
  full: 9999, // Pills, circular elements

  // Component-specific
  button: 8,
  input: 8,
  card: 12,
  modal: 16,
  badge: 6,
  avatar: 9999,
  switch: 9999,
  checkbox: 4,
};
```

### 2.3 Spacing System (8px Base Unit)

```javascript
const spacing = {
  // Base scale (multiply by 4 for pixels)
  0: 0,
  0.5: 2,    // 2px
  1: 4,      // 4px
  1.5: 6,    // 6px
  2: 8,      // 8px - BASE UNIT
  2.5: 10,   // 10px
  3: 12,     // 12px
  3.5: 14,   // 14px
  4: 16,     // 16px - STANDARD PADDING
  5: 20,     // 20px
  6: 24,     // 24px - CARD PADDING
  7: 28,     // 28px
  8: 32,     // 32px
  9: 36,     // 36px
  10: 40,    // 40px - TOUCH TARGET MINIMUM
  11: 44,    // 44px - IOS TOUCH TARGET
  12: 48,    // 48px - ANDROID TOUCH TARGET

  // Component padding standards
  button: {
    x: 16,     // Horizontal padding
    y: 8,      // Vertical padding
  },
  card: {
    padding: 24,  // Card content padding
    gap: 16,      // Gap between card elements
  },
  input: {
    x: 12,     // Horizontal padding
    y: 10,     // Vertical padding
  },
  screen: {
    padding: 16,  // Screen edge padding
    safe: 24,     // Safe area padding
  },
  touchTarget: {
    min: 44,      // Minimum touch target
    compact: 40,  // Compact touch target
    gap: 8,       // Minimum gap between targets
  }
};
```

### 2.4 Typography System

```javascript
const typography = {
  // Font Families
  fontFamily: {
    primary: 'Inter',           // Primary font
    display: 'Inter-Display',   // Display font for headers
    mono: 'JetBrains Mono',    // Monospace for code
  },

  // Font Sizes (Mobile-First)
  fontSize: {
    xs: 12,    // Captions, labels
    sm: 14,    // Small text, mobile default
    base: 16,  // Body text
    lg: 18,    // Large body text
    xl: 20,    // Small headers
    '2xl': 24, // Section headers
    '3xl': 30, // Page headers
    '4xl': 36, // Large headers
    '5xl': 48, // Display headers

    // Specific use cases
    label: 12,
    body: 16,
    button: 14,
    caption: 12,
    header: 24,
    title: 20,
    subtitle: 16,
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',    // Default for UI elements
    semibold: '600',  // Emphasis
    bold: '700',      // Strong emphasis
  },

  // Line Heights
  lineHeight: {
    tight: 1.1,
    snug: 1.3,
    normal: 1.5,    // Default body text
    relaxed: 1.6,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  }
};
```

### 2.5 Shadows & Elevation

```javascript
const shadows = {
  // Elevation levels (iOS style)
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },

  // Component-specific shadows
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  }
};
```

### 2.6 Animation Guidelines

```javascript
const animations = {
  // Duration (milliseconds)
  duration: {
    instant: 0,
    fast: 150,      // Micro interactions
    normal: 200,    // Default transitions
    slow: 300,      // Complex animations
    slower: 500,    // Page transitions
  },

  // Easing functions
  easing: {
    linear: [0, 0, 1, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      mass: 1,
    }
  },

  // Common animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 200,
  },
  slideUp: {
    from: { translateY: 20, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
    duration: 300,
  },
  scale: {
    from: { scale: 0.95 },
    to: { scale: 1 },
    duration: 150,
  }
};
```

---

## 3. API Endpoints & Integration

### 3.1 Base Configuration

```javascript
const API_CONFIG = {
  BASE_URL: 'https://trendankara.com/api/mobile/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
    'X-App-Version': DeviceInfo.getVersion(),
    'X-Device-ID': DeviceInfo.getUniqueId(),
  }
};
```

### 3.2 Mobile Settings Endpoint (UPDATED)

#### Get Mobile Settings
```javascript
GET /api/admin/mobile/settings

Response:
{
  "settings": {
    // Poll Settings
    "enablePolls": true,
    "showOnlyLastActivePoll": true,

    // News Settings
    "enableNews": true,
    "maxNewsCount": 100,

    // Player Settings (NEW)
    "playerLogoUrl": "/api/media/uploads/logo.png",
    "enableLiveInfo": true,              // NEW: Show current playing info
    "playerFacebookUrl": "https://facebook.com/trendankara",    // NEW
    "playerInstagramUrl": "https://instagram.com/trendankara",  // NEW
    "playerWhatsappNumber": "905551234567",                     // NEW
    "liveCallPhoneNumber": "0312 555 12 34",                   // NEW: On-air call number

    // Card Settings
    "maxFeaturedCards": 5,
    "cardDisplayMode": "grid",
    "enableCardAnimation": false,

    // App Settings
    "minimumAppVersion": "1.0.0",
    "maintenanceMode": false
  },
  "lastUpdated": "2025-09-28T12:00:00.000Z"
}
```

### 3.3 Radio Configuration Endpoint (UPDATED)

```javascript
GET /api/mobile/v1/radio

Response:
{
  "success": true,
  "data": {
    "stream_url": "https://radyo.yayin.com.tr:5132/stream",
    "metadata_url": "https://radyo.yayin.com.tr:5132/",
    "station_name": "Trend Ankara Radio",
    "connection_status": "active",
    "last_tested": "2025-09-28T12:00:00.000Z",
    "playerLogoUrl": "/api/media/uploads/logo.png"  // From mobile settings
  }
}
```

### 3.4 Content Cards Endpoint

```javascript
GET /api/mobile/v1/content/cards

Query Parameters:
- featured: boolean (filter featured cards)
- active: boolean (filter active cards)
- limit: number (max cards to return)

Response:
{
  "success": true,
  "cards": [
    {
      "id": 1,
      "title": "Sponsor Card",
      "description": "Premium sponsor content",
      "imageUrl": "/api/media/uploads/card1.jpg",
      "redirectUrl": "https://sponsor.com",
      "redirectType": "website",

      // Contact Information (NEW STRUCTURE)
      "contactEmail": "info@sponsor.com",
      "contactPhone": "+905551234567",
      "contactWhatsapp": "+905551234567",

      // Social Media (NEW)
      "socialInstagram": "@sponsor",
      "socialTiktok": "@sponsor",

      // Location (NEW)
      "locationLatitude": 39.9334,
      "locationLongitude": 32.8597,
      "locationAddress": "Ankara, Turkey",

      // Time Limits (NEW)
      "isTimeLimited": true,
      "validFrom": "2025-09-01T00:00:00.000Z",
      "validUntil": "2025-10-01T00:00:00.000Z",

      // Display Properties
      "isFeatured": true,
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2025-09-01T00:00:00.000Z",
      "updatedAt": "2025-09-28T12:00:00.000Z"
    }
  ],
  "totalCount": 15
}
```

### 3.5 Polls Endpoints

```javascript
// Get current/active polls
GET /api/mobile/v1/polls/current

// Vote on poll
POST /api/mobile/v1/polls/{id}/vote
Body: {
  "itemId": 123,
  "deviceId": "unique-device-id"
}

// Get poll results
GET /api/mobile/v1/polls/{id}/results
```

### 3.6 News Endpoints

```javascript
// Get news list
GET /api/mobile/v1/news
Query: ?page=1&limit=20&category=general

// Get news detail
GET /api/mobile/v1/news/{slug}

// Get news categories
GET /api/mobile/v1/news/categories
```

---

## 4. Mobile Settings Configuration

### 4.1 Settings Service Implementation

```javascript
// services/SettingsService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

class SettingsService {
  constructor() {
    this.settings = null;
    this.cacheKey = 'mobile_settings';
    this.listeners = new Set();
  }

  async fetchSettings() {
    try {
      const response = await apiClient.get('/admin/mobile/settings');
      if (response.data.settings) {
        this.settings = response.data.settings;
        await this.cacheSettings(this.settings);
        this.notifyListeners();
        return this.settings;
      }
    } catch (error) {
      // Fallback to cached settings
      return await this.getCachedSettings();
    }
  }

  async getCachedSettings() {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        this.settings = JSON.parse(cached);
        return this.settings;
      }
    } catch (error) {
      console.error('Error loading cached settings:', error);
    }
    return this.getDefaultSettings();
  }

  async cacheSettings(settings) {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Error caching settings:', error);
    }
  }

  getDefaultSettings() {
    return {
      enablePolls: true,
      showOnlyLastActivePoll: false,
      enableNews: true,
      maxNewsCount: 100,
      playerLogoUrl: null,
      enableLiveInfo: true,
      playerFacebookUrl: null,
      playerInstagramUrl: null,
      playerWhatsappNumber: null,
      liveCallPhoneNumber: null,
      maxFeaturedCards: 5,
      cardDisplayMode: 'grid',
      enableCardAnimation: false,
      minimumAppVersion: '1.0.0',
      maintenanceMode: false
    };
  }

  // Settings getters
  isPollsEnabled() {
    return this.settings?.enablePolls ?? true;
  }

  isNewsEnabled() {
    return this.settings?.enableNews ?? true;
  }

  isLiveInfoEnabled() {
    return this.settings?.enableLiveInfo ?? true;
  }

  getSocialLinks() {
    return {
      facebook: this.settings?.playerFacebookUrl,
      instagram: this.settings?.playerInstagramUrl,
      whatsapp: this.settings?.playerWhatsappNumber,
      liveCall: this.settings?.liveCallPhoneNumber
    };
  }

  getPlayerLogo() {
    return this.settings?.playerLogoUrl;
  }

  getCardSettings() {
    return {
      maxFeatured: this.settings?.maxFeaturedCards ?? 5,
      displayMode: this.settings?.cardDisplayMode ?? 'grid',
      animated: this.settings?.enableCardAnimation ?? false
    };
  }

  // Observer pattern for settings updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.settings));
  }
}

export default new SettingsService();
```

### 4.2 Settings Hook

```javascript
// hooks/useSettings.js
import { useEffect, useState } from 'react';
import SettingsService from '../services/SettingsService';

export const useSettings = () => {
  const [settings, setSettings] = useState(SettingsService.settings);
  const [loading, setLoading] = useState(!SettingsService.settings);

  useEffect(() => {
    // Load settings if not already loaded
    if (!SettingsService.settings) {
      setLoading(true);
      SettingsService.fetchSettings().then(settings => {
        setSettings(settings);
        setLoading(false);
      });
    }

    // Subscribe to settings updates
    const unsubscribe = SettingsService.subscribe(newSettings => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  return {
    settings,
    loading,
    isPollsEnabled: SettingsService.isPollsEnabled(),
    isNewsEnabled: SettingsService.isNewsEnabled(),
    isLiveInfoEnabled: SettingsService.isLiveInfoEnabled(),
    socialLinks: SettingsService.getSocialLinks(),
    playerLogo: SettingsService.getPlayerLogo(),
    cardSettings: SettingsService.getCardSettings()
  };
};
```

---

## 5. Implementation Guidelines

### 5.1 Component Structure

```javascript
// components/Card/ContentCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ContentCard = ({
  card,
  onPress,
  isFeatured = false,
  displayMode = 'grid'
}) => {
  const handleContactPress = (type, value) => {
    switch (type) {
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
      case 'whatsapp':
        Linking.openURL(`whatsapp://send?phone=${value}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'instagram':
        Linking.openURL(`instagram://user?username=${value.replace('@', '')}`);
        break;
      case 'location':
        const { latitude, longitude } = card;
        Linking.openURL(`maps://app?daddr=${latitude},${longitude}`);
        break;
    }
  };

  const isExpired = card.isTimeLimited &&
    new Date(card.validUntil) < new Date();

  if (isExpired) return null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isFeatured && styles.featured,
        displayMode === 'list' && styles.listMode,
        isExpired && styles.expired
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {card.imageUrl && (
        <Image
          source={{ uri: card.imageUrl }}
          style={[
            styles.image,
            displayMode === 'list' && styles.listImage
          ]}
        />
      )}

      <View style={styles.content}>
        {isFeatured && (
          <View style={styles.featuredBadge}>
            <Icon name="star" size={12} color={colors.brand.tertiary} />
            <Text style={styles.featuredText}>ÖNE ÇIKAN</Text>
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {card.title}
        </Text>

        {card.description && (
          <Text style={styles.description} numberOfLines={3}>
            {card.description}
          </Text>
        )}

        {/* Contact Options */}
        <View style={styles.contactOptions}>
          {card.contactPhone && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactPress('phone', card.contactPhone)}
            >
              <Icon name="phone" size={18} color={colors.brand.primary} />
            </TouchableOpacity>
          )}

          {card.contactWhatsapp && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactPress('whatsapp', card.contactWhatsapp)}
            >
              <Icon name="chat" size={18} color="#25D366" />
            </TouchableOpacity>
          )}

          {card.socialInstagram && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactPress('instagram', card.socialInstagram)}
            >
              <Icon name="camera-alt" size={18} color="#E4405F" />
            </TouchableOpacity>
          )}

          {card.locationLatitude && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactPress('location')}
            >
              <Icon name="location-on" size={18} color={colors.brand.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Time Limited Badge */}
        {card.isTimeLimited && (
          <View style={styles.timeLimitBadge}>
            <Icon name="schedule" size={12} color={colors.dark.textSecondary} />
            <Text style={styles.timeLimitText}>
              {new Date(card.validUntil).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.surfacePrimary,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    marginBottom: spacing[4],
    ...shadows.card,
  },
  featured: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  listMode: {
    flexDirection: 'row',
  },
  expired: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  listImage: {
    width: 120,
    height: 120,
  },
  content: {
    padding: spacing[4],
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
  featuredText: {
    color: colors.brand.tertiary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing[1],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.dark.textPrimary,
    marginBottom: spacing[2],
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.dark.textSecondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    marginBottom: spacing[3],
  },
  contactOptions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  contactButton: {
    width: spacing.touchTarget.compact,
    height: spacing.touchTarget.compact,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  timeLimitText: {
    fontSize: typography.fontSize.xs,
    color: colors.dark.textTertiary,
    marginLeft: spacing[1],
  }
});

export default ContentCard;
```

### 5.2 Radio Player Implementation

```javascript
// components/RadioPlayer/RadioPlayer.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking
} from 'react-native';
import TrackPlayer, {
  State,
  usePlaybackState,
  useProgress
} from 'react-native-track-player';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useSettings } from '../../hooks/useSettings';

const RadioPlayer = () => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const { playerLogo, socialLinks, isLiveInfoEnabled } = useSettings();
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const isPlaying = playbackState === State.Playing;
  const isPaused = playbackState === State.Paused;

  useEffect(() => {
    setupPlayer();
    return () => TrackPlayer.destroy();
  }, []);

  const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.add({
      id: 'trendankara-live',
      url: 'https://radyo.yayin.com.tr:5132/stream',
      title: 'Trend Ankara Radio',
      artist: 'Canlı Yayın',
      artwork: playerLogo || require('../../assets/default-radio.png'),
    });
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const handleSocialPress = (platform) => {
    const links = {
      facebook: socialLinks.facebook,
      instagram: socialLinks.instagram,
      whatsapp: `whatsapp://send?phone=${socialLinks.whatsapp}`,
      call: `tel:${socialLinks.liveCall}`
    };

    if (links[platform]) {
      Linking.openURL(links[platform]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Player Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={
            playerLogo
              ? { uri: playerLogo }
              : require('../../assets/default-radio.png')
          }
          style={styles.logo}
        />
        {isPlaying && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
        )}
      </View>

      {/* Now Playing Info */}
      {isLiveInfoEnabled && nowPlaying && (
        <View style={styles.nowPlayingContainer}>
          <Text style={styles.nowPlayingTitle} numberOfLines={1}>
            {nowPlaying.title}
          </Text>
          <Text style={styles.nowPlayingArtist} numberOfLines={1}>
            {nowPlaying.artist}
          </Text>
        </View>
      )}

      {/* Play/Pause Button */}
      <TouchableOpacity
        style={[
          styles.playButton,
          isPlaying && styles.playButtonActive
        ]}
        onPress={togglePlayback}
        disabled={isBuffering}
      >
        {isBuffering ? (
          <ActivityIndicator size="large" color={colors.brand.tertiary} />
        ) : (
          <Icon
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={48}
            color={colors.brand.tertiary}
          />
        )}
      </TouchableOpacity>

      {/* Social Media Links */}
      <View style={styles.socialContainer}>
        {socialLinks.facebook && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialPress('facebook')}
          >
            <Icon name="facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
        )}

        {socialLinks.instagram && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialPress('instagram')}
          >
            <Icon name="camera-alt" size={24} color="#E4405F" />
          </TouchableOpacity>
        )}

        {socialLinks.whatsapp && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialPress('whatsapp')}
          >
            <Icon name="chat" size={24} color="#25D366" />
          </TouchableOpacity>
        )}

        {socialLinks.liveCall && (
          <TouchableOpacity
            style={[styles.socialButton, styles.callButton]}
            onPress={() => handleSocialPress('call')}
          >
            <Icon name="phone" size={20} color={colors.brand.tertiary} />
            <Text style={styles.callText}>CANLI YAYIN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.surfacePrimary,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    alignItems: 'center',
    ...shadows.lg,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing[4],
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveIndicator: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.tertiary,
    marginRight: spacing[1],
  },
  liveText: {
    color: colors.brand.tertiary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  nowPlayingContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  nowPlayingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.dark.textPrimary,
    marginBottom: spacing[1],
  },
  nowPlayingArtist: {
    fontSize: typography.fontSize.base,
    color: colors.dark.textSecondary,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing[4],
    ...shadows.button,
  },
  playButtonActive: {
    backgroundColor: colors.red[700],
  },
  socialContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  socialButton: {
    width: spacing.touchTarget.min,
    height: spacing.touchTarget.min,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: spacing[4],
    backgroundColor: colors.brand.primary,
  },
  callText: {
    color: colors.brand.tertiary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing[2],
  }
});

export default RadioPlayer;
```

---

## 6. UI/UX Standards

### 6.1 Navigation Structure

```javascript
// navigation/AppNavigator.js
const AppNavigator = () => {
  const { settings } = useSettings();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.dark.surfacePrimary,
          borderTopColor: colors.dark.borderPrimary,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.dark.textSecondary,
        headerStyle: {
          backgroundColor: colors.dark.bgPrimary,
        },
        headerTintColor: colors.dark.textPrimary,
      }}
    >
      <Tab.Screen
        name="Radio"
        component={RadioScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="radio" size={24} color={color} />
          ),
          tabBarLabel: 'Radyo',
        }}
      />

      {settings?.enableNews && (
        <Tab.Screen
          name="News"
          component={NewsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="newspaper" size={24} color={color} />
            ),
            tabBarLabel: 'Haberler',
          }}
        />
      )}

      {settings?.enablePolls && (
        <Tab.Screen
          name="Polls"
          component={PollsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="poll" size={24} color={color} />
            ),
            tabBarLabel: 'Anketler',
          }}
        />
      )}

      <Tab.Screen
        name="Cards"
        component={CardsScreen}
        options={{
          tabBarIcon: ({ color }) => (
              <Icon name="dashboard" size={24} color={color} />
          ),
          tabBarLabel: 'Kartlar',
        }}
      />
    </Tab.Navigator>
  );
};
```

### 6.2 Screen Layout Standards

```javascript
// screens/BaseScreen.js
const BaseScreen = ({ children, title, showBack = false }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.dark.bgPrimary}
      />

      {/* Header */}
      <View style={styles.header}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.dark.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen.padding,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderPrimary,
  },
  backButton: {
    width: spacing.touchTarget.min,
    height: spacing.touchTarget.min,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.dark.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.screen.padding,
  }
});
```

---

## 7. State Management

### 7.1 Redux Store Configuration

```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import radioReducer from './slices/radioSlice';
import cardsReducer from './slices/cardsSlice';
import pollsReducer from './slices/pollsSlice';
import newsReducer from './slices/newsSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    radio: radioReducer,
    cards: cardsReducer,
    polls: pollsReducer,
    news: newsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['radio/updatePlaybackState'],
        ignoredPaths: ['radio.currentTrack'],
      },
    }),
});
```

### 7.2 Settings Slice

```javascript
// store/slices/settingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import SettingsService from '../../services/SettingsService';

export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async () => {
    return await SettingsService.fetchSettings();
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    updateSettings: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { updateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
```

---

## 8. Error Handling

### 8.1 Global Error Boundary

```javascript
// components/ErrorBoundary.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to crash reporting service
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Icon name="error-outline" size={64} color={colors.brand.primary} />
          <Text style={styles.title}>Bir Hata Oluştu</Text>
          <Text style={styles.message}>
            Beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatın.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.bgPrimary,
    padding: spacing[6],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.dark.textPrimary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  button: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: colors.brand.tertiary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  }
});

export default ErrorBoundary;
```

### 8.2 API Error Handler

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 400:
        return 'Geçersiz istek. Lütfen bilgileri kontrol edin.';
      case 401:
        return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
      case 403:
        return 'Bu işlem için yetkiniz bulunmamaktadır.';
      case 404:
        return 'İstenen içerik bulunamadı.';
      case 429:
        return 'Çok fazla istek. Lütfen biraz bekleyin.';
      case 500:
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      case 503:
        return 'Servis geçici olarak kullanılamıyor.';
      default:
        return error.response.data?.message || 'Bir hata oluştu.';
    }
  } else if (error.request) {
    // Request made but no response
    return 'İnternet bağlantınızı kontrol edin.';
  } else {
    // Something else happened
    return 'Beklenmeyen bir hata oluştu.';
  }
};
```

---

## 9. Performance Optimization

### 9.1 Image Optimization

```javascript
// components/OptimizedImage.js
import FastImage from 'react-native-fast-image';

const OptimizedImage = ({
  source,
  style,
  placeholder,
  resizeMode = 'cover'
}) => {
  const [loading, setLoading] = useState(true);

  return (
    <View style={style}>
      <FastImage
        style={StyleSheet.absoluteFillObject}
        source={{
          uri: source,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        resizeMode={FastImage.resizeMode[resizeMode]}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && placeholder && (
        <View style={[StyleSheet.absoluteFillObject, styles.placeholder]}>
          {placeholder}
        </View>
      )}
    </View>
  );
};
```

### 9.2 List Optimization

```javascript
// screens/CardsScreen.js
import { FlashList } from '@shopify/flash-list';

const CardsScreen = () => {
  const renderCard = useCallback(({ item }) => (
    <ContentCard
      card={item}
      isFeatured={item.isFeatured}
      displayMode={cardSettings.displayMode}
    />
  ), [cardSettings.displayMode]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <FlashList
      data={cards}
      renderItem={renderCard}
      keyExtractor={keyExtractor}
      estimatedItemSize={200}
      ItemSeparatorComponent={() => <View style={{ height: spacing[4] }} />}
      showsVerticalScrollIndicator={false}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    />
  );
};
```

### 9.3 Memory Management

```javascript
// hooks/useCleanup.js
export const useCleanup = () => {
  useEffect(() => {
    return () => {
      // Clear image cache periodically
      FastImage.clearMemoryCache();

      // Clear old AsyncStorage data
      AsyncStorage.getAllKeys().then(keys => {
        const oldKeys = keys.filter(key => {
          // Remove keys older than 7 days
          const timestamp = extractTimestamp(key);
          return Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000;
        });
        AsyncStorage.multiRemove(oldKeys);
      });
    };
  }, []);
};
```

---

## 10. Testing Guidelines

### 10.1 Unit Testing

```javascript
// __tests__/services/SettingsService.test.js
import SettingsService from '../services/SettingsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch settings from API', async () => {
    const mockSettings = {
      enablePolls: true,
      enableNews: true,
      maxNewsCount: 100,
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ settings: mockSettings }),
      })
    );

    const settings = await SettingsService.fetchSettings();
    expect(settings).toEqual(mockSettings);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'mobile_settings',
      JSON.stringify(mockSettings)
    );
  });

  test('should return cached settings on API failure', async () => {
    const cachedSettings = { enablePolls: false };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedSettings));

    global.fetch = jest.fn(() => Promise.reject('API Error'));

    const settings = await SettingsService.fetchSettings();
    expect(settings).toEqual(cachedSettings);
  });
});
```

### 10.2 Component Testing

```javascript
// __tests__/components/ContentCard.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ContentCard from '../components/Card/ContentCard';

describe('ContentCard', () => {
  const mockCard = {
    id: 1,
    title: 'Test Card',
    description: 'Test Description',
    imageUrl: 'https://test.com/image.jpg',
    contactPhone: '+905551234567',
    isFeatured: true,
  };

  test('renders correctly', () => {
    const { getByText } = render(<ContentCard card={mockCard} />);
    expect(getByText('Test Card')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
  });

  test('shows featured badge when featured', () => {
    const { getByText } = render(<ContentCard card={mockCard} isFeatured />);
    expect(getByText('ÖNE ÇIKAN')).toBeTruthy();
  });

  test('handles contact button press', () => {
    const mockLinking = jest.spyOn(require('react-native').Linking, 'openURL');
    const { getByTestId } = render(<ContentCard card={mockCard} />);

    fireEvent.press(getByTestId('phone-button'));
    expect(mockLinking).toHaveBeenCalledWith('tel:+905551234567');
  });
});
```

### 10.3 Integration Testing

```javascript
// __tests__/integration/RadioPlayer.test.js
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../store';
import RadioPlayer from '../components/RadioPlayer/RadioPlayer';
import TrackPlayer from 'react-native-track-player';

jest.mock('react-native-track-player');

describe('RadioPlayer Integration', () => {
  test('initializes track player on mount', async () => {
    render(
      <Provider store={store}>
        <RadioPlayer />
      </Provider>
    );

    await waitFor(() => {
      expect(TrackPlayer.setupPlayer).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://radyo.yayin.com.tr:5132/stream',
        })
      );
    });
  });
});
```

---

## Appendix A: Migration from Old Documentation

### Changes from Previous Version:

1. **New Settings Fields**:
   - `enableLiveInfo`: Controls display of now-playing information
   - `playerFacebookUrl`, `playerInstagramUrl`, `playerWhatsappNumber`: Social media links
   - `liveCallPhoneNumber`: On-air call-in number for listeners

2. **Card Contact Options**:
   - Replaced single `redirectUrl` with multiple contact options
   - Added social media fields (Instagram, TikTok)
   - Added location support with coordinates

3. **Time-Limited Cards**:
   - New feature for temporary promotional content
   - Automatic expiration handling

4. **Updated API Endpoints**:
   - Mobile settings now at `/api/admin/mobile/settings`
   - Radio config includes player logo URL

5. **Design System Alignment**:
   - Full ReUI design philosophy implementation
   - Dark theme as primary with proper color hierarchy
   - Consistent spacing and touch targets

---

## Appendix B: Quick Reference

### API Base URLs
- Production: `https://trendankara.com/api/mobile/v1`
- Staging: `https://staging.trendankara.com/api/mobile/v1`
- Development: `http://localhost:3000/api/mobile/v1`

### Required Headers
```javascript
{
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Platform': Platform.OS,
  'X-App-Version': DeviceInfo.getVersion(),
  'X-Device-ID': DeviceInfo.getUniqueId()
}
```

### Cache Keys
- Settings: `mobile_settings`
- Radio Config: `radio_config`
- Cards: `content_cards_{timestamp}`
- News: `news_cache_{category}_{page}`
- Polls: `polls_active`

### Touch Targets
- Minimum: 44x44px (iOS standard)
- Android: 48x48px (Material Design)
- Compact: 40x40px (dense layouts)
- Gap: 8px minimum between targets

### Color Usage Priority
1. Brand Red (`#DC2626`) - Primary actions, active states
2. Pure Black (`#000000`) - Main backgrounds
3. Pure White (`#FFFFFF`) - Primary text on dark
4. Dark surfaces - Cards and elevated content
5. Gray shades - Secondary text and borders

---

## Document Version Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0.0 | 2025-09-28 | System | Complete rewrite with ReUI design system, updated settings, new social features |
| 1.0.0 | 2025-09-27 | Initial | Original documentation |

---

END OF DOCUMENTATION