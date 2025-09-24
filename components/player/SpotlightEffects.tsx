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
  const [orbCount, setOrbCount] = useState(3); // Start with full 3 orbs
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

        if (averageFPS < 50 && orbCount > 1) {
          // Reduce orb count if FPS drops below 50
          setOrbCount(prev => Math.max(1, prev - 1));
          setIsLowPerformance(true);
        } else if (averageFPS > 55 && orbCount < 3 && !isLowPerformance) {
          // Restore orbs if performance improves
          setOrbCount(prev => Math.min(3, prev + 1));
        }

        // Mark as low performance device if we've reduced to 1 orb
        if (orbCount === 1 && averageFPS < 50) {
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

  // Adjust opacity based on theme - darker for light mode, brighter for dark mode
  const baseOpacity = colorScheme === 'dark' ? 0.8 : 0.4;

  // Enhance effects when playing
  const playingMultiplier = isPlaying ? 1.3 : 1.0;
  const finalOpacity = baseOpacity * playingMultiplier;

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
      {/* Primary orb - always visible, larger, positioned top-left behind logo */}
      <SpotlightOrb
        size={isLowPerformance ? 100 : 120}
        opacity={isBuffering ? getBufferingProps().opacity : finalOpacity * 0.9}
        animationDuration={isBuffering ? getBufferingProps().animationDuration : getAnimationDuration(isPlaying ? 2500 : 4000)}
        isPulsing={isBuffering ? getBufferingProps().isPulsing : (isPlaying && !isLowPerformance)}
        style={[
          styles.orb,
          {
            top: '15%',
            left: '10%',
          }
        ]}
      />

      {/* Secondary orb - conditionally rendered based on performance */}
      {orbCount >= 2 && (
        <SpotlightOrb
          size={isLowPerformance ? 75 : 90}
          opacity={isBuffering ? getBufferingProps().opacity : finalOpacity * 0.7}
          animationDuration={isBuffering ? getBufferingProps().animationDuration : getAnimationDuration(isPlaying ? 3000 : 5000)}
          isPulsing={isBuffering ? getBufferingProps().isPulsing : (isPlaying && !isLowPerformance)}
          style={[
            styles.orb,
            {
              bottom: '20%',
              right: '15%',
            }
          ]}
        />
      )}

      {/* Tertiary orb - only on high-performance devices */}
      {orbCount >= 3 && !isLowPerformance && (
        <SpotlightOrb
          size={70}
          opacity={isBuffering ? getBufferingProps().opacity : finalOpacity * 0.5}
          animationDuration={isBuffering ? getBufferingProps().animationDuration : getAnimationDuration(isPlaying ? 3500 : 6000)}
          isPulsing={isBuffering ? getBufferingProps().isPulsing : isPlaying}
          style={[
            styles.orb,
            {
              top: '35%',
              right: '20%',
            }
          ]}
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