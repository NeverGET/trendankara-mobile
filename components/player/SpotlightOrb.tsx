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
}

export function SpotlightOrb({
  size = 80,
  style,
  animationDuration = 3000,
  opacity = 0.6,
  isPulsing = false,
  randomOffset = 0
}: SpotlightOrbProps) {
  // Shared values for animations
  const animationProgress = useSharedValue(0);

  // Shared values for ambient movement
  const movementProgress = useSharedValue(0);

  // Shared value for pulse animation
  const pulseProgress = useSharedValue(0);

  // Generate random movement parameters with offset
  const movementRadius = React.useMemo(() => Math.random() * 20 + 10 + randomOffset, []); // 10-30px radius + random offset
  const movementDuration = React.useMemo(() => Math.random() * 10000 + 10000, []); // 10-20 seconds

  // Start the continuous animations
  React.useEffect(() => {
    // Breathing/scale animation
    animationProgress.value = withRepeat(
      withTiming(1, {
        duration: animationDuration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite repeat
      true // Reverse animation
    );

    // Circular movement animation
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
  }, [animationDuration, movementDuration, animationProgress, movementProgress, pulseProgress]);

  // Pulse animation effect when music is playing
  React.useEffect(() => {
    if (isPulsing) {
      // Quick scale up (0.2s) and slow down (0.8s) pulse sequence
      pulseProgress.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 200, // 0.2s quick scale up
            easing: Easing.out(Easing.ease),
          }),
          withTiming(0, {
            duration: 800, // 0.8s slow scale down
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Infinite repeat
        false // Don't reverse
      );
    } else {
      // Reset pulse when not pulsing
      pulseProgress.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }

    // Cleanup function to cancel pulse animation
    return () => {
      cancelAnimation(pulseProgress);
    };
  }, [isPulsing, pulseProgress]);

  // Animated style for the orb
  const animatedStyle = useAnimatedStyle(() => {
    // Base scale animation: slightly grows and shrinks
    const baseScale = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [ANIMATION_CONFIG.scale.spotlight.min, ANIMATION_CONFIG.scale.spotlight.max, ANIMATION_CONFIG.scale.spotlight.min]
    );

    // Pulse scale animation: quick up, slow down
    const pulseScale = interpolate(
      pulseProgress.value,
      [0, 1],
      [1.0, 1.3] // Additional 30% scale during pulse
    );

    // Combine base and pulse scales
    const combinedScale = baseScale * pulseScale;

    // Opacity animation: subtle breathing effect enhanced by pulse
    const baseOpacity = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [opacity * 0.7, opacity, opacity * 0.7]
    );

    // Pulse opacity enhancement
    const pulseOpacity = interpolate(
      pulseProgress.value,
      [0, 1],
      [1.0, 1.4] // Brighten during pulse
    );

    const animatedOpacity = Math.min(baseOpacity * pulseOpacity, 1.0);

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
          backgroundColor: BrandColors.primary, // #DC2626
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  orb: {
    // Base shadow for iOS
    shadowColor: BrandColors.primary,
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