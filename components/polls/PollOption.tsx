/**
 * PollOption Component
 * Display individual poll option with selection state and results
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import type { PollOption as PollOptionType } from '@/types/models';
import { getImageSource, getPlaceholderImage } from '@/utils/imageProxy';

interface PollOptionProps {
  option: PollOptionType;
  isSelected?: boolean;
  onSelect?: () => void;
  showResults?: boolean;
  totalVotes?: number;
  isUserChoice?: boolean;
}

export const PollOption: React.FC<PollOptionProps> = ({
  option,
  isSelected = false,
  onSelect,
  showResults = false,
  totalVotes = 0,
  isUserChoice = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showResults) {
      Animated.timing(progressAnimation, {
        toValue: option.percentage / 100,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [showResults, option.percentage, progressAnimation]);

  const handlePress = () => {
    if (!showResults && onSelect) {
      onSelect();
    }
  };

  const getOptionIcon = () => {
    if (showResults) {
      if (isUserChoice) {
        return 'checkmark-circle';
      }
      return 'bar-chart-outline';
    }
    return isSelected ? 'radio-button-on' : 'radio-button-off';
  };

  const getOptionIconColor = () => {
    if (showResults) {
      if (isUserChoice) {
        return BrandColors.success;
      }
      return colors.tint;
    }
    return isSelected ? colors.tint : colors.icon;
  };

  const getContainerStyle = () => {
    const baseStyle = [
      styles.container,
      {
        backgroundColor: showResults ? colors.surface : colors.card,
        borderColor: isSelected ? colors.tint : colors.border,
      }
    ];

    if (isSelected && !showResults) {
      baseStyle.push({
        borderWidth: 2,
        backgroundColor: colors.tint + '10', // 10% opacity
      });
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={handlePress}
      disabled={showResults}
      activeOpacity={0.7}
    >
      {/* Progress Bar (only in results mode) */}
      {showResults && (
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: isUserChoice
                ? BrandColors.success + '20'
                : colors.tint + '10',
              width: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      )}

      {/* Option Content */}
      <View style={styles.content}>
        {/* Option Image (if available) */}
        {option.imageUrl && (() => {
          const imageSource = getImageSource(option.imageUrl);
          console.log('🎨 PollOption rendering image:', {
            optionId: option.id,
            optionText: option.text,
            originalUrl: option.imageUrl,
            imageSource
          });
          return (
            <View style={styles.imageContainer}>
              <Image
                source={imageSource}
                style={styles.optionImage}
                contentFit="cover"
                transition={200}
                placeholder={{ uri: getPlaceholderImage() }}
                onError={(error) => {
                  console.error('❌ Image load error for option:', option.text, error);
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully for option:', option.text);
                }}
              />
            </View>
          );
        })()}

        <View style={styles.optionInfo}>
          <Ionicons
            name={getOptionIcon()}
            size={20}
            color={getOptionIconColor()}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.optionText,
                { color: colors.text },
                isUserChoice && styles.boldText,
              ]}
            >
              {option.text}
            </Text>
            {/* Option Description (if available) */}
            {option.description && (
              <Text
                style={[styles.optionDescription, { color: colors.icon }]}
                numberOfLines={1}
              >
                {option.description}
              </Text>
            )}
          </View>
        </View>

        {/* Results Info */}
        {showResults && (
          <View style={styles.resultsInfo}>
            <Text style={[styles.percentage, { color: colors.text }]}>
              {option.percentage.toFixed(1)}%
            </Text>
            <Text style={[styles.voteCount, { color: colors.icon }]}>
              {option.voteCount} oy
            </Text>
          </View>
        )}
      </View>

      {/* User Choice Indicator */}
      {showResults && isUserChoice && (
        <View style={styles.choiceIndicator}>
          <Ionicons
            name="checkmark"
            size={12}
            color={BrandColors.tertiary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    zIndex: 0,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    zIndex: 1,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  optionImage: {
    width: '100%',
    height: '100%',
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    lineHeight: 20,
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  boldText: {
    fontWeight: '600',
  },
  resultsInfo: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  percentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  voteCount: {
    fontSize: 12,
    marginTop: 2,
  },
  choiceIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: BrandColors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});