// Primary audio service exports
// Both services are exported to support feature flag switching via USE_TRACK_PLAYER
// Default export remains VideoPlayerService for backward compatibility
export { default } from './VideoPlayerService';
export { default as VideoPlayerService } from './VideoPlayerService';
export { default as trackPlayerService } from './TrackPlayerService';

// Legacy exports (archived but types may still be needed)
export { AudioErrorHandler, AudioError } from './ErrorHandler';
export type { MediaSessionMetadata, RemoteCommand, EnhancedAudioStatus } from './types';
export { AudioFocusState } from './AudioFocusState';