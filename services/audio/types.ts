import { AudioStatus } from './AudioService';

/**
 * Media session metadata for background playback
 * Used to display track information in notification/lock screen
 */
export interface MediaSessionMetadata {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  genre?: string;
  releaseDate?: string;
}

/**
 * Remote command types for media session controls
 * Handles user interactions from notification/lock screen
 */
export interface RemoteCommand {
  type: 'play' | 'pause' | 'stop' | 'next' | 'previous' | 'seek';
  data?: {
    position?: number; // For seek command
  };
}

/**
 * Headphone connection state
 */
export interface HeadphoneState {
  isConnected: boolean;
  lastDisconnectedAt?: number;
}

/**
 * Enhanced audio status that includes media session information
 * Extends the base AudioStatus with background playback capabilities
 */
export interface EnhancedAudioStatus extends AudioStatus {
  metadata?: MediaSessionMetadata;
  isBackgroundActive: boolean;
  hasMediaSession: boolean;
  supportedCommands: RemoteCommand['type'][];
  headphoneState: HeadphoneState;
}