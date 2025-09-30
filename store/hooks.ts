/**
 * Typed Redux Hooks
 * Trend Ankara Mobile Application
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from './index';

// Define RootState locally to avoid circular dependency
interface RootState {
  player: any;
  settings: any;
  polls: any;
  news: any;
}

/**
 * Typed version of useDispatch hook
 * Use this instead of plain useDispatch
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of useSelector hook
 * Use this instead of plain useSelector
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Custom hooks for common state selections
 */

// Player state selectors
export const usePlayerState = () => {
  return useAppSelector((state) => state.player);
};

export const useIsPlaying = () => {
  return useAppSelector((state) => state.player.isPlaying);
};

export const usePlayerLoading = () => {
  return useAppSelector((state) => state.player.isLoading);
};

export const usePlayerError = () => {
  return useAppSelector((state) => state.player.error);
};

export const useCurrentTrack = () => {
  return useAppSelector((state) => state.player.currentTrack);
};

// Settings state selectors
export const useAppSettings = () => {
  return useAppSelector((state) => state.settings);
};

export const useTheme = () => {
  return useAppSelector((state) => state.settings.theme);
};

export const useAudioQuality = () => {
  return useAppSelector((state) => state.settings.audioQuality);
};

export const useNotificationSettings = () => {
  return useAppSelector((state) => state.settings.notifications);
};

// Polls state selectors
export const usePollsState = () => {
  return useAppSelector((state) => state.polls);
};

export const useActivePolls = () => {
  return useAppSelector((state) => state.polls.polls.filter(poll => poll.isActive));
};

export const usePollById = (pollId: number) => {
  return useAppSelector((state) =>
    state.polls.polls.find(poll => poll.id === pollId)
  );
};

// News state selectors
export const useNewsState = () => {
  return useAppSelector((state) => state.news);
};

export const useNewsArticles = () => {
  return useAppSelector((state) => state.news.articles);
};

export const useNewsCategories = () => {
  return useAppSelector((state) => state.news.categories);
};

export const useNewsLoading = () => {
  return useAppSelector((state) => state.news.isLoading);
};

export const useArticleById = (articleId: number) => {
  return useAppSelector((state) =>
    state.news.articles.find(article => article.id === articleId)
  );
};

/**
 * Complex selectors for computed state
 */

// Get total vote count across all polls
export const useTotalVotes = () => {
  return useAppSelector((state) =>
    state.polls.polls.reduce((total, poll) => total + poll.totalVotes, 0)
  );
};

// Get user's voting history
export const useUserVotingHistory = () => {
  return useAppSelector((state) =>
    state.polls.polls.filter(poll => poll.userHasVoted)
  );
};

// Get unread news count
export const useUnreadNewsCount = () => {
  return useAppSelector((state) =>
    state.news.articles.filter(article => article.isNew).length
  );
};

// Check if app is ready (all required data loaded)
export const useAppReady = () => {
  return useAppSelector((state) =>
    state.settings.isLoaded && !state.news.isLoading && !state.polls.isLoading
  );
};

/**
 * Hook Usage Examples:
 *
 * Basic usage:
 * const dispatch = useAppDispatch();
 * const playerState = useAppSelector(state => state.player);
 *
 * Convenience hooks:
 * const isPlaying = useIsPlaying();
 * const currentTrack = useCurrentTrack();
 * const theme = useTheme();
 *
 * Complex selectors:
 * const totalVotes = useTotalVotes();
 * const unreadCount = useUnreadNewsCount();
 * const isAppReady = useAppReady();
 */