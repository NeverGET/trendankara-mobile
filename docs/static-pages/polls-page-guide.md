# Polls Page Implementation Guide

## Overview
This guide provides a comprehensive implementation reference for creating a static polls page in React Native that displays current active polls and allows voting. The page consumes the existing polls API endpoints and handles all voting scenarios including when no active polls are available.

## API Endpoints

### 1. Get Active Poll
**Endpoint:** `GET /api/mobile/v1/polls`

Retrieves the currently active poll based on mobile settings. Returns `null` if no active polls exist or polls are disabled.

```javascript
// Request
GET https://trendankara.com/api/mobile/v1/polls
Headers:
  Accept: application/json
  X-Device-ID: unique-device-id
  If-None-Match: "etag-value" // For caching
```

**Success Response (200 OK) - With Active Poll:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "Haftanın En İyi Şarkısı",
    "description": "Bu hafta en çok hangi şarkıyı beğendiniz?",
    "pollType": "weekly",
    "startDate": "2025-09-21T13:35:00.000Z",
    "endDate": "2025-09-28T13:35:00.000Z",
    "isActive": true,
    "items": [
      {
        "id": 4,
        "title": "Şarkı 1",
        "description": "Sanatçı - Şarkı Adı",
        "imageUrl": "https://trendankara.com/api/media/uploads/song1.jpg",
        "voteCount": 125,
        "percentage": 45,
        "displayOrder": 0
      }
    ],
    "totalVotes": 278,
    "timeRemaining": "2 gün 14 saat kaldı"
  },
  "cache": {
    "etag": "\"cf31c90b1b8608c8ba602050c7f92205\"",
    "maxAge": 60
  }
}
```

**No Active Poll Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "error": "Anketler devre dışı"
}
```

### 2. Submit Vote
**Endpoint:** `POST /api/mobile/v1/polls/{pollId}/vote`

Submits a vote for a specific poll item with device tracking to prevent duplicate voting.

```javascript
// Request
POST https://trendankara.com/api/mobile/v1/polls/3/vote
Headers:
  Accept: application/json
  Content-Type: application/json

Body:
{
  "itemId": 4,
  "deviceInfo": {
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "platform": "ios",
    "appVersion": "1.0.0",
    "userAgent": "TrendAnkara/1.0.0 (iOS 14.0; iPhone12,1)"
  }
}
```

**Vote Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Oyunuz başarıyla kaydedildi",
    "updatedCounts": [
      {
        "itemId": 4,
        "voteCount": 126,
        "percentage": 45
      },
      {
        "itemId": 5,
        "voteCount": 98,
        "percentage": 35
      }
    ]
  }
}
```

**Already Voted Response (400):**
```json
{
  "success": false,
  "data": {
    "success": false,
    "message": "Bu ankette zaten oy kullandınız"
  },
  "error": "Bu ankette zaten oy kullandınız"
}
```

## React Native Implementation

### 1. Device ID Management

First, implement device ID management for voting tracking:

```javascript
// utils/deviceId.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'device_id';

export const getDeviceInfo = async () => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = uuidv4();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    const appVersion = DeviceInfo.getVersion();
    const platform = Platform.OS;
    const userAgent = await DeviceInfo.getUserAgent();

    return {
      deviceId,
      platform,
      appVersion,
      userAgent
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      deviceId: uuidv4(),
      platform: Platform.OS,
      appVersion: '1.0.0',
      userAgent: 'TrendAnkara/1.0.0'
    };
  }
};
```

### 2. Polls Service

Create a service to handle all poll-related API calls:

```javascript
// services/pollService.js
import apiClient from '../api/authenticatedClient';
import { getDeviceInfo } from '../utils/deviceId';

class PollService {
  /**
   * Get the currently active poll
   * @returns {Promise<Object>} API response with poll data or null
   */
  async getActivePoll() {
    try {
      const deviceInfo = await getDeviceInfo();

      const response = await apiClient.get('/polls', {
        headers: {
          'X-Device-ID': deviceInfo.deviceId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching active poll:', error);
      throw error;
    }
  }

  /**
   * Submit a vote for a poll item
   * @param {number} pollId - Poll ID
   * @param {number} itemId - Poll item ID to vote for
   * @returns {Promise<Object>} Vote result with updated counts
   */
  async submitVote(pollId, itemId) {
    try {
      const deviceInfo = await getDeviceInfo();

      const response = await apiClient.post(`/polls/${pollId}/vote`, {
        itemId,
        deviceInfo
      });

      return response.data;
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  }
}

export default new PollService();
```

### 3. Main Polls Page Component

Create the complete polls page with all necessary states and functionality:

```javascript
// screens/PollsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pollService from '../services/pollService';

const PollsScreen = () => {
  const [poll, setPoll] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPoll();
  }, []);

  /**
   * Fetch the active poll from API
   */
  const fetchPoll = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await pollService.getActivePoll();

      if (response.success && response.data) {
        setPoll(response.data);

        // Check if already voted (stored locally as backup)
        const votedPollId = await AsyncStorage.getItem(`voted_poll_${response.data.id}`);
        setHasVoted(!!votedPollId || response.data.userHasVoted);
      } else {
        setPoll(null);
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      setError('Anket yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPoll();
    setRefreshing(false);
  }, []);

  /**
   * Handle vote submission
   */
  const handleVote = async () => {
    if (!selectedItem) {
      Alert.alert('Uyarı', 'Lütfen bir seçenek seçin');
      return;
    }

    if (hasVoted) {
      Alert.alert('Bilgi', 'Bu ankette zaten oy kullandınız');
      return;
    }

    try {
      setIsVoting(true);
      const response = await pollService.submitVote(poll.id, selectedItem);

      if (response.success && response.data.success) {
        // Update local state with new vote counts
        const updatedItems = poll.items.map(item => {
          const updated = response.data.updatedCounts?.find(u => u.itemId === item.id);
          if (updated) {
            return {
              ...item,
              voteCount: updated.voteCount,
              percentage: updated.percentage
            };
          }
          return item;
        });

        const newTotalVotes = updatedItems.reduce((sum, item) => sum + item.voteCount, 0);
        setPoll({ ...poll, items: updatedItems, totalVotes: newTotalVotes });
        setHasVoted(true);

        // Store voting status locally
        await AsyncStorage.setItem(`voted_poll_${poll.id}`, 'true');

        Alert.alert('Başarılı', response.data.message);
      } else {
        Alert.alert('Hata', response.data?.message || 'Oy gönderilemedi');
      }
    } catch (error) {
      console.error('Vote submission error:', error);

      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error || 'Bu ankette zaten oy kullandınız';
        Alert.alert('Uyarı', errorMessage);
        setHasVoted(true);
      } else {
        Alert.alert('Hata', 'Oy gönderilemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsVoting(false);
    }
  };

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Anket yükleniyor...</Text>
    </View>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchPoll}>
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render no active polls state
   */
  const renderNoActivePoll = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.noDataText}>Şu anda aktif anket bulunmuyor</Text>
      <Text style={styles.noDataSubtext}>
        Yeni anketler yayınlandığında burada görünecek
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={fetchPoll}>
        <Text style={styles.refreshButtonText}>Yenile</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render poll item
   */
  const renderPollItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.pollItem,
        selectedItem === item.id && styles.selectedItem,
        hasVoted && styles.disabledItem
      ]}
      onPress={() => !hasVoted && setSelectedItem(item.id)}
      disabled={hasVoted}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
        {hasVoted && (
          <View style={styles.resultContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${item.percentage}%` }]}
              />
            </View>
            <Text style={styles.resultText}>
              {item.voteCount} oy ({item.percentage}%)
            </Text>
          </View>
        )}
      </View>
      {selectedItem === item.id && !hasVoted && (
        <View style={styles.selectedIndicator} />
      )}
    </TouchableOpacity>
  );

  /**
   * Render active poll
   */
  const renderPoll = () => (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.pollContainer}>
        <Text style={styles.title}>{poll.title}</Text>
        {poll.description && (
          <Text style={styles.description}>{poll.description}</Text>
        )}

        <View style={styles.itemsContainer}>
          {poll.items
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(renderPollItem)}
        </View>

        {!hasVoted && (
          <TouchableOpacity
            style={[styles.voteButton, isVoting && styles.disabledButton]}
            onPress={handleVote}
            disabled={isVoting || !selectedItem}
          >
            {isVoting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.voteButtonText}>Oy Ver</Text>
            )}
          </TouchableOpacity>
        )}

        {hasVoted && (
          <View style={styles.votedContainer}>
            <Text style={styles.votedText}>✓ Oyunuz kaydedildi</Text>
            <Text style={styles.votedSubtext}>Sonuçları görebilirsiniz</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Toplam: {poll.totalVotes} oy
          </Text>
          {poll.timeRemaining && (
            <Text style={styles.footerText}>
              {poll.timeRemaining}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );

  // Main render logic
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderLoading()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderError()}
      </SafeAreaView>
    );
  }

  if (!poll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderNoActivePoll()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderPoll()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pollContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  pollItem: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  selectedItem: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  disabledItem: {
    opacity: 0.8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  resultContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  voteButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  voteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  votedContainer: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  votedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  votedSubtext: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  noDataSubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginBottom: 24,
  },
  errorText: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PollsScreen;
```

### 4. API Client Configuration

Ensure your API client includes proper device headers:

```javascript
// api/authenticatedClient.js
import axios from 'axios';
import { getDeviceInfo } from '../utils/deviceId';

const BASE_URL = __DEV__
  ? 'http://localhost:3000/api/mobile/v1'
  : 'https://trendankara.com/api/mobile/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Add device headers to all requests
client.interceptors.request.use(async (config) => {
  try {
    const deviceInfo = await getDeviceInfo();
    config.headers['X-Device-ID'] = deviceInfo.deviceId;
    config.headers['X-Platform'] = deviceInfo.platform;
  } catch (error) {
    console.error('Error adding device headers:', error);
  }
  return config;
});

// Handle response errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default client;
```

## No Active Polls Scenarios

The implementation handles several scenarios when no active polls are available:

### 1. Polls Disabled
When polls are disabled in mobile settings, the API returns:
```json
{
  "success": true,
  "data": null,
  "error": "Anketler devre dışı"
}
```

### 2. No Active Polls
When no polls are currently active:
```json
{
  "success": true,
  "data": null
}
```

### 3. Component Handling
The `renderNoActivePoll()` function displays:
- A clear message indicating no active polls
- A subtitle explaining when polls will appear
- A refresh button to check for new polls
- Pull-to-refresh functionality for easy updates

## Device ID Handling

### Implementation Requirements
1. **Unique Device ID**: Generate and persist UUID for each device
2. **Local Storage**: Store device ID in AsyncStorage
3. **Vote Tracking**: Include device info in all vote requests
4. **Backup Storage**: Store voted poll IDs locally as backup

### Device Info Structure
```javascript
{
  deviceId: "550e8400-e29b-41d4-a716-446655440000",
  platform: "ios", // or "android"
  appVersion: "1.0.0",
  userAgent: "TrendAnkara/1.0.0 (iOS 14.0; iPhone12,1)"
}
```

## Error Handling

### Common Error Scenarios

| Error | Status Code | Cause | UI Handling |
|-------|-------------|-------|-------------|
| Already voted | 400 | Device has voted | Show results, disable voting |
| Invalid poll | 404 | Poll doesn't exist | Refresh poll list |
| Missing data | 400 | Required fields missing | Show error, retry |
| Server error | 500 | Backend issue | Show error, retry button |
| Network error | - | Connection issue | Show error, retry button |

### Error Handling Best Practices
1. **User-Friendly Messages**: Display Turkish error messages
2. **Retry Functionality**: Provide retry buttons for failed requests
3. **Graceful Degradation**: Handle missing data gracefully
4. **Loading States**: Show loading indicators during API calls
5. **Pull-to-Refresh**: Allow users to refresh content manually

## Caching Strategy

### Client-Side Caching
- **ETag Support**: Send `If-None-Match` headers for 304 responses
- **Local Storage**: Cache poll results and voting status
- **TTL Handling**: Respect `maxAge` values from API responses

### Implementation
```javascript
// Check ETag before making request
const lastETag = await AsyncStorage.getItem('poll_etag');
const headers = lastETag ? { 'If-None-Match': lastETag } : {};

// Store ETag from response
if (response.data.cache?.etag) {
  await AsyncStorage.setItem('poll_etag', response.data.cache.etag);
}
```

## Testing Considerations

### Manual Testing Scenarios
1. **Active Poll Display**: Verify poll renders correctly with all items
2. **Vote Submission**: Test successful voting and UI updates
3. **Duplicate Vote Prevention**: Confirm already voted handling
4. **No Active Polls**: Test empty state display
5. **Network Errors**: Test offline/error scenarios
6. **Pull-to-Refresh**: Verify refresh functionality
7. **Device Rotation**: Test responsive design

### Test Data Setup
Use the admin panel to create test polls with:
- Different poll types (weekly, monthly, custom)
- Multiple items with images
- Various end dates for time remaining testing
- Different voting configurations

## Performance Optimization

### Recommendations
1. **Image Optimization**: Use `resizeMode="cover"` for poll item images
2. **List Performance**: Use proper keys for list items
3. **Memory Management**: Cleanup timers and listeners
4. **Network Optimization**: Implement proper caching
5. **Bundle Size**: Lazy load non-critical components

This implementation guide provides a complete, production-ready polls page that handles all scenarios including active polls, voting, error states, and the critical no active polls scenario with appropriate user feedback and refresh functionality.