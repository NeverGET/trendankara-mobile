# Mobile Player Social Features API Documentation

## Overview

This guide explains how to integrate the radio player's social contact features into your mobile app. These features allow users to interact with the radio station through WhatsApp, Instagram, Facebook, and direct phone calls.

**Last Updated**: 2025-10-19
**API Version**: v1
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [API Endpoint](#api-endpoint)
3. [Available Features](#available-features)
4. [Field Descriptions](#field-descriptions)
5. [Implementation Guide](#implementation-guide)
6. [Action Types & Deep Links](#action-types--deep-links)
7. [UI/UX Best Practices](#uiux-best-practices)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Examples](#examples)

---

## Quick Start

### 1. Fetch Player Configuration

```typescript
const response = await fetch('https://www.trendankara.com/api/mobile/v1/config');
const { success, data } = await response.json();

if (success) {
  const {
    playerLogoUrl,
    enableLiveInfo,
    playerFacebookUrl,
    playerInstagramUrl,
    playerWhatsappNumber,
    liveCallPhoneNumber
  } = data;

  // Use these fields to enable/disable features
}
```

### 2. Check if Feature is Enabled

```typescript
// Feature is enabled if field exists and has a value
const isWhatsAppEnabled = !!data.playerWhatsappNumber;
const isInstagramEnabled = !!data.playerInstagramUrl;
const isPhoneCallEnabled = !!data.liveCallPhoneNumber;
const isFacebookEnabled = !!data.playerFacebookUrl;
```

### 3. Trigger Actions

```typescript
// WhatsApp
if (data.playerWhatsappNumber) {
  Linking.openURL(`whatsapp://send?phone=${data.playerWhatsappNumber}`);
}

// Instagram
if (data.playerInstagramUrl) {
  Linking.openURL(data.playerInstagramUrl);
}

// Phone Call
if (data.liveCallPhoneNumber) {
  Linking.openURL(`tel:${data.liveCallPhoneNumber}`);
}
```

---

## API Endpoint

### Configuration Endpoint

```
GET /api/mobile/v1/config
```

**Host**: `https://www.trendankara.com`
**Method**: `GET`
**Authentication**: None required
**Cache**: 10 minutes (ETags supported)

### Response Format

```json
{
  "success": true,
  "data": {
    "showOnlyLastActivePoll": false,
    "maxNewsCount": 50,
    "enablePolls": true,
    "enableNews": true,
    "playerLogoUrl": "/api/media/uploads/1758306383548-Trendankara3.png",
    "enableLiveInfo": true,
    "playerFacebookUrl": "https://facebook.com/trendankara",
    "playerInstagramUrl": "https://instagram.com/trendankara",
    "playerWhatsappNumber": "905551234567",
    "liveCallPhoneNumber": "0312 555 12 34",
    "cardDisplayMode": "grid",
    "maxFeaturedCards": 3,
    "enableCardAnimation": true,
    "maintenanceMode": false,
    "minimumAppVersion": "1.0.0",
    "forceUpdate": false
  },
  "cache": {
    "etag": "\"0a37efdedd86ea350a9959d624d84776\"",
    "maxAge": 600
  }
}
```

---

## Available Features

| Feature | Field Name | Type | Purpose |
|---------|-----------|------|---------|
| **WhatsApp Song Request** | `playerWhatsappNumber` | `string \| undefined` | Allow users to send song requests via WhatsApp |
| **Instagram Profile** | `playerInstagramUrl` | `string \| undefined` | Link to station's Instagram profile |
| **Facebook Page** | `playerFacebookUrl` | `string \| undefined` | Link to station's Facebook page |
| **Live Call-In** | `liveCallPhoneNumber` | `string \| undefined` | Phone number for live on-air participation |
| **Player Logo** | `playerLogoUrl` | `string \| undefined` | Custom logo for player branding |
| **Live Info Display** | `enableLiveInfo` | `boolean` | Show/hide current song/program info |

---

## Field Descriptions

### playerWhatsappNumber

**Type**: `string | undefined`
**Format**: International format without `+` (e.g., `"905551234567"`)
**Purpose**: WhatsApp number for song requests and listener interaction

**Usage**:
```typescript
if (config.playerWhatsappNumber) {
  // Feature enabled - show WhatsApp button
  const whatsappUrl = `whatsapp://send?phone=${config.playerWhatsappNumber}`;
  const message = "Merhaba! Şarkı isteğim var."; // Optional pre-filled message
  const fullUrl = `${whatsappUrl}&text=${encodeURIComponent(message)}`;
  Linking.openURL(fullUrl);
}
```

**When to show**:
- ✅ Show when `playerWhatsappNumber` is defined and not empty
- ❌ Hide when `playerWhatsappNumber` is `undefined` or `null`

---

### playerInstagramUrl

**Type**: `string | undefined`
**Format**: Full URL (e.g., `"https://instagram.com/trendankara"`)
**Purpose**: Direct link to station's Instagram profile

**Usage**:
```typescript
if (config.playerInstagramUrl) {
  // Try Instagram app first, fallback to browser
  const username = config.playerInstagramUrl.split('/').pop();
  const instagramAppUrl = `instagram://user?username=${username}`;

  Linking.canOpenURL(instagramAppUrl)
    .then(supported => {
      if (supported) {
        Linking.openURL(instagramAppUrl);
      } else {
        Linking.openURL(config.playerInstagramUrl);
      }
    });
}
```

**When to show**:
- ✅ Show when `playerInstagramUrl` is defined and is a valid URL
- ❌ Hide when `playerInstagramUrl` is `undefined` or `null`

---

### playerFacebookUrl

**Type**: `string | undefined`
**Format**: Full URL (e.g., `"https://facebook.com/trendankara"`)
**Purpose**: Direct link to station's Facebook page

**Usage**:
```typescript
if (config.playerFacebookUrl) {
  // Try Facebook app first, fallback to browser
  const pageId = extractFacebookPageId(config.playerFacebookUrl);
  const facebookAppUrl = `fb://page/${pageId}`;

  Linking.canOpenURL(facebookAppUrl)
    .then(supported => {
      if (supported) {
        Linking.openURL(facebookAppUrl);
      } else {
        Linking.openURL(config.playerFacebookUrl);
      }
    });
}
```

**When to show**:
- ✅ Show when `playerFacebookUrl` is defined and is a valid URL
- ❌ Hide when `playerFacebookUrl` is `undefined` or `null`

---

### liveCallPhoneNumber

**Type**: `string | undefined`
**Format**: Turkish phone format (e.g., `"0312 555 12 34"`)
**Purpose**: Phone number for live on-air participation

**Usage**:
```typescript
if (config.liveCallPhoneNumber) {
  // Clean the number for tel: protocol
  const cleanNumber = config.liveCallPhoneNumber.replace(/\s/g, '');
  const telUrl = `tel:${cleanNumber}`;

  // Optional: Show confirmation dialog
  Alert.alert(
    'Canlı Yayın Hattı',
    `${config.liveCallPhoneNumber} numarasını aramak istiyor musunuz?`,
    [
      { text: 'İptal', style: 'cancel' },
      { text: 'Ara', onPress: () => Linking.openURL(telUrl) }
    ]
  );
}
```

**When to show**:
- ✅ Show when `liveCallPhoneNumber` is defined and not empty
- ❌ Hide when `liveCallPhoneNumber` is `undefined` or `null`

---

### playerLogoUrl

**Type**: `string | undefined`
**Format**: Relative path (e.g., `"/api/media/uploads/1758306383548-Trendankara3.png"`)
**Purpose**: Custom logo for player branding

**Usage**:
```typescript
const logoUrl = config.playerLogoUrl
  ? `https://www.trendankara.com${config.playerLogoUrl}`
  : require('./assets/default-logo.png');

<Image source={{ uri: logoUrl }} style={styles.playerLogo} />
```

**When to show**:
- ✅ Show when `playerLogoUrl` is defined
- ❌ Use default logo when `playerLogoUrl` is `undefined`

---

### enableLiveInfo

**Type**: `boolean`
**Default**: `false`
**Purpose**: Control visibility of current song/program information

**Usage**:
```typescript
{config.enableLiveInfo && (
  <View style={styles.liveInfo}>
    <Text style={styles.currentSong}>{currentSong}</Text>
    <Text style={styles.currentProgram}>{currentProgram}</Text>
  </View>
)}
```

---

## Implementation Guide

### Step 1: Fetch Configuration on App Launch

```typescript
import { useEffect, useState } from 'react';

interface PlayerConfig {
  playerLogoUrl?: string;
  enableLiveInfo?: boolean;
  playerFacebookUrl?: string;
  playerInstagramUrl?: string;
  playerWhatsappNumber?: string;
  liveCallPhoneNumber?: string;
}

export function usePlayerConfig() {
  const [config, setConfig] = useState<PlayerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://www.trendankara.com/api/mobile/v1/config');

      if (!response.ok) {
        throw new Error('Failed to fetch config');
      }

      const { success, data } = await response.json();

      if (success) {
        setConfig(data);
      } else {
        throw new Error('Config fetch unsuccessful');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching player config:', err);
    } finally {
      setLoading(false);
    }
  };

  return { config, loading, error, refetch: fetchConfig };
}
```

### Step 2: Create Social Actions Component

```typescript
import React from 'react';
import { View, TouchableOpacity, Linking, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface SocialActionsProps {
  config: PlayerConfig;
}

export function SocialActions({ config }: SocialActionsProps) {
  const handleWhatsApp = () => {
    if (!config.playerWhatsappNumber) return;

    const message = "Merhaba! Şarkı isteğim var.";
    const url = `whatsapp://send?phone=${config.playerWhatsappNumber}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Hata', 'WhatsApp uygulaması yüklü değil.');
        }
      })
      .catch(err => console.error('WhatsApp error:', err));
  };

  const handleInstagram = () => {
    if (!config.playerInstagramUrl) return;

    const username = config.playerInstagramUrl.split('/').pop();
    const appUrl = `instagram://user?username=${username}`;

    Linking.canOpenURL(appUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(appUrl);
        } else {
          Linking.openURL(config.playerInstagramUrl!);
        }
      })
      .catch(err => console.error('Instagram error:', err));
  };

  const handleFacebook = () => {
    if (!config.playerFacebookUrl) return;

    Linking.openURL(config.playerFacebookUrl)
      .catch(err => console.error('Facebook error:', err));
  };

  const handlePhoneCall = () => {
    if (!config.liveCallPhoneNumber) return;

    const cleanNumber = config.liveCallPhoneNumber.replace(/\s/g, '');

    Alert.alert(
      'Canlı Yayın Hattı',
      `${config.liveCallPhoneNumber} numarasını aramak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ara',
          onPress: () => Linking.openURL(`tel:${cleanNumber}`)
        }
      ]
    );
  };

  return (
    <View style={styles.socialActions}>
      {config.playerWhatsappNumber && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleWhatsApp}
          accessibilityLabel="WhatsApp ile şarkı iste"
        >
          <Icon name="whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>
      )}

      {config.playerInstagramUrl && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleInstagram}
          accessibilityLabel="Instagram'da takip et"
        >
          <Icon name="instagram" size={24} color="#E4405F" />
        </TouchableOpacity>
      )}

      {config.playerFacebookUrl && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleFacebook}
          accessibilityLabel="Facebook'ta takip et"
        >
          <Icon name="facebook" size={24} color="#1877F2" />
        </TouchableOpacity>
      )}

      {config.liveCallPhoneNumber && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePhoneCall}
          accessibilityLabel="Canlı yayını ara"
        >
          <Icon name="phone" size={24} color="#34C759" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  socialActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
```

### Step 3: Integrate into Player Screen

```typescript
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { usePlayerConfig } from './hooks/usePlayerConfig';
import { SocialActions } from './components/SocialActions';
import { PlayerLogo } from './components/PlayerLogo';

export function PlayerScreen() {
  const { config, loading, error } = usePlayerConfig();

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (error || !config) {
    return <Text>Failed to load player configuration</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Player Logo */}
      {config.playerLogoUrl && (
        <PlayerLogo url={config.playerLogoUrl} />
      )}

      {/* Radio Player Controls */}
      <RadioControls />

      {/* Live Info (if enabled) */}
      {config.enableLiveInfo && (
        <LiveInfo />
      )}

      {/* Social Actions */}
      <SocialActions config={config} />
    </View>
  );
}
```

---

## Action Types & Deep Links

### WhatsApp Deep Link

**Format**:
```
whatsapp://send?phone={number}&text={message}
```

**Example**:
```typescript
const url = `whatsapp://send?phone=905551234567&text=${encodeURIComponent('Merhaba!')}`;
```

**Fallback**: If WhatsApp not installed, show error message

---

### Instagram Deep Link

**App URL**:
```
instagram://user?username={username}
```

**Web Fallback**:
```
https://instagram.com/{username}
```

**Example**:
```typescript
const username = 'trendankara';
const appUrl = `instagram://user?username=${username}`;
const webUrl = `https://instagram.com/${username}`;
```

---

### Facebook Deep Link

**App URL**:
```
fb://page/{pageId}
```

**Web Fallback**:
```
https://facebook.com/{pageName}
```

**Example**:
```typescript
const webUrl = 'https://facebook.com/trendankara';
// Try app first, fallback to web
```

---

### Phone Call

**Format**:
```
tel:{number}
```

**Example**:
```typescript
const number = '03125551234';
const url = `tel:${number}`;
```

**Best Practice**: Always show confirmation dialog before initiating call

---

## UI/UX Best Practices

### 1. **Progressive Disclosure**

Show only enabled features:
```typescript
const enabledFeaturesCount = [
  config.playerWhatsappNumber,
  config.playerInstagramUrl,
  config.playerFacebookUrl,
  config.liveCallPhoneNumber
].filter(Boolean).length;

// Only show social section if at least one feature is enabled
{enabledFeaturesCount > 0 && (
  <SocialActions config={config} />
)}
```

### 2. **Icon Colors**

Use recognizable brand colors:
- WhatsApp: `#25D366` (green)
- Instagram: `#E4405F` (pink/gradient)
- Facebook: `#1877F2` (blue)
- Phone: `#34C759` (green) or your app's primary color

### 3. **Loading States**

```typescript
{loading ? (
  <ActivityIndicator />
) : (
  <SocialActions config={config} />
)}
```

### 4. **Error Handling**

```typescript
if (!config.playerWhatsappNumber) {
  // Don't show WhatsApp button
  return null;
}

// Handle WhatsApp not installed
Linking.canOpenURL(url).then(supported => {
  if (!supported) {
    Alert.alert(
      'WhatsApp Bulunamadı',
      'WhatsApp uygulaması telefonunuzda yüklü değil.'
    );
  }
});
```

### 5. **Accessibility**

```typescript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="WhatsApp ile şarkı iste"
  accessibilityHint="WhatsApp uygulamasını açar"
>
  <Icon name="whatsapp" />
</TouchableOpacity>
```

---

## Error Handling

### API Request Errors

```typescript
try {
  const response = await fetch(API_URL);

  if (!response.ok) {
    if (response.status === 503) {
      // Maintenance mode
      showMaintenanceMessage();
    } else if (response.status >= 500) {
      // Server error - retry
      setTimeout(() => fetchConfig(), 5000);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  const { success, data, error } = await response.json();

  if (!success) {
    throw new Error(error || 'Unknown error');
  }

  return data;
} catch (error) {
  console.error('Config fetch error:', error);
  // Use cached config if available
  return getCachedConfig();
}
```

### Deep Link Errors

```typescript
const openDeepLink = async (url: string, appName: string) => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(
        `${appName} Bulunamadı`,
        `${appName} uygulaması yüklü değil.`
      );
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error(`Error opening ${appName}:`, error);
    Alert.alert('Hata', `${appName} açılırken bir hata oluştu.`);
    return false;
  }
};
```

---

## Testing

### Unit Tests

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { usePlayerConfig } from './usePlayerConfig';

describe('usePlayerConfig', () => {
  it('should fetch config successfully', async () => {
    const { result, waitForNextUpdate } = renderHook(() => usePlayerConfig());

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.config).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should have WhatsApp number if enabled', async () => {
    const { result, waitForNextUpdate } = renderHook(() => usePlayerConfig());

    await waitForNextUpdate();

    if (result.current.config?.playerWhatsappNumber) {
      expect(result.current.config.playerWhatsappNumber).toMatch(/^\d+$/);
    }
  });
});
```

### Integration Tests

```typescript
describe('SocialActions', () => {
  const mockConfig = {
    playerWhatsappNumber: '905551234567',
    playerInstagramUrl: 'https://instagram.com/trendankara',
    liveCallPhoneNumber: '0312 555 12 34'
  };

  it('should render enabled buttons', () => {
    const { getByA11yLabel } = render(<SocialActions config={mockConfig} />);

    expect(getByA11yLabel('WhatsApp ile şarkı iste')).toBeDefined();
    expect(getByA11yLabel("Instagram'da takip et")).toBeDefined();
    expect(getByA11yLabel('Canlı yayını ara')).toBeDefined();
  });

  it('should open WhatsApp on button press', () => {
    const { getByA11yLabel } = render(<SocialActions config={mockConfig} />);

    const button = getByA11yLabel('WhatsApp ile şarkı iste');
    fireEvent.press(button);

    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('whatsapp://send?phone=905551234567')
    );
  });
});
```

### Manual Testing Checklist

- [ ] WhatsApp button opens WhatsApp app
- [ ] Pre-filled message appears in WhatsApp
- [ ] Instagram button opens Instagram app (if installed)
- [ ] Instagram button opens browser (if app not installed)
- [ ] Facebook button opens correct page
- [ ] Phone button shows confirmation dialog
- [ ] Phone button initiates call after confirmation
- [ ] Disabled features don't show buttons
- [ ] Loading states display correctly
- [ ] Error states handle gracefully

---

## Examples

### Complete Implementation Example

```typescript
// PlayerScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface PlayerConfig {
  playerLogoUrl?: string;
  enableLiveInfo?: boolean;
  playerFacebookUrl?: string;
  playerInstagramUrl?: string;
  playerWhatsappNumber?: string;
  liveCallPhoneNumber?: string;
}

export function PlayerScreen() {
  const [config, setConfig] = useState<PlayerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('https://www.trendankara.com/api/mobile/v1/config');
      const { success, data } = await response.json();

      if (success) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!config?.playerWhatsappNumber) return;

    const message = "Merhaba! Şarkı isteğim var.";
    const url = `whatsapp://send?phone=${config.playerWhatsappNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'WhatsApp açılamadı.');
    });
  };

  const handleInstagram = () => {
    if (!config?.playerInstagramUrl) return;

    const username = config.playerInstagramUrl.split('/').pop();
    const appUrl = `instagram://user?username=${username}`;

    Linking.canOpenURL(appUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(appUrl);
        } else {
          return Linking.openURL(config.playerInstagramUrl!);
        }
      })
      .catch(() => {
        Alert.alert('Hata', 'Instagram açılamadı.');
      });
  };

  const handlePhoneCall = () => {
    if (!config?.liveCallPhoneNumber) return;

    const cleanNumber = config.liveCallPhoneNumber.replace(/\s/g, '');

    Alert.alert(
      'Canlı Yayın Hattı',
      `${config.liveCallPhoneNumber} numarasını aramak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ara',
          onPress: () => Linking.openURL(`tel:${cleanNumber}`)
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E31E24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Player Logo */}
      {config?.playerLogoUrl && (
        <Image
          source={{ uri: `https://www.trendankara.com${config.playerLogoUrl}` }}
          style={styles.logo}
          resizeMode="contain"
        />
      )}

      {/* Radio Controls */}
      <View style={styles.controls}>
        {/* Your radio player controls here */}
      </View>

      {/* Social Actions */}
      <View style={styles.socialActions}>
        {config?.playerWhatsappNumber && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleWhatsApp}
            accessibilityLabel="WhatsApp ile şarkı iste"
          >
            <Icon name="whatsapp" size={28} color="#25D366" />
            <Text style={styles.socialLabel}>WhatsApp</Text>
          </TouchableOpacity>
        )}

        {config?.playerInstagramUrl && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleInstagram}
            accessibilityLabel="Instagram'da takip et"
          >
            <Icon name="instagram" size={28} color="#E4405F" />
            <Text style={styles.socialLabel}>Instagram</Text>
          </TouchableOpacity>
        )}

        {config?.liveCallPhoneNumber && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handlePhoneCall}
            accessibilityLabel="Canlı yayını ara"
          >
            <Icon name="phone" size={28} color="#34C759" />
            <Text style={styles.socialLabel}>Canlı Hat</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Live Info */}
      {config?.enableLiveInfo && (
        <View style={styles.liveInfo}>
          <Text style={styles.liveInfoLabel}>Şimdi Çalıyor</Text>
          <Text style={styles.songTitle}>Şarkı Adı</Text>
          <Text style={styles.artistName}>Sanatçı</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  logo: {
    width: 200,
    height: 100,
    alignSelf: 'center',
    marginTop: 40,
  },
  controls: {
    flex: 1,
    justifyContent: 'center',
  },
  socialActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingVertical: 30,
  },
  socialButton: {
    alignItems: 'center',
    gap: 8,
  },
  socialLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  liveInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  liveInfoLabel: {
    color: '#E31E24',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  songTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artistName: {
    color: '#aaa',
    fontSize: 14,
  },
});
```

---

## FAQs

### Q: How often should I fetch the configuration?

**A**: The API has a 10-minute cache. Fetch on:
- App launch
- When returning to foreground (if > 10 minutes)
- After receiving a push notification about config changes (future feature)

### Q: What if a user doesn't have WhatsApp installed?

**A**: Use `Linking.canOpenURL()` to check first, or catch the error and show a user-friendly message.

### Q: Should I cache the configuration locally?

**A**: Yes! Cache the config in AsyncStorage and use it as a fallback if the API request fails.

### Q: Can admin disable features in real-time?

**A**: Yes. When admin clears a field (e.g., WhatsApp number), the next API call will return `undefined` for that field. Your app should handle this by hiding the button.

### Q: What about analytics?

**A**: Track these events:
- `social_button_clicked` with parameter `type: whatsapp | instagram | facebook | phone`
- `whatsapp_opened`
- `instagram_opened`
- `phone_call_initiated`

---

## Support

For questions or issues:

1. **Check API Response**: Test `https://www.trendankara.com/api/mobile/v1/config`
2. **Review Logs**: Check console for error messages
3. **Contact Backend Team**: Provide error logs and steps to reproduce
4. **Documentation Updates**: Submit PR to update this guide

---

## Changelog

### 2025-10-19 - Initial Release
- Added WhatsApp song request feature
- Added Instagram profile link
- Added Facebook page link
- Added live call-in phone number
- Added player logo customization
- Added live info toggle

---

**Happy Coding! 🎵📻**
