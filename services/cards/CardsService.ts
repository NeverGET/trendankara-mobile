/**
 * Cards Service
 * Manages content cards (advertisements) data
 */

import apiClient, { handleApiResponse, handleApiError } from '../api/client';
import cacheManager from '../cache/CacheManager';
import { cardsCacheKey, cardDetailCacheKey, CACHE_TTL } from '../cache/cacheKeys';
import { CARDS_ENDPOINTS } from '../api/endpoints';
import type { ContentCard, CardsResponse } from '@/types/api';

interface FetchCardsParams {
  featured?: boolean;
  active?: boolean;
  page?: number;
  limit?: number;
}

class CardsService {
  private static instance: CardsService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): CardsService {
    if (!CardsService.instance) {
      CardsService.instance = new CardsService();
    }
    return CardsService.instance;
  }

  /**
   * Fetch content cards from API
   */
  async fetchCards(params?: FetchCardsParams): Promise<ContentCard[]> {
    const cacheKey = cardsCacheKey(params);

    // Check cache first
    const cached = await cacheManager.get<ContentCard[]>(cacheKey);
    if (cached) {
      console.log('Cards loaded from cache');
      return cached;
    }

    try {
      console.log('Fetching cards from API...');

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params?.featured !== undefined) {
        queryParams.append('featured', params.featured.toString());
      }
      if (params?.active !== undefined) {
        queryParams.append('active', params.active.toString());
      }
      if (params?.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }

      const endpoint = queryParams.toString()
        ? `${CARDS_ENDPOINTS.LIST}?${queryParams}`
        : CARDS_ENDPOINTS.LIST;

      const response = await apiClient.get<CardsResponse>(endpoint);
      const result = handleApiResponse(response);

      if (result.cards) {
        // Cache the results
        await cacheManager.set(cacheKey, result.cards, CACHE_TTL.CARDS);
        console.log(`Fetched and cached ${result.cards.length} cards`);
        return result.cards;
      }

      return [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  }

  /**
   * Fetch featured cards
   */
  async fetchFeaturedCards(limit?: number): Promise<ContentCard[]> {
    return this.fetchCards({ featured: true, active: true, limit });
  }

  /**
   * Fetch active cards
   */
  async fetchActiveCards(page?: number, limit?: number): Promise<ContentCard[]> {
    return this.fetchCards({ active: true, page, limit });
  }

  /**
   * Get card by ID
   */
  async getCard(id: number): Promise<ContentCard | null> {
    const cacheKey = cardDetailCacheKey(id);

    // Check cache first
    const cached = await cacheManager.get<ContentCard>(cacheKey);
    if (cached) {
      console.log(`Card ${id} loaded from cache`);
      return cached;
    }

    try {
      console.log(`Fetching card ${id} from API...`);
      const endpoint = CARDS_ENDPOINTS.DETAIL(id);
      const response = await apiClient.get<{ card: ContentCard }>(endpoint);
      const result = handleApiResponse(response);

      if (result.card) {
        // Cache the card details
        await cacheManager.set(cacheKey, result.card, CACHE_TTL.CARDS);
        console.log(`Card ${id} fetched and cached`);
        return result.card;
      }

      return null;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  /**
   * Track card view (analytics)
   */
  async trackCardView(id: number): Promise<void> {
    try {
      const endpoint = CARDS_ENDPOINTS.TRACK_VIEW(id);
      await apiClient.post(endpoint, {});
      console.log(`Tracked view for card ${id}`);
    } catch (error) {
      console.error(`Failed to track view for card ${id}:`, error);
    }
  }

  /**
   * Track card click (analytics)
   */
  async trackCardClick(id: number): Promise<void> {
    try {
      const endpoint = CARDS_ENDPOINTS.TRACK_CLICK(id);
      await apiClient.post(endpoint, {});
      console.log(`Tracked click for card ${id}`);
    } catch (error) {
      console.error(`Failed to track click for card ${id}:`, error);
    }
  }

  /**
   * Clear cards cache
   */
  async clearCache(): Promise<void> {
    const keys = await cacheManager.has(cardsCacheKey());
    if (keys) {
      await cacheManager.remove(cardsCacheKey());
      console.log('Cards cache cleared');
    }
  }

  /**
   * Prefetch cards for better performance
   */
  async prefetchCards(): Promise<void> {
    try {
      console.log('Prefetching cards...');

      // Prefetch featured cards
      await this.fetchFeaturedCards(5);

      // Prefetch first page of active cards
      await this.fetchActiveCards(1, 20);

      console.log('Cards prefetch complete');
    } catch (error) {
      console.error('Failed to prefetch cards:', error);
    }
  }

  /**
   * Filter cards by category
   */
  filterByCategory(cards: ContentCard[], category: string): ContentCard[] {
    return cards.filter(card =>
      card.tags?.some(tag => tag.toLowerCase() === category.toLowerCase())
    );
  }

  /**
   * Filter cards by time validity
   */
  filterByTimeValidity(cards: ContentCard[]): ContentCard[] {
    const now = new Date();

    return cards.filter(card => {
      // Check start time
      if (card.startTime && new Date(card.startTime) > now) {
        return false;
      }

      // Check end time
      if (card.endTime && new Date(card.endTime) < now) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort cards by priority
   */
  sortByPriority(cards: ContentCard[]): ContentCard[] {
    return [...cards].sort((a, b) => {
      // Featured cards first
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      // Then by display order
      if (a.displayOrder !== b.displayOrder) {
        return (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
      }

      // Finally by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Get cards for display (filtered and sorted)
   */
  async getDisplayCards(params?: FetchCardsParams): Promise<ContentCard[]> {
    const cards = await this.fetchCards(params);

    // Filter by time validity
    const validCards = this.filterByTimeValidity(cards);

    // Sort by priority
    const sortedCards = this.sortByPriority(validCards);

    return sortedCards;
  }
}

// Export singleton instance
export default CardsService.getInstance();