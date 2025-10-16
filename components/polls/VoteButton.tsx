/**
 * VoteButton Component
 * Handle vote submission with loading and feedback states
 */

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface VoteButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  showSuccess?: boolean;
  showError?: boolean;
  errorMessage?: string;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  onPress,
  disabled = false,
  isLoading = false,
  showSuccess = false,
  showError = false,
  errorMessage,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  const errorShakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSuccess) {
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSuccess, successAnimation]);

  useEffect(() => {
    if (showError) {
      // Shake animation for error
      Animated.sequence([
        Animated.timing(errorShakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(errorShakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(errorShakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(errorShakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showError, errorShakeAnimation]);

  const handlePressIn = () => {
    if (!disabled && !isLoading) {
      Animated.spring(scaleAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !isLoading) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = async () => {
    if (disabled || isLoading) return;

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    onPress();
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    if (disabled) {
      baseStyle.push({
        backgroundColor: colors.border,
      });
    } else if (showError) {
      baseStyle.push({
        backgroundColor: BrandColors.error,
      });
    } else if (showSuccess) {
      baseStyle.push({
        backgroundColor: BrandColors.success,
      });
    } else {
      baseStyle.push({
        backgroundColor: BrandColors.primary, // Use brand red instead of colors.tint (white in dark mode)
      });
    }

    return baseStyle;
  };

  const getButtonText = () => {
    if (isLoading) return 'Oy Veriliyor...';
    if (showSuccess) return 'Oy Verildi!';
    if (showError) return 'Tekrar Dene';
    return 'Oy Ver';
  };

  const getButtonIcon = () => {
    if (isLoading) return null;
    if (showSuccess) return 'checkmark-circle';
    if (showError) return 'refresh';
    return 'send';
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.icon;
    }
    // Always use white text for active buttons (red/green/error backgrounds)
    return '#FFFFFF';
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnimation },
            { translateX: errorShakeAnimation },
          ],
        }}
      >
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={getTextColor()}
                style={styles.loader}
              />
            ) : (
              getButtonIcon() && (
                <Ionicons
                  name={getButtonIcon()}
                  size={18}
                  color={getTextColor()}
                  style={styles.icon}
                />
              )
            )}
            <Text style={[styles.buttonText, { color: getTextColor() }]}>
              {getButtonText()}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Success Overlay */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.overlay,
            styles.successOverlay,
            {
              opacity: successAnimation,
              transform: [
                {
                  scale: successAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={BrandColors.tertiary}
          />
          <Text style={styles.overlayText}>Başarılı!</Text>
        </Animated.View>
      )}

      {/* Error Message */}
      {showError && errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: BrandColors.error }]}>
            {errorMessage}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  loader: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  successOverlay: {
    backgroundColor: BrandColors.success,
  },
  overlayText: {
    color: BrandColors.tertiary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
  },
});