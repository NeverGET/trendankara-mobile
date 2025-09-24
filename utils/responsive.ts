/**
 * Responsive size calculation utilities for the TrendAnkara Radio app
 * Provides consistent sizing across different screen sizes and orientations
 */

export interface ResponsiveSize {
  width: number;
  height: number;
}

/**
 * Calculate responsive logo size based on screen width
 * Uses progressive scaling with maximum size limits
 *
 * @param screenWidth - Current screen width in pixels
 * @returns Logo size that scales appropriately for the screen
 */
export function getLogoSize(screenWidth: number): number {
  // Base size is 60% of screen width for mobile
  const baseSize = screenWidth * 0.6;

  // Set size boundaries based on common device categories
  if (screenWidth <= 320) {
    // Small phones (iPhone 5s, SE)
    return Math.min(baseSize, 150);
  } else if (screenWidth <= 375) {
    // Standard phones (iPhone 6, 7, 8)
    return Math.min(baseSize, 180);
  } else if (screenWidth <= 414) {
    // Large phones (iPhone 6+, 7+, 8+)
    return Math.min(baseSize, 200);
  } else if (screenWidth <= 768) {
    // Tablets in portrait mode
    return Math.min(baseSize, 250);
  } else {
    // Large tablets and landscape mode
    return Math.min(baseSize, 300);
  }
}

/**
 * Calculate responsive orb size for spotlight effects
 * Orbs are typically smaller than the logo for optimal visual balance
 *
 * @param screenWidth - Current screen width in pixels
 * @returns Orb size that complements the logo size
 */
export function getOrbSize(screenWidth: number): number {
  // Orb size is typically 25-30% of logo size
  const logoSize = getLogoSize(screenWidth);
  const orbRatio = 0.28; // 28% of logo size

  const calculatedSize = logoSize * orbRatio;

  // Ensure minimum orb size for visibility
  const minOrbSize = 40;
  // Ensure maximum orb size for performance
  const maxOrbSize = 120;

  return Math.max(minOrbSize, Math.min(calculatedSize, maxOrbSize));
}

/**
 * Get responsive dimensions for both logo and orb
 * Convenience function for components that need both sizes
 *
 * @param screenWidth - Current screen width in pixels
 * @returns Object containing both logo and orb sizes
 */
export function getResponsiveSizes(screenWidth: number): {
  logo: number;
  orb: number;
} {
  return {
    logo: getLogoSize(screenWidth),
    orb: getOrbSize(screenWidth),
  };
}

/**
 * Calculate responsive container dimensions
 * Used for components that need to define their own container size
 *
 * @param screenWidth - Current screen width in pixels
 * @param aspectRatio - Desired aspect ratio (width/height), defaults to 1 (square)
 * @returns ResponsiveSize object with width and height
 */
export function getContainerSize(
  screenWidth: number,
  aspectRatio: number = 1
): ResponsiveSize {
  const logoSize = getLogoSize(screenWidth);

  // Container should be slightly larger than logo to accommodate animations
  const containerWidth = logoSize * 1.2;
  const containerHeight = containerWidth / aspectRatio;

  return {
    width: containerWidth,
    height: containerHeight,
  };
}