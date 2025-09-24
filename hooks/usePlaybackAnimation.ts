import { useEffect, useCallback, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSharedValue, withTiming, withRepeat, Easing, cancelAnimation } from 'react-native-reanimated';
import { useAudio } from './useAudio';

export function usePlaybackAnimation() {
  const { isPlaying } = useAudio();

  // Reduce motion accessibility setting
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  // Check reduce motion preference on mount
  useEffect(() => {
    const checkReduceMotion = async () => {
      try {
        const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setIsReduceMotionEnabled(isEnabled);
      } catch (error) {
        console.warn('Failed to check reduce motion setting:', error);
        // Default to false if unable to check
        setIsReduceMotionEnabled(false);
      }
    };

    checkReduceMotion();

    // Listen for changes to reduce motion setting
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReduceMotionEnabled);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Shared animation values
  const logoScale = useSharedValue(1);
  const logoOpacity = useSharedValue(1);
  const spotlight1Opacity = useSharedValue(0.3);
  const spotlight2Opacity = useSharedValue(0.5);
  const spotlight3Opacity = useSharedValue(0.2);
  const spotlight1Scale = useSharedValue(1);
  const spotlight2Scale = useSharedValue(1.2);
  const spotlight3Scale = useSharedValue(0.8);

  // Animation control methods
  const startAmbientAnimation = useCallback(() => {
    if (isReduceMotionEnabled) {
      // Simplified, static animations when reduce motion is enabled
      spotlight1Opacity.value = withTiming(0.5, { duration: 1000 });
      spotlight2Opacity.value = withTiming(0.6, { duration: 1000 });
      spotlight3Opacity.value = withTiming(0.4, { duration: 1000 });
      spotlight1Scale.value = withTiming(1.1, { duration: 1000 });
      spotlight2Scale.value = withTiming(1.2, { duration: 1000 });
      spotlight3Scale.value = withTiming(1.0, { duration: 1000 });
      return;
    }

    // Gentle ambient animations when not playing
    spotlight1Opacity.value = withRepeat(
      withTiming(0.8, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight2Opacity.value = withRepeat(
      withTiming(0.9, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight3Opacity.value = withRepeat(
      withTiming(0.6, {
        duration: 3500,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight1Scale.value = withRepeat(
      withTiming(1.3, {
        duration: 4500,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight2Scale.value = withRepeat(
      withTiming(1.6, {
        duration: 5000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight3Scale.value = withRepeat(
      withTiming(1.1, {
        duration: 3800,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );
  }, [spotlight1Opacity, spotlight2Opacity, spotlight3Opacity, spotlight1Scale, spotlight2Scale, spotlight3Scale, isReduceMotionEnabled]);

  const startPulseAnimation = useCallback(() => {
    if (isReduceMotionEnabled) {
      // Simplified, static playing state when reduce motion is enabled
      logoScale.value = withTiming(1.02, { duration: 500 });
      spotlight1Opacity.value = withTiming(0.7, { duration: 500 });
      spotlight2Opacity.value = withTiming(0.8, { duration: 500 });
      spotlight3Opacity.value = withTiming(0.6, { duration: 500 });
      spotlight1Scale.value = withTiming(1.3, { duration: 500 });
      spotlight2Scale.value = withTiming(1.4, { duration: 500 });
      spotlight3Scale.value = withTiming(1.2, { duration: 500 });
      return;
    }

    // More intense pulse animations when playing
    logoScale.value = withRepeat(
      withTiming(1.05, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight1Opacity.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight2Opacity.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight3Opacity.value = withRepeat(
      withTiming(0.8, {
        duration: 1300,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight1Scale.value = withRepeat(
      withTiming(1.8, {
        duration: 1400,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight2Scale.value = withRepeat(
      withTiming(2.2, {
        duration: 1600,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    spotlight3Scale.value = withRepeat(
      withTiming(1.5, {
        duration: 1100,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );
  }, [logoScale, spotlight1Opacity, spotlight2Opacity, spotlight3Opacity, spotlight1Scale, spotlight2Scale, spotlight3Scale, isReduceMotionEnabled]);

  const pauseAnimation = useCallback(() => {
    // Cancel all repeating animations
    cancelAnimation(logoScale);
    cancelAnimation(spotlight1Opacity);
    cancelAnimation(spotlight2Opacity);
    cancelAnimation(spotlight3Opacity);
    cancelAnimation(spotlight1Scale);
    cancelAnimation(spotlight2Scale);
    cancelAnimation(spotlight3Scale);

    // Return to default values with smooth transition
    logoScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    });
    spotlight1Opacity.value = withTiming(0.3, {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    });
    spotlight2Opacity.value = withTiming(0.5, {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    });
    spotlight3Opacity.value = withTiming(0.2, {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    });
    spotlight1Scale.value = withTiming(1, {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    });
    spotlight2Scale.value = withTiming(1.2, {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    });
    spotlight3Scale.value = withTiming(0.8, {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    });
  }, [logoScale, spotlight1Opacity, spotlight2Opacity, spotlight3Opacity, spotlight1Scale, spotlight2Scale, spotlight3Scale]);

  const resetAnimation = useCallback(() => {
    // Cancel all animations and reset to initial values immediately
    cancelAnimation(logoScale);
    cancelAnimation(logoOpacity);
    cancelAnimation(spotlight1Opacity);
    cancelAnimation(spotlight2Opacity);
    cancelAnimation(spotlight3Opacity);
    cancelAnimation(spotlight1Scale);
    cancelAnimation(spotlight2Scale);
    cancelAnimation(spotlight3Scale);

    logoScale.value = 1;
    logoOpacity.value = 1;
    spotlight1Opacity.value = 0.3;
    spotlight2Opacity.value = 0.5;
    spotlight3Opacity.value = 0.2;
    spotlight1Scale.value = 1;
    spotlight2Scale.value = 1.2;
    spotlight3Scale.value = 0.8;
  }, [logoScale, logoOpacity, spotlight1Opacity, spotlight2Opacity, spotlight3Opacity, spotlight1Scale, spotlight2Scale, spotlight3Scale]);

  // React to playback state changes
  useEffect(() => {
    if (isPlaying) {
      startPulseAnimation();
    } else {
      startAmbientAnimation();
    }
  }, [isPlaying, startPulseAnimation, startAmbientAnimation, isReduceMotionEnabled]);

  return {
    // Animation values
    logoScale,
    logoOpacity,
    spotlight1Opacity,
    spotlight2Opacity,
    spotlight3Opacity,
    spotlight1Scale,
    spotlight2Scale,
    spotlight3Scale,

    // Animation control methods
    startAmbientAnimation,
    startPulseAnimation,
    pauseAnimation,
    resetAnimation,

    // Playback state
    isPlaying,

    // Accessibility
    isReduceMotionEnabled,
  };
}