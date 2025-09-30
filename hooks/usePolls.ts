/**
 * usePolls Hook
 * Manage polls state and voting logic
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import type { Poll } from '@/types/models';
import { pollsService } from '@/services/api/polls';

interface UsePollsState {
  polls: Poll[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasVoted: (pollId: number) => boolean;
  votedOption: (pollId: number) => number | null;
}

interface UsePollsActions {
  loadPolls: (forceRefresh?: boolean) => Promise<void>;
  submitVote: (pollId: number, optionId: number) => Promise<boolean>;
  refreshPolls: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const DEVICE_ID_KEY = '@polls_device_id';
const VOTED_POLLS_KEY = '@voted_polls';

export const usePolls = (): UsePollsState & UsePollsActions => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Record<number, number>>({});
  const [deviceId, setDeviceId] = useState<string>('');

  // Initialize device ID and load voted polls
  useEffect(() => {
    initializeData();
  }, []);

  // Load polls on mount
  useEffect(() => {
    loadPolls();
  }, []);

  const initializeData = async () => {
    try {
      // Get or create device ID
      let storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!storedDeviceId) {
        // Create a unique device ID
        const deviceName = Device.deviceName || 'Unknown';
        const timestamp = Date.now();
        storedDeviceId = `${deviceName}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
      }
      setDeviceId(storedDeviceId);

      // Load voted polls from storage
      const storedVotedPolls = await AsyncStorage.getItem(VOTED_POLLS_KEY);
      if (storedVotedPolls) {
        setVotedPolls(JSON.parse(storedVotedPolls));
      }
    } catch (error) {
      console.error('Error initializing polls data:', error);
    }
  };

  const loadPolls = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      let pollsData = await pollsService.getCurrentPolls(!forceRefresh);

      // Ensure pollsData is an array before mapping
      if (Array.isArray(pollsData)) {
        // Update polls with local vote status
        const updatedPolls = pollsData.map(poll => ({
          ...poll,
          userHasVoted: !!votedPolls[poll.id],
        }));

        setPolls(updatedPolls);
      } else {
        console.warn('Polls data is not an array, forcing fresh data:', pollsData);
        // If cached data is invalid, force fresh data
        try {
          pollsData = await pollsService.getCurrentPolls(true);
          if (Array.isArray(pollsData)) {
            const updatedPolls = pollsData.map(poll => ({
              ...poll,
              userHasVoted: !!votedPolls[poll.id],
            }));
            setPolls(updatedPolls);
          } else {
            setPolls([]);
          }
        } catch (retryError) {
          console.error('Failed to load polls even with fresh data:', retryError);
          setPolls([]);
        }
      }
    } catch (err) {
      console.error('Error loading polls:', err);
      setError('Anketler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, votedPolls]);

  const refreshPolls = useCallback(async () => {
    setRefreshing(true);
    await loadPolls(true);
  }, [loadPolls]);

  const submitVote = useCallback(async (pollId: number, optionId: number): Promise<boolean> => {
    try {
      // Check if already voted
      if (votedPolls[pollId]) {
        Alert.alert('Bilgi', 'Bu ankete zaten oy verdiniz');
        return false;
      }

      // Submit vote to API
      const response = await pollsService.submitVote(pollId, optionId);

      if (response.success) {
        // Store vote locally
        const newVotedPolls = { ...votedPolls, [pollId]: optionId };
        setVotedPolls(newVotedPolls);
        await AsyncStorage.setItem(VOTED_POLLS_KEY, JSON.stringify(newVotedPolls));

        // Store vote in service cache as well
        await pollsService.storeVoteLocally(pollId, optionId);

        // Update polls state if we have updated poll data
        if (response.updatedPoll) {
          setPolls(currentPolls =>
            currentPolls.map(poll =>
              poll.id === pollId
                ? { ...response.updatedPoll!, userHasVoted: true }
                : poll
            )
          );
        } else {
          // Reload polls to get updated data
          await loadPolls(true);
        }

        return true;
      } else {
        Alert.alert('Hata', response.message || 'Oy verirken bir hata oluştu');
        return false;
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      Alert.alert('Hata', 'Oy verirken bir hata oluştu. Lütfen tekrar deneyin.');
      return false;
    }
  }, [votedPolls, loadPolls]);

  const hasVoted = useCallback((pollId: number): boolean => {
    return !!votedPolls[pollId];
  }, [votedPolls]);

  const votedOption = useCallback((pollId: number): number | null => {
    return votedPolls[pollId] || null;
  }, [votedPolls]);

  const clearCache = useCallback(async () => {
    try {
      await pollsService.clearCache();
      await AsyncStorage.removeItem(VOTED_POLLS_KEY);
      setVotedPolls({});
      await loadPolls(true);
    } catch (error) {
      console.error('Error clearing polls cache:', error);
    }
  }, [loadPolls]);

  return {
    // State
    polls,
    loading,
    refreshing,
    error,
    hasVoted,
    votedOption,

    // Actions
    loadPolls,
    submitVote,
    refreshPolls,
    clearCache,
  };
};

/**
 * Hook for a specific poll
 */
export const usePoll = (pollId: number) => {
  const { polls, loading, error, hasVoted, votedOption, submitVote } = usePolls();

  const poll = polls.find(p => p.id === pollId);
  const userHasVoted = hasVoted(pollId);
  const userVotedOption = votedOption(pollId);

  return {
    poll,
    loading,
    error,
    userHasVoted,
    userVotedOption,
    submitVote: (optionId: number) => submitVote(pollId, optionId),
  };
};

/**
 * Hook for active polls only
 */
export const useActivePolls = () => {
  const { polls, ...rest } = usePolls();

  const activePolls = polls.filter(poll =>
    poll.isActive && (!poll.endDate || new Date(poll.endDate) > new Date())
  );

  return {
    polls: activePolls,
    activePollsCount: activePolls.length,
    totalPollsCount: polls.length,
    ...rest,
  };
};