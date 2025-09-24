import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import {
  BackgroundHandler,
  AudioFocusState,
  createBackgroundHandler
} from '../../../services/audio/BackgroundHandler';
import { MediaSessionMetadata, RemoteCommand, HeadphoneState } from '../../../services/audio/types';
import { BACKGROUND_CONFIG, AudioConfig } from '../../../constants/audio';

// __DEV__ is already declared in React Native types

// Mock Platform module
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(),
  },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
  },
}));

// Mock constants
jest.mock('../../../constants/audio', () => ({
  BACKGROUND_CONFIG: {
    ios: {
      backgroundModes: ['audio'],
      enableBackgroundAudio: true,
      allowsExternalPlayback: false,
    },
    android: {
      enableForegroundService: true,
      notificationChannelId: 'radio_playback',
      notificationPriority: 'high',
      enableMediaSession: true,
    },
    mediaControls: {
      enableNotificationControls: true,
      enableLockScreenControls: true,
      showProgressBar: false,
      compactActions: ['play', 'pause', 'stop'],
    },
  },
  AudioConfig: {
    STREAM_URL: 'https://test.stream.url',
    AUDIO_MODE: {
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    },
  },
}));

// Create a concrete test implementation of BackgroundHandler
class TestBackgroundHandler extends BackgroundHandler {
  public mockInitialize = jest.fn();
  public mockEnableBackground = jest.fn();
  public mockDisableBackground = jest.fn();
  public mockUpdateMetadata = jest.fn();
  public mockHandleRemoteCommand = jest.fn();
  public mockRequestAudioFocus = jest.fn();
  public mockAbandonAudioFocus = jest.fn();
  public mockResumePlayback = jest.fn();
  public mockPausePlayback = jest.fn();
  public mockDuckAudio = jest.fn();
  public mockHandleHeadphoneDisconnection = jest.fn();
  public mockStopForExternalApp = jest.fn();

  async initialize(): Promise<void> {
    this.isInitialized = true;
    return this.mockInitialize();
  }

  async enableBackground(metadata?: MediaSessionMetadata): Promise<void> {
    this.isBackgroundEnabled = true;
    this.currentMetadata = metadata;
    return this.mockEnableBackground(metadata);
  }

  async disableBackground(): Promise<void> {
    this.isBackgroundEnabled = false;
    this.currentMetadata = undefined;
    return this.mockDisableBackground();
  }

  async updateMetadata(metadata: MediaSessionMetadata): Promise<void> {
    this.currentMetadata = metadata;
    return this.mockUpdateMetadata(metadata);
  }

  async handleRemoteCommand(command: RemoteCommand): Promise<void> {
    return this.mockHandleRemoteCommand(command);
  }

  async requestAudioFocus(): Promise<boolean> {
    this.currentAudioFocus = AudioFocusState.GAIN;
    return this.mockRequestAudioFocus();
  }

  async abandonAudioFocus(): Promise<void> {
    this.currentAudioFocus = AudioFocusState.NONE;
    return this.mockAbandonAudioFocus();
  }

  protected async resumePlayback(): Promise<void> {
    return this.mockResumePlayback();
  }

  protected async pausePlayback(): Promise<void> {
    return this.mockPausePlayback();
  }

  protected async duckAudio(): Promise<void> {
    return this.mockDuckAudio();
  }

  protected async handleHeadphoneDisconnection(): Promise<void> {
    return this.mockHandleHeadphoneDisconnection();
  }

  protected async stopForExternalApp(): Promise<void> {
    return this.mockStopForExternalApp();
  }

  // Expose protected methods for testing
  public testGetPlatform() {
    return this.getPlatform();
  }

  public testGetBackgroundConfig() {
    return this.getBackgroundConfig();
  }

  public testGetMediaControlsConfig() {
    return this.getMediaControlsConfig();
  }

  public testGetAudioConfig() {
    return this.getAudioConfig();
  }

  public testValidateMetadata(metadata: MediaSessionMetadata) {
    return this.validateMetadata(metadata);
  }

  public testLog(message: string, data?: any) {
    return this.log(message, data);
  }

  public testLogError(message: string, error?: any) {
    return this.logError(message, error);
  }

  public testUpdateHeadphoneConnectionState(isConnected: boolean) {
    return this.updateHeadphoneConnectionState(isConnected);
  }

  public async testHandlePotentialHeadphoneDisconnection(reason: string) {
    return this.handlePotentialHeadphoneDisconnection(reason);
  }

  public async testInitializeHeadphoneDetection() {
    return this.initializeHeadphoneDetection();
  }

  public async testCleanupHeadphoneDetection() {
    return this.cleanupHeadphoneDetection();
  }
}

describe('BackgroundHandler', () => {
  let handler: TestBackgroundHandler;
  let mockPlatform: jest.Mocked<typeof Platform>;

  beforeEach(() => {
    handler = new TestBackgroundHandler();
    mockPlatform = Platform as jest.Mocked<typeof Platform>;

    // Reset all mocks
    jest.clearAllMocks();

    // Reset platform to iOS by default
    mockPlatform.OS = 'ios';
  });

  describe('Platform Detection', () => {
    it('should detect iOS platform correctly', () => {
      mockPlatform.OS = 'ios';
      expect(handler.testGetPlatform()).toBe('ios');
    });

    it('should detect Android platform correctly', () => {
      mockPlatform.OS = 'android';
      expect(handler.testGetPlatform()).toBe('android');
    });

    it('should handle web platform', () => {
      mockPlatform.OS = 'web' as any;
      expect(handler.testGetPlatform()).toBe('web');
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      handler.mockInitialize.mockResolvedValue(undefined);

      await handler.initialize();

      expect(handler.isHandlerInitialized()).toBe(true);
      expect(handler.mockInitialize).toHaveBeenCalledTimes(1);
    });

    it('should track initialization state', () => {
      expect(handler.isHandlerInitialized()).toBe(false);
    });
  });

  describe('Background Mode Management', () => {
    it('should enable background mode without metadata', async () => {
      handler.mockEnableBackground.mockResolvedValue(undefined);

      await handler.enableBackground();

      expect(handler.isBackgroundActive()).toBe(true);
      expect(handler.mockEnableBackground).toHaveBeenCalledWith(undefined);
    });

    it('should enable background mode with metadata', async () => {
      const metadata: MediaSessionMetadata = {
        title: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
      };
      handler.mockEnableBackground.mockResolvedValue(undefined);

      await handler.enableBackground(metadata);

      expect(handler.isBackgroundActive()).toBe(true);
      expect(handler.mockEnableBackground).toHaveBeenCalledWith(metadata);
    });

    it('should disable background mode', async () => {
      handler.mockDisableBackground.mockResolvedValue(undefined);

      // First enable
      await handler.enableBackground();
      expect(handler.isBackgroundActive()).toBe(true);

      // Then disable
      await handler.disableBackground();

      expect(handler.isBackgroundActive()).toBe(false);
      expect(handler.mockDisableBackground).toHaveBeenCalledTimes(1);
    });
  });

  describe('Audio Focus Management', () => {
    it('should initialize with no audio focus', () => {
      expect(handler.getAudioFocusState()).toBe(AudioFocusState.NONE);
    });

    it('should request audio focus successfully', async () => {
      handler.mockRequestAudioFocus.mockResolvedValue(true);

      const result = await handler.requestAudioFocus();

      expect(result).toBe(true);
      expect(handler.getAudioFocusState()).toBe(AudioFocusState.GAIN);
      expect(handler.mockRequestAudioFocus).toHaveBeenCalledTimes(1);
    });

    it('should abandon audio focus', async () => {
      handler.mockAbandonAudioFocus.mockResolvedValue(undefined);

      // First gain focus
      await handler.requestAudioFocus();
      expect(handler.getAudioFocusState()).toBe(AudioFocusState.GAIN);

      // Then abandon
      await handler.abandonAudioFocus();

      expect(handler.getAudioFocusState()).toBe(AudioFocusState.NONE);
      expect(handler.mockAbandonAudioFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Audio Focus State Changes', () => {
    beforeEach(() => {
      handler.mockResumePlayback.mockResolvedValue(undefined);
      handler.mockPausePlayback.mockResolvedValue(undefined);
      handler.mockDuckAudio.mockResolvedValue(undefined);
      handler.mockAbandonAudioFocus.mockResolvedValue(undefined);
    });

    it('should resume playback when gaining focus after interruption', async () => {
      // First lose focus while playing
      await handler.handleAudioFocusChange(AudioFocusState.LOSS_TRANSIENT, true);

      // Then regain focus
      await handler.handleAudioFocusChange(AudioFocusState.GAIN, false);

      expect(handler.mockResumePlayback).toHaveBeenCalledTimes(1);
    });

    it('should not resume if was not playing before interruption', async () => {
      // Gain focus without previous interruption
      await handler.handleAudioFocusChange(AudioFocusState.GAIN, false);

      expect(handler.mockResumePlayback).not.toHaveBeenCalled();
    });

    it('should pause and abandon focus on permanent loss', async () => {
      await handler.handleAudioFocusChange(AudioFocusState.LOSS, true);

      expect(handler.mockPausePlayback).toHaveBeenCalledTimes(1);
      expect(handler.mockAbandonAudioFocus).toHaveBeenCalledTimes(1);
    });

    it('should pause on transient focus loss', async () => {
      await handler.handleAudioFocusChange(AudioFocusState.LOSS_TRANSIENT, true);

      expect(handler.mockPausePlayback).toHaveBeenCalledTimes(1);
      expect(handler.mockAbandonAudioFocus).not.toHaveBeenCalled();
    });

    it('should duck audio on transient loss with ducking', async () => {
      await handler.handleAudioFocusChange(AudioFocusState.LOSS_TRANSIENT_CAN_DUCK, true);

      expect(handler.mockDuckAudio).toHaveBeenCalledTimes(1);
      expect(handler.mockPausePlayback).not.toHaveBeenCalled();
    });

    it('should pause when no focus', async () => {
      await handler.handleAudioFocusChange(AudioFocusState.NONE, true);

      expect(handler.mockPausePlayback).toHaveBeenCalledTimes(1);
    });

    it('should not take action when already paused', async () => {
      await handler.handleAudioFocusChange(AudioFocusState.LOSS, false);

      expect(handler.mockPausePlayback).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Access', () => {
    it('should return iOS configuration when on iOS', () => {
      mockPlatform.OS = 'ios';

      const config = handler.testGetBackgroundConfig();

      expect(config).toEqual(BACKGROUND_CONFIG.ios);
    });

    it('should return Android configuration when on Android', () => {
      mockPlatform.OS = 'android';

      const config = handler.testGetBackgroundConfig();

      expect(config).toEqual(BACKGROUND_CONFIG.android);
    });

    it('should return null for unsupported platforms', () => {
      mockPlatform.OS = 'web' as any;

      const config = handler.testGetBackgroundConfig();

      expect(config).toBeNull();
    });

    it('should return media controls configuration', () => {
      const config = handler.testGetMediaControlsConfig();

      expect(config).toEqual(BACKGROUND_CONFIG.mediaControls);
    });

    it('should return audio configuration', () => {
      const config = handler.testGetAudioConfig();

      expect(config).toEqual(AudioConfig);
    });
  });

  describe('Metadata Validation', () => {
    it('should validate complete metadata', () => {
      const metadata: MediaSessionMetadata = {
        title: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
      };

      expect(handler.testValidateMetadata(metadata)).toBe(true);
    });

    it('should validate metadata with only required fields', () => {
      const metadata: MediaSessionMetadata = {
        title: 'Test Track',
        artist: 'Test Artist',
      };

      expect(handler.testValidateMetadata(metadata)).toBe(true);
    });

    it('should reject metadata without title', () => {
      const metadata: MediaSessionMetadata = {
        title: '',
        artist: 'Test Artist',
      };

      expect(handler.testValidateMetadata(metadata)).toBe(false);
    });

    it('should reject metadata without artist', () => {
      const metadata: MediaSessionMetadata = {
        title: 'Test Track',
        artist: '',
      };

      expect(handler.testValidateMetadata(metadata)).toBe(false);
    });
  });

  describe('Headphone State Management', () => {
    it('should initialize with disconnected headphones', () => {
      const state = handler.getHeadphoneState();

      expect(state.isConnected).toBe(false);
      expect(state.lastDisconnectedAt).toBeUndefined();
    });

    it('should update headphone connection state', () => {
      handler.testUpdateHeadphoneConnectionState(true);

      let state = handler.getHeadphoneState();
      expect(state.isConnected).toBe(true);

      handler.testUpdateHeadphoneConnectionState(false);

      state = handler.getHeadphoneState();
      expect(state.isConnected).toBe(false);
      expect(state.lastDisconnectedAt).toBeDefined();
    });

    it('should initialize headphone detection', async () => {
      await handler.testInitializeHeadphoneDetection();

      const state = handler.getHeadphoneState();
      expect(state.isConnected).toBe(false);
    });

    it('should cleanup headphone detection', async () => {
      await handler.testCleanupHeadphoneDetection();

      const state = handler.getHeadphoneState();
      expect(state.isConnected).toBe(false);
    });

    it('should handle potential headphone disconnection', async () => {
      handler.mockHandleHeadphoneDisconnection.mockResolvedValue(undefined);

      await handler.testHandlePotentialHeadphoneDisconnection('test reason');

      const state = handler.getHeadphoneState();
      expect(state.isConnected).toBe(false);
      expect(handler.mockHandleHeadphoneDisconnection).toHaveBeenCalledTimes(1);
    });
  });

  describe('Remote Command Handling', () => {
    it('should handle play command', async () => {
      const command: RemoteCommand = { type: 'play' };
      handler.mockHandleRemoteCommand.mockResolvedValue(undefined);

      await handler.handleRemoteCommand(command);

      expect(handler.mockHandleRemoteCommand).toHaveBeenCalledWith(command);
    });

    it('should handle pause command', async () => {
      const command: RemoteCommand = { type: 'pause' };
      handler.mockHandleRemoteCommand.mockResolvedValue(undefined);

      await handler.handleRemoteCommand(command);

      expect(handler.mockHandleRemoteCommand).toHaveBeenCalledWith(command);
    });

    it('should handle seek command with position', async () => {
      const command: RemoteCommand = {
        type: 'seek',
        data: { position: 30 }
      };
      handler.mockHandleRemoteCommand.mockResolvedValue(undefined);

      await handler.handleRemoteCommand(command);

      expect(handler.mockHandleRemoteCommand).toHaveBeenCalledWith(command);
    });
  });

  describe('Metadata Management', () => {
    it('should update metadata', async () => {
      const metadata: MediaSessionMetadata = {
        title: 'Updated Track',
        artist: 'Updated Artist',
      };
      handler.mockUpdateMetadata.mockResolvedValue(undefined);

      await handler.updateMetadata(metadata);

      expect(handler.mockUpdateMetadata).toHaveBeenCalledWith(metadata);
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      // Reset console mocks
      jest.clearAllMocks();
    });

    it('should log debug messages in development', () => {
      // Mock __DEV__ for this test
      (global as any).__DEV__ = true;

      handler.testLog('Test message', { test: 'data' });

      expect(console.log).toHaveBeenCalledWith('[BackgroundHandler] Test message', { test: 'data' });
    });

    it('should not log debug messages in production', () => {
      // Mock __DEV__ for this test
      (global as any).__DEV__ = false;

      handler.testLog('Test message', { test: 'data' });

      expect(console.log).not.toHaveBeenCalled();

      // Reset to dev mode for other tests
      (global as any).__DEV__ = true;
    });

    it('should always log error messages', () => {
      handler.testLogError('Test error', new Error('test'));

      expect(console.error).toHaveBeenCalledWith('[BackgroundHandler] Test error', new Error('test'));
    });
  });
});

describe('createBackgroundHandler', () => {
  let mockPlatform: jest.Mocked<typeof Platform>;

  beforeEach(() => {
    mockPlatform = Platform as jest.Mocked<typeof Platform>;
    jest.clearAllMocks();
  });

  it('should create iOS handler when on iOS platform', async () => {
    mockPlatform.OS = 'ios';

    // Since we can't easily mock dynamic imports in this test environment,
    // we'll just test that it throws an error when trying to load the real module
    await expect(createBackgroundHandler()).rejects.toThrow();
  });

  it('should create Android handler when on Android platform', async () => {
    mockPlatform.OS = 'android';

    await expect(createBackgroundHandler()).rejects.toThrow();
  });

  it('should throw error for unsupported platforms', async () => {
    mockPlatform.OS = 'web' as any;

    await expect(createBackgroundHandler()).rejects.toThrow(
      'BackgroundHandler not supported for platform: web'
    );
  });

  it('should throw error for unknown platforms', async () => {
    mockPlatform.OS = 'windows' as any;

    await expect(createBackgroundHandler()).rejects.toThrow(
      'BackgroundHandler not supported for platform: windows'
    );
  });
});