/**
 * Redux Store Configuration
 * Trend Ankara Mobile Application
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slice reducers
import playerReducer from './slices/playerSlice';
import settingsReducer from './slices/settingsSlice';
import pollsReducer from './slices/pollsSlice';
import newsReducer from './slices/newsSlice';

// Root reducer combining all slices
const rootReducer = combineReducers({
  player: playerReducer,
  settings: settingsReducer,
  polls: pollsReducer,
  news: newsReducer,
});

// Persist configuration
const persistConfig: PersistConfig<RootState> = {
  key: 'trendankara-mobile',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['settings'], // Only persist settings by default
  blacklist: ['player'], // Don't persist player state (should reset on app restart)
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with Redux Toolkit
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for persist actions
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
        // Ignore these field paths in state
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
      immutableCheck: {
        // Increase threshold for better performance
        warnAfter: 128,
      },
    }).concat(
      // Add any additional middleware here
    ),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks - Note: hooks will be imported from here
// export { useAppDispatch, useAppSelector } from './hooks';

/**
 * Store Configuration Summary:
 *
 * Features:
 * - Redux Toolkit for modern Redux patterns
 * - Redux Persist for state persistence
 * - AsyncStorage for React Native storage
 * - TypeScript support with typed hooks
 * - Development tools integration
 *
 * Slices:
 * - player: Audio player state (not persisted)
 * - settings: App settings (persisted)
 * - polls: Voting polls state
 * - news: News articles state
 *
 * Persistence:
 * - Only settings are persisted by default
 * - Player state resets on app restart
 * - Version 1 for migration compatibility
 */