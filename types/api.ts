/**
 * API Response Type Definitions
 * Trend Ankara Mobile Application
 */

/**
 * Mobile Settings Configuration from Admin API
 * Used for remote feature control and app configuration
 */
export interface MobileSettings {
  // Poll Settings
  enablePolls: boolean;
  showOnlyLastActivePoll: boolean;

  // News Settings
  enableNews: boolean;
  maxNewsCount: number;

  // Player Settings
  playerLogoUrl: string | null;
  enableLiveInfo: boolean;
  playerFacebookUrl: string | null;
  playerInstagramUrl: string | null;
  playerWhatsappNumber: string | null;
  liveCallPhoneNumber: string | null;

  // Card Settings
  maxFeaturedCards: number;
  cardDisplayMode: 'grid' | 'list';
  enableCardAnimation: boolean;

  // App Settings
  minimumAppVersion: string;
  maintenanceMode: boolean;

  lastUpdated: string;
}

/**
 * Radio Stream Configuration
 * Stream URLs and metadata for the radio player
 */
export interface RadioConfig {
  stream_url: string;
  metadata_url: string;
  station_name: string;
  connection_status: 'active' | 'inactive' | 'error';
  last_tested: string;
  playerLogoUrl: string | null;
}

/**
 * Generic API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Settings API Response
 */
export interface SettingsResponse {
  settings: MobileSettings;
  lastUpdated: string;
}

/**
 * Radio API Response
 */
export interface RadioResponse {
  success: boolean;
  data: RadioConfig;
}

/**
 * Pagination Info for List Responses
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Generic Paginated Response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Poll Vote Request
 */
export interface PollVoteRequest {
  pollId: number;
  optionId: number;
  timestamp: string;
}

/**
 * Poll Vote Response
 */
export interface PollVoteResponse {
  success: boolean;
  message: string;
  updatedPoll?: Poll;
}

/**
 * Import Poll from models for API responses
 */
export type { Poll, PollOption } from './models';