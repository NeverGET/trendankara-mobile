# TypeScript Types & Interfaces

## Overview
Complete TypeScript type definitions for all API responses, requests, and data models used in the TrendAnkara mobile application.

## Base Types

### API Response
```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  errorCode?: string;
  details?: Record<string, any>;
  cache?: CacheInfo;
  meta?: MetaInfo;
}

export interface CacheInfo {
  etag: string;
  maxAge: number;
}

export interface MetaInfo {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
```

### Device & Authentication
```typescript
// types/auth.ts
export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  buildNumber?: string;
  systemVersion: string;
  deviceModel: string;
  userAgent: string;
}

export interface ApiHeaders {
  'Accept': string;
  'Content-Type': string;
  'X-Device-ID': string;
  'X-Platform': string;
  'X-App-Version': string;
  'User-Agent': string;
}
```

## Poll Types

```typescript
// types/poll.ts
export interface Poll {
  id: number;
  title: string;
  description?: string;
  pollType: 'daily' | 'weekly' | 'monthly' | 'special';
  startDate: string;
  endDate: string;
  isActive: boolean;
  items: PollItem[];
  totalVotes: number;
  timeRemaining?: string;
  hasVoted: boolean;
}

export interface PollItem {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  voteCount: number;
  percentage: number;
  displayOrder: number;
}

export interface VoteRequest {
  itemId: number;
  deviceInfo: {
    deviceId: string;
    platform: string;
    appVersion: string;
    userAgent: string;
  };
}

export interface VoteResponse {
  success: boolean;
  message: string;
  updatedCounts: VoteCount[];
}

export interface VoteCount {
  itemId: number;
  voteCount: number;
  percentage: number;
}

export type PollsApiResponse = ApiResponse<Poll>;
export type VoteApiResponse = ApiResponse<VoteResponse>;
```

## News Types

```typescript
// types/news.ts
export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  htmlContent: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: NewsCategory;
  tags: string[];
  author?: string;
  source?: string;
  publishedAt: string;
  updatedAt?: string;
  viewCount: number;
  readTime?: number;
  isBreaking: boolean;
  isFeatured: boolean;
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

export interface NewsListResponse {
  articles: NewsArticle[];
  categories: NewsCategory[];
}

export interface NewsDetailResponse extends NewsArticle {
  relatedArticles?: NewsArticle[];
  gallery?: NewsGalleryItem[];
  videos?: NewsVideo[];
}

export interface NewsGalleryItem {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface NewsVideo {
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
  duration?: number;
  platform: 'youtube' | 'vimeo' | 'custom';
}

export interface NewsListParams extends PaginationParams {
  category?: string;
  search?: string;
  featured?: boolean;
  breaking?: boolean;
}

export type NewsListApiResponse = ApiResponse<NewsListResponse>;
export type NewsDetailApiResponse = ApiResponse<NewsDetailResponse>;
```

## Card Types

```typescript
// types/card.ts
export interface Card {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  redirectUrl?: string;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardsResponse {
  featured: Card[];
  normal: Card[];
  total: number;
}

export interface CardParams {
  featured?: boolean;
  limit?: number;
}

export type CardsApiResponse = ApiResponse<CardsResponse>;
export type CardApiResponse = ApiResponse<Card>;
```

## Configuration Types

```typescript
// types/config.ts
export interface AppConfig {
  appVersion: string;
  minVersion: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: string;
  features: FeatureFlags;
  endpoints: EndpointConfig;
  radio: RadioConfig;
  social: SocialLinks;
  contact: ContactInfo;
  analytics: AnalyticsConfig;
  ads: AdsConfig;
}

export interface FeatureFlags {
  polls: boolean;
  news: boolean;
  radio: boolean;
  podcasts: boolean;
  notifications: boolean;
  darkMode: boolean;
  comments: boolean;
  [key: string]: boolean;
}

export interface EndpointConfig {
  api: string;
  ws?: string;
  cdn?: string;
}

export interface RadioConfig {
  streamUrl: string;
  fallbackUrl?: string;
  bitrate: number;
  format: 'mp3' | 'aac' | 'ogg';
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
}

export interface AnalyticsConfig {
  googleAnalyticsId?: string;
  firebaseEnabled: boolean;
  mixpanelToken?: string;
}

export interface AdsConfig {
  enabled: boolean;
  admobAppId?: string;
  bannerAdUnitId?: string;
  interstitialAdUnitId?: string;
  rewardedAdUnitId?: string;
}

export interface VersionCheckRequest {
  currentVersion: string;
  platform: 'ios' | 'android';
  deviceInfo: {
    model: string;
    osVersion: string;
  };
}

export interface VersionCheckResponse {
  updateRequired: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  minVersion?: string;
  currentVersion?: string;
  updateUrl?: string;
  releaseNotes?: string[];
  message?: string;
}

export type ConfigApiResponse = ApiResponse<AppConfig>;
export type VersionCheckApiResponse = ApiResponse<VersionCheckResponse>;
```

## Radio Types

```typescript
// types/radio.ts
export interface RadioInfo {
  stream: StreamInfo;
  nowPlaying?: NowPlayingInfo;
  program?: ProgramInfo;
  nextProgram?: NextProgramInfo;
  quality: QualityOptions;
}

export interface StreamInfo {
  primaryUrl: string;
  fallbackUrl?: string;
  format: 'mp3' | 'aac' | 'ogg';
  bitrate: number;
  sampleRate: number;
}

export interface NowPlayingInfo {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  startedAt: string;
  endingAt?: string;
  listenersCount?: number;
}

export interface ProgramInfo {
  name: string;
  presenter: string;
  description?: string;
  imageUrl?: string;
  startTime: string;
  endTime: string;
  isLive: boolean;
  isRepeat?: boolean;
}

export interface NextProgramInfo {
  name: string;
  presenter: string;
  startTime: string;
  endTime: string;
}

export interface QualityOptions {
  options: QualityOption[];
  recommended: number;
}

export interface QualityOption {
  label: string;
  bitrate: number;
  url: string;
}

export interface ProgramSchedule {
  day: string;
  date: string;
  programs: ScheduledProgram[];
}

export interface ScheduledProgram {
  id: number;
  name: string;
  presenter: string;
  description?: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  isLive: boolean;
  isRepeat: boolean;
}

export interface SongHistory {
  songs: HistorySong[];
  total: number;
}

export interface HistorySong {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  playedAt: string;
  duration?: number;
}

export interface RadioScheduleParams {
  day?: string;
  week?: boolean;
}

export interface RadioHistoryParams {
  limit?: number;
}

export type RadioApiResponse = ApiResponse<RadioInfo>;
export type ScheduleApiResponse = ApiResponse<ProgramSchedule>;
export type HistoryApiResponse = ApiResponse<SongHistory>;
```

## Error Types

```typescript
// types/error.ts
export interface ApiError {
  message: string;
  code: ErrorCode;
  status: number;
  details?: Record<string, any>;
  isNetworkError: boolean;
  shouldRetry: boolean;
  retryAfter?: number;
  requiresAuth?: boolean;
}

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'ALREADY_VOTED'
  | 'POLL_NOT_FOUND'
  | 'NEWS_NOT_FOUND'
  | 'CARD_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MAINTENANCE_MODE'
  | 'UPDATE_REQUIRED'
  | 'INVALID_VERSION'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

export interface ValidationError {
  field: string;
  message: string;
  rule?: string;
}
```

## State Types

```typescript
// types/state.ts
export interface LoadingState<T = any> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  lastFetch?: number;
}

export interface PaginatedState<T = any> extends LoadingState<T[]> {
  page: number;
  hasMore: boolean;
  total?: number;
  isRefreshing: boolean;
  isLoadingMore: boolean;
}

export interface CacheState<T = any> {
  data: T | null;
  etag?: string;
  timestamp: number;
  expiresAt: number;
}
```

## Navigation Types

```typescript
// types/navigation.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Main: undefined;
  UpdateRequired: { updateUrl?: string };
  Maintenance: { message?: string; endTime?: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Polls: undefined;
  News: undefined;
  Radio: undefined;
  Settings: undefined;
};

// News Stack
export type NewsStackParamList = {
  NewsList: undefined;
  NewsDetail: { id: number; article?: NewsArticle };
};

// Navigation Props
export type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;
export type PollsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Polls'>;
export type NewsListNavigationProp = StackNavigationProp<NewsStackParamList, 'NewsList'>;
export type NewsDetailNavigationProp = StackNavigationProp<NewsStackParamList, 'NewsDetail'>;
export type NewsDetailRouteProp = RouteProp<NewsStackParamList, 'NewsDetail'>;

// Screen Props
export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export interface NewsDetailScreenProps {
  navigation: NewsDetailNavigationProp;
  route: NewsDetailRouteProp;
}
```

## Component Props

```typescript
// types/components.ts
export interface PollCardProps {
  poll: Poll;
  onVote: (pollId: number, itemId: number) => Promise<void>;
  disabled?: boolean;
}

export interface NewsCardProps {
  article: NewsArticle;
  onPress: (article: NewsArticle) => void;
  variant?: 'default' | 'compact' | 'featured';
}

export interface CardCarouselProps {
  cards: Card[];
  onCardPress: (card: Card) => void;
  title?: string;
  horizontal?: boolean;
}

export interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
  icon?: string;
}

export interface LoadingViewProps {
  message?: string;
  size?: 'small' | 'large';
}

export interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
}
```

## Utility Types

```typescript
// types/utils.ts
// Make all properties optional
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties required
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Make specific properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract promise type
export type Unpacked<T> = T extends Promise<infer U> ? U : T;

// Nullable type
export type Nullable<T> = T | null;

// Maybe type (nullable or undefined)
export type Maybe<T> = T | null | undefined;
```

## Usage Examples

```typescript
// services/pollService.ts
import { ApiResponse, Poll, VoteRequest, VoteResponse } from '../types';

class PollService {
  async getActivePolls(): Promise<ApiResponse<Poll>> {
    // Implementation
  }

  async submitVote(
    pollId: number,
    request: VoteRequest
  ): Promise<ApiResponse<VoteResponse>> {
    // Implementation
  }
}

// components/PollCard.tsx
import React, { FC } from 'react';
import { PollCardProps } from '../types/components';

const PollCard: FC<PollCardProps> = ({ poll, onVote, disabled }) => {
  // Component implementation
};

// screens/NewsDetailScreen.tsx
import React, { FC } from 'react';
import { NewsDetailScreenProps } from '../types/navigation';

const NewsDetailScreen: FC<NewsDetailScreenProps> = ({ navigation, route }) => {
  const { id, article } = route.params;
  // Screen implementation
};
```

## Best Practices

1. **Type Safety**: Always use strict TypeScript configuration
2. **Export Types**: Export all types from a central index file
3. **Naming Convention**: Use PascalCase for types and interfaces
4. **Documentation**: Add JSDoc comments for complex types
5. **Validation**: Use runtime validation for API responses
6. **Generic Types**: Use generics for reusable components
7. **Union Types**: Use discriminated unions for state management
8. **Type Guards**: Implement type guards for runtime type checking