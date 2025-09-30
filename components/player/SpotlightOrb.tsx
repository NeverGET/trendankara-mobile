import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { BrandColors } from '@/constants/theme';
import { ANIMATION_CONFIG } from '@/constants/animations';

interface SpotlightOrbProps {
  size?: number;
  style?: any;
  animationDuration?: number;
  opacity?: number;
  isPulsing?: boolean;
  randomOffset?: number;
  color?: string; // Custom color for the orb
}

export function SpotlightOrb({
  size = 80,
  style,
  animationDuration = 3000,
  opacity = 0.6,
  isPulsing = false,
  randomOffset = 0,
  color = BrandColors.primary
}: SpotlightOrbProps) {
  // Shared values for animations
  const animationProgress = useSharedValue(0);

  // Shared values for ambient movement
  const movementProgress = useSharedValue(0);

  // Shared value for pulse animation
  const pulseProgress = useSharedValue(0);

  // Shared value for random pulse tracking
  const randomPulseProgress = useSharedValue(0);
  const lastPulseTime = useSharedValue(0);

  // Generate random movement parameters with offset
  const movementRadius = React.useMemo(() => Math.random() * 20 + 10 + randomOffset, []); // 10-30px radius + random offset
  const movementDuration = React.useMemo(() => Math.random() * 10000 + 10000, []); // 10-20 seconds

  // Start the continuous animations
  React.useEffect(() => {
    // Only do breathing animation when NOT pulsing
    if (!isPulsing) {
      // Breathing/scale animation for idle state
      animationProgress.value = withRepeat(
        withTiming(1, {
          duration: animationDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite repeat
        true // Reverse animation
      );
    } else {
      // When pulsing, keep animation progress at 0 (no breathing)
      animationProgress.value = 0;
    }

    // Circular movement animation (always active)
    movementProgress.value = withRepeat(
      withTiming(1, {
        duration: movementDuration,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // Don't reverse, continuous circular motion
    );

    // Cleanup function to cancel animations on unmount
    return () => {
      cancelAnimation(animationProgress);
      cancelAnimation(movementProgress);
      cancelAnimation(pulseProgress);
    };
  }, [animationDuration, movementDuration, animationProgress, movementProgress, pulseProgress, isPulsing]);

  // Random pulse animation effect when music is playing
  React.useEffect(() => {
    if (isPulsing) {
      // Create a random delay for each orb to pulse independently
      const randomDelay = Math.random() * 2000; // 0-2 seconds initial delay

      // Start the random pulse animation with delay
      setTimeout(() => {
        // Random pulse animation that repeats
        randomPulseProgress.value = withRepeat(
          withSequence(
            // Instant pulse up (50ms)
            withTiming(1, {
              duration: 50,
              easing: Easing.out(Easing.quad),
            }),
            // Faster shrink (0.8-1.5 seconds) - more audio-responsive
            withTiming(0, {
              duration: 800 + Math.random() * 700,
              easing: Easing.inOut(Easing.ease),
            }),
            // Shorter pause between pulses (0.2-0.8 seconds) - more frequent
            withTiming(0, {
              duration: 200 + Math.random() * 600,
              easing: Easing.linear,
            })
          ),
          -1, // Infinite repeat
          false // Don't reverse
        );
      }, randomDelay);

      // No base pulse - keep pulseProgress at 0
      pulseProgress.value = 0;

      // Cleanup
      return () => {
        cancelAnimation(pulseProgress);
        cancelAnimation(randomPulseProgress);
      };
    } else {
      // Reset pulses when not playing
      pulseProgress.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      randomPulseProgress.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }

    // Cleanup function
    return () => {
      cancelAnimation(pulseProgress);
      cancelAnimation(randomPulseProgress);
    };
  }, [isPulsing, pulseProgress, randomPulseProgress]);

  // Animated style for the orb
  const animatedStyle = useAnimatedStyle(() => {
    // Base scale animation: breathing when idle, static when playing
    const baseScale = isPulsing
      ? ANIMATION_CONFIG.scale.spotlight.min // Static base scale when playing
      : interpolate(
          animationProgress.value,
          [0, 0.5, 1],
          [ANIMATION_CONFIG.scale.spotlight.min, ANIMATION_CONFIG.scale.spotlight.max, ANIMATION_CONFIG.scale.spotlight.min]
        );

    // Random pulse scale animation: instant up, slow down
    const randomPulseScale = interpolate(
      randomPulseProgress.value,
      [0, 1],
      [1.0, 1.5] // Up to 50% larger during random pulse
    );

    // Combine scales with a maximum limit
    const combinedScale = Math.min(
      baseScale * randomPulseScale,
      2.0 // Maximum scale limit to prevent covering entire screen
    );

    // Opacity animation: breathing when idle, stable when playing
    const baseOpacity = isPulsing
      ? opacity // Stable opacity when playing
      : interpolate(
          animationProgress.value,
          [0, 0.5, 1],
          [opacity * 0.7, opacity, opacity * 0.7]
        );

    // Random pulse opacity enhancement
    const randomPulseOpacity = interpolate(
      randomPulseProgress.value,
      [0, 1],
      [1.0, 1.3] // Brighten during random pulse
    );

    const animatedOpacity = Math.min(baseOpacity * randomPulseOpacity, 1.0);

    // Circular movement calculations
    const angle = interpolate(
      movementProgress.value,
      [0, 1],
      [0, 2 * Math.PI]
    );

    const translateX = Math.cos(angle) * movementRadius;
    const translateY = Math.sin(angle) * movementRadius;

    return {
      transform: [
        { translateX },
        { translateY },
        { scale: combinedScale }
      ],
      opacity: animatedOpacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  orb: {
    // Base shadow for iOS (will inherit color from backgroundColor)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,

    // Elevation for Android
    elevation: 8,

    // Additional glow effect using border
    borderWidth: 0,

    // Ensure the orb is positioned absolutely if needed
    position: 'absolute',
  },
});