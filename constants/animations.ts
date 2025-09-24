/**
 * Animation constants for the TrendAnkara Radio animated logo player
 * Centralizes animation configuration values for consistent timing and effects
 */

import { BrandColors } from './theme';

/**
 * Animation configuration interface defining timing values and colors
 * for the animated logo player feature
 */
export interface AnimationConfig {
  // Timing values in milliseconds
  timing: {
    ambient: number;        // Ambient animation duration when not playing
    pulse: number;          // Pulse animation duration when playing
    spotlight: number;      // Spotlight movement duration
    fadeIn: number;         // Fade in animation duration
    fadeOut: number;        // Fade out animation duration
    scaleTab: number;       // Tab icon scale animation duration
  };

  // Light effect colors using brand palette
  lightColors: {
    primary: string;        // Primary red light color (#DC2626)
    secondary: string;      // Secondary red light color (#EF4444)
    accent: string;         // Accent color for highlights
  };

  // Animation easing configurations
  easing: {
    ambient: string;        // Easing for ambient animations
    pulse: string;          // Easing for pulse effects
    spotlight: string;      // Easing for spotlight movement
    scale: string;          // Easing for scale animations
  };

  // Animation scale values
  scale: {
    logo: {
      rest: number;         // Logo scale at rest
      playing: number;      // Logo scale when playing
    };
    tab: {
      default: number;      // Tab icon default scale
      active: number;       // Tab icon active scale
    };
    spotlight: {
      min: number;          // Minimum spotlight scale
      max: number;          // Maximum spotlight scale
    };
  };

  // Opacity values for light effects
  opacity: {
    spotlight: {
      min: number;          // Minimum spotlight opacity
      max: number;          // Maximum spotlight opacity
    };
    ambient: number;        // Ambient light opacity
  };
}

/**
 * Default animation configuration values
 * Optimized for 60 FPS performance and smooth visual effects
 */
export const ANIMATION_CONFIG: AnimationConfig = {
  timing: {
    ambient: 3000,          // 3 second ambient animation cycle
    pulse: 1000,            // 1 second pulse when playing
    spotlight: 4000,        // 4 second spotlight movement
    fadeIn: 500,            // 0.5 second fade in
    fadeOut: 300,           // 0.3 second fade out
    scaleTab: 200,          // 0.2 second tab scale animation
  },

  lightColors: {
    primary: BrandColors.primary,     // #DC2626 - Vibrant red
    secondary: '#EF4444',             // Lighter red for gradient effect
    accent: BrandColors.tertiary,     // #FFFFFF - White highlights
  },

  easing: {
    ambient: 'ease-in-out',           // Smooth ambient animations
    pulse: 'ease-out',                // Quick pulse response
    spotlight: 'linear',              // Continuous spotlight movement
    scale: 'ease-out',                // Natural scale transitions
  },

  scale: {
    logo: {
      rest: 1.0,                      // Normal size at rest
      playing: 1.05,                  // Slightly larger when playing
    },
    tab: {
      default: 1.0,                   // Normal tab icon size
      active: 1.2,                    // Enlarged when active
    },
    spotlight: {
      min: 0.8,                       // Minimum spotlight size
      max: 1.4,                       // Maximum spotlight size
    },
  },

  opacity: {
    spotlight: {
      min: 0.1,                       // Subtle minimum opacity
      max: 0.4,                       // Visible but not overwhelming
    },
    ambient: 0.2,                     // Gentle ambient lighting
  },
};