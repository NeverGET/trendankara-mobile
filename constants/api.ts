/**
 * API Constants and Endpoints
 * Trend Ankara Mobile Application
 */

// Import endpoints from services
import {
  SETTINGS_ENDPOINTS,
  RADIO_ENDPOINTS,
  CARDS_ENDPOINTS,
  POLLS_ENDPOINTS,
  NEWS_ENDPOINTS,
  ANALYTICS_ENDPOINTS,
  PUSH_ENDPOINTS,
  buildApiUrl,
  QUERY_PARAMS,
} from '../services/api/endpoints';

// Re-export all endpoint constants
export const API_ENDPOINTS = {
  SETTINGS: SETTINGS_ENDPOINTS,
  RADIO: RADIO_ENDPOINTS,
  CARDS: CARDS_ENDPOINTS,
  POLLS: {
    GET_CURRENT: () => POLLS_ENDPOINTS.GET_CURRENT_POLLS,
    GET_ALL: () => POLLS_ENDPOINTS.GET_ALL_POLLS,
    GET_DETAIL: (id: number) => POLLS_ENDPOINTS.GET_POLL_DETAIL(id),
    VOTE: (id: number) => POLLS_ENDPOINTS.SUBMIT_VOTE(id),
    GET_RESULTS: (id: number) => POLLS_ENDPOINTS.GET_POLL_RESULTS(id),
  },
  NEWS: {
    GET_LATEST: () => NEWS_ENDPOINTS.GET_NEWS,
    GET_DETAIL: (slug: string) => NEWS_ENDPOINTS.GET_NEWS_DETAIL(slug),
    GET_CATEGORIES: () => NEWS_ENDPOINTS.GET_NEWS_CATEGORIES,
    GET_BY_CATEGORY: (category: string) => NEWS_ENDPOINTS.GET_NEWS_BY_CATEGORY(category),
  },
  ANALYTICS: ANALYTICS_ENDPOINTS,
  PUSH: PUSH_ENDPOINTS,
} as const;

// Export utilities
export { buildApiUrl, QUERY_PARAMS };