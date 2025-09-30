export const CACHE_KEYS = {
  MOBILE_SETTINGS: 'mobile_settings',
  RADIO_CONFIG: 'radio_config',
  CURRENT_CARDS: 'current_cards',
  CURRENT_POLLS: 'current_polls',
  LATEST_NEWS: 'latest_news',
  NEWS_ARTICLES: 'news_articles',
  NEWS_ARTICLE: 'news_article',
  NEWS_CATEGORIES: 'news_categories',
  POLL_VOTES: 'poll_votes',
} as const;

export const CACHE_TTL = {
  SETTINGS: 30 * 60 * 1000, // 30 minutes
  CARDS: 10 * 60 * 1000,     // 10 minutes
  POLLS: 5 * 60 * 1000,      // 5 minutes
  NEWS: 15 * 60 * 1000,      // 15 minutes
  VOTES: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;