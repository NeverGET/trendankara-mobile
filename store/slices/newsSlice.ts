/**
 * News Slice
 * Redux state management for news articles
 * Trend Ankara Mobile Application
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NewsArticle, NewsCategory } from '@/types/models';

// News state
interface NewsState {
  articles: NewsArticle[];
  categories: NewsCategory[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  lastFetched: number | null;

  // Pagination
  currentPage: number;
  hasMorePages: boolean;
  totalArticles: number;

  // Filtering and search
  selectedCategory: string | null;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'popular';

  // Reading state
  readArticles: number[]; // Article IDs that have been read
  bookmarkedArticles: number[]; // Article IDs that are bookmarked

  // Cache management
  cacheExpiry: number | null;
  offlineArticles: NewsArticle[]; // Cached for offline reading
}

// Initial state
const initialState: NewsState = {
  articles: [],
  categories: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetched: null,
  currentPage: 1,
  hasMorePages: true,
  totalArticles: 0,
  selectedCategory: null,
  searchQuery: '',
  sortBy: 'newest',
  readArticles: [],
  bookmarkedArticles: [],
  cacheExpiry: null,
  offlineArticles: [],
};

// Mock data for development
const mockCategories: NewsCategory[] = [
  { id: 1, name: 'Genel', slug: 'genel', description: 'Genel haberler', articleCount: 45 },
  { id: 2, name: 'Müzik', slug: 'muzik', description: 'Müzik haberleri', articleCount: 23 },
  { id: 3, name: 'Teknoloji', slug: 'teknoloji', description: 'Teknoloji haberleri', articleCount: 18 },
  { id: 4, name: 'Kültür', slug: 'kultur', description: 'Kültür haberleri', articleCount: 12 },
];

const mockArticles: NewsArticle[] = [
  {
    id: 1,
    slug: 'yeni-muzik-trendleri-2025',
    title: '2025 Yılının En Popüler Müzik Trendleri',
    excerpt: 'Bu yıl müzik dünyasında hangi trendler öne çıkıyor? İşte 2025\'in en dikkat çeken müzik akımları...',
    content: 'Detaylı makale içeriği burada yer alacak...',
    imageUrl: 'https://example.com/music-trends.jpg',
    category: 'muzik',
    publishedAt: '2025-09-28T10:00:00Z',
    author: 'Müzik Editörü',
    readTime: 5,
    isNew: true,
  },
  {
    id: 2,
    slug: 'radyo-dinleme-aliskanliklari',
    title: 'Dijital Çağda Radyo Dinleme Alışkanlıkları Değişiyor',
    excerpt: 'Araştırmalar gösteriyor ki, gençler radyoyu farklı şekillerde tüketiyor...',
    content: 'Detaylı makale içeriği burada yer alacak...',
    imageUrl: 'https://example.com/radio-habits.jpg',
    category: 'genel',
    publishedAt: '2025-09-27T15:30:00Z',
    author: 'Araştırma Ekibi',
    readTime: 3,
    isNew: true,
  },
  {
    id: 3,
    slug: 'podcast-teknolojileri',
    title: 'Podcast Teknolojilerindeki Son Gelişmeler',
    excerpt: 'Ses teknolojilerindeki yenilikler podcast deneyimini nasıl değiştiriyor?',
    content: 'Detaylı makale içeriği burada yer alacak...',
    imageUrl: 'https://example.com/podcast-tech.jpg',
    category: 'teknoloji',
    publishedAt: '2025-09-26T09:15:00Z',
    author: 'Tech Writer',
    readTime: 7,
    isNew: false,
  },
];

// Async thunks
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (
    params: {
      page?: number;
      category?: string;
      search?: string;
      limit?: number;
      forceRefresh?: boolean;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const { page = 1, category, search, limit = 20, forceRefresh = false } = params;

      console.log('Fetching news...', { page, category, search, limit });

      // For development, use mock data
      if (__DEV__) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        let filteredArticles = [...mockArticles];

        // Apply category filter
        if (category && category !== 'all') {
          filteredArticles = filteredArticles.filter(article => article.category === category);
        }

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          filteredArticles = filteredArticles.filter(
            article =>
              article.title.toLowerCase().includes(searchLower) ||
              article.excerpt.toLowerCase().includes(searchLower)
          );
        }

        // Simulate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

        return {
          articles: paginatedArticles,
          categories: mockCategories,
          totalArticles: filteredArticles.length,
          hasMorePages: endIndex < filteredArticles.length,
          page,
          timestamp: Date.now(),
        };
      }

      // In production, call actual API
      // const response = await api.get('/news', { params });
      // return response.data;

      throw new Error('API not implemented');
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch news',
        timestamp: Date.now(),
      });
    }
  }
);

export const fetchArticleDetails = createAsyncThunk(
  'news/fetchArticleDetails',
  async (articleId: number, { rejectWithValue }) => {
    try {
      console.log('Fetching article details:', articleId);

      // For development, find article in mock data
      if (__DEV__) {
        await new Promise(resolve => setTimeout(resolve, 300));

        const article = mockArticles.find(a => a.id === articleId);
        if (!article) {
          throw new Error('Article not found');
        }

        return {
          article: {
            ...article,
            content: `Detaylı makale içeriği... Bu ${article.title} başlıklı makalenin tam içeriği burada yer alacak. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
          },
          timestamp: Date.now(),
        };
      }

      // In production, call actual API
      // const response = await api.get(`/news/${articleId}`);
      // return response.data;

      throw new Error('API not implemented');
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch article',
        timestamp: Date.now(),
      });
    }
  }
);

export const loadMoreNews = createAsyncThunk(
  'news/loadMoreNews',
  async (_, { getState, dispatch }) => {
    const state = getState() as { news: NewsState };
    const { currentPage, selectedCategory, searchQuery, hasMorePages } = state.news;

    if (!hasMorePages) {
      return { articles: [], hasMorePages: false };
    }

    return dispatch(fetchNews({
      page: currentPage + 1,
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
    }));
  }
);

export const refreshNews = createAsyncThunk(
  'news/refreshNews',
  async (_, { getState, dispatch }) => {
    const state = getState() as { news: NewsState };
    const { selectedCategory, searchQuery } = state.news;

    return dispatch(fetchNews({
      page: 1,
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
      forceRefresh: true,
    }));
  }
);

// News slice
const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    // Filtering and search
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      state.currentPage = 1; // Reset pagination
      state.articles = []; // Clear current articles
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.currentPage = 1; // Reset pagination
      state.articles = []; // Clear current articles
    },

    setSortBy: (state, action: PayloadAction<'newest' | 'oldest' | 'popular'>) => {
      state.sortBy = action.payload;
      // Sort existing articles
      newsSlice.caseReducers.sortArticles(state);
    },

    sortArticles: (state) => {
      switch (state.sortBy) {
        case 'newest':
          state.articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          break;
        case 'oldest':
          state.articles.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
          break;
        case 'popular':
          // Could sort by view count or other popularity metrics
          state.articles.sort((a, b) => b.readTime - a.readTime); // Mock sort by read time
          break;
      }
    },

    // Reading state
    markAsRead: (state, action: PayloadAction<number>) => {
      const articleId = action.payload;
      if (!state.readArticles.includes(articleId)) {
        state.readArticles.push(articleId);
      }

      // Update article's isNew status
      const article = state.articles.find(a => a.id === articleId);
      if (article) {
        article.isNew = false;
      }
    },

    markAsUnread: (state, action: PayloadAction<number>) => {
      const articleId = action.payload;
      state.readArticles = state.readArticles.filter(id => id !== articleId);

      // Update article's isNew status
      const article = state.articles.find(a => a.id === articleId);
      if (article) {
        article.isNew = true;
      }
    },

    // Bookmarking
    toggleBookmark: (state, action: PayloadAction<number>) => {
      const articleId = action.payload;
      const index = state.bookmarkedArticles.indexOf(articleId);

      if (index === -1) {
        state.bookmarkedArticles.push(articleId);
      } else {
        state.bookmarkedArticles.splice(index, 1);
      }
    },

    addBookmark: (state, action: PayloadAction<number>) => {
      const articleId = action.payload;
      if (!state.bookmarkedArticles.includes(articleId)) {
        state.bookmarkedArticles.push(articleId);
      }
    },

    removeBookmark: (state, action: PayloadAction<number>) => {
      const articleId = action.payload;
      state.bookmarkedArticles = state.bookmarkedArticles.filter(id => id !== articleId);
    },

    // Cache management
    cacheArticleForOffline: (state, action: PayloadAction<NewsArticle>) => {
      const article = action.payload;
      const existingIndex = state.offlineArticles.findIndex(a => a.id === article.id);

      if (existingIndex === -1) {
        state.offlineArticles.push(article);
      } else {
        state.offlineArticles[existingIndex] = article;
      }
    },

    removeCachedArticle: (state, action: PayloadAction<number>) => {
      const articleId = action.payload;
      state.offlineArticles = state.offlineArticles.filter(a => a.id !== articleId);
    },

    clearCache: (state) => {
      state.offlineArticles = [];
      state.cacheExpiry = null;
    },

    // Error handling
    clearError: (state) => {
      state.error = null;
    },

    // Reset filters
    resetFilters: (state) => {
      state.selectedCategory = null;
      state.searchQuery = '';
      state.sortBy = 'newest';
      state.currentPage = 1;
      state.articles = [];
    },

    // Update article
    updateArticle: (state, action: PayloadAction<NewsArticle>) => {
      const updatedArticle = action.payload;
      const index = state.articles.findIndex(a => a.id === updatedArticle.id);

      if (index !== -1) {
        state.articles[index] = updatedArticle;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch news
    builder
      .addCase(fetchNews.pending, (state, action) => {
        const isFirstPage = action.meta.arg.page === 1 || !action.meta.arg.page;

        if (isFirstPage) {
          state.isLoading = true;
        } else {
          state.isLoadingMore = true;
        }

        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        const { articles, categories, totalArticles, hasMorePages, page } = action.payload;

        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = null;
        state.lastFetched = action.payload.timestamp;

        if (page === 1) {
          // First page - replace articles
          state.articles = articles;
        } else {
          // Additional pages - append articles
          state.articles.push(...articles);
        }

        state.categories = categories;
        state.totalArticles = totalArticles;
        state.hasMorePages = hasMorePages;
        state.currentPage = page;

        // Sort articles if needed
        newsSlice.caseReducers.sortArticles(state);
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload?.message || 'Failed to fetch news';
      });

    // Fetch article details
    builder
      .addCase(fetchArticleDetails.fulfilled, (state, action) => {
        const { article } = action.payload;
        const index = state.articles.findIndex(a => a.id === article.id);

        if (index !== -1) {
          state.articles[index] = article;
        } else {
          state.articles.unshift(article); // Add to beginning if not found
        }

        // Auto-cache for offline reading
        newsSlice.caseReducers.cacheArticleForOffline(state, { payload: article, type: '' });
      })
      .addCase(fetchArticleDetails.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to fetch article details';
      });
  },
});

// Export actions
export const {
  setSelectedCategory,
  setSearchQuery,
  setSortBy,
  sortArticles,
  markAsRead,
  markAsUnread,
  toggleBookmark,
  addBookmark,
  removeBookmark,
  cacheArticleForOffline,
  removeCachedArticle,
  clearCache,
  clearError,
  resetFilters,
  updateArticle,
} = newsSlice.actions;

// Selectors
export const selectNews = (state: { news: NewsState }) => state.news;
export const selectNewsArticles = (state: { news: NewsState }) => state.news.articles;
export const selectNewsCategories = (state: { news: NewsState }) => state.news.categories;
export const selectNewsLoading = (state: { news: NewsState }) => state.news.isLoading;
export const selectNewsError = (state: { news: NewsState }) => state.news.error;
export const selectReadArticles = (state: { news: NewsState }) => state.news.readArticles;
export const selectBookmarkedArticles = (state: { news: NewsState }) => state.news.bookmarkedArticles;
export const selectOfflineArticles = (state: { news: NewsState }) => state.news.offlineArticles;
export const selectArticleById = (articleId: number) => (state: { news: NewsState }) =>
  state.news.articles.find(article => article.id === articleId);
export const selectUnreadCount = (state: { news: NewsState }) =>
  state.news.articles.filter(article => article.isNew).length;

// Export reducer
export default newsSlice.reducer;

/**
 * News Slice Features:
 *
 * Content Management:
 * - Article fetching and pagination
 * - Category-based filtering
 * - Search functionality
 * - Article detail loading
 *
 * User Interactions:
 * - Read/unread tracking
 * - Bookmarking system
 * - Offline caching
 * - Sort preferences
 *
 * State Management:
 * - Loading states for UI
 * - Error handling
 * - Cache management
 * - Filter persistence
 *
 * Features:
 * - Mock data for development
 * - Infinite scroll support
 * - Offline reading capability
 * - Real-time article updates
 * - Search and filter combinations
 */