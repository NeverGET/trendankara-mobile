/**
 * PollResults Component
 * Display poll results with animated progress bars
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import type { Poll } from '@/types/models';
import { PollOption } from './PollOption';

interface PollResultsProps {
  poll: Poll;
  userVotedOptionId?: number;
}

export const PollResults: React.FC<PollResultsProps> = ({
  poll,
  userVotedOptionId,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnimation]);

  // Sort options by percentage (highest first)
  const sortedOptions = [...(poll.options || [])].sort((a, b) => b.percentage - a.percentage);

  // Find the winning option(s)
  const maxPercentage = sortedOptions[0]?.percentage || 0;
  const winningOptions = sortedOptions.filter(option => option.percentage === maxPercentage);

  const getOptionRank = (percentage: number) => {
    if (percentage === maxPercentage && maxPercentage > 0) {
      return 'winner';
    }
    return 'normal';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnimation,
        },
      ]}
    >
      {/* Results Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons
            name="bar-chart"
            size={18}
            color={colors.tint}
            style={styles.headerIcon}
          />
          <Text style={[styles.resultsLabel, { color: colors.tint }]}>
            SONUÇLAR
          </Text>
        </View>
        <View style={[styles.totalVotes, { backgroundColor: colors.surface }]}>
          <Text style={[styles.totalVotesText, { color: colors.text }]}>
            Toplam {poll.totalVotes} oy
          </Text>
        </View>
      </View>

      {/* Options with Results */}
      <View style={styles.optionsContainer}>
        {sortedOptions.map((option, index) => {
          const isUserChoice = userVotedOptionId === option.id;
          const rank = getOptionRank(option.percentage);

          return (
            <View key={option.id} style={styles.optionContainer}>
              {/* Rank Badge for Winner */}
              {rank === 'winner' && winningOptions.length === 1 && (
                <View style={styles.winnerBadge}>
                  <Ionicons
                    name="trophy"
                    size={12}
                    color={BrandColors.warning}
                  />
                  <Text style={styles.winnerText}>En Çok Oy</Text>
                </View>
              )}

              <PollOption
                option={option}
                showResults={true}
                totalVotes={poll.totalVotes}
                isUserChoice={isUserChoice}
              />

              {/* Position Indicator */}
              <View style={styles.positionContainer}>
                <Text style={[styles.positionText, { color: colors.icon }]}>
                  #{index + 1}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Results Summary */}
      <View style={styles.summary}>
        {poll.userHasVoted && userVotedOptionId && (
          <View style={styles.userVoteInfo}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={BrandColors.success}
            />
            <Text style={[styles.userVoteText, { color: BrandColors.success }]}>
              Oyunuz kaydedildi
            </Text>
          </View>
        )}

        {winningOptions.length > 1 && (
          <View style={styles.tieInfo}>
            <Ionicons
              name="git-compare"
              size={16}
              color={colors.icon}
            />
            <Text style={[styles.tieText, { color: colors.icon }]}>
              {winningOptions.length} seçenek berabere
            </Text>
          </View>
        )}
      </View>

      {/* Vote Distribution Chart */}
      {poll.totalVotes > 0 && (
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Oy Dağılımı
          </Text>
          <View style={styles.chart}>
            {sortedOptions.map((option, index) => (
              <View
                key={option.id}
                style={[
                  styles.chartBar,
                  {
                    backgroundColor: index === 0 ? colors.tint : colors.border,
                    width: `${(option.voteCount / poll.totalVotes) * 100}%`,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 6,
  },
  resultsLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  totalVotes: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalVotesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  winnerBadge: {
    position: 'absolute',
    top: -8,
    left: 8,
    backgroundColor: BrandColors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 3,
  },
  winnerText: {
    color: BrandColors.tertiary,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  positionContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
  },
  positionText: {
    fontSize: 10,
    fontWeight: '500',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userVoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userVoteText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  tieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tieText: {
    fontSize: 12,
    marginLeft: 4,
  },
  chartContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  chart: {
    height: 8,
    backgroundColor: BrandColors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  chartBar: {
    height: '100%',
    minWidth: 2,
  },
});