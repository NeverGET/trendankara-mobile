# Cards API

## Overview
The Cards API provides endpoints for retrieving content cards that are displayed on the mobile app's home screen. Cards can be featured or normal, with support for images and redirect URLs.

## Endpoints

### 1. Get All Active Cards

Retrieves all active content cards sorted by display order.

**Endpoint:** `GET /content/cards`

**Production URL:** `https://trendankara.com/api/mobile/v1/content/cards`

#### Request
```javascript
GET https://trendankara.com/api/mobile/v1/content/cards
Headers:
  Accept: application/json
  X-Device-ID: unique-device-id
  X-Platform: ios
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| featured | boolean | No | Filter by featured status |
| limit | number | No | Limit number of results (default: 20) |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "featured": [
      {
        "id": 1,
        "title": "Haftanın Şarkısı",
        "description": "En çok dinlenen parçalar",
        "imageUrl": "https://trendankara.com/api/media/uploads/featured-1.jpg",
        "redirectUrl": "/polls",
        "isFeatured": true,
        "displayOrder": 0,
        "isActive": true,
        "createdAt": "2025-09-20T10:00:00.000Z",
        "updatedAt": "2025-09-27T14:30:00.000Z"
      },
      {
        "id": 2,
        "title": "Canlı Yayın",
        "description": "Şimdi dinle",
        "imageUrl": "https://trendankara.com/api/media/uploads/featured-2.jpg",
        "redirectUrl": "/radio",
        "isFeatured": true,
        "displayOrder": 1,
        "isActive": true,
        "createdAt": "2025-09-20T10:00:00.000Z",
        "updatedAt": "2025-09-27T14:30:00.000Z"
      }
    ],
    "normal": [
      {
        "id": 3,
        "title": "Haberler",
        "description": "Son dakika müzik haberleri",
        "imageUrl": "https://trendankara.com/api/media/uploads/news-card.jpg",
        "redirectUrl": "/news",
        "isFeatured": false,
        "displayOrder": 0,
        "isActive": true,
        "createdAt": "2025-09-21T10:00:00.000Z",
        "updatedAt": "2025-09-27T14:30:00.000Z"
      },
      {
        "id": 4,
        "title": "Podcast",
        "description": "Haftalık müzik sohbetleri",
        "imageUrl": "https://trendankara.com/api/media/uploads/podcast-card.jpg",
        "redirectUrl": "/podcasts",
        "isFeatured": false,
        "displayOrder": 1,
        "isActive": true,
        "createdAt": "2025-09-21T10:00:00.000Z",
        "updatedAt": "2025-09-27T14:30:00.000Z"
      }
    ],
    "total": 4
  },
  "cache": {
    "etag": "\"abc123def456\"",
    "maxAge": 300
  }
}
```

#### No Cards Response (200 OK)
```json
{
  "success": true,
  "data": {
    "featured": [],
    "normal": [],
    "total": 0
  },
  "message": "No active cards found"
}
```

#### Error Response (500)
```json
{
  "success": false,
  "data": null,
  "error": "Kartlar yüklenirken bir hata oluştu"
}
```

### 2. Get Single Card

Retrieves a specific card by ID.

**Endpoint:** `GET /content/cards/{id}`

**Production URL:** `https://trendankara.com/api/mobile/v1/content/cards/{id}`

#### Request
```javascript
GET https://trendankara.com/api/mobile/v1/content/cards/1
Headers:
  Accept: application/json
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Haftanın Şarkısı",
    "description": "En çok dinlenen parçalar",
    "imageUrl": "https://trendankara.com/api/media/uploads/featured-1.jpg",
    "redirectUrl": "/polls",
    "isFeatured": true,
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2025-09-20T10:00:00.000Z",
    "updatedAt": "2025-09-27T14:30:00.000Z"
  }
}
```

#### Not Found Response (404)
```json
{
  "success": false,
  "data": null,
  "error": "Kart bulunamadı"
}
```

## React Native Implementation

### Card Service
```javascript
// services/cardService.js
import apiClient from '../api/authenticatedClient';

class CardService {
  async getCards(featured = null) {
    try {
      const params = {};
      if (featured !== null) {
        params.featured = featured;
      }

      const response = await apiClient.get('/content/cards', params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getCardById(id) {
    try {
      const response = await apiClient.get(`/content/cards/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new CardService();
```

### Home Screen with Cards
```javascript
// screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList
} from 'react-native';
import cardService from '../services/cardService';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [featuredCards, setFeaturedCards] = useState([]);
  const [normalCards, setNormalCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await cardService.getCards();

      if (response.success && response.data) {
        setFeaturedCards(response.data.featured || []);
        setNormalCards(response.data.normal || []);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCards();
  };

  const handleCardPress = (card) => {
    // Navigate based on redirectUrl
    const route = card.redirectUrl;

    if (route === '/polls') {
      navigation.navigate('Polls');
    } else if (route === '/news') {
      navigation.navigate('News');
    } else if (route === '/radio') {
      navigation.navigate('Radio');
    } else if (route.startsWith('http')) {
      // External URL
      navigation.navigate('WebView', { url: route });
    } else {
      // Custom route
      navigation.navigate(route.replace('/', ''));
    }
  };

  const renderFeaturedCard = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.featuredImage}
        resizeMode="cover"
      />
      <View style={styles.featuredOverlay}>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.featuredDescription}>{item.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderNormalCard = ({ item }) => (
    <TouchableOpacity
      style={styles.normalCard}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.normalImage}
        resizeMode="cover"
      />
      <View style={styles.normalContent}>
        <Text style={styles.normalTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.normalDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#007AFF']}
        />
      }
    >
      {/* Featured Cards Carousel */}
      {featuredCards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öne Çıkanlar</Text>
          <FlatList
            data={featuredCards}
            renderItem={renderFeaturedCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={width - 40}
            decelerationRate="fast"
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      {/* Normal Cards Grid */}
      {normalCards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keşfet</Text>
          <View style={styles.normalGrid}>
            {normalCards.map((card) => (
              <View key={card.id} style={styles.normalCardWrapper}>
                {renderNormalCard({ item: card })}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {featuredCards.length === 0 && normalCards.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Henüz içerik bulunmuyor</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCards}>
            <Text style={styles.retryText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#333',
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: width - 40,
    height: 200,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  normalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  normalCardWrapper: {
    width: '50%',
    padding: 4,
  },
  normalCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  normalImage: {
    width: '100%',
    height: 120,
  },
  normalContent: {
    padding: 12,
  },
  normalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  normalDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
```

### Card Carousel Component
```javascript
// components/CardCarousel.js
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

const CardCarousel = ({ cards, onCardPress, title }) => {
  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onCardPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width * 0.7 + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#333',
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    width: width * 0.7,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default CardCarousel;
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Kartlar yüklenirken bir hata oluştu" | Server error | Retry request |
| "Kart bulunamadı" | Invalid card ID | Refresh card list |
| Network timeout | Slow connection | Implement retry logic |

## Caching Strategy

Cards are cached for 5 minutes (300 seconds) using ETag headers. The app should:
1. Store the ETag from the response headers
2. Send the ETag in subsequent requests
3. Handle 304 Not Modified responses by using cached data
4. Refresh cache when maxAge expires

## Navigation Handling

The `redirectUrl` field determines where users navigate when tapping a card:
- `/polls` - Navigate to Polls screen
- `/news` - Navigate to News screen
- `/radio` - Navigate to Radio screen
- `/podcasts` - Navigate to Podcasts screen
- `http://...` - Open in WebView
- Custom paths - Navigate to corresponding screens