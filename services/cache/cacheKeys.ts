/**
 * Cache Keys Constants
 * Standardized cache key patterns for consistent caching
 */

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIXES = {
  SETTINGS: 'settings',
  RADIO: 'radio',
  CARDS: 'cards',
  POLLS: 'polls',
  NEWS: 'news',
  IMAGES: 'images',
  API: 'api',
} as const;

/**
 * Cache TTL values in milliseconds
 */
export const CACHE_TTL = {
  // Short-lived cache (5 minutes)
  SHORT: 5 * 60 * 1000,

  // Medium cache (30 minutes)
  MEDIUM: 30 * 60 * 1000,

  // Long cache (2 hours)
  LONG: 2 * 60 * 60 * 1000,

  // Daily cache (24 hours)
  DAILY: 24 * 60 * 60 * 1000,

  // Weekly cache (7 days)
  WEEKLY: 7 * 24 * 60 * 60 * 1000,

  // Specific TTLs
  SETTINGS: 7 * 24 * 60 * 60 * 1000, // 7 days
  CARDS: 30 * 60 * 1000, // 30 minutes
  POLLS: 5 * 60 * 1000, // 5 minutes (real-time updates)
  NEWS: 60 * 60 * 1000, // 1 hour
  RADIO_CONFIG: 60 * 60 * 1000, // 1 hour
  IMAGES: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Generate cache key for settings
 */
export const settingsCacheKey = () =>
  `${CACHE_PREFIXES.SETTINGS}:mobile_settings`;

/**
 * Generate cache key for radio configuration
 */
export const radioCacheKey = () =>
  `${CACHE_PREFIXES.RADIO}:config`;

/**
 * Generate cache key for radio stream status
 */
export const radioStatusCacheKey = () =>
  `${CACHE_PREFIXES.RADIO}:status`;

/**
 * Generate cache key for content cards list
 */
export const cardsCacheKey = (params?: {
  featured?: boolean;
  active?: boolean;
  page?: number;
}) => {
  const baseKey = `${CACHE_PREFIXES.CARDS}:list`;
  if (!params) return baseKey;

  const parts = [baseKey];
  if (params.featured !== undefined) parts.push(`featured:${params.featured}`);
  if (params.active !== undefined) parts.push(`active:${params.active}`);
  if (params.page !== undefined) parts.push(`page:${params.page}`);

  return parts.join(':');
};

/**
 * Generate cache key for single card
 */
export const cardDetailCacheKey = (id: number) =>
  `${CACHE_PREFIXES.CARDS}:detail:${id}`;

/**
 * Generate cache key for polls list
 */
export const pollsCacheKey = (type: 'current' | 'all' = 'current') =>
  `${CACHE_PREFIXES.POLLS}:${type}`;

/**
 * Generate cache key for single poll
 */
export const pollDetailCacheKey = (id: number) =>
  `${CACHE_PREFIXES.POLLS}:detail:${id}`;

/**
 * Generate cache key for poll results
 */
export const pollResultsCacheKey = (id: number) =>
  `${CACHE_PREFIXES.POLLS}:results:${id}`;

/**
 * Generate cache key for news list
 */
export const newsCacheKey = (params?: {
  category?: string;
  page?: number;
  limit?: number;
}) => {
  const baseKey = `${CACHE_PREFIXES.NEWS}:list`;
  if (!params) return baseKey;

  const parts = [baseKey];
  if (params.category) parts.push(`category:${params.category}`);
  if (params.page !== undefined) parts.push(`page:${params.page}`);
  if (params.limit !== undefined) parts.push(`limit:${params.limit}`);

  return parts.join(':');
};

/**
 * Generate cache key for news article
 */
export const newsDetailCacheKey = (slug: string) =>
  `${CACHE_PREFIXES.NEWS}:detail:${slug}`;

/**
 * Generate cache key for news categories
 */
export const newsCategoriesCacheKey = () =>
  `${CACHE_PREFIXES.NEWS}:categories`;

/**
 * Generate cache key for image
 */
export const imageCacheKey = (url: string) => {
  // Create a simple hash from the URL for the key
  const hash = url.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);

  return `${CACHE_PREFIXES.IMAGES}:${Math.abs(hash)}`;
};

/**
 * Generate cache key for generic API response
 */
export const apiCacheKey = (endpoint: string, params?: Record<string, any>) => {
  const baseKey = `${CACHE_PREFIXES.API}:${endpoint.replace(/\//g, '_')}`;

  if (!params || Object.keys(params).length === 0) {
    return baseKey;
  }

  // Sort params for consistent key generation
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');

  return `${baseKey}:${sortedParams}`;
};

/**
 * Clear all cache keys for a specific prefix
 */
export const getCacheKeysByPrefix = (prefix: keyof typeof CACHE_PREFIXES): string => {
  return `${CACHE_PREFIXES[prefix]}:*`;
};

/**
 * Check if a cache key matches a pattern
 */
export const matchesCacheKeyPattern = (key: string, pattern: string): boolean => {
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(key);
};

/**
 * Parse cache key to extract parameters
 */
export const parseCacheKey = (key: string): {
  prefix: string;
  type?: string;
  params: Record<string, string>;
} => {
  const parts = key.split(':');
  const prefix = parts[0];
  const type = parts[1];
  const params: Record<string, string> = {};

  // Parse remaining parts as key:value pairs
  for (let i = 2; i < parts.length; i += 2) {
    if (parts[i + 1]) {
      params[parts[i]] = parts[i + 1];
    }
  }

  return { prefix, type, params };
};