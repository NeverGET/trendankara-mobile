/**
 * Default artwork for native media controls
 * Returns the require() result directly for TrackPlayer to use
 */

// Import the image using require() to ensure it's bundled
const DEFAULT_ARTWORK_IMAGE = require('@/assets/images/Trendankara2.png');

/**
 * Get the artwork for native media controls
 * Returns the require() result (number) for bundled images
 * This works in both dev and production builds
 */
export function getDefaultArtwork(): number {
  return DEFAULT_ARTWORK_IMAGE;
}

/**
 * Get the artwork for use in TrackPlayer metadata
 * Returns remote URL if provided, otherwise bundled image
 * TrackPlayer accepts either a URL string or a require() number
 */
export function getArtwork(remoteUrl?: string | null): string | number {
  // If a remote URL is provided and valid, use it
  if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
    return remoteUrl;
  }

  // Otherwise, use the bundled default artwork (as a number from require)
  return getDefaultArtwork();
}

export default {
  getDefaultArtwork,
  getArtwork,
};
