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
  const { polls, loading, error, refetch, votePoll } = usePolls();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      await votePoll(pollId, optionId);
      Alert.alert('Başarılı', 'Oyunuz kaydedildi!');
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

  if (!polls || polls.length === 0) {
    return (
      <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          style={screenStyles.scrollView}
          contentContainerStyle={screenStyles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <EmptyState
            message="Aktif anket bulunmamaktadır"
            icon="bar-chart-outline"
            subtitle="Yeni anketler yakında eklenecek!"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.container}>
      <ScrollView
        style={screenStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={screenStyles.headerContainer}>
          <Text style={screenStyles.pageTitle}>Anketler</Text>
          <Text style={screenStyles.pageSubtitle}>Fikriniz bizim için önemli</Text>
        </View>

        <View style={[screenStyles.listContainer, styles.pollsList]}>
          {polls.map((poll: Poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={(optionId) => handleVote(poll.id, optionId)}
            />
          ))}
        </View>
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