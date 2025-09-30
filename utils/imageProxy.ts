/**
 * Image Proxy Utility
 * Handles image URL transformation to use GCP media proxy when needed
 */

const PROXY_BASE_URL = 'https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-media-proxy';

/**
 * Check if an image URL should use the proxy
 * Returns true if the URL is from the main server (trendankara.com) which may have SSL issues
 */
function shouldUseProxy(imageUrl: string): boolean {
  if (!imageUrl) return false;

  // Use proxy for trendankara.com images to bypass SSL issues
  return imageUrl.includes('trendankara.com');
}

/**
 * Transform image URL to use the media proxy
 */
export function getProxiedImageUrl(originalUrl: string | null | undefined): string | null {
  if (!originalUrl) return null;

  // If the URL should use proxy, transform it
  if (shouldUseProxy(originalUrl)) {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${PROXY_BASE_URL}?url=${encodedUrl}`;
  }

  // Return original URL for external images
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