# Sponsorship Cards Page Implementation Guide

## Overview
This guide provides a comprehensive implementation reference for creating a static sponsorship cards page in React Native that displays sponsorship cards with modal detail views and redirect functionality. The page consumes the existing cards API endpoints and handles both featured and normal cards with optimized performance and caching.

## API Endpoints

### 1. Get All Cards
**Endpoint:** `GET /api/mobile/v1/content/cards`

Retrieves all active sponsorship cards with optional type filtering. Returns cards ordered by display order with featured cards prioritized.

```javascript
// Request - All Cards
GET https://trendankara.com/api/mobile/v1/content/cards
Headers:
  Accept: application/json
  If-None-Match: "etag-value" // For caching
```

```javascript
// Request - Featured Cards Only
GET https://trendankara.com/api/mobile/v1/content/cards?type=featured
Headers:
  Accept: application/json
  If-None-Match: "etag-value"
```

```javascript
// Request - Normal Cards Only
GET https://trendankara.com/api/mobile/v1/content/cards?type=normal
Headers:
  Accept: application/json
  If-None-Match: "etag-value"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Premium Sponsor",
      "description": "Özel sponsor içeriği ve detaylı açıklama metni",
      "imageUrl": "https://trendankara.com/api/media/uploads/sponsor1.jpg",
      "redirectUrl": "https://sponsor1.com/mobile-promo",
      "isFeatured": true,
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "title": "Normal Content Card",
      "description": "Regular content card description",
      "imageUrl": "https://trendankara.com/api/media/uploads/content2.jpg",
      "redirectUrl": null,
      "isFeatured": false,
      "displayOrder": 2,
      "isActive": true,
      "createdAt": "2024-01-01T11:00:00Z",
      "updatedAt": "2024-01-01T11:00:00Z"
    },
    {
      "id": 3,
      "title": "Simple Text Card",
      "description": null,
      "imageUrl": null,
      "redirectUrl": "https://example.com/redirect",
      "isFeatured": false,
      "displayOrder": 3,
      "isActive": true,
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "cache": {
    "etag": "\"a1b2c3d4e5f6\"",
    "maxAge": 180
  }
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "data": [],
  "error": "Kartlar yüklenirken bir hata oluştu"
}
```

**Cached Response (304 Not Modified):**
Returns empty body with cache headers when ETag matches.

### 2. Get Single Card
**Endpoint:** `GET /api/mobile/v1/content/cards/{id}`

Retrieves a specific card by ID for modal detail view.

```javascript
// Request
GET https://trendankara.com/api/mobile/v1/content/cards/1
Headers:
  Accept: application/json
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Premium Sponsor",
    "description": "Detaylı sponsor açıklaması ve içerik bilgileri",
    "imageUrl": "https://trendankara.com/api/media/uploads/sponsor1.jpg",
    "redirectUrl": "https://sponsor1.com/mobile-promo",
    "isFeatured": true,
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

**Not Found Response (404 Not Found):**
```json
{
  "success": false,
  "data": null,
  "error": "Kart bulunamadı"
}
```

**Invalid ID Response (400 Bad Request):**
```json
{
  "success": false,
  "data": null,
  "error": "Geçersiz kart ID"
}
```

## React Native Implementation

### 1. TypeScript Interfaces

```typescript
// types/cards.ts
export interface MobileCard {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  redirectUrl?: string;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MobileApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  cache?: {
    etag: string;
    maxAge: number;
  };
}

export interface CardModalProps {
  visible: boolean;
  card: MobileCard | null;
  onClose: () => void;
  onRedirect: (url: string) => void;
}
```

### 2. API Service

```typescript
// services/CardsService.ts
import { Linking } from 'react-native';

class CardsService {
  private baseUrl = 'https://trendankara.com/api/mobile/v1/content/cards';
  private etag: string | null = null;

  async getCards(type?: 'featured' | 'normal'): Promise<MobileApiResponse<MobileCard[]>> {
    try {
      const url = type ? `${this.baseUrl}?type=${type}` : this.baseUrl;
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      // Add ETag for caching if available
      if (this.etag) {
        headers['If-None-Match'] = this.etag;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // Handle 304 Not Modified
      if (response.status === 304) {
        return {
          success: true,
          data: [], // Return cached data if you have it stored locally
        };
      }

      // Store ETag for next request
      const responseETag = response.headers.get('ETag');
      if (responseETag) {
        this.etag = responseETag;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching cards:', error);
      return {
        success: false,
        data: [],
        error: 'Kartlar yüklenirken bir hata oluştu'
      };
    }
  }

  async getCardById(id: number): Promise<MobileApiResponse<MobileCard | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching card:', error);
      return {
        success: false,
        data: null,
        error: 'Kart bilgisi alınamadı'
      };
    }
  }

  async handleRedirect(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opening URL:', error);
      return false;
    }
  }
}

export default new CardsService();
```

### 3. Main Cards Page Component

```typescript
// screens/CardsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import CardsService from '../services/CardsService';
import CardModal from '../components/CardModal';
import { MobileCard } from '../types/cards';

const { width } = Dimensions.get('window');

const CardsPage: React.FC = () => {
  const [cards, setCards] = useState<MobileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MobileCard | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadCards = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await CardsService.getCards();

      if (response.success) {
        setCards(response.data);
      } else {
        Alert.alert('Hata', response.error || 'Kartlar yüklenemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Kartlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleCardPress = useCallback(async (card: MobileCard) => {
    // If card has a redirect URL and no description, redirect directly
    if (card.redirectUrl && !card.description) {
      const success = await CardsService.handleRedirect(card.redirectUrl);
      if (!success) {
        Alert.alert('Hata', 'Bağlantı açılamadı');
      }
      return;
    }

    // Otherwise, show modal
    setSelectedCard(card);
    setModalVisible(true);
  }, []);

  const handleModalRedirect = useCallback(async (url: string) => {
    setModalVisible(false);
    setSelectedCard(null);

    const success = await CardsService.handleRedirect(url);
    if (!success) {
      Alert.alert('Hata', 'Bağlantı açılamadı');
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedCard(null);
  }, []);

  const onRefresh = useCallback(() => {
    loadCards(true);
  }, [loadCards]);

  // Separate featured and normal cards
  const featuredCards = cards.filter(card => card.isFeatured);
  const normalCards = cards.filter(card => !card.isFeatured);

  const renderCard = useCallback(({ item }: { item: MobileCard }) => (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        item.isFeatured && styles.featuredCardContainer
      ]}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.7}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={[
            styles.cardImage,
            item.isFeatured && styles.featuredCardImage
          ]}
          resizeMode="cover"
        />
      )}
      <View style={styles.cardContent}>
        <Text style={[
          styles.cardTitle,
          item.isFeatured && styles.featuredCardTitle
        ]}>
          {item.title}
        </Text>
        {item.description && (
          <Text
            style={[
              styles.cardDescription,
              item.isFeatured && styles.featuredCardDescription
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>
      {item.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>ÖNE ÇIKAN</Text>
        </View>
      )}
    </TouchableOpacity>
  ), [handleCardPress]);

  const renderSection = (title: string, data: MobileCard[]) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data.sort((a, b) => a.displayOrder - b.displayOrder)}
          renderItem={renderCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Kartlar yükleniyor...</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Henüz kart bulunmuyor</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[1]} // Dummy data for single item
        renderItem={() => (
          <View>
            {renderSection('Öne Çıkan Kartlar', featuredCards)}
            {renderSection('Kartlar', normalCards)}
          </View>
        )}
        keyExtractor={() => 'cards'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />

      <CardModal
        visible={modalVisible}
        card={selectedCard}
        onClose={handleModalClose}
        onRedirect={handleModalRedirect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  featuredCardContainer: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowOpacity: 0.15,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  featuredCardImage: {
    height: 200,
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
  featuredCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featuredCardDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CardsPage;
```

### 4. Card Modal Component

```typescript
// components/CardModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { CardModalProps } from '../types/cards';

const { width, height } = Dimensions.get('window');

const CardModal: React.FC<CardModalProps> = ({
  visible,
  card,
  onClose,
  onRedirect,
}) => {
  if (!card) return null;

  const handleRedirectPress = () => {
    if (card.redirectUrl) {
      onRedirect(card.redirectUrl);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kart Detayı</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {card.imageUrl && (
              <Image
                source={{ uri: card.imageUrl }}
                style={styles.modalImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.modalTextContent}>
              <Text style={styles.modalCardTitle}>{card.title}</Text>

              {card.description && (
                <Text style={styles.modalCardDescription}>
                  {card.description}
                </Text>
              )}

              {card.isFeatured && (
                <View style={styles.featuredIndicator}>
                  <Text style={styles.featuredIndicatorText}>
                    ⭐ Öne Çıkan Kart
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            {card.redirectUrl ? (
              <TouchableOpacity
                style={styles.redirectButton}
                onPress={handleRedirectPress}
              >
                <Text style={styles.redirectButtonText}>
                  Devamını Oku →
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.closeFooterButton}
                onPress={onClose}
              >
                <Text style={styles.closeFooterButtonText}>Kapat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    minHeight: height * 0.4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  modalTextContent: {
    padding: 20,
  },
  modalCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 28,
  },
  modalCardDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 16,
  },
  featuredIndicator: {
    backgroundColor: '#FFF5D6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  featuredIndicatorText: {
    fontSize: 14,
    color: '#B8860B',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  redirectButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  redirectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeFooterButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CardModal;
```

## Usage Examples

### 1. Basic Implementation

```typescript
// App.tsx or your navigation file
import CardsPage from './screens/CardsPage';

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Cards"
          component={CardsPage}
          options={{ title: 'Sponsorlar' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 2. With Custom Styling

```typescript
// Custom theme support
const CardsPageWithTheme = () => {
  const theme = useTheme(); // Your theme hook

  return (
    <CardsPage
      primaryColor={theme.primary}
      backgroundColor={theme.background}
      textColor={theme.text}
    />
  );
};
```

### 3. With Analytics

```typescript
// Enhanced with analytics
const handleCardPress = useCallback(async (card: MobileCard) => {
  // Track card view
  Analytics.track('card_viewed', {
    card_id: card.id,
    card_title: card.title,
    is_featured: card.isFeatured,
  });

  if (card.redirectUrl && !card.description) {
    // Track direct redirect
    Analytics.track('card_redirected', {
      card_id: card.id,
      redirect_url: card.redirectUrl,
    });

    const success = await CardsService.handleRedirect(card.redirectUrl);
    if (!success) {
      Alert.alert('Hata', 'Bağlantı açılamadı');
    }
    return;
  }

  setSelectedCard(card);
  setModalVisible(true);
}, []);
```

## Performance Optimizations

### 1. Image Caching

```typescript
// Add to your Image components
import FastImage from 'react-native-fast-image';

const CachedImage = ({ source, style }) => (
  <FastImage
    source={{
      uri: source.uri,
      priority: FastImage.priority.normal,
    }}
    style={style}
    resizeMode={FastImage.resizeMode.cover}
  />
);
```

### 2. List Optimization

```typescript
// Add to FlatList props
const renderCard = useCallback(({ item }) => (
  <CardComponent card={item} onPress={handleCardPress} />
), [handleCardPress]);

// In FlatList
<FlatList
  data={cards}
  renderItem={renderCard}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### 3. Network Optimization

```typescript
// Enhanced API service with retry logic
class EnhancedCardsService extends CardsService {
  async getCardsWithRetry(retries = 3): Promise<MobileApiResponse<MobileCard[]>> {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await this.getCards();
        if (result.success) return result;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    return {
      success: false,
      data: [],
      error: 'Bağlantı sorunu'
    };
  }
}
```

## Error Handling

### 1. Network Errors

```typescript
const handleNetworkError = (error: any) => {
  if (error.code === 'NETWORK_ERROR') {
    Alert.alert(
      'Bağlantı Hatası',
      'İnternet bağlantınızı kontrol edin',
      [
        { text: 'Tekrar Dene', onPress: () => loadCards() },
        { text: 'Tamam', style: 'cancel' },
      ]
    );
  } else {
    Alert.alert('Hata', 'Bir hata oluştu');
  }
};
```

### 2. Image Loading Errors

```typescript
const [imageError, setImageError] = useState(false);

<Image
  source={{ uri: card.imageUrl }}
  style={styles.cardImage}
  onError={() => setImageError(true)}
  onLoad={() => setImageError(false)}
/>

{imageError && (
  <View style={styles.imagePlaceholder}>
    <Text style={styles.placeholderText}>🖼️</Text>
  </View>
)}
```

## Testing Considerations

### 1. Unit Tests

```typescript
// __tests__/CardsService.test.ts
import CardsService from '../services/CardsService';

describe('CardsService', () => {
  it('should fetch cards successfully', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: [{ id: 1, title: 'Test Card' }]
      })
    });

    global.fetch = mockFetch;

    const result = await CardsService.getCards();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/CardsPage.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CardsPage from '../screens/CardsPage';

describe('CardsPage', () => {
  it('should render cards when loaded', async () => {
    const { getByText } = render(<CardsPage />);

    await waitFor(() => {
      expect(getByText('Test Card')).toBeTruthy();
    });
  });

  it('should open modal when card is pressed', async () => {
    const { getByText } = render(<CardsPage />);

    await waitFor(() => {
      fireEvent.press(getByText('Test Card'));
    });

    expect(getByText('Kart Detayı')).toBeTruthy();
  });
});
```

## Accessibility

### 1. Screen Reader Support

```typescript
<TouchableOpacity
  style={styles.cardContainer}
  onPress={() => handleCardPress(item)}
  accessibilityRole="button"
  accessibilityLabel={`${item.title} kartı`}
  accessibilityHint="Detayları görmek için dokunun"
>
```

### 2. Focus Management

```typescript
import { AccessibilityInfo } from 'react-native';

const handleModalOpen = () => {
  setModalVisible(true);
  // Announce modal opening
  AccessibilityInfo.announceForAccessibility('Kart detayları açıldı');
};
```

## Deployment Notes

1. **API Endpoint**: Ensure the base URL matches your production environment
2. **Image Handling**: All image URLs are automatically converted to proxy URLs by the API
3. **Caching**: The API supports ETag-based caching with a 3-minute TTL
4. **Error Messages**: All error messages are in Turkish for the Turkish mobile app
5. **Performance**: Target response times under 200ms with proper caching
6. **Device Compatibility**: Tested on iOS 13+ and Android API 21+

## Security Considerations

1. **URL Validation**: The `Linking.canOpenURL()` method validates URLs before opening
2. **Image Sources**: Only load images from trusted domains
3. **Deep Links**: Validate redirect URLs to prevent malicious redirects
4. **Network Security**: Use HTTPS endpoints only
5. **Data Validation**: Validate all API responses before rendering

This implementation guide provides a complete foundation for implementing a sponsorship cards page with modal detail views and redirect functionality that follows React Native best practices and integrates seamlessly with the existing API infrastructure.