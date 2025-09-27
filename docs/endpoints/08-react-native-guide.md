# React Native Implementation Guide

## Overview
This guide provides a complete implementation reference for integrating the TrendAnkara API into a React Native application.

## Project Setup

### 1. Initial Setup
```bash
# Create new React Native project
npx react-native init TrendAnkara
cd TrendAnkara

# Install required dependencies
npm install axios \
  @react-native-async-storage/async-storage \
  react-native-uuid \
  react-native-device-info \
  react-native-vector-icons \
  react-native-track-player \
  react-native-webview \
  @react-navigation/native \
  @react-navigation/stack \
  @react-navigation/bottom-tabs \
  react-native-safe-area-context \
  react-native-screens \
  react-native-gesture-handler \
  react-native-reanimated

# iOS specific
cd ios && pod install
```

### 2. Project Structure
```
TrendAnkara/
├── src/
│   ├── api/
│   │   ├── client.js           # Base API client
│   │   └── authenticatedClient.js # Client with auth headers
│   ├── services/
│   │   ├── pollService.js      # Poll API service
│   │   ├── newsService.js      # News API service
│   │   ├── cardService.js      # Cards API service
│   │   ├── configService.js    # Config API service
│   │   └── radioService.js     # Radio API service
│   ├── screens/
│   │   ├── HomeScreen.js       # Home with cards
│   │   ├── PollsScreen.js      # Polls listing
│   │   ├── NewsScreen.js       # News listing
│   │   ├── RadioScreen.js      # Radio player
│   │   └── SettingsScreen.js   # App settings
│   ├── components/
│   │   ├── PollCard.js         # Poll component
│   │   ├── NewsCard.js         # News card
│   │   ├── CardCarousel.js     # Card carousel
│   │   └── ErrorView.js        # Error display
│   ├── navigation/
│   │   └── MainNavigator.js    # App navigation
│   ├── utils/
│   │   ├── deviceId.js         # Device ID management
│   │   ├── errorHandler.js     # Error handling
│   │   └── cache.js            # Cache utilities
│   ├── hooks/
│   │   ├── useAPICall.js       # API call hook
│   │   └── useCache.js         # Cache hook
│   └── constants/
│       └── index.js            # App constants
├── App.js                      # Main app component
└── index.js                    # App entry point
```

## Core Implementation

### 1. Base API Client
```javascript
// src/api/client.js
import axios from 'axios';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getDeviceId } from '../utils/deviceId';

const BASE_URL = __DEV__
  ? 'http://localhost:3000/api/mobile/v1'
  : 'https://trendankara.com/api/mobile/v1';

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    this.setupInterceptors();
  }

  async setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const deviceId = await getDeviceId();

        config.headers = {
          ...config.headers,
          'X-Device-ID': deviceId,
          'X-Platform': Platform.OS,
          'X-App-Version': DeviceInfo.getVersion(),
          'User-Agent': `TrendAnkara/${DeviceInfo.getVersion()} (${Platform.OS} ${DeviceInfo.getSystemVersion()})`
        };

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Handle successful response
        if (response.data?.success === false) {
          return Promise.reject({
            response: {
              status: response.status,
              data: response.data
            }
          });
        }
        return response.data;
      },
      (error) => {
        // Enhanced error handling
        return Promise.reject(error);
      }
    );
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    return this.client.get(endpoint, { params });
  }

  async post(endpoint, data = {}) {
    return this.client.post(endpoint, data);
  }

  async put(endpoint, data = {}) {
    return this.client.put(endpoint, data);
  }

  async delete(endpoint) {
    return this.client.delete(endpoint);
  }
}

export default new APIClient();
```

### 2. App Navigation
```javascript
// src/navigation/MainNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import PollsScreen from '../screens/PollsScreen';
import NewsScreen from '../screens/NewsScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import RadioScreen from '../screens/RadioScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// News Stack
const NewsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="NewsList"
      component={NewsScreen}
      options={{ title: 'Haberler' }}
    />
    <Stack.Screen
      name="NewsDetail"
      component={NewsDetailScreen}
      options={{ title: 'Haber Detayı' }}
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainNavigator = ({ config }) => {
  const isFeatureEnabled = (feature) => {
    return config?.features?.[feature] !== false;
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Home':
                iconName = 'home';
                break;
              case 'Polls':
                iconName = 'poll';
                break;
              case 'News':
                iconName = 'article';
                break;
              case 'Radio':
                iconName = 'radio';
                break;
              case 'Settings':
                iconName = 'settings';
                break;
              default:
                iconName = 'circle';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#E91E63',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Ana Sayfa' }}
        />
        {isFeatureEnabled('polls') && (
          <Tab.Screen
            name="Polls"
            component={PollsScreen}
            options={{ title: 'Anketler' }}
          />
        )}
        {isFeatureEnabled('news') && (
          <Tab.Screen
            name="News"
            component={NewsStack}
            options={{ title: 'Haberler', headerShown: false }}
          />
        )}
        {isFeatureEnabled('radio') && (
          <Tab.Screen
            name="Radio"
            component={RadioScreen}
            options={{ title: 'Radyo' }}
          />
        )}
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Ayarlar' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
```

### 3. Main App Component
```javascript
// App.js
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  Alert,
  View,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import configService from './src/services/configService';
import UpdateRequiredScreen from './src/screens/UpdateRequiredScreen';
import MaintenanceScreen from './src/screens/MaintenanceScreen';
import SplashScreen from './src/screens/SplashScreen';

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [config, setConfig] = useState(null);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Fetch app configuration
      const appConfig = await configService.getConfig();
      setConfig(appConfig);

      // Check for updates
      const updateInfo = await configService.checkForUpdate();

      if (updateInfo.updateRequired) {
        setUpdateRequired(true);
        setForceUpdate(updateInfo.forceUpdate);

        if (!updateInfo.forceUpdate) {
          Alert.alert(
            'Güncelleme Mevcut',
            'Yeni özellikler için uygulamayı güncelleyin.',
            [
              { text: 'Sonra', style: 'cancel' },
              { text: 'Güncelle', onPress: () => handleUpdate(updateInfo.updateUrl) }
            ]
          );
        }
      }

      // Simulate minimum loading time for smooth transition
      setTimeout(() => {
        setIsInitializing(false);
      }, 1500);
    } catch (error) {
      console.error('Initialization error:', error);
      setIsInitializing(false);

      Alert.alert(
        'Bağlantı Hatası',
        'Uygulama başlatılamadı. İnternet bağlantınızı kontrol edin.',
        [
          { text: 'Tekrar Dene', onPress: initializeApp },
          { text: 'Çevrimdışı Devam Et', style: 'cancel' }
        ]
      );
    }
  };

  const handleUpdate = (updateUrl) => {
    // Navigate to app store
    if (updateUrl) {
      Linking.openURL(updateUrl);
    }
  };

  if (isInitializing) {
    return <SplashScreen />;
  }

  if (updateRequired && forceUpdate) {
    return <UpdateRequiredScreen onUpdate={handleUpdate} />;
  }

  if (config?.maintenanceMode) {
    return (
      <MaintenanceScreen
        message={config.maintenanceMessage}
        endTime={config.maintenanceEndTime}
      />
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFF"
        />
        <MainNavigator config={config} />
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});

export default App;
```

## Platform-Specific Configuration

### iOS Configuration

#### 1. Info.plist
```xml
<!-- ios/TrendAnkara/Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>localhost</key>
    <dict>
      <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
    <key>trendankara.com</key>
    <dict>
      <key>NSIncludesSubdomains</key>
      <true/>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <false/>
    </dict>
  </dict>
</key>

<!-- Background audio -->
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <string>fetch</string>
</array>
```

#### 2. Podfile
```ruby
# ios/Podfile
platform :ios, '12.0'

target 'TrendAnkara' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )

  # Additional pods
  pod 'RNFS', :path => '../node_modules/react-native-fs'

  post_install do |installer|
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '12.0'
      end
    end
  end
end
```

### Android Configuration

#### 1. AndroidManifest.xml
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

<application
  android:usesCleartextTraffic="false"
  android:networkSecurityConfig="@xml/network_security_config">

  <!-- Main Activity -->
  <activity
    android:name=".MainActivity"
    android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
    android:launchMode="singleTask"
    android:windowSoftInputMode="adjustResize">
  </activity>

  <!-- Audio Service for Radio -->
  <service
    android:name="com.doublesymmetry.trackplayer.service.MusicService"
    android:foregroundServiceType="mediaPlayback">
    <intent-filter>
      <action android:name="android.intent.action.MEDIA_BUTTON" />
    </intent-filter>
  </service>
</application>
```

#### 2. Network Security Config
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">trendankara.com</domain>
  </domain-config>

  <!-- Debug only -->
  <debug-overrides>
    <base-config cleartextTrafficPermitted="true">
      <trust-anchors>
        <certificates src="user" />
      </trust-anchors>
    </base-config>
  </debug-overrides>
</network-security-config>
```

## Performance Optimization

### 1. Image Optimization
```javascript
// components/OptimizedImage.js
import React, { useState } from 'react';
import {
  Image,
  View,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import FastImage from 'react-native-fast-image';

const OptimizedImage = ({ source, style, placeholder, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      <FastImage
        {...props}
        style={StyleSheet.absoluteFill}
        source={{
          uri: source,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        resizeMode={FastImage.resizeMode.cover}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <ActivityIndicator color="#E91E63" />
        </View>
      )}
      {error && placeholder && (
        <Image
          source={placeholder}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default OptimizedImage;
```

### 2. List Optimization
```javascript
// components/OptimizedList.js
import React, { useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

const OptimizedList = ({
  data,
  renderItem,
  onRefresh,
  onLoadMore,
  isLoading,
  isRefreshing,
  hasMore,
  emptyMessage = 'Veri bulunamadı',
  ...props
}) => {
  const keyExtractor = useCallback((item, index) =>
    item.id?.toString() || index.toString()
  , []);

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator color="#E91E63" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  };

  return (
    <FlatList
      {...props}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#E91E63']}
          tintColor="#E91E63"
        />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      updateCellsBatchingPeriod={50}
    />
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default OptimizedList;
```

## Testing

### 1. Unit Tests
```javascript
// __tests__/services/pollService.test.js
import pollService from '../../src/services/pollService';
import apiClient from '../../src/api/client';

jest.mock('../../src/api/client');

describe('PollService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch active polls', async () => {
    const mockResponse = {
      success: true,
      data: { id: 1, title: 'Test Poll' }
    };

    apiClient.get.mockResolvedValue(mockResponse);

    const result = await pollService.getActivePolls();

    expect(apiClient.get).toHaveBeenCalledWith('/polls');
    expect(result).toEqual(mockResponse);
  });

  test('should submit vote', async () => {
    const mockResponse = {
      success: true,
      data: { success: true, message: 'Vote submitted' }
    };

    apiClient.post.mockResolvedValue(mockResponse);

    const result = await pollService.submitVote(1, 2);

    expect(apiClient.post).toHaveBeenCalledWith('/polls/1/vote', {
      itemId: 2,
      deviceInfo: expect.any(Object)
    });
    expect(result).toEqual(mockResponse);
  });
});
```

### 2. E2E Tests
```javascript
// e2e/polls.test.js
describe('Polls', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should show polls tab', async () => {
    await expect(element(by.text('Anketler'))).toBeVisible();
  });

  it('should navigate to polls screen', async () => {
    await element(by.text('Anketler')).tap();
    await expect(element(by.id('polls-screen'))).toBeVisible();
  });

  it('should load and display active poll', async () => {
    await waitFor(element(by.id('poll-card')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should allow voting', async () => {
    await element(by.id('poll-option-1')).tap();
    await element(by.id('submit-vote-button')).tap();
    await expect(element(by.text('Oyunuz kaydedildi'))).toBeVisible();
  });
});
```

## Deployment

### 1. Build Configuration
```javascript
// react-native.config.js
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
  dependencies: {},
};
```

### 2. Release Build Commands
```bash
# Android Release Build
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk

# iOS Release Build
cd ios
xcodebuild -workspace TrendAnkara.xcworkspace \
  -scheme TrendAnkara \
  -configuration Release \
  -archivePath TrendAnkara.xcarchive \
  archive
```

## Best Practices

1. **State Management**: Use Context API or Redux for global state
2. **Code Splitting**: Lazy load screens and heavy components
3. **Error Boundaries**: Wrap components with error boundaries
4. **Offline Support**: Implement offline queue for API calls
5. **Analytics**: Track user interactions and errors
6. **Performance Monitoring**: Use Flipper for debugging
7. **Code Quality**: Use ESLint and Prettier
8. **Testing**: Write unit and E2E tests
9. **Security**: Store sensitive data in Keychain/Keystore
10. **Accessibility**: Add proper accessibility labels