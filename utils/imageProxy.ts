/**
 * Image URL Utility
 * SSL is now handled directly via Let's Encrypt — no proxy needed
 */

/**
 * Returns the image URL directly (proxy removed, SSL fixed on server)
 */
export function getProxiedImageUrl(originalUrl: string | null | undefined): string | null {
  if (!originalUrl) return null;
  return originalUrl;
}

/**
 * Get image source object for React Native Image component
 * Handles both string URLs and ImageSource objects
 */
export function getImageSource(imageUrl: string | null | undefined): { uri: string } | null {
  const proxiedUrl = getProxiedImageUrl(imageUrl);
  return proxiedUrl ? { uri: proxiedUrl } : null;
}

/**
 * Check if an image URL is valid
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch {
    // If it's not a valid URL, check if it's a relative path
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * Get fallback placeholder image URL
 */
export function getPlaceholderImage(): string {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
}