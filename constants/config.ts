/**
 * Feature flags configuration for rollback capability
 * These flags allow gradual rollout and quick rollback of features
 */

export const FEATURES = {
  /**
   * Enable mounted state checks in components
   * When false, falls back to direct setState calls
   */
  USE_MOUNTED_STATE: true,

  /**
   * Use VideoPlayerService exclusively for audio
   * When false, falls back to previous dual system implementation
   */
  USE_VIDEO_PLAYER_ONLY: true,

  /**
   * Show empty state components when no data
   * When false, shows loading spinner instead
   */
  SHOW_EMPTY_STATES: true,
} as const;

export type FeatureFlags = typeof FEATURES;