// Primary audio service export
export { default } from './VideoPlayerService';
export { default as VideoPlayerService } from './VideoPlayerService';

// Legacy exports (archived but types may still be needed)
export { AudioErrorHandler, AudioError } from './ErrorHandler';
export type { MediaSessionMetadata, RemoteCommand, EnhancedAudioStatus } from './types';
export { AudioFocusState } from './AudioFocusState';