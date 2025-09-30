import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useFrameCallback, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { SpotlightOrb } from './SpotlightOrb';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SpotlightEffectsProps {
  /**
   * Whether the player is currently playing audio
   * Affects animation intensity and opacity
   */
  isPlaying?: boolean;
  /**
   * Current audio state for buffering animations
   */
  state?: 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error';
  /**
   * Custom style to apply to the container
   */
  style?: any;
}

export function SpotlightEffects({
  isPlaying = false,
  state = 'idle',
  style
}: SpotlightEffectsProps) {
  const colorScheme = useColorScheme();

  // Theme transition animation values
  const themeOpacity = useSharedValue(1);
  const themeBlurRadius = useSharedValue(colorScheme === 'dark' ? 8 : 4);

  // Animate theme transitions
  useEffect(() => {
    // Smooth opacity transition when theme changes
    themeOpacity.value = withTiming(0.3, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    }, (finished) => {
      if (finished) {
        // Fade back in with new theme
        themeOpacity.value = withTiming(1, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }
    });

    // Animate blur radius based on theme
    const targetBlurRadius = colorScheme === 'dark' ? 8 : 4;
    themeBlurRadius.value = withTiming(targetBlurRadius, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  }, [colorScheme, themeOpacity, themeBlurRadius]);

  // Performance monitoring state
  const [orbCount, setOrbCount] = useState(8); // Start with 8 orbs for better coverage
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  // FPS tracking
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const fpsHistory = useRef<number[]>([]);
  const performanceCheckInterval = useRef(0);

  // Shared value for frame monitoring
  const frameMonitor = useSharedValue(0);

  // Performance monitoring callback
  const updatePerformanceMetrics = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastFrameTime.current;
    lastFrameTime.current = currentTime;

    if (deltaTime > 0) {
      const currentFPS = 1000 / deltaTime;
      fpsHistory.current.push(currentFPS);

      // Keep only last 30 frames for rolling average
      if (fpsHistory.current.length > 30) {
        fpsHistory.current.shift();
      }

      frameCount.current++;

      // Check performance every 60 frames (~1 second at 60fps)
      if (frameCount.current % 60 === 0 && fpsHistory.current.length >= 10) {
        const averageFPS = fpsHistory.current.reduce((sum, fps) => sum + fps, 0) / fpsHistory.current.length;

        if (averageFPS < 45 && orbCount > 3) {
          // Reduce orb count if FPS drops below 45
          setOrbCount(prev => Math.max(3, prev - 2));
          setIsLowPerformance(true);
        } else if (averageFPS > 55 && orbCount < 8 && !isLowPerformance) {
          // Restore orbs if performance improves
          setOrbCount(prev => Math.min(8, prev + 1));
        }

        // Mark as low performance device if we've reduced to 3 orbs
        if (orbCount === 3 && averageFPS < 45) {
          setIsLowPerformance(true);
        }
      }
    }
  }, [orbCount, isLowPerformance]);

  // Frame callback for performance monitoring
  useFrameCallback((frameInfo) => {
    'worklet';
    frameMonitor.value = frameInfo.timestamp;
    runOnJS(updatePerformanceMetrics)(frameInfo.timestamp);
  }, true);

  // Adjust opacity based on theme - reduced saturation for readability
  const baseOpacity = colorScheme === 'dark' ? 0.5 : 0.25; // Lower base opacity

  // Enhance effects when playing but keep it subtle
  const playingMultiplier = isPlaying ? 1.2 : 1.0;
  const finalOpacity = baseOpacity * playingMultiplier;

  // Define varied red shades with different hues for less saturation
  const redShades = [
    'rgba(220, 38, 38, 0.35)',   // Base red - #DC2626 with 35% opacity
    'rgba(239, 68, 68, 0.30)',   // Lighter red - #EF4444 with 30% opacity
    'rgba(185, 28, 28, 0.40)',   // Darker red - #B91C1C with 40% opacity
    'rgba(248, 113, 113, 0.25)', // Coral red - #F87171 with 25% opacity
    'rgba(220, 52, 69, 0.35)',   // Crimson - with 35% opacity
    'rgba(200, 30, 30, 0.38)',   // Deep red - with 38% opacity
    'rgba(230, 70, 70, 0.28)',   // Bright red - with 28% opacity
    'rgba(195, 45, 55, 0.33)',   // Maroon tint - with 33% opacity
  ];

  // Adjust animation durations based on performance and state
  const getAnimationDuration = useCallback((baseDuration: number) => {
    if (state === 'buffering') {
      // Longer, calmer durations for buffering state
      return baseDuration * 2.5;
    }
    if (isLowPerformance) {
      return baseDuration * 1.5; // Slower animations on low-performance devices
    }
    return baseDuration;
  }, [isLowPerformance, state]);

  // Determine if we should show buffering animations
  const isBuffering = state === 'buffering';

  // Get buffering-specific animation properties
  const getBufferingProps = useCallback(() => {
    if (!isBuffering) return {};

    // Synchronized slow pulse for all orbs during buffering
    return {
      animationDuration: 4000, // Longer duration for calmer effect
      isPulsing: true, // Enable pulsing for loading indication
      opacity: finalOpacity * 0.8, // Slightly dimmed during buffering
    };
  }, [isBuffering, finalOpacity]);

  // Get theme-adjusted opacity for smoother transitions
  const getThemeAdjustedOpacity = useCallback((baseOpacity: number) => {
    return baseOpacity; // The container opacity handles the theme transition
  }, []);

  // Animated style for theme transitions
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: themeOpacity.value,
      // Note: React Native doesn't support blur filters natively
      // The blur radius is stored for potential future use with libraries like react-native-blur
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, style]} pointerEvents="none">
      {/* Orb 1 - Top-left corner of 16:9 area */}
      <SpotlightOrb
        size={isLowPerformance ? 90 : 110}
        color={redShades[0]}
        animationDuration={getAnimationDuration(isPlaying ? 2200 : 4000)}
        isPulsing={isPlaying && !isLowPerformance}
        style={[styles.orb, { top: '20%', left: '8%' }]}
      />

      {/* Orb 2 - Top-center of 16:9 area */}
      {orbCount >= 2 && (
        <SpotlightOrb
          size={isLowPerformance ? 70 : 95}
          color={redShades[1]}
          animationDuration={getAnimationDuration(isPlaying ? 2600 : 4500)}
          isPulsing={isPlaying && !isLowPerformance}
          style={[styles.orb, { top: '15%', left: '42%' }]}
        />
      )}

      {/* Orb 3 - Top-right corner of 16:9 area */}
      {orbCount >= 3 && (
        <SpotlightOrb
          size={isLowPerformance ? 85 : 105}
          color={redShades[2]}
          animationDuration={getAnimationDuration(isPlaying ? 2400 : 4200)}
          isPulsing={isPlaying}
          style={[styles.orb, { top: '18%', right: '10%' }]}
        />
      )}

      {/* Orb 4 - Middle-left of 16:9 area */}
      {orbCount >= 4 && (
        <SpotlightOrb
          size={isLowPerformance ? 75 : 100}
          color={redShades[3]}
          animationDuration={getAnimationDuration(isPlaying ? 2800 : 4800)}
          isPulsing={isPlaying}
          style={[styles.orb, { top: '42%', left: '5%' }]}
        />
      )}

      {/* Orb 5 - Middle-right of 16:9 area */}
      {orbCount >= 5 && (
        <SpotlightOrb
          size={isLowPerformance ? 80 : 98}
          color={redShades[4]}
          animationDuration={getAnimationDuration(isPlaying ? 2300 : 4300)}
          isPulsing={isPlaying}
          style={[styles.orb, { top: '45%', right: '6%' }]}
        />
      )}

      {/* Orb 6 - Bottom-left corner of 16:9 area */}
      {orbCount >= 6 && (
        <SpotlightOrb
          size={isLowPerformance ? 88 : 108}
          color={redShades[5]}
          animationDuration={getAnimationDuration(isPlaying ? 2500 : 4600)}
          isPulsing={isPlaying}
          style={[styles.orb, { bottom: '22%', left: '12%' }]}
        />
      )}

      {/* Orb 7 - Bottom-center of 16:9 area */}
      {orbCount >= 7 && (
        <SpotlightOrb
          size={isLowPerformance ? 72 : 92}
          color={redShades[6]}
          animationDuration={getAnimationDuration(isPlaying ? 2700 : 4700)}
          isPulsing={isPlaying}
          style={[styles.orb, { bottom: '18%', left: '45%' }]}
        />
      )}

      {/* Orb 8 - Bottom-right corner of 16:9 area */}
      {orbCount >= 8 && (
        <SpotlightOrb
          size={isLowPerformance ? 82 : 103}
          color={redShades[7]}
          animationDuration={getAnimationDuration(isPlaying ? 2100 : 4100)}
          isPulsing={isPlaying}
          style={[styles.orb, { bottom: '20%', right: '11%' }]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // Ensure orbs are behind other content
    zIndex: -1,
  },
  orb: {
    // Additional blur effect for depth
    // Note: actual blur filter would require additional libraries
    // Using shadow and opacity for similar effect
  },
});