/**
 * PollCard Component
 * Display poll question and options with voting functionality
 */

import React, { useState } from 'react';
import { useMountedState } from '@/hooks/useMountedState';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import type { Poll } from '@/types/models';
import { PollOption } from './PollOption';
import { PollResults } from './PollResults';
import { VoteButton } from './VoteButton';

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: number, optionId: number) => Promise<void>;
  showResults?: boolean;
  votedOptionId?: number;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  onVote,
  showResults = false,
  votedOptionId,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { setStateIfMounted, signal } = useMountedState();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(poll.userHasVoted || showResults);

  const handleOptionSelect = (optionId: number) => {
    if (hasVoted) return;
    setSelectedOption(optionId);
  };

  const handleVote = async () => {
    if (!selectedOption || !onVote) return;

    try {
      setStateIfMounted(() => setIsVoting(true));
      await onVote(poll.id, selectedOption);
      setStateIfMounted(() => {
        setHasVoted(true);
        setIsVoting(false);
      });
      Alert.alert('Başarılı', 'Oyunuz kaydedildi!');
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Vote error:', error);
        Alert.alert('Hata', 'Oy verirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
      setStateIfMounted(() => setIsVoting(false));
    }
  };

  const isActive = poll.isActive && (!poll.endDate || new Date(poll.endDate) > new Date());

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Poll Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons
            name="bar-chart-outline"
            size={20}
            color={colors.tint}
            style={styles.headerIcon}
          />
          <Text style={[styles.pollLabel, { color: colors.tint }]}>
            ANKET
          </Text>
        </View>
        {!isActive && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Sona Erdi</Text>
          </View>
        )}
      </View>

      {/* Poll Question */}
      <Text style={[styles.question, { color: colors.text }]}>
        {poll.question}
      </Text>

      {/* Poll Description */}
      {poll.description && (
        <Text style={[styles.description, { color: colors.icon }]}>
          {poll.description}
        </Text>
      )}

      {/* Poll Content */}
      {hasVoted || !isActive ? (
        <PollResults poll={poll} userVotedOptionId={votedOptionId} />
      ) : (
        <View style={styles.optionsContainer}>
          {(poll.options || []).map((option) => (
            <PollOption
              key={option.id}
              option={option}
              isSelected={selectedOption === option.id}
              onSelect={() => handleOptionSelect(option.id)}
              showResults={false}
            />
          ))}
        </View>
      )}

      {/* Vote Button */}
      {!hasVoted && isActive && (
        <VoteButton
          disabled={!selectedOption}
          isLoading={isVoting}
          onPress={handleVote}
        />
      )}

      {/* Poll Footer */}
      <View style={styles.footer}>
        <View style={styles.voteCount}>
          <Ionicons
            name="people-outline"
            size={16}
            color={colors.icon}
          />
          <Text style={[styles.voteCountText, { color: colors.icon }]}>
            {poll.totalVotes} oy
          </Text>
        </View>
        {poll.endDate && (
          <Text style={[styles.endDate, { color: colors.icon }]}>
            Bitiş: {new Date(poll.endDate).toLocaleDateString('tr-TR')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    margin: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 6,
  },
  pollLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: BrandColors.gray400,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: BrandColors.tertiary,
    fontSize: 10,
    fontWeight: '500',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
  },
  voteCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCountText: {
    fontSize: 12,
    marginLeft: 4,
  },
  endDate: {
    fontSize: 12,
  },
});