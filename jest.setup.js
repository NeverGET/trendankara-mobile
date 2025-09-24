// Import React Native Testing Library (commented out as not needed for basic testing)
// import '@testing-library/react-native/extend-expect';

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
}));

// Mock expo-av
jest.mock('expo-av', () => ({
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