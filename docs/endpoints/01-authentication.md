# Authentication & Headers

## Overview

The mobile API uses device-based authentication for tracking and personalization. No user login is required for public endpoints.

## Required Headers

### All Requests
```javascript
{
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-App-Version': '1.0.0',  // Your app version
  'X-Platform': 'ios' // or 'android'
}
```

### Device Identification
```javascript
{
  'X-Device-ID': 'unique-device-id', // Required for voting
  'User-Agent': 'TrendAnkara/1.0.0 (iOS 14.0; iPhone12,1)'
}
```

## Device ID Generation

### React Native Implementation

```javascript
// utils/deviceId.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = async () => {
  try {
    // Check if device ID exists
    let deviceId = await AsyncStorage.getItem('deviceId');

    if (!deviceId) {
      // Generate new device ID
      deviceId = uuidv4();
      await AsyncStorage.setItem('deviceId', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return uuidv4(); // Fallback to temporary ID
  }
};

export const getDeviceInfo = async () => {
  const deviceId = await getDeviceId();

  return {
    deviceId,
    platform: Platform.OS,
    appVersion: DeviceInfo.getVersion(),
    buildNumber: DeviceInfo.getBuildNumber(),
    systemVersion: DeviceInfo.getSystemVersion(),
    deviceModel: DeviceInfo.getModel(),
    userAgent: `TrendAnkara/${DeviceInfo.getVersion()} (${Platform.OS} ${DeviceInfo.getSystemVersion()}; ${DeviceInfo.getModel()})`
  };
};
```

## API Client Setup with Authentication

```javascript
// api/authenticatedClient.js
import axios from 'axios';
import { getDeviceInfo } from '../utils/deviceId';

const BASE_URL = 'https://trendankara.com/api/mobile/v1';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  async setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const deviceInfo = await getDeviceInfo();

        config.headers = {
          ...config.headers,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Device-ID': deviceInfo.deviceId,
          'X-Platform': deviceInfo.platform,
          'X-App-Version': deviceInfo.appVersion,
          'User-Agent': deviceInfo.userAgent,
        };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Handle successful response
        return response.data;
      },
      (error) => {
        // Handle errors
        if (error.response) {
          // Server responded with error
          const { status, data } = error.response;

          switch (status) {
            case 401:
              // Handle unauthorized
              console.log('Unauthorized access');
              break;
            case 429:
              // Handle rate limiting
              const retryAfter = error.response.headers['retry-after'];
              console.log(`Rate limited. Retry after ${retryAfter} seconds`);
              break;
            case 500:
              // Handle server error
              console.log('Server error:', data.error);
              break;
            default:
              console.log('API Error:', data.error || 'Unknown error');
          }
        } else if (error.request) {
          // Request made but no response
          console.log('Network error: No response from server');
        } else {
          // Error in request setup
          console.log('Request error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  // GET request
  async get(endpoint, params = {}) {
    return this.client.get(endpoint, { params });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.client.post(endpoint, data);
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.client.put(endpoint, data);
  }

  // DELETE request
  async delete(endpoint) {
    return this.client.delete(endpoint);
  }
}

export default new ApiClient();
```

## ETag Cache Implementation

```javascript
// utils/etagCache.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class ETagCache {
  async getWithETag(url, fetcher) {
    try {
      // Get stored ETag
      const storedETag = await AsyncStorage.getItem(`etag_${url}`);
      const cachedData = await AsyncStorage.getItem(`data_${url}`);

      // Make request with If-None-Match header
      const headers = {};
      if (storedETag) {
        headers['If-None-Match'] = storedETag;
      }

      const response = await fetcher(url, { headers });

      // Check if not modified
      if (response.status === 304 && cachedData) {
        // Return cached data
        return JSON.parse(cachedData);
      }

      // Store new ETag and data
      if (response.headers?.etag) {
        await AsyncStorage.setItem(`etag_${url}`, response.headers.etag);
        await AsyncStorage.setItem(`data_${url}`, JSON.stringify(response.data));
      }

      return response.data;
    } catch (error) {
      console.error('ETag cache error:', error);
      throw error;
    }
  }

  async clearCache(pattern) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key =>
        key.startsWith(`etag_${pattern}`) ||
        key.startsWith(`data_${pattern}`)
      );
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }
}

export default new ETagCache();
```

## Security Best Practices

### 1. Store Sensitive Data Securely
```javascript
import * as Keychain from 'react-native-keychain';

// Store device ID securely
await Keychain.setInternetCredentials(
  'trendankara.com',
  'deviceId',
  deviceId
);

// Retrieve securely
const credentials = await Keychain.getInternetCredentials('trendankara.com');
if (credentials) {
  const deviceId = credentials.password;
}
```

### 2. Certificate Pinning (Optional)
```javascript
import { NetworkingModule } from 'react-native';

NetworkingModule.addListener('certificateError', (error) => {
  console.error('Certificate error:', error);
  // Handle certificate validation error
});
```

### 3. Obfuscate API Keys (if needed)
```javascript
// config/secrets.js
const API_KEY = __DEV__
  ? 'development-key'
  : '5d3188c9892c6c0945e79660b9510a128c9bac31c0f1e9887c91a114cb263623';

export const getApiKey = () => {
  // Add additional obfuscation if needed
  return API_KEY;
};
```

## Error Handling

```javascript
// api/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    return {
      success: false,
      error: data.error || 'Bir hata oluştu',
      status,
      isNetworkError: false,
      isServerError: status >= 500,
      isClientError: status >= 400 && status < 500,
      isRateLimited: status === 429,
      retryAfter: error.response.headers['retry-after']
    };
  } else if (error.request) {
    // Network error
    return {
      success: false,
      error: 'İnternet bağlantınızı kontrol edin',
      isNetworkError: true,
      isServerError: false,
      isClientError: false,
      isRateLimited: false
    };
  } else {
    // Request setup error
    return {
      success: false,
      error: error.message || 'Bilinmeyen bir hata oluştu',
      isNetworkError: false,
      isServerError: false,
      isClientError: false,
      isRateLimited: false
    };
  }
};
```

## Usage Example

```javascript
// screens/HomeScreen.js
import apiClient from '../api/authenticatedClient';
import { handleApiError } from '../api/errorHandler';

const fetchPolls = async () => {
  try {
    const response = await apiClient.get('/polls');

    if (response.success) {
      setPolls(response.data);
    } else {
      Alert.alert('Hata', response.error);
    }
  } catch (error) {
    const errorInfo = handleApiError(error);

    if (errorInfo.isRateLimited) {
      Alert.alert(
        'Çok fazla istek',
        `Lütfen ${errorInfo.retryAfter} saniye sonra tekrar deneyin`
      );
    } else if (errorInfo.isNetworkError) {
      Alert.alert('Bağlantı Hatası', errorInfo.error);
    } else {
      Alert.alert('Hata', errorInfo.error);
    }
  }
};
```