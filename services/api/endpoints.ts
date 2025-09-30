/**
 * API Endpoint Constants
 * Centralized endpoint management for Trend Ankara API
 */

// Base URLs
// Using deployed Google Cloud Function proxy to bypass SSL issues
const PROXY_BASE_URL = process.env.EXPO_PUBLIC_PROXY_URL ||
  'https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy';

export const API_BASE = {
  MOBILE: `${PROXY_BASE_URL}/api/mobile/v1`,
  ADMIN: `${PROXY_BASE_URL}/api/admin`,
  MEDIA: `${PROXY_BASE_URL}/api/media`,
  // Original endpoints (kept for reference/fallback)
  ORIGINAL_MOBILE: 'https://trendankara.com/api/mobile/v1',
  ORIGINAL_ADMIN: 'https://trendankara.com/api/admin',
  ORIGINAL_MEDIA: 'https://trendankara.com/api/media',
} as const;

// Mobile Settings
export const SETTINGS_ENDPOINTS = {
  GET_SETTINGS: '/mobile/settings',
  GET_CONFIG: '/config',
} as const;

// Radio/Audio
export const RADIO_ENDPOINTS = {
  GET_RADIO_CONFIG: '/radio',
  GET_STREAM_STATUS: '/radio/status',
  REPORT_STREAM_ERROR: '/radio/error',
} as const;

// Content Cards
export const CARDS_ENDPOINTS = {
  LIST: '/content/cards',
  GET_CARDS: '/content/cards',
  GET_CARD_DETAIL: (id: number) => `/content/cards/${id}`,
  DETAIL: (id: number) => `/content/cards/${id}`,
  GET_FEATURED_CARDS: '/content/cards/featured',
  TRACK_VIEW: (id: number) => `/content/cards/${id}/view`,
  TRACK_CLICK: (id: number) => `/content/cards/${id}/click`,
} as const;

// Polls
export const POLLS_ENDPOINTS = {
  GET_CURRENT_POLLS: '/polls/current',
  GET_ALL_POLLS: '/polls',
  GET_POLL_DETAIL: (id: number) => `/polls/${id}`,
  SUBMIT_VOTE: (id: number) => `/polls/${id}/vote`,
  GET_POLL_RESULTS: (id: number) => `/polls/${id}/results`,
} as const;

// News
export const NEWS_ENDPOINTS = {
  GET_NEWS: '/news',
  GET_NEWS_DETAIL: (slug: string) => `/news/${slug}`,
  GET_NEWS_CATEGORIES: '/news/categories',
  GET_NEWS_BY_CATEGORY: (category: string) => `/news/category/${category}`,
} as const;

// Analytics
export const ANALYTICS_ENDPOINTS = {
  TRACK_EVENT: '/analytics/event',
  TRACK_SESSION: '/analytics/session',
  TRACK_ERROR: '/analytics/error',
} as const;

// Push Notifications
export const PUSH_ENDPOINTS = {
  REGISTER_TOKEN: '/push/register',
  UNREGISTER_TOKEN: '/push/unregister',
  UPDATE_PREFERENCES: '/push/preferences',
} as const;

// Helper function to build relative URL for axios (since baseURL is already configured)
export const buildUrl = (endpoint: string, baseUrl?: string): string => {
  if (baseUrl) {
    // Build full URL when baseUrl is explicitly provided
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  // Return relative path for axios when no baseUrl provided
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

// Query parameter helpers
export const QUERY_PARAMS = {
  PAGINATION: {
    page: (page: number) => ({ page }),
    limit: (limit: number) => ({ limit }),
    paginate: (page: number, limit: number) => ({ page, limit }),
  },
  FILTERS: {
    featured: (featured: boolean) => ({ featured }),
    active: (active: boolean) => ({ active }),
    category: (category: string) => ({ category }),
  },
  SORTING: {
    orderBy: (field: string) => ({ orderBy: field }),
    sortDirection: (direction: 'asc' | 'desc') => ({ sort: direction }),
  },
} as const;

// Build query string from params
export const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

// Complete URL builder with query params
export const buildApiUrl = (
  endpoint: string,
  params?: Record<string, any>,
  baseUrl?: string
): string => {
  const url = buildUrl(endpoint, baseUrl);
  if (params) {
    return url + buildQueryString(params);
  }
  return url;
};

export default {
  SETTINGS: SETTINGS_ENDPOINTS,
  RADIO: RADIO_ENDPOINTS,
  CARDS: CARDS_ENDPOINTS,
  POLLS: POLLS_ENDPOINTS,
  NEWS: NEWS_ENDPOINTS,
  ANALYTICS: ANALYTICS_ENDPOINTS,
  PUSH: PUSH_ENDPOINTS,
};