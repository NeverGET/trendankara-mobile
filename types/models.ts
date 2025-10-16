/**
 * Data Model Type Definitions
 * Trend Ankara Mobile Application
 */

/**
 * Content Card Model
 * Represents sponsored content and advertisement cards
 */
export interface ContentCard {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  redirectUrl: string | null;
  redirectType: 'website' | 'app' | 'internal';

  // Contact Information
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;

  // Social Media
  socialInstagram: string | null;
  socialTiktok: string | null;

  // Location
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationAddress: string | null;

  // Time Limits
  isTimeLimited: boolean;
  validFrom: string | null;
  validUntil: string | null;

  // Display Properties
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Poll Option Model
 * Individual option within a poll
 */
export interface PollOption {
  id: number;
  text: string;
  voteCount: number;
  percentage: number;
  imageUrl?: string;         // Optional image URL for visual poll options
  description?: string;      // Optional description text for the option
  displayOrder?: number;     // Optional display order for sorting options
}

/**
 * Poll Model
 * Interactive voting polls for listeners
 */
export interface Poll {
  id: number;
  question: string;
  description: string | null;
  options: PollOption[];
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  totalVotes: number;
  userHasVoted: boolean;
  createdAt: string;
}

/**
 * News Article Model
 * Media industry news and articles
 */
export interface NewsArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  category: string;
  publishedAt: string;
  author: string | null;
  readTime: number;
  isNew: boolean;
  redirectUrl?: string;      // Optional redirect URL for opening article in browser
}

/**
 * News Category Model
 */
export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
}

/**
 * Vote Request Model
 * Request structure for submitting poll votes
 */
export interface VoteRequest {
  itemId: number;
  deviceId: string;
}

/**
 * Vote Response Model
 */
export interface VoteResponse {
  success: boolean;
  message: string;
  updatedPoll?: Poll;
}

/**
 * Contact Type for Card Actions
 */
export type ContactType = 'phone' | 'whatsapp' | 'email' | 'instagram' | 'tiktok' | 'location';

/**
 * Player State Type
 */
export type PlayerStateType = 'stopped' | 'playing' | 'paused' | 'buffering' | 'error';

/**
 * Player State Model
 */
export interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
  currentTrack: TrackInfo | null;
}

/**
 * Track Information Model
 */
export interface TrackInfo {
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
}

/**
 * Cache Entry Model
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Network State Model
 */
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: 'unknown' | 'none' | 'cellular' | 'wifi' | 'bluetooth' | 'ethernet' | 'wimax' | 'vpn' | 'other';
}

/**
 * User Preferences Model
 */
export interface UserPreferences {
  backgroundPlayEnabled: boolean;
  darkModeEnabled: boolean;
  notificationsEnabled: boolean;
  autoPlayOnStartup: boolean;
  dataUsageWarning: boolean;
}

/**
 * App State Model
 */
export interface AppState {
  isInitialized: boolean;
  isMaintenanceMode: boolean;
  settingsLoaded: boolean;
  networkState: NetworkState;
  userPreferences: UserPreferences;
}