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
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import type { PollOption as PollOptionType } from '@/types/models';

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
        <View style={styles.optionInfo}>
          <Ionicons
            name={getOptionIcon()}
            size={20}
            color={getOptionIconColor()}
            style={styles.icon}
          />
          <Text
            style={[
              styles.optionText,
              { color: colors.text },
              isUserChoice && styles.boldText,
            ]}
          >
            {option.text}
          </Text>
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
  icon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 20,
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