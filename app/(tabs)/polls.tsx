import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  View,
  Alert,
  Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { PollCard } from '@/components/polls/PollCard';
import { EmptyState } from '@/components/common/EmptyState';
import { createScreenStyles } from '@/constants/screenStyles';
import { Colors } from '@/constants/theme';
import { usePolls } from '@/hooks/usePolls';
import type { Poll } from '@/types/models';

export default function PollsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenStyles = createScreenStyles(colorScheme ?? 'light');
  const [refreshing, setRefreshing] = useState(false);
  const { polls, loading, error, refreshPolls, submitVote, votedOption } = usePolls();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPolls();
    setRefreshing(false);
  };

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      const success = await submitVote(pollId, optionId);
      if (success) {
        Alert.alert('Başarılı', 'Oyunuz kaydedildi!');
      }
    } catch (err) {
      Alert.alert('Hata', 'Oy kullanılırken bir hata oluştu');
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
        <View style={screenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Anketler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
        <View style={screenStyles.emptyContainer}>
          <Text style={[screenStyles.pageTitle, { textAlign: 'center' }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
      {/* Header - Always visible */}
      <View style={screenStyles.headerContainer}>
        <Text style={screenStyles.pageTitle}>Anketler</Text>
        <Text style={screenStyles.pageSubtitle}>Fikriniz bizim için önemli</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={screenStyles.scrollView}
        contentContainerStyle={(!polls || polls.length === 0) ? screenStyles.emptyContainer : styles.pollsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!polls || polls.length === 0 ? (
          <EmptyState
            message="Aktif anket bulunmamaktadır"
            icon="bar-chart-outline"
            subtitle="Yeni anketler yakında eklenecek!"
          />
        ) : (
          polls.map((poll: Poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={(optionId) => handleVote(poll.id, optionId)}
              votedOptionId={votedOption(poll.id) || undefined}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pollsList: {
    gap: 16,
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    opacity: 0.6,
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    opacity: 0.6,
    textAlign: 'center',
    fontSize: 14,
  },
});