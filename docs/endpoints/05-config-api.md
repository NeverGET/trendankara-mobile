# Configuration API

## Overview
The Configuration API provides app settings, version information, and feature flags for the mobile application. It also includes maintenance mode status and custom messages.

## Endpoints

### 1. Get App Configuration

Retrieves the current application configuration and settings.

**Endpoint:** `GET /config`

**Production URL:** `https://trendankara.com/api/mobile/v1/config`

#### Request
```javascript
GET https://trendankara.com/api/mobile/v1/config
Headers:
  Accept: application/json
  X-App-Version: 1.0.0
  X-Platform: ios
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "appVersion": "1.0.5",
    "minVersion": "1.0.0",
    "forceUpdate": false,
    "maintenanceMode": false,
    "maintenanceMessage": null,
    "features": {
      "polls": true,
      "news": true,
      "radio": true,
      "podcasts": true,
      "notifications": true,
      "darkMode": false,
      "comments": false
    },
    "endpoints": {
      "api": "https://trendankara.com/api/mobile/v1",
      "ws": "wss://trendankara.com/ws",
      "cdn": "https://cdn.trendankara.com"
    },
    "radio": {
      "streamUrl": "https://trendankara.com/stream/live",
      "fallbackUrl": "https://backup.trendankara.com/stream/live",
      "bitrate": 128,
      "format": "mp3"
    },
    "social": {
      "facebook": "https://facebook.com/trendankara",
      "instagram": "https://instagram.com/trendankara",
      "twitter": "https://twitter.com/trendankara",
      "youtube": "https://youtube.com/trendankara"
    },
    "contact": {
      "phone": "+90 312 123 45 67",
      "email": "info@trendankara.com",
      "whatsapp": "+905321234567"
    },
    "analytics": {
      "googleAnalyticsId": "UA-XXXXXXXXX-X",
      "firebaseEnabled": true
    },
    "ads": {
      "enabled": true,
      "admobAppId": "ca-app-pub-XXXXXXXXX",
      "bannerAdUnitId": "ca-app-pub-XXXXXXXXX/XXXXXXXXX",
      "interstitialAdUnitId": "ca-app-pub-XXXXXXXXX/XXXXXXXXX"
    }
  },
  "cache": {
    "etag": "\"config-v1.0.5\"",
    "maxAge": 3600
  }
}
```

#### Maintenance Mode Response (200 OK)
```json
{
  "success": true,
  "data": {
    "appVersion": "1.0.5",
    "minVersion": "1.0.0",
    "forceUpdate": false,
    "maintenanceMode": true,
    "maintenanceMessage": "Sistem bakım çalışması nedeniyle geçici olarak hizmet veremiyor. Lütfen daha sonra tekrar deneyin.",
    "maintenanceEndTime": "2025-09-27T15:00:00.000Z",
    "features": {
      "polls": false,
      "news": false,
      "radio": true,
      "podcasts": false,
      "notifications": false,
      "darkMode": false,
      "comments": false
    }
  }
}
```

### 2. Check App Version

Check if the current app version needs to be updated.

**Endpoint:** `POST /config/version-check`

**Production URL:** `https://trendankara.com/api/mobile/v1/config/version-check`

#### Request
```javascript
POST https://trendankara.com/api/mobile/v1/config/version-check
Headers:
  Accept: application/json
  Content-Type: application/json

Body:
{
  "currentVersion": "1.0.0",
  "platform": "ios",
  "deviceInfo": {
    "model": "iPhone12,1",
    "osVersion": "14.0"
  }
}
```

#### Update Required Response (200 OK)
```json
{
  "success": true,
  "data": {
    "updateRequired": true,
    "forceUpdate": true,
    "latestVersion": "1.0.5",
    "minVersion": "1.0.3",
    "updateUrl": "https://apps.apple.com/app/trendankara/id123456789",
    "releaseNotes": [
      "Yeni anket özellikleri eklendi",
      "Performans iyileştirmeleri yapıldı",
      "Hata düzeltmeleri"
    ],
    "message": "Uygulamayı kullanmaya devam etmek için güncelleme gerekli."
  }
}
```

#### No Update Required Response (200 OK)
```json
{
  "success": true,
  "data": {
    "updateRequired": false,
    "forceUpdate": false,
    "latestVersion": "1.0.5",
    "currentVersion": "1.0.5",
    "message": "Uygulama güncel"
  }
}
```

## React Native Implementation

### Config Service
```javascript
// services/configService.js
import apiClient from '../api/authenticatedClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

class ConfigService {
  constructor() {
    this.config = null;
    this.configKey = 'app_config';
    this.configTimestampKey = 'app_config_timestamp';
    this.cacheDuration = 3600000; // 1 hour
  }

  async getConfig(forceRefresh = false) {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedConfig = await this.getCachedConfig();
        if (cachedConfig) {
          return cachedConfig;
        }
      }

      // Fetch fresh config
      const response = await apiClient.get('/config');

      if (response.success && response.data) {
        // Cache the config
        await this.cacheConfig(response.data);
        this.config = response.data;
        return response.data;
      }

      throw new Error('Invalid config response');
    } catch (error) {
      // Return cached config on error
      const cachedConfig = await this.getCachedConfig();
      if (cachedConfig) {
        return cachedConfig;
      }
      throw error;
    }
  }

  async getCachedConfig() {
    try {
      const timestamp = await AsyncStorage.getItem(this.configTimestampKey);

      if (timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < this.cacheDuration) {
          const config = await AsyncStorage.getItem(this.configKey);
          if (config) {
            return JSON.parse(config);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error reading cached config:', error);
      return null;
    }
  }

  async cacheConfig(config) {
    try {
      await AsyncStorage.setItem(this.configKey, JSON.stringify(config));
      await AsyncStorage.setItem(this.configTimestampKey, Date.now().toString());
    } catch (error) {
      console.error('Error caching config:', error);
    }
  }

  async checkForUpdate() {
    try {
      const currentVersion = DeviceInfo.getVersion();
      const platform = Platform.OS;

      const response = await apiClient.post('/config/version-check', {
        currentVersion,
        platform,
        deviceInfo: {
          model: DeviceInfo.getModel(),
          osVersion: DeviceInfo.getSystemVersion()
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  isFeatureEnabled(featureName) {
    if (!this.config || !this.config.features) {
      return false;
    }
    return this.config.features[featureName] === true;
  }

  isMaintenanceMode() {
    return this.config?.maintenanceMode === true;
  }

  getStreamUrl() {
    return this.config?.radio?.streamUrl || null;
  }

  getSocialLinks() {
    return this.config?.social || {};
  }
}

export default new ConfigService();
```

### App Initialization with Config
```javascript
// App.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  Linking,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import configService from './services/configService';
import MainNavigator from './navigation/MainNavigator';
import MaintenanceScreen from './screens/MaintenanceScreen';
import UpdateRequiredScreen from './screens/UpdateRequiredScreen';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Get app configuration
      const appConfig = await configService.getConfig();
      setConfig(appConfig);

      // Check for updates
      const updateInfo = await configService.checkForUpdate();

      if (updateInfo.updateRequired) {
        setUpdateRequired(true);
        setForceUpdate(updateInfo.forceUpdate);

        if (!updateInfo.forceUpdate) {
          // Show optional update alert
          Alert.alert(
            'Güncelleme Mevcut',
            updateInfo.message || 'Yeni bir güncelleme mevcut. Güncellemek ister misiniz?',
            [
              { text: 'Daha Sonra', style: 'cancel' },
              {
                text: 'Güncelle',
                onPress: () => handleUpdate(updateInfo.updateUrl)
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert(
        'Bağlantı Hatası',
        'Uygulama başlatılırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = (updateUrl) => {
    if (updateUrl) {
      Linking.openURL(updateUrl);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  // Force update required
  if (updateRequired && forceUpdate) {
    return <UpdateRequiredScreen onUpdate={handleUpdate} />;
  }

  // Maintenance mode
  if (config?.maintenanceMode) {
    return (
      <MaintenanceScreen
        message={config.maintenanceMessage}
        endTime={config.maintenanceEndTime}
      />
    );
  }

  // Normal app
  return <MainNavigator config={config} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default App;
```

### Feature Flag Usage
```javascript
// screens/HomeScreen.js
import React from 'react';
import { View, Text } from 'react-native';
import configService from '../services/configService';

const HomeScreen = () => {
  const showPolls = configService.isFeatureEnabled('polls');
  const showNews = configService.isFeatureEnabled('news');
  const showPodcasts = configService.isFeatureEnabled('podcasts');

  return (
    <View>
      {showPolls && <PollSection />}
      {showNews && <NewsSection />}
      {showPodcasts && <PodcastSection />}
    </View>
  );
};
```

### Maintenance Screen
```javascript
// screens/MaintenanceScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity
} from 'react-native';

const MaintenanceScreen = ({ message, endTime }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (endTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const end = new Date(endTime).getTime();
        const diff = end - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours} saat ${minutes} dakika`);
        } else {
          setTimeRemaining('Yakında');
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [endTime]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/maintenance.png')}
        style={styles.image}
      />
      <Text style={styles.title}>Bakım Çalışması</Text>
      <Text style={styles.message}>
        {message || 'Sistem bakımda. Lütfen daha sonra tekrar deneyin.'}
      </Text>
      {timeRemaining && (
        <Text style={styles.time}>
          Tahmini süre: {timeRemaining}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  time: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 10,
  },
});

export default MaintenanceScreen;
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Network timeout | Slow connection | Use cached config |
| Invalid version format | Malformed version string | Use semantic versioning |
| Missing config | Server error | Fallback to default config |

## Best Practices

1. **Cache Configuration**: Store config locally and refresh periodically
2. **Feature Flags**: Use feature flags to enable/disable features remotely
3. **Version Checking**: Check for updates on app launch and resume
4. **Graceful Degradation**: Always have fallback values for critical settings
5. **Maintenance Mode**: Handle maintenance mode gracefully with clear messaging