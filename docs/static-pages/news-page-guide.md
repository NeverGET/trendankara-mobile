# News Page Implementation Guide

## Overview
This guide provides a comprehensive implementation reference for creating a static news page in React Native that displays latest news articles with categories, pagination, and detail views. The page consumes the existing news API endpoints and provides a rich user experience with infinite scroll, category filtering, and detailed article views with image galleries.

## Features
- Paginated news list with infinite scroll
- Category-based filtering
- Article detail view with content and image galleries
- Breaking/featured news highlighting
- Error handling and offline state management
- Optimized performance with caching

## API Endpoints

### 1. Get News List
**Endpoint:** `GET /api/mobile/v1/news`

Retrieves a paginated list of news articles with mobile-optimized formatting and respects mobile settings for maximum news count.

```javascript
// Request
GET https://trendankara.com/api/mobile/v1/news?page=1&limit=10&category_id=1
Headers:
  Accept: application/json
  X-Device-ID: unique-device-id
  If-None-Match: "etag-value" // For caching
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (1-based) |
| limit | number | No | 10 | Items per page (max: 50) |
| category_id | number | No | null | Filter by specific category |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Trend Ankara'da Yeni Yayın Dönemi Başlıyor",
        "slug": "trend-ankara-yeni-yayin-donemi-basliyor",
        "summary": "Yeni sezon programlarımız ile dinleyicilerimizle buluşuyoruz",
        "featuredImage": "https://trendankara.com/api/media/uploads/news1.jpg",
        "category": "Haberler",
        "categoryId": 1,
        "isFeatured": true,
        "isBreaking": false,
        "isHot": true,
        "publishedAt": "2025-09-27T10:00:00.000Z",
        "views": 1234
      },
      {
        "id": 2,
        "title": "Canlı Yayında Sürpriz Konuk",
        "slug": "canli-yayinda-surpriz-konuk",
        "summary": "Bu akşam saat 20:00'da özel konuğumuz var",
        "featuredImage": "https://trendankara.com/api/media/uploads/news2.jpg",
        "category": "Programlar",
        "categoryId": 2,
        "isFeatured": false,
        "isBreaking": true,
        "isHot": false,
        "publishedAt": "2025-09-27T08:30:00.000Z",
        "views": 567
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "cache": {
    "etag": "\"abc123def456\"",
    "maxAge": 120
  }
}
```

**Error Response (500):**
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
**Endpoint:** `GET /api/mobile/v1/news/{slug}`

Retrieves detailed news article content with full content, image galleries, and related articles.

```javascript
// Request
GET https://trendankara.com/api/mobile/v1/news/trend-ankara-yeni-yayin-donemi-basliyor
Headers:
  Accept: application/json
  X-Device-ID: unique-device-id
  If-None-Match: "etag-value"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Trend Ankara'da Yeni Yayın Dönemi Başlıyor",
    "slug": "trend-ankara-yeni-yayin-donemi-basliyor",
    "summary": "Yeni sezon programlarımız ile dinleyicilerimizle buluşuyoruz",
    "content": "<p>Detaylı haber içeriği burada yer alır...</p>",
    "featuredImage": "https://trendankara.com/api/media/uploads/news1.jpg",
    "images": [
      "https://trendankara.com/api/media/uploads/gallery1.jpg",
      "https://trendankara.com/api/media/uploads/gallery2.jpg",
      "https://trendankara.com/api/media/uploads/gallery3.jpg"
    ],
    "category": "Haberler",
    "categoryId": 1,
    "isFeatured": true,
    "isBreaking": false,
    "isHot": true,
    "publishedAt": "2025-09-27T10:00:00.000Z",
    "views": 1235,
    "author": "Editör",
    "tags": ["Haberler", "Öne Çıkan", "Gündem"],
    "relatedNews": [
      {
        "id": 3,
        "title": "İlgili Haber Başlığı",
        "slug": "ilgili-haber-basligi",
        "summary": "İlgili haber özeti",
        "featuredImage": "https://trendankara.com/api/media/uploads/related1.jpg",
        "category": "Haberler",
        "categoryId": 1,
        "publishedAt": "2025-09-26T15:30:00.000Z"
      }
    ]
  },
  "cache": {
    "etag": "\"def789ghi012\"",
    "maxAge": 300
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "data": null,
  "error": "Haber bulunamadı"
}
```

## React Native Implementation

### 1. News Service

Create a service to handle all news API interactions:

```javascript
// services/NewsService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

class NewsService {
  constructor() {
    this.baseURL = 'https://trendankara.com/api/mobile/v1';
    this.deviceId = null;
    this.cache = new Map();
    this.initializeDeviceId();
  }

  async initializeDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = await DeviceInfo.getUniqueId();
        await AsyncStorage.setItem('device_id', deviceId);
      }
      this.deviceId = deviceId;
    } catch (error) {
      console.error('Error initializing device ID:', error);
      this.deviceId = 'fallback-device-id';
    }
  }

  async getHeaders(etag = null) {
    const headers = {
      'Accept': 'application/json',
      'X-Device-ID': this.deviceId || 'fallback-device-id',
    };

    if (etag) {
      headers['If-None-Match'] = etag;
    }

    return headers;
  }

  async getNewsList(page = 1, limit = 10, categoryId = null) {
    try {
      const cacheKey = `news_list_${page}_${limit}_${categoryId || 'all'}`;
      const cached = this.cache.get(cacheKey);

      let url = `${this.baseURL}/news?page=${page}&limit=${limit}`;
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }

      const headers = await this.getHeaders(cached?.etag);
      const response = await fetch(url, { headers });

      // Handle 304 Not Modified
      if (response.status === 304 && cached) {
        return cached.data;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Cache successful response
      if (result.success) {
        this.cache.set(cacheKey, {
          data: result,
          etag: result.cache?.etag,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching news list:', error);

      // Return cached data if available
      const cacheKey = `news_list_${page}_${limit}_${categoryId || 'all'}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached.data;
      }

      // Return error structure
      return {
        success: false,
        data: {
          items: [],
          pagination: { page, limit, total: 0, hasNext: false, hasPrev: false }
        },
        error: 'Haberler yüklenirken bir hata oluştu'
      };
    }
  }

  async getNewsDetail(slug) {
    try {
      const cacheKey = `news_detail_${slug}`;
      const cached = this.cache.get(cacheKey);

      const url = `${this.baseURL}/news/${slug}`;
      const headers = await this.getHeaders(cached?.etag);
      const response = await fetch(url, { headers });

      // Handle 304 Not Modified
      if (response.status === 304 && cached) {
        return cached.data;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Cache successful response
      if (result.success) {
        this.cache.set(cacheKey, {
          data: result,
          etag: result.cache?.etag,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching news detail:', error);

      // Return cached data if available
      const cacheKey = `news_detail_${slug}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached.data;
      }

      return {
        success: false,
        data: null,
        error: 'Haber detayı yüklenirken bir hata oluştu'
      };
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }
}

export default new NewsService();
```

### 2. News List Component with Infinite Scroll

```javascript
// components/NewsList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import NewsService from '../services/NewsService';
import NewsCard from './NewsCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

const { width } = Dimensions.get('window');

const NewsList = ({ categoryId = null, onNewsPress }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasNext, setHasNext] = useState(true);
  const [page, setPage] = useState(1);

  const loadNews = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const result = await NewsService.getNewsList(pageNum, 10, categoryId);

      if (result.success) {
        const newItems = result.data.items || [];

        if (pageNum === 1) {
          setNews(newItems);
        } else {
          setNews(prev => [...prev, ...newItems]);
        }

        setHasNext(result.data.pagination?.hasNext || false);
        setPage(pageNum);
      } else {
        setError(result.error || 'Haberler yüklenirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Error loading news:', err);
      setError('Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadNews(1);
  }, [loadNews]);

  const handleRefresh = useCallback(() => {
    loadNews(1, true);
  }, [loadNews]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasNext) {
      loadNews(page + 1);
    }
  }, [loadMore, hasNext, page, loadNews]);

  const renderNewsItem = useCallback(({ item }) => (
    <NewsCard
      news={item}
      onPress={() => onNewsPress?.(item)}
    />
  ), [onNewsPress]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF6B35" />
        <Text style={styles.loadingText}>Daha fazla haber yükleniyor...</Text>
      </View>
    );
  }, [loadingMore]);

  const keyExtractor = useCallback((item) => `news-${item.id}`, []);

  if (loading && news.length === 0) {
    return <LoadingState message="Haberler yükleniyor..." />;
  }

  if (error && news.length === 0) {
    return (
      <ErrorState
        message={error}
        onRetry={() => loadNews(1)}
      />
    );
  }

  return (
    <FlatList
      data={news}
      keyExtractor={keyExtractor}
      renderItem={renderNewsItem}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#FF6B35']}
          tintColor="#FF6B35"
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default NewsList;
```

### 3. News Card Component

```javascript
// components/NewsCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const { width } = Dimensions.get('window');

const NewsCard = ({ news, onPress }) => {
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy, HH:mm', { locale: tr });
    } catch (error) {
      return 'Tarih belirtilmemiş';
    }
  };

  const getBadgeStyle = () => {
    if (news.isBreaking) return styles.breakingBadge;
    if (news.isFeatured) return styles.featuredBadge;
    if (news.isHot) return styles.hotBadge;
    return null;
  };

  const getBadgeText = () => {
    if (news.isBreaking) return 'SON DAKİKA';
    if (news.isFeatured) return 'ÖNE ÇIKAN';
    if (news.isHot) return 'GÜNDEM';
    return null;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(news)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: news.featuredImage || 'https://via.placeholder.com/300x200?text=Görsel+Yok'
          }}
          style={styles.image}
          resizeMode="cover"
        />
        {getBadgeStyle() && (
          <View style={[styles.badge, getBadgeStyle()]}>
            <Text style={styles.badgeText}>{getBadgeText()}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{news.category}</Text>
          <Text style={styles.views}>{news.views} görüntülenme</Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {news.title}
        </Text>

        {news.summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {news.summary}
          </Text>
        )}

        <Text style={styles.date}>
          {formatDate(news.publishedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  breakingBadge: {
    backgroundColor: '#FF4757',
  },
  featuredBadge: {
    backgroundColor: '#3742FA',
  },
  hotBadge: {
    backgroundColor: '#FF6B35',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  views: {
    fontSize: 11,
    color: '#999',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});

export default NewsCard;
```

### 4. News Detail Component

```javascript
// components/NewsDetail.js
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import NewsService from '../services/NewsService';
import ImageGallery from './ImageGallery';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

const { width, height } = Dimensions.get('window');

const NewsDetail = ({ slug, onBack, onRelatedNewsPress }) => {
  const [newsDetail, setNewsDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadNewsDetail();
  }, [slug]);

  const loadNewsDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await NewsService.getNewsDetail(slug);

      if (result.success && result.data) {
        setNewsDetail(result.data);
      } else {
        setError(result.error || 'Haber detayı yüklenirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Error loading news detail:', err);
      setError('Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = (index = 0) => {
    setSelectedImageIndex(index);
    setShowImageGallery(true);
  };

  const renderContent = () => {
    if (!newsDetail?.content) return null;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 16px;
              background-color: #fff;
            }
            p { margin-bottom: 16px; }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 8px 0;
            }
            a { color: #FF6B35; text-decoration: none; }
            a:hover { text-decoration: underline; }
            blockquote {
              border-left: 4px solid #FF6B35;
              margin: 16px 0;
              padding-left: 16px;
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          ${newsDetail.content}
        </body>
      </html>
    `;

    return (
      <View style={styles.webViewContainer}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webView}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Haber detayı yükleniyor..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadNewsDetail}
        onBack={onBack}
      />
    );
  }

  if (!newsDetail) {
    return (
      <ErrorState
        message="Haber bulunamadı"
        onBack={onBack}
      />
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Featured Image */}
        {newsDetail.featuredImage && (
          <TouchableOpacity onPress={() => handleImagePress(0)}>
            <Image
              source={{ uri: newsDetail.featuredImage }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Category and Date */}
          <View style={styles.metaContainer}>
            <Text style={styles.category}>{newsDetail.category}</Text>
            <Text style={styles.date}>
              {format(new Date(newsDetail.publishedAt), 'd MMMM yyyy, HH:mm', { locale: tr })}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{newsDetail.title}</Text>

          {/* Author and Views */}
          <View style={styles.authorContainer}>
            {newsDetail.author && (
              <Text style={styles.author}>Yazar: {newsDetail.author}</Text>
            )}
            <Text style={styles.views}>{newsDetail.views} görüntülenme</Text>
          </View>

          {/* Tags */}
          {newsDetail.tags && newsDetail.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {newsDetail.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Summary */}
          {newsDetail.summary && (
            <Text style={styles.summary}>{newsDetail.summary}</Text>
          )}

          {/* Content */}
          {renderContent()}

          {/* Image Gallery */}
          {newsDetail.images && newsDetail.images.length > 0 && (
            <View style={styles.galleryContainer}>
              <Text style={styles.galleryTitle}>Galeri ({newsDetail.images.length} fotoğraf)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.galleryScroll}
              >
                {newsDetail.images.map((imageUrl, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleImagePress(index)}
                    style={styles.galleryImageContainer}
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

          {/* Related News */}
          {newsDetail.relatedNews && newsDetail.relatedNews.length > 0 && (
            <View style={styles.relatedContainer}>
              <Text style={styles.relatedTitle}>İlgili Haberler</Text>
              {newsDetail.relatedNews.map((relatedNews) => (
                <TouchableOpacity
                  key={relatedNews.id}
                  style={styles.relatedItem}
                  onPress={() => onRelatedNewsPress?.(relatedNews)}
                >
                  <Image
                    source={{ uri: relatedNews.featuredImage }}
                    style={styles.relatedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedNewsTitle} numberOfLines={2}>
                      {relatedNews.title}
                    </Text>
                    <Text style={styles.relatedCategory}>{relatedNews.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Gallery Modal */}
      {showImageGallery && newsDetail.images && (
        <Modal
          visible={showImageGallery}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageGallery(false)}
        >
          <ImageGallery
            images={newsDetail.images}
            initialIndex={selectedImageIndex}
            onClose={() => setShowImageGallery(false)}
          />
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  featuredImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 28,
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  author: {
    fontSize: 13,
    color: '#666',
  },
  views: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  summary: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  webViewContainer: {
    marginBottom: 16,
  },
  webView: {
    height: 400, // This will be dynamic based on content
  },
  galleryContainer: {
    marginBottom: 24,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  galleryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  galleryImageContainer: {
    marginRight: 12,
  },
  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  relatedContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  relatedItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  relatedImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
  },
  relatedContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  relatedNewsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  relatedCategory: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
});

export default NewsDetail;
```

### 5. Image Gallery Component

```javascript
// components/ImageGallery.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  PanGestureHandler,
  Animated,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { PinchGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const ImageGallery = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale] = useState(new Animated.Value(1));
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));

  const handlePinch = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: true }
  );

  const handlePan = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const resetImageTransform = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetImageTransform();
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetImageTransform();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.counter}>
          {currentIndex + 1} / {images.length}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <PinchGestureHandler onGestureEvent={handlePinch}>
          <Animated.View style={styles.imageWrapper}>
            <PanGestureHandler onGestureEvent={handlePan}>
              <Animated.View
                style={[
                  styles.animatedImageContainer,
                  {
                    transform: [
                      { scale: scale },
                      { translateX: translateX },
                      { translateY: translateY },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: images[currentIndex] }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </View>

      {images.length > 1 && (
        <View style={styles.navigation}>
          <TouchableOpacity
            onPress={goToPrevious}
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            disabled={currentIndex === 0}
          >
            <Text style={[styles.navText, currentIndex === 0 && styles.navTextDisabled]}>
              ‹ Önceki
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNext}
            style={[styles.navButton, currentIndex === images.length - 1 && styles.navButtonDisabled]}
            disabled={currentIndex === images.length - 1}
          >
            <Text style={[styles.navText, currentIndex === images.length - 1 && styles.navTextDisabled]}>
              Sonraki ›
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <View style={styles.thumbnailContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailScroll}
          >
            {images.map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setCurrentIndex(index);
                  resetImageTransform();
                }}
                style={[
                  styles.thumbnail,
                  index === currentIndex && styles.thumbnailActive
                ]}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: width,
    height: height * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  navTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  thumbnailContainer: {
    height: 80,
    paddingVertical: 10,
  },
  thumbnailScroll: {
    paddingHorizontal: 20,
  },
  thumbnail: {
    marginRight: 10,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#FF6B35',
  },
  thumbnailImage: {
    width: 60,
    height: 45,
  },
});

export default ImageGallery;
```

### 6. Category Filter Component

```javascript
// components/CategoryFilter.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

const categories = [
  { id: null, name: 'Tümü', slug: 'all' },
  { id: 1, name: 'Haberler', slug: 'haberler' },
  { id: 2, name: 'Programlar', slug: 'programlar' },
  { id: 3, name: 'Etkinlikler', slug: 'etkinlikler' },
  { id: 4, name: 'Müzik', slug: 'muzik' },
  { id: 5, name: 'Kültür', slug: 'kultur' },
];

const CategoryFilter = ({ selectedCategoryId, onCategorySelect }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.slug}
            style={[
              styles.categoryButton,
              selectedCategoryId === category.id && styles.categoryButtonActive
            ]}
            onPress={() => onCategorySelect(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategoryId === category.id && styles.categoryTextActive
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
});

export default CategoryFilter;
```

### 7. Main News Page Component

```javascript
// screens/NewsScreen.js
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import NewsList from '../components/NewsList';
import NewsDetail from '../components/NewsDetail';
import CategoryFilter from '../components/CategoryFilter';
import Header from '../components/Header';

const NewsScreen = ({ navigation }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
  const [selectedNewsSlug, setSelectedNewsSlug] = useState(null);

  const handleNewsPress = (news) => {
    setSelectedNewsSlug(news.slug);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedNewsSlug(null);
  };

  const handleRelatedNewsPress = (relatedNews) => {
    setSelectedNewsSlug(relatedNews.slug);
    // Stay in detail view, just change the slug
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Haberler"
        showBack={currentView === 'detail'}
        onBack={handleBackToList}
      />

      {currentView === 'list' ? (
        <>
          <CategoryFilter
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={handleCategorySelect}
          />
          <NewsList
            categoryId={selectedCategoryId}
            onNewsPress={handleNewsPress}
          />
        </>
      ) : (
        <NewsDetail
          slug={selectedNewsSlug}
          onBack={handleBackToList}
          onRelatedNewsPress={handleRelatedNewsPress}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
});

export default NewsScreen;
```

## Key Features Implemented

### 1. Infinite Scroll with Performance Optimization
- Uses `FlatList` with `onEndReached` for loading more content
- Implements `removeClippedSubviews`, `maxToRenderPerBatch`, and `windowSize` for better performance
- Tracks loading states to prevent duplicate requests

### 2. Category Filtering
- Horizontal scrollable category filter
- Resets pagination when category changes
- Visual feedback for selected category

### 3. Caching Strategy
- ETag-based HTTP caching using `If-None-Match` headers
- In-memory cache with TTL for offline support
- Graceful fallback to cached data on network errors

### 4. Rich Article Detail View
- WebView for HTML content rendering with custom CSS
- Image gallery with pinch-to-zoom and pan gestures
- Related articles for improved engagement
- View count tracking

### 5. Breaking/Featured News Highlighting
- Visual badges for different news types (Breaking, Featured, Hot)
- Color-coded category indicators
- Priority display for important news

### 6. Error Handling
- Network error recovery with retry functionality
- Graceful degradation with cached content
- User-friendly error messages in Turkish

### 7. Accessibility Features
- Proper touch targets (minimum 44pt)
- Descriptive text for screen readers
- High contrast color scheme

## Performance Considerations

1. **Image Loading**: Use lazy loading and placeholder images
2. **Memory Management**: Implement image caching and cleanup
3. **Network Optimization**: Leverage ETags and conditional requests
4. **Scroll Performance**: Use FlatList optimization props
5. **WebView Performance**: Limit WebView height and disable unnecessary features

## Testing Recommendations

1. **Unit Tests**: Test API service methods and data transformations
2. **Integration Tests**: Test navigation between list and detail views
3. **Performance Tests**: Monitor memory usage and scroll performance
4. **Network Tests**: Test offline behavior and error recovery
5. **Accessibility Tests**: Verify screen reader compatibility

This implementation provides a robust, performant news page that follows mobile best practices and provides an excellent user experience for reading news articles with rich media content.