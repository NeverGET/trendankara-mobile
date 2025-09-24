import { Audio, AVPlaybackStatus } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';
import { AudioConfig } from '@/constants/audio';
import { AudioErrorHandler, AudioError } from './ErrorHandler';

export class StreamController {
  private sound: Audio.Sound | null = null;
  private retryCount = 0;
  private backgroundRetryCount = 0;
  private isInBackground = false;
  private statusUpdateCallback: ((status: AVPlaybackStatus) => void) | null = null;

  constructor() {
    // Set initial background state
    this.isInBackground = AppState.currentState === 'background';
  }

  /**
   * Update background mode state (called from AudioService)
   */
  public updateBackgroundMode(isInBackground: boolean): void {
    const wasInBackground = this.isInBackground;
    this.isInBackground = isInBackground;

    // Reset background retry count when transitioning between states
    if (wasInBackground !== this.isInBackground) {
      this.backgroundRetryCount = 0;

      if (__DEV__) {
        console.log(`[StreamController] Background mode updated: ${this.isInBackground}`);
      }
    }
  }

  async loadStream(url: string, onStatusUpdate: (status: AVPlaybackStatus) => void): Promise<Audio.Sound> {
    this.statusUpdateCallback = onStatusUpdate;

    try {
      if (this.sound) {
        await this.unloadStream();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 1000, // Update only once per second instead of constantly
          shouldCorrectPitch: true,
          volume: 1.0
        },
        onStatusUpdate
      );

      this.sound = sound;
      this.retryCount = 0;
      this.backgroundRetryCount = 0;
      return sound;
    } catch (error) {
      return this.handleLoadError(error, url, onStatusUpdate);
    }
  }

  /**
   * Handle load errors with background-aware retry logic
   */
  private async handleLoadError(error: any, url: string, onStatusUpdate: (status: AVPlaybackStatus) => void): Promise<Audio.Sound> {
    const handledError = AudioErrorHandler.handleError(error);

    // Check if we should retry based on error type
    if (!AudioErrorHandler.shouldRetry(handledError.type)) {
      throw error;
    }

    // Get retry counts and limits based on background mode
    const { currentCount, maxRetries, retryDelay } = this.getRetryParameters(handledError.type);

    if (currentCount < maxRetries) {
      this.incrementRetryCount();

      if (__DEV__) {
        console.log(`[StreamController] Retrying in background mode: ${this.isInBackground}, attempt ${currentCount + 1}/${maxRetries}, delay: ${retryDelay}ms`);
      }

      // Update status during retry for background mode
      this.updateStatusDuringRetry(handledError, currentCount + 1, maxRetries);

      await this.delay(retryDelay);
      return this.loadStream(url, onStatusUpdate);
    }

    throw error;
  }

  /**
   * Get retry parameters based on background mode and error type
   */
  private getRetryParameters(errorType: AudioError): { currentCount: number; maxRetries: number; retryDelay: number } {
    if (this.isInBackground) {
      // Background mode: extended retry with longer delays for network recovery
      const maxBackgroundRetries = AudioConfig.MAX_RETRIES * 2; // Double retries for background
      const retryDelay = this.getBackgroundRetryDelay(errorType, this.backgroundRetryCount);

      return {
        currentCount: this.backgroundRetryCount,
        maxRetries: maxBackgroundRetries,
        retryDelay
      };
    } else {
      // Foreground mode: standard retry logic
      const retryDelay = AudioErrorHandler.getRetryDelay(errorType, this.retryCount);

      return {
        currentCount: this.retryCount,
        maxRetries: AudioConfig.MAX_RETRIES,
        retryDelay
      };
    }
  }

  /**
   * Get background-specific retry delay with extended intervals for network recovery
   */
  private getBackgroundRetryDelay(errorType: AudioError, attemptNumber: number): number {
    // Base delay for background mode (longer than foreground)
    const baseDelay = this.isInBackground ? 5000 : AudioConfig.RETRY_DELAY;
    const maxDelay = this.isInBackground ? 30000 : 10000; // Extended max delay for background

    if (!AudioErrorHandler.shouldRetry(errorType)) {
      return 0;
    }

    // For background mode, use more aggressive exponential backoff for network recovery
    if (this.isInBackground && errorType === AudioError.NETWORK_ERROR) {
      // Extended backoff for network errors in background (helps with network reconnection)
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
      const jitter = Math.random() * 2000; // Increased jitter for background
      return exponentialDelay + jitter;
    }

    // Standard exponential backoff for other cases
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
  }

  /**
   * Increment appropriate retry counter based on current mode
   */
  private incrementRetryCount(): void {
    if (this.isInBackground) {
      this.backgroundRetryCount++;
    } else {
      this.retryCount++;
    }
  }

  /**
   * Update status during background recovery attempts
   */
  private updateStatusDuringRetry(error: { type: AudioError; message: string }, attempt: number, maxAttempts: number): void {
    if (!this.statusUpdateCallback) {
      return;
    }

    // Create a custom status update for retry state
    const retryStatus: AVPlaybackStatus = {
      isLoaded: false,
      error: `${error.message} (${this.isInBackground ? 'Arka planda' : 'Ön planda'} yeniden deneniyor... ${attempt}/${maxAttempts})`
    } as AVPlaybackStatus;

    try {
      this.statusUpdateCallback(retryStatus);

      if (__DEV__) {
        console.log(`[StreamController] Updated status during ${this.isInBackground ? 'background' : 'foreground'} retry: ${error.message}, attempt ${attempt}/${maxAttempts}`);
      }
    } catch (statusError) {
      console.error('[StreamController] Failed to update status during retry:', statusError);
    }
  }

  async unloadStream(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('Error unloading stream:', error);
      } finally {
        this.sound = null;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSound(): Audio.Sound | null {
    return this.sound;
  }

  resetRetryCount(): void {
    this.retryCount = 0;
    this.backgroundRetryCount = 0;
  }

  /**
   * Get current background mode status
   */
  public isBackgroundMode(): boolean {
    return this.isInBackground;
  }

  /**
   * Get current retry counts for debugging
   */
  public getRetryStatus(): { foreground: number; background: number; isInBackground: boolean } {
    return {
      foreground: this.retryCount,
      background: this.backgroundRetryCount,
      isInBackground: this.isInBackground
    };
  }

  /**
   * Force network reconnection attempt (useful for manual retry triggers)
   */
  public async attemptNetworkRecovery(url: string): Promise<Audio.Sound | null> {
    if (!this.statusUpdateCallback) {
      console.warn('[StreamController] Cannot attempt recovery without status callback');
      return null;
    }

    try {
      console.log(`[StreamController] Attempting manual network recovery in ${this.isInBackground ? 'background' : 'foreground'} mode`);

      // Reset retry counts for fresh attempt
      this.retryCount = 0;
      this.backgroundRetryCount = 0;

      return await this.loadStream(url, this.statusUpdateCallback);
    } catch (error) {
      console.error('[StreamController] Manual network recovery failed:', error);
      return null;
    }
  }

  /**
   * Cleanup method to remove app state listeners
   */
  public cleanup(): void {
    try {
      // Note: AppState.removeEventListener is deprecated in newer React Native versions
      // The listener will be automatically cleaned up when the instance is destroyed
      this.statusUpdateCallback = null;
      this.retryCount = 0;
      this.backgroundRetryCount = 0;

      if (__DEV__) {
        console.log('[StreamController] Cleanup completed');
      }
    } catch (error) {
      console.error('[StreamController] Cleanup failed:', error);
    }
  }
}