import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors } from '@/constants/theme';
import { useAudio } from '@/hooks/useAudio';
import type { SymbolViewProps } from 'expo-symbols';
import type { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

interface AnimatedTabIconProps {
  name: SymbolViewProps['name'];
  color: string | OpaqueColorValue;
  size?: number;
  style?: StyleProp<TextStyle>;
  focused: boolean;
}

export function AnimatedTabIcon({
  name,
  color,
  size = 28,
  style,
  focused,
}: AnimatedTabIconProps) {
  const { isPlaying } = useAudio();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const [isMounted, setIsMounted] = React.useState(false);

  // Ensure component is mounted before animations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scale animation when focused
  useEffect(() => {
    if (!isMounted) return;
    scale.value = withSpring(focused ? 1.2 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [focused, scale, isMounted]);

  // Pulse animation when playing
  useEffect(() => {
    if (!isMounted) return;
    if (isPlaying) {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying, pulseScale, isMounted]);

  const animatedStyle = useAnimatedStyle(() => {
    const combinedScale = scale.value * pulseScale.value;
    return {
      transform: [{ scale: combinedScale }],
    };
  });

  const pulseIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pulseScale.value,
      [1, 1.1],
      [0.6, 1]
    );
    return {
      opacity: isPlaying ? opacity : 0,
      transform: [{ scale: pulseScale.value }],
    };
  });

  return (
    <View style={{ position: 'relative' }}>
      <Animated.View style={animatedStyle}>
        <IconSymbol
          name={name}
          color={color}
          size={size}
          style={style}
        />
      </Animated.View>

      {/* Pulse indicator dot for active playback */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: BrandColors.primary, // Use brand red color
          },
          pulseIndicatorStyle,
        ]}
      />
    </View>
  );
}