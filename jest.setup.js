// Basic Jest setup for testing
// require('react-native-gesture-handler/jestSetup');
// require('@testing-library/jest-native/extend-expect');

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () =>
  require('react-native-gesture-handler/jestSetup')
);

// Mock React Native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios', // Default to iOS for testing
    select: jest.fn((platforms) => platforms.ios || platforms.default),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812, scale: 1, fontScale: 1 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  InteractionManager: {
    runAfterInteractions: jest.fn((callback) => {
      callback();
      return { cancel: jest.fn() };
    }),
  },
}));

// Mock expo-audio (replaced expo-av)
jest.mock('expo-audio', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn(),
    },
    INTERRUPTION_MODE_IOS_DO_NOT_MIX: 'doNotMix',
    INTERRUPTION_MODE_IOS_DUCK_OTHERS: 'duckOthers',
    INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS: 'mixWithOthers',
    INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 'doNotMix',
    INTERRUPTION_MODE_ANDROID_DUCK_OTHERS: 'duckOthers',
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  dismissAllNotificationsAsync: jest.fn(),
}));

// Mock expo-task-manager
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  unregisterTaskAsync: jest.fn(),
}));

// Mock additional expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
    name: 'TrendAnkara',
  },
}));

jest.mock('expo-device', () => ({
  brand: 'Apple',
  modelName: 'iPhone',
  osName: 'iOS',
  osVersion: '16.0',
  platformApiLevel: null,
  deviceType: 1,
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    Ionicons: Text,
    MaterialIcons: Text,
    FontAwesome: Text,
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Redux Persist
jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist');
  return {
    ...real,
    persistReducer: jest.fn().mockImplementation((config, reducers) => reducers),
  };
});

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Global __DEV__ variable
global.__DEV__ = true;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test helpers
global.testHelpers = {
  waitFor: async (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  flushPromises: () => new Promise(setImmediate),
};