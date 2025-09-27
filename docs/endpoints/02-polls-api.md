# Polls API

## Overview
The Polls API provides endpoints for retrieving active polls and submitting votes. Each device can only vote once per poll.

## Endpoints

### 1. Get Active Poll

Retrieves the currently active poll with its items and current vote counts.

**Endpoint:** `GET /polls`

**Production URL:** `https://trendankara.com/api/mobile/v1/polls`

#### Request
```javascript
GET https://trendankara.com/api/mobile/v1/polls
Headers:
  Accept: application/json
  X-Device-ID: unique-device-id
  X-Platform: ios
```

#### Success Response (200 OK)
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
      },
      {
        "id": 5,
        "title": "Şarkı 2",
        "description": "Sanatçı - Şarkı Adı",
        "imageUrl": "https://trendankara.com/api/media/uploads/song2.jpg",
        "voteCount": 98,
        "percentage": 35,
        "displayOrder": 1
      },
      {
        "id": 6,
        "title": "Şarkı 3",
        "description": "Sanatçı - Şarkı Adı",
        "imageUrl": "https://trendankara.com/api/media/uploads/song3.jpg",
        "voteCount": 55,
        "percentage": 20,
        "displayOrder": 2
      }
    ],
    "totalVotes": 278,
    "timeRemaining": "2 gün 14 saat",
    "hasVoted": false
  },
  "cache": {
    "etag": "\"cf31c90b1b8608c8ba602050c7f92205\"",
    "maxAge": 60
  }
}
```

#### No Active Poll Response (200 OK)
```json
{
  "success": true,
  "data": null,
  "message": "Şu anda aktif anket bulunmuyor"
}
```

#### Error Response (500)
```json
{
  "success": false,
  "data": null,
  "error": "Anketler yüklenirken bir hata oluştu"
}
```

### 2. Get Current Poll

Retrieves the currently active poll specifically. This is an alternative to the general polls endpoint.

**Endpoint:** `GET /polls/current`

**Production URL:** `https://trendankara.com/api/mobile/v1/polls/current`

#### Request
```javascript
GET https://trendankara.com/api/mobile/v1/polls/current
Headers:
  Accept: application/json
  X-Device-ID: unique-device-id
```

#### Success Response (200 OK)
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
    "hasVoted": false
  }
}
```

#### No Current Poll Response (200 OK)
```json
{
  "success": true,
  "data": null
}
```

### 3. Submit Vote

Submit a vote for a poll item. Each device can only vote once per poll.

**Endpoint:** `POST /polls/{pollId}/vote`

**Production URL:** `https://trendankara.com/api/mobile/v1/polls/{pollId}/vote`

#### Request
```javascript
POST https://trendankara.com/api/mobile/v1/polls/3/vote
Headers:
  Accept: application/json
  Content-Type: application/json
  X-Device-ID: unique-device-id

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

#### Success Response (200 OK)
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
      },
      {
        "itemId": 6,
        "voteCount": 55,
        "percentage": 20
      }
    ]
  }
}
```

#### Already Voted Response (400)
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

#### Invalid Poll Response (404)
```json
{
  "success": false,
  "data": null,
  "error": "Anket bulunamadı"
}
```

#### Missing Device Info Response (400)
```json
{
  "success": false,
  "data": null,
  "error": "Eksik bilgi: itemId ve deviceInfo gerekli"
}
```

## React Native Implementation

### Poll Service
```javascript
// services/pollService.js
import apiClient from '../api/authenticatedClient';
import { getDeviceInfo } from '../utils/deviceId';

class PollService {
  async getActivePolls() {
    try {
      const response = await apiClient.get('/polls');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async submitVote(pollId, itemId) {
    try {
      const deviceInfo = await getDeviceInfo();

      const response = await apiClient.post(`/polls/${pollId}/vote`, {
        itemId,
        deviceInfo: {
          deviceId: deviceInfo.deviceId,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion,
          userAgent: deviceInfo.userAgent
        }
      });

      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new PollService();
```

### Poll Component
```javascript
// components/PollCard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import pollService from '../services/pollService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PollCard = () => {
  const [poll, setPoll] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, []);

  const fetchPoll = async () => {
    try {
      setIsLoading(true);
      const response = await pollService.getActivePolls();

      if (response.success && response.data) {
        setPoll(response.data);

        // Check if already voted (stored locally)
        const votedPollId = await AsyncStorage.getItem(`voted_poll_${response.data.id}`);
        setHasVoted(!!votedPollId || response.data.hasVoted);
      }
    } catch (error) {
      Alert.alert('Hata', 'Anket yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

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

      if (response.success) {
        // Update local state with new counts
        const updatedItems = poll.items.map(item => {
          const updated = response.data.updatedCounts.find(u => u.itemId === item.id);
          if (updated) {
            return { ...item, voteCount: updated.voteCount, percentage: updated.percentage };
          }
          return item;
        });

        setPoll({ ...poll, items: updatedItems, totalVotes: poll.totalVotes + 1 });
        setHasVoted(true);

        // Store voting status locally
        await AsyncStorage.setItem(`voted_poll_${poll.id}`, 'true');

        Alert.alert('Başarılı', response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert('Uyarı', error.response.data.error);
        setHasVoted(true);
      } else {
        Alert.alert('Hata', 'Oy gönderilemedi');
      }
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Aktif anket bulunmuyor</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{poll.title}</Text>
      {poll.description && (
        <Text style={styles.description}>{poll.description}</Text>
      )}

      <View style={styles.itemsContainer}>
        {poll.items.map((item) => (
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
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            )}
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.itemDescription}>{item.description}</Text>
              )}
              {(hasVoted || poll.showResults) && (
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
          </TouchableOpacity>
        ))}
      </View>

      {!hasVoted && (
        <TouchableOpacity
          style={[styles.voteButton, isVoting && styles.disabledButton]}
          onPress={handleVote}
          disabled={isVoting}
        >
          {isVoting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.voteButtonText}>Oy Ver</Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Toplam: {poll.totalVotes} oy
        </Text>
        {poll.timeRemaining && (
          <Text style={styles.footerText}>
            Kalan: {poll.timeRemaining}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  pollItem: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  disabledItem: {
    opacity: 0.6,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  resultText: {
    fontSize: 12,
    color: '#666',
  },
  voteButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  voteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
});

export default PollCard;
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Bu ankette zaten oy kullandınız" | Device has already voted | Show results only |
| "Eksik bilgi: itemId ve deviceInfo gerekli" | Missing required fields | Include all required data |
| "Anket bulunamadı" | Invalid poll ID | Refresh poll list |
| "Anketler yüklenirken bir hata oluştu" | Server error | Retry request |