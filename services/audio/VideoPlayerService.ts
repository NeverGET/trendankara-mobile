import { Video, VideoPlayer, VideoSource } from 'expo-video';
import { Platform } from 'react-native';

/**
 * VideoPlayerService uses expo-video to handle audio streaming
 * with native media controls support via showNowPlayingNotification
 */
export class VideoPlayerService {
  private player: VideoPlayer | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Create VideoPlayer instance using Video.createVideoPlayer
      // Start with no source (null)
      this.player = Video.createVideoPlayer(null);

      // Configure player for audio streaming with media controls
      this.player.staysActiveInBackground = true;
      this.player.showNowPlayingNotification = true; // This enables native media controls!
      this.player.muted = false; // Ensure not muted

      this.isInitialized = true;
      console.log('VideoPlayerService initialized with native media controls');
    } catch (error) {
      console.error('Failed to initialize VideoPlayerService:', error);
    }
  }

  async loadStream(url: string): Promise<void> {
    if (!this.player) {
      throw new Error('VideoPlayerService not initialized');
    }

    try {
      // Replace the current source with the stream URL
      const videoSource: VideoSource = { uri: url };
      await this.player.replaceAsync(videoSource);

      // Set metadata for media controls
      // Note: expo-video should automatically handle this with showNowPlayingNotification
      console.log('Stream loaded with native media controls enabled');
    } catch (error) {
      console.error('Failed to load stream:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (!this.player) {
      throw new Error('VideoPlayerService not initialized');
    }

    try {
      this.player.play();
      console.log('Playback started');
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (!this.player) {
      throw new Error('VideoPlayerService not initialized');
    }

    try {
      this.player.pause();
      console.log('Playback paused');
    } catch (error) {
      console.error('Failed to pause playback:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.player) {
      return;
    }

    try {
      this.player.pause();
      // Clear the source by replacing with null
      await this.player.replaceAsync(null);
      console.log('Playback stopped');
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  }

  get isPlaying(): boolean {
    return this.player?.playing ?? false;
  }

  get isMuted(): boolean {
    return this.player?.muted ?? false;
  }

  set isMuted(value: boolean) {
    if (this.player) {
      this.player.muted = value;
    }
  }

  get volume(): number {
    return this.player?.volume ?? 1.0;
  }

  set volume(value: number) {
    if (this.player) {
      this.player.volume = Math.max(0, Math.min(1, value));
    }
  }

  async cleanup(): Promise<void> {
    await this.stop();

    // Release the player instance to prevent memory leaks
    // This is required when using Video.createVideoPlayer()
    if (this.player) {
      this.player.release();
    }

    this.player = null;
    this.isInitialized = false;
  }
}

export default VideoPlayerService;