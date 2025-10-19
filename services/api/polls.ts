import { API_ENDPOINTS } from '../../constants/api';
import { Poll, PollVoteRequest, PollVoteResponse } from '../../types/api';
import apiClient from './client';
import { apiCache, CACHE_KEYS } from '../cache/apiCache';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PollsService {
  private static instance: PollsService;
  private cachePrefix = '@polls_';

  private constructor() {}

  static getInstance(): PollsService {
    if (!PollsService.instance) {
      PollsService.instance = new PollsService();
    }
    return PollsService.instance;
  }

  /**
   * Get current active polls
   */
  async getCurrentPolls(useCache = true): Promise<Poll[]> {
    const cacheKey = CACHE_KEYS.CURRENT_POLLS;

    if (useCache) {
      const cached = await apiCache.get<Poll[]>(cacheKey);
      if (cached) {
        if (__DEV__) {
          console.log('FOUND CACHED POLLS - VALIDATING...');
        }
        // Validate and normalize cached data
        const validCached = this.validateAndNormalizePolls(cached);
        if (validCached.length > 0) {
          if (__DEV__) {
            console.log('Cached polls validated successfully, returning normalized data');
          }
          return validCached;
        } else {
          if (__DEV__) {
            console.log('CACHED POLLS INVALID - CLEARING CACHE AND FETCHING FRESH DATA');
          }
          await apiCache.remove(cacheKey);
        }
      }
    }

    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.POLLS.GET_CURRENT());

      // Handle different response formats
      let polls: Poll[] = [];
      if (response.data) {
        // If response.data is an array, use it directly
        if (Array.isArray(response.data)) {
          polls = response.data;
        }
        // If response.data has a nested data array
        else if (response.data.data && Array.isArray(response.data.data)) {
          polls = response.data.data;
        }
        // If response.data has a polls array
        else if (response.data.polls && Array.isArray(response.data.polls)) {
          polls = response.data.polls;
        }
        // If response.data.data is a single poll object (wrap in array)
        else if (response.data.data && typeof response.data.data === 'object' && response.data.data.id) {
          polls = [response.data.data];
        }
        // If response.data is a single poll object (wrap in array)
        else if (response.data.id && typeof response.data === 'object') {
          polls = [response.data];
        }
        // If response.data is an object but not structured as expected
        else {
          console.warn('Unexpected polls response format:', response.data);
          polls = [];
        }
      }

      // Validate and normalize the polls data
      polls = this.validateAndNormalizePolls(polls);

      // Cache for 5 minutes
      await apiCache.set(cacheKey, polls, 5 * 60 * 1000);

      return polls;
    } catch (error: any) {
      // Handle 404 as "no active polls" - not an error
      if (error?.error === 'The requested resource was not found.' || error?.message?.includes('404')) {
        console.log('No active polls found (404) - returning empty array');
        return [];
      }

      console.error('Error fetching polls:', error);

      // Return empty array instead of mock data for better UX
      return [];
    }
  }

  /**
   * Submit vote for a poll
   */
  async submitVote(pollId: number, optionId: number): Promise<PollVoteResponse> {
    try {
      const request: PollVoteRequest = {
        pollId,
        optionId,
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post<PollVoteResponse>(
        API_ENDPOINTS.POLLS.VOTE(pollId),
        request
      );

      // Clear polls cache after voting
      await apiCache.remove(CACHE_KEYS.CURRENT_POLLS);

      return response.data;
    } catch (error) {
      console.error('Error submitting vote:', error);

      // Return mock response in development
      if (__DEV__) {
        return {
          success: true,
          message: 'Vote submitted successfully',
          updatedPoll: {
            ...this.getMockPolls().find(p => p.id === pollId)!,
            hasVoted: true,
            votedOptionId: optionId
          }
        };
      }

      throw error;
    }
  }

  /**
   * Get poll by ID
   */
  async getPollById(pollId: number): Promise<Poll | null> {
    try {
      const polls = await this.getCurrentPolls();
      return polls.find(p => p.id === pollId) || null;
    } catch (error) {
      console.error('Error getting poll by ID:', error);
      return null;
    }
  }

  /**
   * Check if user has voted on a poll (stored locally)
   */
  async hasVoted(pollId: number): Promise<boolean> {
    const voteKey = `${this.cachePrefix}vote_${pollId}`;
    const vote = await AsyncStorage.getItem(voteKey);
    return !!vote;
  }

  /**
   * Store vote locally
   */
  async storeVoteLocally(pollId: number, optionId: number): Promise<void> {
    const voteKey = `${this.cachePrefix}vote_${pollId}`;
    // Store vote
    await AsyncStorage.setItem(voteKey, JSON.stringify({ pollId, optionId, timestamp: Date.now() }));
  }

  /**
   * Validate and normalize polls data (both cached and fresh)
   */
  private validateAndNormalizePolls(polls: any[]): Poll[] {
    if (!Array.isArray(polls)) {
      console.warn('Polls data is not an array:', polls);
      return [];
    }

    // Filter out invalid polls and normalize structure
    const validPolls = polls
      .filter(poll => poll && typeof poll.id !== 'undefined')
      .map(poll => {
        // Use items from backend, map to options array
        const items = poll.items || poll.options || [];

        // Transform each item/option to match PollOption interface
        const options = Array.isArray(items) ? items.map((item: any) => {
          // Transform image URL from relative to absolute if needed
          let imageUrl = item.imageUrl;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `https://trendankara.com${imageUrl}`;
            if (__DEV__) {
              console.log('Poll image URL transformed:', { original: item.imageUrl, transformed: imageUrl });
            }
          } else if (imageUrl) {
            if (__DEV__) {
              console.log('Poll image URL (already absolute):', imageUrl);
            }
          }

          return {
            id: item.id,
            text: item.text || item.title || '',  // Backend uses "title", we use "text"
            voteCount: item.voteCount || 0,
            percentage: item.percentage || 0,
            imageUrl: imageUrl || undefined,       // NEW: Optional image URL (transformed)
            description: item.description || undefined, // NEW: Optional description
            displayOrder: item.displayOrder ?? undefined, // NEW: Optional display order (use ?? for 0 values)
          };
        }) : [];

        return {
          ...poll,
          options,
        };
      });

    // Additional validation - ensure options is always an array with content
    return validPolls.filter(poll => Array.isArray(poll.options) && poll.options.length > 0);
  }

  /**
   * Get mock polls for development
   */
  private getMockPolls(): Poll[] {
    return [
      {
        id: 1,
        question: 'Trend Ankara\'yı hangi platformdan dinliyorsunuz?',
        options: [
          { id: 1, text: 'Mobil Uygulama', votes: 145, percentage: 48.3 },
          { id: 2, text: 'Web Sitesi', votes: 89, percentage: 29.7 },
          { id: 3, text: 'Radyo', votes: 66, percentage: 22.0 }
        ],
        totalVotes: 300,
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        endsAt: '2024-02-15T10:00:00Z',
        hasVoted: false
      },
      {
        id: 2,
        question: 'En sevdiğiniz müzik türü hangisi?',
        options: [
          { id: 4, text: 'Pop', votes: 234, percentage: 39.0 },
          { id: 5, text: 'Rock', votes: 186, percentage: 31.0 },
          { id: 6, text: 'Türk Sanat Müziği', votes: 120, percentage: 20.0 },
          { id: 7, text: 'Caz', votes: 60, percentage: 10.0 }
        ],
        totalVotes: 600,
        isActive: true,
        createdAt: '2024-01-10T10:00:00Z',
        endsAt: '2024-02-10T10:00:00Z',
        hasVoted: true,
        votedOptionId: 5
      }
    ];
  }

  /**
   * Clear all polls cache
   */
  async clearCache(): Promise<void> {
    await apiCache.remove(CACHE_KEYS.CURRENT_POLLS);
  }
}

export const pollsService = PollsService.getInstance();