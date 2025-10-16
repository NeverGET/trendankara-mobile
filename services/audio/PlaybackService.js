/**
 * PlaybackService - Background service for TrackPlayer
 * Handles remote media control events (lock screen, Bluetooth, notification, etc.)
 * This service runs in the background even when the app is not in the foreground
 */
import { Platform } from 'react-native';
import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Playback Service Function
 * Registered with TrackPlayer to handle background playback events
 * This is called when the service starts and runs independently of the React lifecycle
 */
module.exports = async function() {
  console.log('[PlaybackService] Service registered and started');

  /**
   * Handle remote play button
   * Triggered from: Lock screen, notification, Bluetooth device, car audio system
   */
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('[PlaybackService] Remote play event received');
    await TrackPlayer.play();
  });

  /**
   * Handle remote pause button
   * Triggered from: Lock screen, notification, Bluetooth device, car audio system
   */
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log('[PlaybackService] Remote pause event received');
    await TrackPlayer.pause();
  });

  /**
   * Handle remote stop button
   * Triggered from: Notification, some Bluetooth devices
   */
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log('[PlaybackService] Remote stop event received');
    await TrackPlayer.stop();
  });

  /**
   * Handle audio interruptions
   * Triggered when: Headphones unplugged, phone call incoming, etc.
   */
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    console.log('[PlaybackService] Remote duck event:', event);

    if (event.paused) {
      // Temporary interruption (e.g., notification sound) - pause playback
      await TrackPlayer.pause();
    } else if (event.permanent) {
      // Permanent interruption (e.g., phone call) - pause playback
      await TrackPlayer.pause();
    }
    // When event.paused is false and event.permanent is false, audio focus is regained
    // The user can manually resume playback if desired
  });

  /**
   * Handle playback errors
   * Triggered when: Stream fails to load, network errors, etc.
   */
  TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
    console.error('[PlaybackService] Playback error:', error);
  });

  /**
   * Handle stream metadata updates (Android only)
   * Android's ExoPlayer can automatically detect metadata from Shoutcast/Icecast streams
   * This event fires when new song information is received from the stream
   * iOS does not support this event - use polling via useNowPlaying hook instead
   */
  if (Platform.OS === 'android') {
    TrackPlayer.addEventListener(Event.AudioCommonMetadataReceived, async (event) => {
      console.log('[PlaybackService] Metadata received from stream (Android):', event);

      try {
        // Extract metadata from the stream event
        const title = event.title || 'Live Stream';
        const artist = event.artist || 'Trend Ankara';

        // Get the current active track index
        const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();

        if (currentTrackIndex !== undefined) {
          // Update the track metadata WITHOUT interrupting playback
          // This is the core feature that solves the audio cutoff problem!
          await TrackPlayer.updateMetadataForTrack(currentTrackIndex, {
            title,
            artist,
          });

          console.log('[PlaybackService] Metadata updated successfully:', { title, artist });
        }
      } catch (error) {
        // Log error but don't throw - metadata update failures shouldn't break playback
        console.error('[PlaybackService] Failed to update metadata:', error);
      }
    });
  }
};
