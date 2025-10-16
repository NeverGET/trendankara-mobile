/**
 * News API Service
 * Handle news articles and categories
 */

import { NEWS_ENDPOINTS, buildApiUrl, QUERY_PARAMS } from './endpoints';
import { NewsArticle, NewsCategory } from '../../types/models';
import { PaginatedResponse } from '../../types/api';
import apiClient from './client';
import { apiCache, CACHE_KEYS } from '../cache/apiCache';

interface NewsFilters {
  category?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
}

class NewsService {
  private static instance: NewsService;

  private constructor() {}

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  /**
   * Get latest news articles
   */
  async getLatestNews(filters: NewsFilters = {}, useCache = true): Promise<PaginatedResponse<NewsArticle>> {
    const { page = 1, limit = 10, category, featured } = filters;

    // Use simpler cache key for first page default requests (matches initialization)
    // Added v2 to force cache refresh after adding transformation logic
    const isDefaultRequest = page === 1 && limit === 10 && !category && !featured;
    const cacheKey = isDefaultRequest
      ? `${CACHE_KEYS.NEWS_LATEST}_v2`
      : `${CACHE_KEYS.NEWS_ARTICLES}_v2_${page}_${limit}_${category || 'all'}_${featured || 'all'}`;

    if (useCache) {
      const cached = await apiCache.get<PaginatedResponse<NewsArticle>>(cacheKey);
      if (cached) {
        console.log('Using cached news articles from key:', cacheKey);
        return cached;
      }
    }

    try {
      const params = {
        ...QUERY_PARAMS.PAGINATION.paginate(page, limit),
        ...(category && QUERY_PARAMS.FILTERS.category(category)),
        ...(featured !== undefined && QUERY_PARAMS.FILTERS.featured(featured)),
      };

      const url = buildApiUrl(NEWS_ENDPOINTS.GET_NEWS, params);
      const response = await apiClient.get<any>(url);

      // Handle different response formats
      let paginatedResponse: PaginatedResponse<NewsArticle>;

      if (response.data) {
        // If response.data already has the expected structure
        if (response.data.data && response.data.pagination) {
          paginatedResponse = response.data;
        }
        // NEW: Handle API structure with data.items and pagination
        else if (response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
          // Transform API response to match our NewsArticle interface
          const transformedItems = response.data.data.items.map(this.transformApiResponseToNewsArticle);

          paginatedResponse = {
            success: true,
            data: transformedItems,
            pagination: response.data.data.pagination || response.data.pagination || {
              page,
              limit,
              total: response.data.data.items.length,
              totalPages: Math.ceil(response.data.data.items.length / limit),
              hasNext: false,
              hasPrev: page > 1,
            },
          };
        }
        // If response.data is directly an array (no pagination)
        else if (Array.isArray(response.data)) {
          paginatedResponse = {
            success: true,
            data: response.data,
            pagination: {
              page,
              limit,
              total: response.data.length,
              totalPages: Math.ceil(response.data.length / limit),
              hasNext: false,
              hasPrev: page > 1,
            },
          };
        }
        // If response.data has articles array but no pagination
        else if (response.data.articles && Array.isArray(response.data.articles)) {
          paginatedResponse = {
            success: true,
            data: response.data.articles,
            pagination: {
              page,
              limit,
              total: response.data.total || response.data.articles.length,
              totalPages: Math.ceil((response.data.total || response.data.articles.length) / limit),
              hasNext: response.data.hasNext || false,
              hasPrev: response.data.hasPrev || page > 1,
            },
          };
        }
        // Fallback: create structure from whatever we got
        else {
          console.warn('Unexpected news response format:', response.data);
          paginatedResponse = {
            success: true,
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          };
        }
      } else {
        // No data in response
        paginatedResponse = {
          success: false,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      // Debug: Log what we're actually getting from the API
      if (paginatedResponse.data && Array.isArray(paginatedResponse.data) && paginatedResponse.data.length > 0) {
        console.log('🔧 API response data sample:', JSON.stringify(paginatedResponse.data.slice(0, 2).map(article => ({
          id: article.id,
          title: article.title,
          imageUrl: article.imageUrl || 'NO_IMAGE'
        })), null, 2));
      } else {
        console.log('🔧 API response: No data or empty array');
      }

      // Cache for 10 minutes
      await apiCache.set(cacheKey, paginatedResponse, 10 * 60 * 1000);

      return paginatedResponse;
    } catch (error) {
      console.error('Error fetching news:', error);

      // Return mock data in development
      if (__DEV__) {
        console.log('🔧 Using MOCK news data in development');
        const mockResponse = this.getMockNewsResponse(filters);
        if (mockResponse.data && Array.isArray(mockResponse.data) && mockResponse.data.length > 0) {
          console.log('🔧 Mock response data:', JSON.stringify(mockResponse.data.slice(0, 2).map(article => ({
            id: article.id,
            title: article.title,
            imageUrl: article.imageUrl
          })), null, 2));
        }
        return mockResponse;
      }

      throw error;
    }
  }

  /**
   * Get news article by slug
   */
  async getNewsArticle(slug: string, useCache = true): Promise<NewsArticle | null> {
    const cacheKey = `${CACHE_KEYS.NEWS_ARTICLE}_${slug}`;

    if (useCache) {
      const cached = await apiCache.get<NewsArticle>(cacheKey);
      if (cached) {
        console.log('Using cached news article');
        return cached;
      }
    }

    try {
      const response = await apiClient.get<any>(NEWS_ENDPOINTS.GET_NEWS_DETAIL(slug));

      // Handle API response structure: {success: true, data: {...}}
      const apiArticle = response.data?.data || response.data;

      if (!apiArticle) {
        console.error('No article data in response');
        return null;
      }

      // Transform API response to NewsArticle
      const article = this.transformApiResponseToNewsArticle(apiArticle);

      console.log('📰 Fetched news article detail:', {
        slug,
        id: article.id,
        hasContent: !!article.content,
        contentLength: article.content?.length || 0
      });

      // Cache for 30 minutes
      await apiCache.set(cacheKey, article, 30 * 60 * 1000);

      return article;
    } catch (error) {
      console.error('Error fetching news article:', error);

      // Return mock data in development
      if (__DEV__) {
        const mockArticles = this.getMockNews();
        return mockArticles.find(article => article.slug === slug) || null;
      }

      return null;
    }
  }

  /**
   * Get news categories
   */
  async getNewsCategories(useCache = true): Promise<NewsCategory[]> {
    const cacheKey = CACHE_KEYS.NEWS_CATEGORIES;

    if (useCache) {
      const cached = await apiCache.get<NewsCategory[]>(cacheKey);
      if (cached) {
        console.log('Using cached news categories');
        return cached;
      }
    }

    try {
      const response = await apiClient.get<NewsCategory[]>(NEWS_ENDPOINTS.GET_NEWS_CATEGORIES);
      const categories = response.data || [];

      // Cache for 1 hour
      await apiCache.set(cacheKey, categories, 60 * 60 * 1000);

      return categories;
    } catch (error) {
      console.error('Error fetching news categories:', error);

      // Return mock data in development
      if (__DEV__) {
        return this.getMockCategories();
      }

      throw error;
    }
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(
    category: string,
    page = 1,
    limit = 10,
    useCache = true
  ): Promise<PaginatedResponse<NewsArticle>> {
    return this.getLatestNews({ category, page, limit }, useCache);
  }

  /**
   * Search news articles
   */
  async searchNews(query: string, page = 1, limit = 10): Promise<PaginatedResponse<NewsArticle>> {
    try {
      const params = {
        q: query,
        ...QUERY_PARAMS.PAGINATION.paginate(page, limit),
      };

      const url = buildApiUrl(NEWS_ENDPOINTS.GET_NEWS, params);
      const response = await apiClient.get<PaginatedResponse<NewsArticle>>(url);

      return response.data;
    } catch (error) {
      console.error('Error searching news:', error);

      // Return filtered mock data in development
      if (__DEV__) {
        const mockNews = this.getMockNews();
        const filtered = mockNews.filter(article =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(query.toLowerCase())
        );

        return {
          success: true,
          data: filtered.slice((page - 1) * limit, page * limit),
          pagination: {
            page,
            limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
            hasNext: page * limit < filtered.length,
            hasPrev: page > 1,
          },
        };
      }

      throw error;
    }
  }

  /**
   * Get mock news for development
   */
  private getMockNews(): NewsArticle[] {
    return [
      {
        id: 1,
        slug: 'radyo-sektorunde-yeni-trendler',
        title: 'Radyo Sektöründe Yeni Trendler ve Dijital Dönüşüm',
        excerpt: 'Radyo dünyasında yaşanan dijital dönüşüm süreci ve gelecekte bizi bekleyen yenilikler.',
        content: `Radyo sektörü, teknolojinin hızla gelişmesiyle birlikte büyük bir dönüşüm yaşıyor.

        Podcast'lerin yükselişi, akıllı hoparlörler ve voice assistantlar, radyo dinleme alışkanlıklarını değiştiriyor.

        Geleneksel FM/AM yayıncılığından internet radyolarına geçiş hızlanıyor. Spotify, Apple Music gibi platformlar da radyo benzeri içerikler sunmaya başladı.

        Bu değişimler, radyo istasyonlarını yeni stratejiler geliştirmeye zorluyor. İçerik üretiminden dinleyici etkileşimine kadar her alanda yenilikler yapılıyor.`,
        imageUrl: 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Radyo+Teknoloji',
        category: 'Teknoloji',
        publishedAt: '2024-01-20T10:00:00Z',
        author: 'Ahmet Demir',
        readTime: 5,
        isNew: true,
      },
      {
        id: 2,
        slug: 'muzik-endustrisi-2024-raporu',
        title: 'Müzik Endüstrisi 2024 Yıl Sonu Raporu',
        excerpt: 'Türkiye müzik endüstrisinin 2024 yılındaki performansı ve 2025 beklentileri.',
        content: `2024 yılı Türkiye müzik endüstrisi için kayda değer bir yıl oldu.

        Streaming platformlarındaki artış devam ederken, konser ve festival organizasyonları da hız kazandı.

        Yerli sanatçıların uluslararası başarıları dikkat çekiyor. Özellikle genç nesil sanatçılar, sosyal medya sayesinde küresel dinleyicilere ulaşıyor.

        Dijital müzik satışları %15 artış gösterirken, fiziksel satışlar da nostaljik bir geri dönüş yaşıyor.`,
        imageUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Muzik+Raporu',
        category: 'Endüstri',
        publishedAt: '2024-01-18T14:30:00Z',
        author: 'Elif Yılmaz',
        readTime: 8,
        isNew: true,
      },
      {
        id: 3,
        slug: 'podcast-yayinciligi-rehberi',
        title: 'Podcast Yayıncılığı: Başlangıç Rehberi',
        excerpt: 'Podcast dünyasına adım atmak isteyenler için kapsamlı bir başlangıç rehberi.',
        content: `Podcast, son yıllarda hızla büyüyen bir içerik formatı haline geldi.

        Başarılı bir podcast için hikaye anlatımı, düzenli yayın takvimi ve kaliteli ses önemli.

        Platform seçimi, hedef kitle analizi ve içerik planlaması temel adımlar arasında.

        Monetizasyon seçenekleri: sponsorluk, premium içerik, ürün satışı ve bağış kampanyaları.`,
        imageUrl: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Podcast+Rehberi',
        category: 'Rehber',
        publishedAt: '2024-01-15T09:15:00Z',
        author: 'Can Özkan',
        readTime: 6,
        isNew: false,
      },
      {
        id: 4,
        slug: 'sosyal-medya-muzik-etkisi',
        title: 'Sosyal Medyanın Müzik Trendlerine Etkisi',
        excerpt: 'TikTok, Instagram ve diğer sosyal medya platformlarının müzik endüstrisindeki rolü.',
        content: `Sosyal medya platformları, müzik keşfinin ana kaynağı haline geldi.

        TikTok'ta viral olan şarkılar, müzik listelerinin zirvesine çıkıyor. 15-30 saniyelik kısa formatlar, tüm şarkıların yapısını etkiliyor.

        Sanatçılar, albüm çıkarmadan önce sosyal medyada test ediyor. Fan etkileşimi, müzik üretim sürecinin bir parçası oldu.

        Algoritmaların müzik keşfindeki rolü ve bu durumun sanatsal yaratıcılığa etkileri tartışılıyor.`,
        imageUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Sosyal+Medya',
        category: 'Sosyal Medya',
        publishedAt: '2024-01-12T16:45:00Z',
        author: 'Zeynep Kaya',
        readTime: 7,
        isNew: false,
      },
    ];
  }

  /**
   * Get mock categories for development
   */
  private getMockCategories(): NewsCategory[] {
    return [
      {
        id: 1,
        name: 'Teknoloji',
        slug: 'teknoloji',
        description: 'Radyo ve müzik dünyasındaki teknolojik gelişmeler',
        articleCount: 25,
      },
      {
        id: 2,
        name: 'Endüstri',
        slug: 'endustri',
        description: 'Müzik ve medya endüstrisi haberleri',
        articleCount: 18,
      },
      {
        id: 3,
        name: 'Rehber',
        slug: 'rehber',
        description: 'Yayıncılık ve müzik üretimi rehberleri',
        articleCount: 12,
      },
      {
        id: 4,
        name: 'Sosyal Medya',
        slug: 'sosyal-medya',
        description: 'Sosyal medya ve müzik etkileşimi',
        articleCount: 15,
      },
    ];
  }

  /**
   * Get mock paginated news response
   */
  private getMockNewsResponse(filters: NewsFilters): PaginatedResponse<NewsArticle> {
    const { page = 1, limit = 10, category } = filters;
    let mockNews = this.getMockNews();

    // Filter by category if specified
    if (category) {
      mockNews = mockNews.filter(article =>
        article.category.toLowerCase() === category.toLowerCase()
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mockNews.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: mockNews.length,
        totalPages: Math.ceil(mockNews.length / limit),
        hasNext: endIndex < mockNews.length,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Transform API response item to NewsArticle interface
   */
  private transformApiResponseToNewsArticle(apiItem: any): NewsArticle {
    // Convert relative image paths to absolute URLs
    const imageUrl = apiItem.featuredImage
      ? `https://trendankara.com${apiItem.featuredImage}`
      : null;

    return {
      id: apiItem.id,
      slug: apiItem.slug,
      title: apiItem.title,
      excerpt: apiItem.summary || '',
      content: apiItem.content || apiItem.summary || '',
      imageUrl,
      category: apiItem.category || 'Genel',
      publishedAt: apiItem.publishedAt || new Date().toISOString(),
      author: apiItem.author || 'Trend Ankara',
      readTime: Math.ceil((apiItem.content || apiItem.summary || '').length / 200) || 3,
      isNew: new Date(apiItem.publishedAt || new Date()).getTime() > Date.now() - 24 * 60 * 60 * 1000,
      views: apiItem.views || 0,
      isFeatured: apiItem.isFeatured || false,
      isBreaking: apiItem.isBreaking || false,
      isHot: apiItem.isHot || false,
      redirectUrl: apiItem.redirectUrl || undefined,  // NEW: Optional redirect URL for opening in browser
    };
  }

  /**
   * Clear all news cache
   */
  async clearCache(): Promise<void> {
    await apiCache.clearAll();
  }
}

export const newsService = NewsService.getInstance();