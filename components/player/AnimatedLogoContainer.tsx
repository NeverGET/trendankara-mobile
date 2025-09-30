import React, { useEffect, useState } from 'react';
import { StyleSheet, ViewStyle, AppState, Dimensions } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, cancelAnimation } from 'react-native-reanimated';
import { ThemedView } from '@/components/themed-view';
import { LogoDisplay } from './LogoDisplay';
import { SpotlightEffects } from './SpotlightEffects';
import { getLogoSize, getOrbSize } from '@/utils/responsive';

interface AnimatedLogoContainerProps {
  /**
   * Whether the player is currently playing audio
   * This prop will be passed to child components to control animations
   */
  isPlaying?: boolean;
  /**
   * Size of the logo to display
   * If not provided, LogoDisplay will use responsive sizing
   */
  logoSize?: number;
  /**
   * Custom style to apply to the container
   */
  style?: ViewStyle;
  /**
   * Custom style to apply specifically to the logo
   */
  logoStyle?: ViewStyle;
}

/**
 * Main container component that orchestrates the animated logo display
 * with spotlight effects. This component combines the LogoDisplay and
 * SpotlightEffects to create an engaging visual experience.
 *
 * The container uses ThemedView for consistent styling with the app's
 * theme system and passes the isPlaying prop to child components to
 * coordinate animations based on the audio playback state.
 *
 * Battery optimization: Automatically pauses animations when the app
 * is backgrounded or inactive to conserve battery life.
 */
export function AnimatedLogoContainer({
  isPlaying = false,
  logoSize,
  style,
  logoStyle
}: AnimatedLogoContainerProps) {
  // State to track if animations should be paused for battery optimization
  const [isAppActive, setIsAppActive] = useState(true);

  // State to track screen dimensions for responsive sizing
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  // Animated values for smooth size transitions during orientation changes
  const animatedLogoSize = useSharedValue(logoSize || getLogoSize(screenDimensions.width));
  const animatedOrbSize = useSharedValue(getOrbSize(screenDimensions.width));

  // Listen for app state changes to pause animations when backgrounded
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        setIsAppActive(true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsAppActive(false);
      }
    };

    // Add listener for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Get initial app state
    setIsAppActive(AppState.currentState === 'active');

    // Cleanup subscription on unmount
    return () => {
      subscription?.remove();
    };
  }, []);

  // Listen for orientation changes and update dimensions
  useEffect(() => {
    const handleOrientationChange = ({ window }: { window: { width: number; height: number } }) => {
      setScreenDimensions(window);

      // Calculate new sizes based on new screen width
      const newLogoSize = logoSize || getLogoSize(window.width);
      const newOrbSize = getOrbSize(window.width);

      // Animate to new sizes with smooth timing
      animatedLogoSize.value = withTiming(newLogoSize, {
        duration: 300, // 300ms smooth transition
      });

      animatedOrbSize.value = withTiming(newOrbSize, {
        duration: 300, // 300ms smooth transition
      });
    };

    // Add listener for dimension changes (orientation)
    const subscription = Dimensions.addEventListener('change', handleOrientationChange);

    // Cleanup subscription and animations on unmount
    return () => {
      subscription?.remove();
      // Cancel any ongoing size transition animations
      cancelAnimation(animatedLogoSize);
      cancelAnimation(animatedOrbSize);
    };
  }, [logoSize, animatedLogoSize, animatedOrbSize]);

  // Pause animations when app is not active for battery optimization
  const shouldPlayAnimations = isAppActive;

  // Create animated style for the container to handle size transitions
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      // Container adapts to logo size changes
      minWidth: animatedLogoSize.value * 1.2,
      minHeight: animatedLogoSize.value * 1.2,
    };
  });

  return (
    <ThemedView style={[styles.container, style]}>
      <Animated.View style={[styles.animatedContainer, animatedContainerStyle]}>
        {/* Spotlight effects rendered behind the logo */}
        <SpotlightEffects
          isPlaying={isPlaying && shouldPlayAnimations}
          style={styles.spotlightContainer}
        />

        {/* Logo display rendered on top of spotlight effects */}
        <LogoDisplay
          size={logoSize}
          style={[styles.logoContainer, logoStyle]}
        />
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    // Allow spotlight effects to extend beyond bounds
    overflow: 'visible',
  },
  animatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Allow spotlight effects to be visible outside bounds
    overflow: 'visible',
  },
  spotlightContainer: {
    // SpotlightEffects uses absolute positioning and zIndex: -1
    // No additional styling needed as it handles its own positioning
  },
  logoContainer: {
    // Ensure logo appears above spotlight effects
    zIndex: 1,
    // Allow logo to be positioned relative to container
    position: 'relative',
  },
});