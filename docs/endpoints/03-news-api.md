# News API

## Overview
The News API provides paginated news lists and detailed news articles with image galleries.

## Endpoints

### 1. Get News List

Retrieves a paginated list of news articles.

**Endpoint:** `GET /news`

**Production URL:** `https://trendankara.com/api/mobile/v1/news`

#### Request Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (1-based) |
| limit | number | No | 10 | Items per page (max: 50) |
| category_id | number | No | null | Filter by category ID |

#### Request Example
```javascript
GET https://trendankara.com/api/mobile/v1/news?page=1&limit=10
Headers:
  Accept: application/json
  X-Device-ID: unique-device-id
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Trend Ankara'da Yeni Yayın Dönemi",
        "summary": "Yeni sezon programlarımız başlıyor",
        "slug": "trend-ankara-yeni-yayin-donemi",
        "imageUrl": "https://trendankara.com/api/media/uploads/news1.jpg",
        "category": {
          "id": 1,
          "name": "Haberler",
          "slug": "haberler"
        },
        "viewCount": 1234,
        "publishedAt": "2025-09-27T10:00:00.000Z",
        "isBreaking": false
      },
      {
        "id": 2,
        "title": "Canlı Yayında Sürpriz Konuk",
        "summary": "Bu akşam saat 20:00'da özel konuğumuz var",
        "slug": "canli-yayinda-surpriz-konuk",
        "imageUrl": "https://trendankara.com/api/media/uploads/news2.jpg",
        "category": {
          "id": 2,
          "name": "Programlar",
          "slug": "programlar"
        },
        "viewCount": 567,
        "publishedAt": "2025-09-27T08:30:00.000Z",
        "isBreaking": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "hasNext": true,
      "hasPrev": false,
      "totalPages": 5
    }
  },
  "cache": {
    "etag": "\"abc123def456\"",
    "maxAge": 120
  }
}
```

#### Error Response (500)
```json
{
  "success": false,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "error": "Haberler yüklenirken bir hata oluştu"
}
```

### 2. Get News Detail

Retrieves the full content of a news article by slug.

**Endpoint:** `GET /news/{slug}`

**Production URL:** `https://trendankara.com/api/mobile/v1/news/{slug}`

#### Request Example
```javascript
GET https://trendankara.com/api/mobile/v1/news/trend-ankara-yeni-yayin-donemi
Headers:
  Accept: application/json
  X-Device-ID: unique-device-id
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Trend Ankara'da Yeni Yayın Dönemi",
    "summary": "Yeni sezon programlarımız başlıyor",
    "content": "<p>Trend Ankara radyosu yeni yayın dönemine hazır...</p>",
    "slug": "trend-ankara-yeni-yayin-donemi",
    "imageUrl": "https://trendankara.com/api/media/uploads/news1.jpg",
    "imageGallery": [
      "https://trendankara.com/api/media/uploads/gallery1.jpg",
      "https://trendankara.com/api/media/uploads/gallery2.jpg",
      "https://trendankara.com/api/media/uploads/gallery3.jpg"
    ],
    "category": {
      "id": 1,
      "name": "Haberler",
      "slug": "haberler"
    },
    "author": {
      "id": 1,
      "name": "Admin",
      "avatar": "https://trendankara.com/api/media/uploads/avatar.jpg"
    },
    "tags": ["radyo", "yeni sezon", "programlar"],
    "viewCount": 1235,
    "publishedAt": "2025-09-27T10:00:00.000Z",
    "updatedAt": "2025-09-27T10:00:00.000Z",
    "isBreaking": false,
    "relatedNews": [
      {
        "id": 3,
        "title": "Yeni Program: Sabah Keyfi",
        "slug": "yeni-program-sabah-keyfi",
        "imageUrl": "https://trendankara.com/api/media/uploads/related1.jpg",
        "publishedAt": "2025-09-26T14:00:00.000Z"
      }
    ]
  },
  "cache": {
    "etag": "\"xyz789abc123\"",
    "maxAge": 300
  }
}
```

#### Not Found Response (404)
```json
{
  "success": false,
  "data": null,
  "error": "Haber bulunamadı"
}
```

## React Native Implementation

### News Service
```javascript
// services/newsService.js
import apiClient from '../api/authenticatedClient';

class NewsService {
  async getNewsList(page = 1, limit = 10, categoryId = null) {
    try {
      const params = { page, limit };
      if (categoryId) {
        params.category_id = categoryId;
      }

      const response = await apiClient.get('/news', params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getNewsDetail(slug) {
    try {
      const response = await apiClient.get(`/news/${slug}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getCategories() {
    // If there's a separate categories endpoint
    try {
      const response = await apiClient.get('/news/categories');
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new NewsService();
```

### News List Component with Infinite Scroll
```javascript
// screens/NewsListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import newsService from '../services/newsService';
import moment from 'moment';
import 'moment/locale/tr';

moment.locale('tr');

const { width } = Dimensions.get('window');

const NewsListScreen = () => {
  const navigation = useNavigation();
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchNews(1, true);
  }, []);

  const fetchNews = async (pageNum, isInitial = false) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await newsService.getNewsList(pageNum, 10);

      if (response.success) {
        const { items, pagination } = response.data;

        if (isInitial) {
          setNews(items);
        } else {
          setNews(prev => [...prev, ...items]);
        }

        setHasMore(pagination.hasNext);
        setTotalItems(pagination.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    fetchNews(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchNews(page + 1);
    }
  };

  const navigateToDetail = (item) => {
    navigation.navigate('NewsDetail', { slug: item.slug });
  };

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity
      style={styles.newsItem}
      onPress={() => navigateToDetail(item)}
      activeOpacity={0.8}
    >
      {item.isBreaking && (
        <View style={styles.breakingBadge}>
          <Text style={styles.breakingText}>SON DAKİKA</Text>
        </View>
      )}

      <Image
        source={{ uri: item.imageUrl }}
        style={styles.newsImage}
        resizeMode="cover"
      />

      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.newsSummary} numberOfLines={3}>
          {item.summary}
        </Text>

        <View style={styles.newsFooter}>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category.name}</Text>
            </View>
          )}

          <Text style={styles.newsDate}>
            {moment(item.publishedAt).fromNow()}
          </Text>

          <Text style={styles.viewCount}>
            👁 {item.viewCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>Yükleniyor...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Haber bulunamadı</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />

      {totalItems > 0 && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {news.length} / {totalItems} haber
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    paddingBottom: 80,
  },
  newsItem: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  breakingBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  breakingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newsImage: {
    width: '100%',
    height: 200,
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  newsSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  newsDate: {
    fontSize: 12,
    color: '#999',
  },
  viewCount: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  counter: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    opacity: 0.8,
  },
  counterText: {
    color: '#FFF',
    fontSize: 12,
  },
});

export default NewsListScreen;
```

### News Detail Screen
```javascript
// screens/NewsDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { WebView } from 'react-native-webview';
import newsService from '../services/newsService';
import moment from 'moment';
import 'moment/locale/tr';

const { width } = Dimensions.get('window');

const NewsDetailScreen = ({ route }) => {
  const { slug } = route.params;
  const [news, setNews] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchNewsDetail();
  }, []);

  const fetchNewsDetail = async () => {
    try {
      setIsLoading(true);
      const response = await newsService.getNewsDetail(slug);

      if (response.success) {
        setNews(response.data);
      }
    } catch (error) {
      console.error('Error fetching news detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!news) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Haber bulunamadı</Text>
      </View>
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, system-ui, sans-serif;
            padding: 16px;
            color: #333;
            line-height: 1.6;
          }
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px 0;
          }
          p {
            margin: 16px 0;
            font-size: 16px;
          }
          h1, h2, h3 {
            margin: 20px 0 10px 0;
            color: #000;
          }
        </style>
      </head>
      <body>
        ${news.content}
      </body>
    </html>
  `;

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: news.imageUrl }}
        style={styles.mainImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.title}>{news.title}</Text>

        <View style={styles.meta}>
          {news.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{news.category.name}</Text>
            </View>
          )}

          <Text style={styles.date}>
            {moment(news.publishedAt).format('DD MMMM YYYY HH:mm')}
          </Text>
        </View>

        {news.summary && (
          <Text style={styles.summary}>{news.summary}</Text>
        )}

        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          scrollEnabled={false}
          automaticallyAdjustContentInsets={false}
        />

        {news.imageGallery && news.imageGallery.length > 0 && (
          <View style={styles.gallery}>
            <Text style={styles.galleryTitle}>Galeri</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
            >
              {news.imageGallery.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(imageUrl)}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {news.tags && news.tags.length > 0 && (
          <View style={styles.tags}>
            {news.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.viewCount}>👁 {news.viewCount} görüntülenme</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  mainImage: {
    width: width,
    height: 250,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  summary: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 16,
    lineHeight: 26,
  },
  webview: {
    height: 400,
    marginVertical: 16,
  },
  gallery: {
    marginVertical: 20,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  galleryScroll: {
    flexDirection: 'row',
  },
  galleryImage: {
    width: 150,
    height: 150,
    marginRight: 12,
    borderRadius: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 16,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 20,
  },
  viewCount: {
    fontSize: 14,
    color: '#666',
  },
});

export default NewsDetailScreen;
```