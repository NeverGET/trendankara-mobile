// Background configuration interface
export interface BackgroundConfig {
  ios: {
    backgroundModes: string[];
    enableBackgroundAudio: boolean;
    allowsExternalPlayback: boolean;
  };
  android: {
    enableForegroundService: boolean;
    notificationChannelId: string;
    notificationPriority: 'high' | 'default' | 'low';
    enableMediaSession: boolean;
  };
  mediaControls: {
    enableNotificationControls: boolean;
    enableLockScreenControls: boolean;
    showProgressBar: boolean;
    compactActions: string[];
  };
}

// Background playback configuration
export const BACKGROUND_CONFIG: BackgroundConfig = {
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
} as const;

export const AudioConfig = {
  STREAM_URL: 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service', // Test fallback stream

  // Audio Mode Settings
  AUDIO_MODE: {
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  },

  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,

  // Buffer Configuration
  BUFFER_CONFIG: {
    minBufferMs: 15000,
    maxBufferMs: 50000,
    bufferForPlaybackMs: 2500,
    bufferForPlaybackAfterRebufferMs: 5000,
  },
} as const;