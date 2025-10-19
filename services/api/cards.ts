/**
 * Cards API Service
 * Handles fetching and managing card data
 */

import apiClient, { handleApiResponse } from './client';
import { CARDS_ENDPOINTS, buildUrl } from './endpoints';
import { apiCache, CACHE_KEYS, CACHE_TTL } from '@/services/cache/apiCache';
import { ContentCard } from '@/types/models';
import { ApiResponse } from '@/types/api';

interface CardsResponse {
  cards: ContentCard[];
  total: number;
}

class CardsApiService {
  /**
   * Transform API response to ensure proper image URLs
   */
  private transformCardData(card: any): ContentCard {
    // Transform relative image URLs to absolute URLs
    const originalUrl = card.imageUrl;
    const imageUrl = card.imageUrl
      ? (card.imageUrl.startsWith('http')
        ? card.imageUrl
        : `https://trendankara.com${card.imageUrl}`)
      : null;

    if (__DEV__) {
      console.log('Cards API - Transform:', {
        original: originalUrl,
        transformed: imageUrl
      });
    }

    return {
      ...card,
      imageUrl
    };
  }

  /**
   * Get all cards with caching
   */
  async getAllCards(forceRefresh = false): Promise<ContentCard[]> {
    // Try cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = await apiCache.get<ContentCard[]>(CACHE_KEYS.CARDS_ALL);
      if (cached) {
        console.log('Using cached cards data');
        return cached;
      }
    }

    try {
      const response = await apiClient.get<ApiResponse<CardsResponse>>(
        buildUrl(CARDS_ENDPOINTS.GET_CARDS)
      );

      const data = handleApiResponse(response);
      // API returns cards array directly, or handle both structures
      const rawCards = Array.isArray(data) ? data : (data.cards || []);

      // Transform each card to ensure proper image URLs
      const cards = rawCards.map(card => this.transformCardData(card));

      // Cache the transformed data
      await apiCache.set(CACHE_KEYS.CARDS_ALL, cards, CACHE_TTL.CARD_DATA);

      console.log(`Fetched ${cards.length} cards from API`);
      return cards;
    } catch (error) {
      console.error('Error fetching cards:', error);

      // Try expired cache as fallback
      const expiredCache = await apiCache.get<ContentCard[]>(CACHE_KEYS.CARDS_ALL);
      if (expiredCache) {
        console.log('Using expired cards cache due to error');
        return expiredCache;
      }

      // Return empty array as last resort
      return [];
    }
  }

  /**
   * Get card by ID
   */
  async getCardById(id: string): Promise<ContentCard | null> {
    try {
      const response = await apiClient.get<ApiResponse<ContentCard>>(
        buildUrl(CARDS_ENDPOINTS.GET_CARD_DETAIL(parseInt(id)))
      );

      const card = handleApiResponse(response);
      return card ? this.transformCardData(card) : null;
    } catch (error) {
      console.error(`Error fetching card ${id}:`, error);
      return null;
    }
  }

  /**
   * Mark card as viewed
   */
  async markCardViewed(cardId: string): Promise<void> {
    try {
      await apiClient.post(
        buildUrl(CARDS_ENDPOINTS.TRACK_VIEW(parseInt(cardId))),
        {}
      );
    } catch (error) {
      console.error(`Error marking card ${cardId} as viewed:`, error);
    }
  }
}

export const cardsService = new CardsApiService();
export default cardsService;