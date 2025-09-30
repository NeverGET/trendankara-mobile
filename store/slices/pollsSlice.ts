/**
 * Polls Slice
 * Redux state management for voting polls
 * Trend Ankara Mobile Application
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Poll, PollOption, VoteRequest, VoteResponse } from '@/types/models';

// Polls state
interface PollsState {
  polls: Poll[];
  isLoading: boolean;
  isVoting: { [pollId: number]: boolean };
  error: string | null;
  lastFetched: number | null;
  totalVotes: number;
  userVotingHistory: number[]; // Poll IDs user has voted on
  activePolls: Poll[];
  completedPolls: Poll[];
}

// Initial state
const initialState: PollsState = {
  polls: [],
  isLoading: false,
  isVoting: {},
  error: null,
  lastFetched: null,
  totalVotes: 0,
  userVotingHistory: [],
  activePolls: [],
  completedPolls: [],
};

// Mock data for development
const mockPolls: Poll[] = [
  {
    id: 1,
    question: "En sevdiğiniz müzik türü hangisi?",
    description: "Trend Ankara'da çalmak istediğiniz müzik türünü seçin!",
    options: [
      { id: 1, text: "Pop", voteCount: 45, percentage: 37.5 },
      { id: 2, text: "Rock", voteCount: 30, percentage: 25.0 },
      { id: 3, text: "Türkçe Pop", voteCount: 35, percentage: 29.2 },
      { id: 4, text: "Elektronik", voteCount: 10, percentage: 8.3 },
    ],
    isActive: true,
    startDate: "2025-09-28T00:00:00Z",
    endDate: "2025-10-05T23:59:59Z",
    totalVotes: 120,
    userHasVoted: false,
    createdAt: "2025-09-28T00:00:00Z",
  },
  {
    id: 2,
    question: "Hangi saatte radyo dinlemeyi tercih edersiniz?",
    description: null,
    options: [
      { id: 5, text: "Sabah (06:00-12:00)", voteCount: 25, percentage: 31.3 },
      { id: 6, text: "Öğle (12:00-18:00)", voteCount: 20, percentage: 25.0 },
      { id: 7, text: "Akşam (18:00-24:00)", voteCount: 30, percentage: 37.5 },
      { id: 8, text: "Gece (00:00-06:00)", voteCount: 5, percentage: 6.3 },
    ],
    isActive: true,
    startDate: "2025-09-27T00:00:00Z",
    endDate: null,
    totalVotes: 80,
    userHasVoted: false,
    createdAt: "2025-09-27T00:00:00Z",
  },
];

// Async thunks
export const fetchPolls = createAsyncThunk(
  'polls/fetchPolls',
  async (params: { forceRefresh?: boolean } = {}, { rejectWithValue }) => {
    try {
      console.log('Fetching polls...', params);

      // For development, use mock data
      if (__DEV__) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
          polls: mockPolls,
          timestamp: Date.now(),
        };
      }

      // In production, this would call the actual API
      // const response = await api.get('/polls');
      // return response.data;

      throw new Error('API not implemented');
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch polls',
        timestamp: Date.now(),
      });
    }
  }
);

export const submitVote = createAsyncThunk(
  'polls/submitVote',
  async (
    params: { pollId: number; optionId: number },
    { getState, rejectWithValue }
  ) => {
    try {
      const { pollId, optionId } = params;
      console.log('Submitting vote:', { pollId, optionId });

      // Simulate device ID generation
      const deviceId = 'mock-device-id-123';

      // For development, simulate vote submission
      if (__DEV__) {
        await new Promise(resolve => setTimeout(resolve, 300));

        // Find the poll and option
        const state = getState() as { polls: PollsState };
        const poll = state.polls.polls.find(p => p.id === pollId);
        const option = poll?.options.find(o => o.id === optionId);

        if (!poll || !option) {
          throw new Error('Poll or option not found');
        }

        // Create updated poll with new vote
        const updatedOptions = poll.options.map(opt =>
          opt.id === optionId
            ? { ...opt, voteCount: opt.voteCount + 1 }
            : opt
        );

        const totalVotes = updatedOptions.reduce((sum, opt) => sum + opt.voteCount, 0);

        const updatedPoll: Poll = {
          ...poll,
          options: updatedOptions.map(opt => ({
            ...opt,
            percentage: (opt.voteCount / totalVotes) * 100,
          })),
          totalVotes,
          userHasVoted: true,
        };

        return {
          pollId,
          optionId,
          updatedPoll,
          timestamp: Date.now(),
        };
      }

      // In production, call actual API
      // const response = await api.post('/polls/vote', { pollId, optionId, deviceId });
      // return response.data;

      throw new Error('API not implemented');
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to submit vote',
        timestamp: Date.now(),
      });
    }
  }
);

export const refreshPolls = createAsyncThunk(
  'polls/refreshPolls',
  async (_, { dispatch }) => {
    // Force refresh by calling fetchPolls with forceRefresh flag
    return dispatch(fetchPolls({ forceRefresh: true }));
  }
);

// Polls slice
const pollsSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    // Local state updates
    clearError: (state) => {
      state.error = null;
    },

    markPollAsVoted: (state, action: PayloadAction<number>) => {
      const pollId = action.payload;
      const poll = state.polls.find(p => p.id === pollId);
      if (poll) {
        poll.userHasVoted = true;
        if (!state.userVotingHistory.includes(pollId)) {
          state.userVotingHistory.push(pollId);
        }
      }
    },

    updatePollResults: (state, action: PayloadAction<Poll>) => {
      const updatedPoll = action.payload;
      const index = state.polls.findIndex(p => p.id === updatedPoll.id);
      if (index !== -1) {
        state.polls[index] = updatedPoll;
        pollsSlice.caseReducers.updateDerivedState(state);
      }
    },

    updateDerivedState: (state) => {
      // Update active and completed polls
      const now = new Date().toISOString();
      state.activePolls = state.polls.filter(poll => {
        if (!poll.isActive) return false;
        if (poll.endDate && poll.endDate < now) return false;
        return true;
      });

      state.completedPolls = state.polls.filter(poll => {
        if (!poll.isActive) return true;
        if (poll.endDate && poll.endDate < now) return true;
        return false;
      });

      // Update total votes
      state.totalVotes = state.polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
    },

    // Reset voting state for a poll (for retry scenarios)
    resetVotingState: (state, action: PayloadAction<number>) => {
      const pollId = action.payload;
      delete state.isVoting[pollId];
    },

    // Add new poll (for real-time updates)
    addPoll: (state, action: PayloadAction<Poll>) => {
      const newPoll = action.payload;
      const existingIndex = state.polls.findIndex(p => p.id === newPoll.id);

      if (existingIndex === -1) {
        state.polls.unshift(newPoll); // Add to beginning
      } else {
        state.polls[existingIndex] = newPoll; // Update existing
      }

      pollsSlice.caseReducers.updateDerivedState(state);
    },

    // Remove poll
    removePoll: (state, action: PayloadAction<number>) => {
      const pollId = action.payload;
      state.polls = state.polls.filter(p => p.id !== pollId);
      delete state.isVoting[pollId];
      state.userVotingHistory = state.userVotingHistory.filter(id => id !== pollId);

      pollsSlice.caseReducers.updateDerivedState(state);
    },

    // Sort polls by different criteria
    sortPolls: (state, action: PayloadAction<'newest' | 'oldest' | 'mostVotes' | 'active'>) => {
      const sortBy = action.payload;

      switch (sortBy) {
        case 'newest':
          state.polls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          state.polls.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'mostVotes':
          state.polls.sort((a, b) => b.totalVotes - a.totalVotes);
          break;
        case 'active':
          state.polls.sort((a, b) => {
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          break;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch polls
    builder
      .addCase(fetchPolls.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPolls.fulfilled, (state, action) => {
        state.isLoading = false;
        state.polls = action.payload.polls;
        state.lastFetched = action.payload.timestamp;
        state.error = null;

        // Update derived state
        pollsSlice.caseReducers.updateDerivedState(state);
      })
      .addCase(fetchPolls.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch polls';
      });

    // Submit vote
    builder
      .addCase(submitVote.pending, (state, action) => {
        const pollId = action.meta.arg.pollId;
        state.isVoting[pollId] = true;
        state.error = null;
      })
      .addCase(submitVote.fulfilled, (state, action) => {
        const { pollId, updatedPoll } = action.payload;

        // Update voting state
        state.isVoting[pollId] = false;

        // Update poll data
        const index = state.polls.findIndex(p => p.id === pollId);
        if (index !== -1) {
          state.polls[index] = updatedPoll;
        }

        // Update voting history
        if (!state.userVotingHistory.includes(pollId)) {
          state.userVotingHistory.push(pollId);
        }

        // Update derived state
        pollsSlice.caseReducers.updateDerivedState(state);

        state.error = null;
      })
      .addCase(submitVote.rejected, (state, action) => {
        const pollId = action.meta.arg.pollId;
        state.isVoting[pollId] = false;
        state.error = action.payload?.message || 'Failed to submit vote';
      });
  },
});

// Export actions
export const {
  clearError,
  markPollAsVoted,
  updatePollResults,
  updateDerivedState,
  resetVotingState,
  addPoll,
  removePoll,
  sortPolls,
} = pollsSlice.actions;

// Selectors
export const selectPolls = (state: { polls: PollsState }) => state.polls.polls;
export const selectActivePolls = (state: { polls: PollsState }) => state.polls.activePolls;
export const selectCompletedPolls = (state: { polls: PollsState }) => state.polls.completedPolls;
export const selectPollsLoading = (state: { polls: PollsState }) => state.polls.isLoading;
export const selectPollsError = (state: { polls: PollsState }) => state.polls.error;
export const selectTotalVotes = (state: { polls: PollsState }) => state.polls.totalVotes;
export const selectUserVotingHistory = (state: { polls: PollsState }) => state.polls.userVotingHistory;
export const selectPollById = (pollId: number) => (state: { polls: PollsState }) =>
  state.polls.polls.find(poll => poll.id === pollId);
export const selectIsVoting = (pollId: number) => (state: { polls: PollsState }) =>
  state.polls.isVoting[pollId] || false;

// Export reducer
export default pollsSlice.reducer;

/**
 * Polls Slice Features:
 *
 * State Management:
 * - Active and completed polls separation
 * - User voting history tracking
 * - Real-time vote count updates
 * - Individual poll voting states
 *
 * Async Operations:
 * - fetchPolls: Load polls from API
 * - submitVote: Submit user votes
 * - refreshPolls: Force refresh data
 *
 * Local Operations:
 * - Poll sorting and filtering
 * - Vote state management
 * - Real-time poll updates
 * - Error handling and recovery
 *
 * Features:
 * - Mock data for development
 * - Optimistic vote updates
 * - Vote percentage calculations
 * - Poll lifecycle management
 * - Offline vote queuing (future)
 */