/**
 * Navigation Utilities
 * Helper functions for navigation and deep linking
 * Trend Ankara Mobile Application
 */

import { router } from 'expo-router';
import * as Linking from 'expo-linking';

// Navigation route names and parameters
export interface NavigationRoutes {
  home: '';
  polls: 'polls';
  news: 'news';
  sponsors: 'sponsors';
  settings: 'settings';
  about: 'about';
  onboarding: 'onboarding';
  article: `article/${number}`;
  poll: `poll/${number}`;
  modal: 'modal';
}

// Deep link URL patterns
export const DEEP_LINK_PATTERNS = {
  APP_SCHEME: 'trendankara://',
  WEB_DOMAIN: 'https://trendankara.com',
  APP_DOMAIN: 'https://app.trendankara.com',
} as const;

// Route paths for type safety
export const ROUTES = {
  HOME: '/' as const,
  POLLS: '/polls' as const,
  NEWS: '/news' as const,
  SPONSORS: '/sponsors' as const,
  SETTINGS: '/settings' as const,
  ABOUT: '/about' as const,
  ONBOARDING: '/onboarding' as const,
  MODAL: '/modal' as const,
  ARTICLE: (id: number) => `/article/${id}` as const,
  POLL: (id: number) => `/poll/${id}` as const,
} as const;

/**
 * Navigation Helper Class
 */
export class NavigationHelper {
  /**
   * Navigate to a specific route
   */
  static navigate(route: string, params?: Record<string, any>) {
    try {
      if (params) {
        router.push({ pathname: route, params });
      } else {
        router.push(route);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  /**
   * Replace current route
   */
  static replace(route: string, params?: Record<string, any>) {
    try {
      if (params) {
        router.replace({ pathname: route, params });
      } else {
        router.replace(route);
      }
    } catch (error) {
      console.error('Navigation replace error:', error);
    }
  }

  /**
   * Go back to previous screen
   */
  static goBack() {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback to home if no back history
        router.replace(ROUTES.HOME);
      }
    } catch (error) {
      console.error('Navigation back error:', error);
      router.replace(ROUTES.HOME);
    }
  }

  /**
   * Navigate to home screen
   */
  static goHome() {
    router.replace(ROUTES.HOME);
  }

  /**
   * Navigate to specific tab
   */
  static goToTab(tab: 'home' | 'polls' | 'news' | 'sponsors') {
    switch (tab) {
      case 'home':
        router.push(ROUTES.HOME);
        break;
      case 'polls':
        router.push(ROUTES.POLLS);
        break;
      case 'news':
        router.push(ROUTES.NEWS);
        break;
      case 'sponsors':
        router.push(ROUTES.SPONSORS);
        break;
    }
  }

  /**
   * Navigate to article details
   */
  static goToArticle(articleId: number) {
    router.push(ROUTES.ARTICLE(articleId));
  }

  /**
   * Navigate to poll details
   */
  static goToPoll(pollId: number) {
    router.push(ROUTES.POLL(pollId));
  }

  /**
   * Navigate to settings
   */
  static goToSettings() {
    router.push(ROUTES.SETTINGS);
  }

  /**
   * Navigate to about screen
   */
  static goToAbout() {
    router.push(ROUTES.ABOUT);
  }

  /**
   * Navigate to onboarding
   */
  static goToOnboarding() {
    router.push(ROUTES.ONBOARDING);
  }

  /**
   * Show modal
   */
  static showModal() {
    router.push(ROUTES.MODAL);
  }

  /**
   * Dismiss modal
   */
  static dismissModal() {
    router.dismiss();
  }
}

/**
 * Deep Link Helper Class
 */
export class DeepLinkHelper {
  /**
   * Parse incoming deep link URL
   */
  static parseUrl(url: string): {
    route: string;
    params: Record<string, any>;
  } | null {
    try {
      const parsed = Linking.parse(url);
      console.log('Parsed deep link:', parsed);

      const { hostname, path, queryParams } = parsed;

      // Handle different URL formats
      if (hostname === 'trendankara.com' || hostname === 'app.trendankara.com') {
        return this.parseWebUrl(path || '', queryParams || {});
      }

      // Handle app scheme URLs
      if (parsed.scheme === 'trendankara') {
        return this.parseAppSchemeUrl(path || '', queryParams || {});
      }

      return null;
    } catch (error) {
      console.error('Deep link parsing error:', error);
      return null;
    }
  }

  /**
   * Parse web URLs (https://trendankara.com/...)
   */
  private static parseWebUrl(path: string, queryParams: Record<string, any>) {
    const pathParts = path.split('/').filter(Boolean);

    switch (pathParts[0]) {
      case 'polls':
        if (pathParts[1]) {
          return {
            route: ROUTES.POLL(parseInt(pathParts[1], 10)),
            params: queryParams,
          };
        }
        return { route: ROUTES.POLLS, params: queryParams };

      case 'news':
        if (pathParts[1]) {
          return {
            route: ROUTES.ARTICLE(parseInt(pathParts[1], 10)),
            params: queryParams,
          };
        }
        return { route: ROUTES.NEWS, params: queryParams };

      case 'article':
        if (pathParts[1]) {
          return {
            route: ROUTES.ARTICLE(parseInt(pathParts[1], 10)),
            params: queryParams,
          };
        }
        return { route: ROUTES.NEWS, params: queryParams };

      case 'poll':
        if (pathParts[1]) {
          return {
            route: ROUTES.POLL(parseInt(pathParts[1], 10)),
            params: queryParams,
          };
        }
        return { route: ROUTES.POLLS, params: queryParams };

      case 'sponsors':
        return { route: ROUTES.SPONSORS, params: queryParams };

      case 'settings':
        return { route: ROUTES.SETTINGS, params: queryParams };

      case 'about':
        return { route: ROUTES.ABOUT, params: queryParams };

      default:
        return { route: ROUTES.HOME, params: queryParams };
    }
  }

  /**
   * Parse app scheme URLs (trendankara://...)
   */
  private static parseAppSchemeUrl(path: string, queryParams: Record<string, any>) {
    // Similar logic to web URLs but for app scheme
    return this.parseWebUrl(path, queryParams);
  }

  /**
   * Generate deep link URL for sharing
   */
  static generateShareUrl(route: string, params?: Record<string, any>): string {
    const baseUrl = DEEP_LINK_PATTERNS.WEB_DOMAIN;
    const queryString = params
      ? '?' + Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
      : '';

    // Remove leading slash from route if present
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;

    return `${baseUrl}/${cleanRoute}${queryString}`;
  }

  /**
   * Generate app scheme URL
   */
  static generateAppUrl(route: string, params?: Record<string, any>): string {
    const queryString = params
      ? '?' + Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
      : '';

    // Remove leading slash from route if present
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;

    return `${DEEP_LINK_PATTERNS.APP_SCHEME}${cleanRoute}${queryString}`;
  }

  /**
   * Handle incoming deep link
   */
  static handleDeepLink(url: string): boolean {
    // Handle TrackPlayer notification clicks - just bring app to foreground without navigation
    // to avoid reloading the page and stopping the player
    if (url.startsWith('trackplayer://') || url.includes('notification.click')) {
      console.log('[DeepLink] TrackPlayer notification clicked, app brought to foreground');
      return true;
    }

    const parsed = this.parseUrl(url);

    if (!parsed) {
      console.warn('Could not parse deep link:', url);
      return false;
    }

    try {
      // Navigate to the parsed route
      NavigationHelper.navigate(parsed.route, parsed.params);
      return true;
    } catch (error) {
      console.error('Deep link navigation error:', error);
      return false;
    }
  }

  /**
   * Get current URL for sharing
   */
  static getCurrentUrl(): string {
    // In a real app, you'd get the current route from the navigation state
    // For now, return the base URL
    return DEEP_LINK_PATTERNS.WEB_DOMAIN;
  }
}

/**
 * Navigation State Helper
 */
export class NavigationStateHelper {
  /**
   * Check if we can go back
   */
  static canGoBack(): boolean {
    return router.canGoBack();
  }

  /**
   * Get current route name (simplified)
   */
  static getCurrentRoute(): string {
    // This is a simplified implementation
    // In a real app, you'd use navigation state
    return window.location?.pathname || '/';
  }

  /**
   * Check if we're on a specific tab
   */
  static isOnTab(tab: 'home' | 'polls' | 'news' | 'sponsors'): boolean {
    const currentRoute = this.getCurrentRoute();

    switch (tab) {
      case 'home':
        return currentRoute === '/' || currentRoute === '/index';
      case 'polls':
        return currentRoute.startsWith('/polls');
      case 'news':
        return currentRoute.startsWith('/news');
      case 'sponsors':
        return currentRoute.startsWith('/sponsors');
      default:
        return false;
    }
  }

  /**
   * Check if we're in a modal
   */
  static isModalOpen(): boolean {
    const currentRoute = this.getCurrentRoute();
    return currentRoute.includes('/modal');
  }
}

/**
 * Route validation helpers
 */
export const RouteValidator = {
  /**
   * Validate article ID
   */
  isValidArticleId(id: string | number): boolean {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return !isNaN(numId) && numId > 0;
  },

  /**
   * Validate poll ID
   */
  isValidPollId(id: string | number): boolean {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return !isNaN(numId) && numId > 0;
  },

  /**
   * Validate route exists
   */
  isValidRoute(route: string): boolean {
    const validRoutes = [
      '/',
      '/polls',
      '/news',
      '/sponsors',
      '/settings',
      '/about',
      '/onboarding',
      '/modal',
    ];

    // Check exact matches first
    if (validRoutes.includes(route)) {
      return true;
    }

    // Check dynamic routes
    if (route.startsWith('/article/')) {
      const id = route.replace('/article/', '');
      return this.isValidArticleId(id);
    }

    if (route.startsWith('/poll/')) {
      const id = route.replace('/poll/', '');
      return this.isValidPollId(id);
    }

    return false;
  },
};

/**
 * Usage Examples:
 *
 * Basic Navigation:
 * NavigationHelper.goToArticle(123);
 * NavigationHelper.goToPoll(456);
 * NavigationHelper.goToSettings();
 *
 * Deep Linking:
 * const url = DeepLinkHelper.generateShareUrl('article/123', { source: 'share' });
 * DeepLinkHelper.handleDeepLink('trendankara://article/123');
 *
 * State Checking:
 * const isOnNews = NavigationStateHelper.isOnTab('news');
 * const canGoBack = NavigationStateHelper.canGoBack();
 *
 * Validation:
 * const isValid = RouteValidator.isValidArticleId('123');
 * const routeExists = RouteValidator.isValidRoute('/article/123');
 */