# React Native Track Player - Comprehensive Implementation Report

**Report Date:** 2025-10-01
**Project:** TrendAnkara Mobile App
**Purpose:** Evaluate react-native-track-player as an alternative to expo-video for Shoutcast audio streaming with dynamic metadata updates

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Package Overview](#package-overview)
3. [Current Implementation Analysis](#current-implementation-analysis)
4. [The Core Problem & Solution](#the-core-problem--solution)
5. [Feature Comparison Matrix](#feature-comparison-matrix)
6. [Technical Architecture](#technical-architecture)
7. [Implementation Guide](#implementation-guide)
8. [Code Examples](#code-examples)
9. [Platform-Specific Considerations](#platform-specific-considerations)
10. [Migration Strategy](#migration-strategy)
11. [Testing & Validation](#testing--validation)
12. [Rollback Plan](#rollback-plan)
13. [Resources & References](#resources--references)

---

## 1. Executive Summary

### Current Situation
- ✅ Successfully implemented Shoutcast audio streaming using `expo-video`
- ✅ Native media controls working on iOS and Android
- ❌ **Critical Issue:** Updating "Now Playing" metadata requires destroying and recreating the player, causing audio cutoffs
- 🔧 **Current Workaround:** Using static station name ("Trend Ankara") instead of dynamic track metadata

### Key Finding
`react-native-track-player` provides `updateMetadataForTrack()` function that updates native media controls metadata **WITHOUT interrupting playback**. This solves your exact problem.

### Recommendation
✅ **Implement react-native-track-player as an alternative system** with feature flag support for easy switching between expo-video and track player implementations.

---

## 2. Package Overview

### Package Information
- **Package Name:** `react-native-track-player`
- **Latest Version:** 4.1.2 (August 2025)
- **GitHub:** https://github.com/doublesymmetry/react-native-track-player
- **Stars:** 3,600+ ⭐
- **License:** Apache-2.0
- **Documentation:** https://rntp.dev

### Core Capabilities
- ✅ Audio playback (local, network, bundled)
- ✅ External media controls (lock screen, Bluetooth, Android Auto, CarPlay)
- ✅ Background playback mode
- ✅ Adaptive bitrate streaming
- ✅ Media caching (Android only)
- ✅ Customizable notifications
- ✅ React Hooks integration
- ✅ Live streaming support (HLS, DASH, regular streams)
- ✅ **Dynamic metadata updates without playback interruption** 🎯

### Platform Support Matrix

| Feature | Android | iOS | Web |
|---------|---------|-----|-----|
| Audio Playback | ✅ | ✅ | ✅ |
| Background Mode | ✅ | ✅ | ❌ |
| Media Controls | ✅ | ✅ | ❌ |
| HLS Streaming | ✅ | ✅ | ✅ |
| DASH Streaming | ✅ | ❌ | ✅ |
| SmoothStreaming | ✅ | ❌ | ❌ |
| Caching | ✅ | ❌ | ❌ |
| Metadata Events | ✅ | ⚠️ Partial | ❌ |

---

## 3. Current Implementation Analysis

### Current Architecture (expo-video)

**File:** `services/audio/VideoPlayerService.ts`

**Key Components:**
- `createVideoPlayer()` from expo-video
- `showNowPlayingNotification: true` for native controls
- `staysActiveInBackground: true` for background playback
- Singleton service pattern
- Event-based state management

**Current Flow:**
```
1. Create VideoPlayer with stream URL and initial metadata
2. Enable showNowPlayingNotification
3. When metadata changes (from useNowPlaying hook):
   - Android: Disable notification → Replace source → Wait 200ms → Re-enable notification → Resume playback
   - iOS: Replace source with new metadata → Resume playback
4. Result: Audio interruption/glitch during metadata update
```

### The Problem in Detail

**File:** `services/audio/VideoPlayerService.ts:142-242`

```typescript
async updateNowPlayingInfo(nowPlaying: { title?: string; artist?: string; song?: string } | null): Promise<void> {
  // Platform-specific update strategy
  if (Platform.OS === 'android') {
    // 1. Disable notification
    this.player.showNowPlayingNotification = false;

    // 2. Replace source with new metadata
    await this.player.replaceAsync(updatedSource);

    // 3. Wait for notification system to settle
    await new Promise<void>(resolve => setTimeout(resolve, 200));

    // 4. Re-enable notification (forces recreation with new metadata)
    this.player.showNowPlayingNotification = true;

    // 5. Resume playback - CAUSES AUDIO CUTOFF
    await this.player.play();
  }
}
```

**Why This Happens:**
- expo-video doesn't provide a direct metadata update API
- Requires destroying and recreating the notification system
- Stream must be re-established, causing brief interruption

---

## 4. The Core Problem & Solution

### Problem Statement
When track metadata changes (song title, artist) from the Shoutcast server, updating the native media controls requires:
1. Stopping the current player notification
2. Recreating the player source with new metadata
3. Restarting playback

This causes a 200-500ms audio gap/stutter, which is unacceptable for live radio streaming.

### The Solution: react-native-track-player

#### Key Function: `updateMetadataForTrack()`

```typescript
await TrackPlayer.updateMetadataForTrack(trackIndex, {
  title: 'New Song Title',
  artist: 'New Artist Name',
  artwork: 'https://example.com/artwork.jpg'
});
```

**How It Works:**
- Updates the track metadata in the queue
- If updating the current track, **automatically updates** the notification and Now Playing Center
- **NO playback interruption** - stream continues seamlessly
- Returns a Promise for proper async handling

**This is exactly what you need!** 🎯

---

## 5. Feature Comparison Matrix

| Feature | expo-video | react-native-track-player |
|---------|------------|---------------------------|
| **Streaming Support** | ✅ HTTP streams | ✅ HTTP, HLS, DASH |
| **Background Playback** | ✅ Yes | ✅ Yes |
| **Native Controls** | ✅ Yes | ✅ Yes (more customizable) |
| **Metadata Update** | ❌ Requires recreation | ✅ `updateMetadataForTrack()` |
| **Audio Interruption** | ⚠️ Yes (on metadata update) | ✅ No interruption |
| **Remote Events** | ⚠️ Manual handling | ✅ Built-in event system |
| **Queue Management** | ❌ Single track | ✅ Full queue support |
| **Progress Tracking** | ⚠️ Manual implementation | ✅ `useProgress()` hook |
| **State Management** | ⚠️ Manual implementation | ✅ `usePlaybackState()` hook |
| **Metadata Events (Android)** | ❌ Not supported | ✅ `AudioCommonMetadataReceived` |
| **Buffering Options** | ⚠️ Limited | ✅ Extensive (minBuffer, maxBuffer, etc.) |
| **Documentation** | ⚠️ Basic | ✅ Comprehensive |
| **Community Support** | ✅ Expo ecosystem | ✅ 3.6k stars, active Discord |
| **Expo Compatibility** | ✅ Native | ✅ Supported (requires dev build) |

---

## 6. Technical Architecture

### react-native-track-player Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  (RadioPlayerControls, Now Playing Display, etc.)       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Uses Hooks
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   React Hooks Layer                      │
│  • useProgress()        • useActiveTrack()              │
│  • usePlaybackState()   • useTrackPlayerEvents()        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Calls API
                     ▼
┌─────────────────────────────────────────────────────────┐
│                TrackPlayer API Functions                 │
│  • setupPlayer()     • updateMetadataForTrack()         │
│  • add()             • play() / pause()                  │
│  • getProgress()     • addEventListener()                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Native Bridge
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Playback Service                        │
│  (Runs in background, handles remote events)            │
│  • Event.RemotePlay    • Event.RemotePause              │
│  • Event.RemoteNext    • Event.MetadataReceived         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Controls
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Native Audio Player                         │
│  iOS: AVPlayer + AVAudioSession                         │
│  Android: ExoPlayer + MediaSession                      │
└─────────────────────────────────────────────────────────┘
```

### Metadata Update Flow (New Approach)

```
┌──────────────────────┐
│  Shoutcast Server    │
│  (Metadata Endpoint) │
└──────────┬───────────┘
           │ Poll every 5s
           ▼
┌──────────────────────┐
│   useNowPlaying      │
│   Custom Hook        │
└──────────┬───────────┘
           │ New metadata detected
           ▼
┌──────────────────────────────────────┐
│  TrackPlayer.updateMetadataForTrack  │
│  (Track index 0 for current track)   │
└──────────┬───────────────────────────┘
           │ Updates without interruption
           ▼
┌──────────────────────────────────────┐
│   Native Media Controls              │
│   • Lock Screen (iOS)                │
│   • Control Center (iOS)             │
│   • Notification (Android)           │
│   • Bluetooth Controls               │
└──────────────────────────────────────┘
```

---

## 7. Implementation Guide

### Step 1: Installation

```bash
# Install react-native-track-player
npm install --save react-native-track-player

# iOS specific (if not using Expo)
cd ios && pod install && cd ..
```

### Step 2: Configure app.json

Add to your existing `app.json`:

```json
{
  "expo": {
    "plugins": [
      // Keep existing expo-video plugin for backwards compatibility
      ["expo-video", {
        "supportsBackgroundPlayback": true,
        "supportsPictureInPicture": false
      }],
      // Add react-native-track-player plugin
      [
        "react-native-track-player",
        {
          "playbackServiceName": "PlaybackService"
        }
      ]
    ]
  }
}
```

**Note:** You may need to rebuild your development client after adding the plugin.

### Step 3: Android Permissions

Your existing permissions in `app.json` already support track player:

```json
{
  "android": {
    "permissions": [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "android.permission.WAKE_LOCK",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE"
    ]
  }
}
```

✅ **No changes needed!**

### Step 4: Register Playback Service

**File:** `index.js` (or your app entry point)

```javascript
import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';

// Register the playback service
TrackPlayer.registerPlaybackService(() => require('./services/audio/PlaybackService'));

AppRegistry.registerComponent(appName, () => App);
```

---

## 8. Code Examples

### 8.1 Playback Service (Background Service)

**File:** `services/audio/PlaybackService.ts`

```typescript
import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Playback Service - Runs in background, handles remote media control events
 * This service continues running even when the app is backgrounded
 */
module.exports = async function () {
  // Handle remote play button (lock screen, notification, Bluetooth)
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    console.log('[PlaybackService] Remote play event');
    TrackPlayer.play();
  });

  // Handle remote pause button
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    console.log('[PlaybackService] Remote pause event');
    TrackPlayer.pause();
  });

  // Handle remote stop button
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    console.log('[PlaybackService] Remote stop event');
    TrackPlayer.stop();
  });

  // Handle audio becoming noisy (headphones unplugged)
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    console.log('[PlaybackService] Remote duck event:', event);
    if (event.paused) {
      // Pause playback when interrupted (phone call, etc.)
      await TrackPlayer.pause();
    } else if (event.permanent) {
      // Permanent duck (like a phone call) - pause
      await TrackPlayer.pause();
    }
  });

  // Android-specific: Listen for metadata from the stream
  // This event fires when Shoutcast/Icecast streams send metadata
  TrackPlayer.addEventListener(Event.AudioCommonMetadataReceived, async (event) => {
    console.log('[PlaybackService] Metadata received from stream:', event);

    // Update track metadata without interrupting playback
    const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
    if (currentTrackIndex !== undefined) {
      await TrackPlayer.updateMetadataForTrack(currentTrackIndex, {
        title: event.title || 'Live Stream',
        artist: event.artist || 'Trend Ankara',
      });
    }
  });

  // Handle playback errors
  TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
    console.error('[PlaybackService] Playback error:', error);
  });
};
```

### 8.2 TrackPlayerService (Main Service)

**File:** `services/audio/TrackPlayerService.ts`

```typescript
import TrackPlayer, {
  Capability,
  AppKilledPlaybackBehavior,
  RepeatMode,
  State,
  Event,
} from 'react-native-track-player';
import { Platform } from 'react-native';
import SettingsService from '../settings/SettingsService';
import type { RadioConfig } from '@/types/api';
import type { PlayerStateType } from '@/types/models';

/**
 * TrackPlayerService uses react-native-track-player for audio streaming
 * with seamless metadata updates and native media controls
 */
export class TrackPlayerService {
  private isInitialized = false;
  private currentConfig: RadioConfig | null = null;
  private playerState: PlayerStateType = 'stopped';
  private stateListeners = new Set<(state: PlayerStateType) => void>();
  private errorListeners = new Set<(error: Error) => void>();
  private metadataUpdateInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[TrackPlayerService] Already initialized');
        return;
      }

      // Setup player with configuration
      await TrackPlayer.setupPlayer({
        autoUpdateMetadata: true, // Automatically update media controls
        autoHandleInterruptions: true, // Handle phone calls, etc.
      });

      // Configure player capabilities (buttons shown in media controls)
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        notificationCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      });

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.updatePlayerState('stopped');
      console.log('[TrackPlayerService] Initialized successfully');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to initialize:', error);
      this.isInitialized = false;
      this.notifyError(new Error('Failed to initialize player'));
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Listen for playback state changes
    TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
      console.log('[TrackPlayerService] Playback state changed:', data);
      this.handleStateChange(data.state);
    });

    // Listen for errors
    TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
      console.error('[TrackPlayerService] Playback error:', error);
      this.updatePlayerState('error');
      this.notifyError(new Error(error.message || 'Playback error'));
    });
  }

  private handleStateChange(state: State): void {
    let mappedState: PlayerStateType;

    switch (state) {
      case State.Playing:
        mappedState = 'playing';
        break;
      case State.Paused:
        mappedState = 'paused';
        break;
      case State.Stopped:
      case State.None:
        mappedState = 'stopped';
        break;
      case State.Buffering:
      case State.Connecting:
        mappedState = 'buffering';
        break;
      case State.Error:
        mappedState = 'error';
        break;
      default:
        mappedState = 'stopped';
    }

    this.updatePlayerState(mappedState);
  }

  async loadStream(url: string, config?: RadioConfig): Promise<void> {
    try {
      console.log('[TrackPlayerService] Loading stream:', url);

      if (config) {
        this.currentConfig = config;
      }

      // Get artwork from settings
      const settings = await SettingsService.getSettings();
      const artwork = settings.playerLogoUrl;

      // Clear existing queue
      await TrackPlayer.reset();

      // Add stream as a track
      await TrackPlayer.add({
        url: url,
        title: 'Trend Ankara',
        artist: 'Canlı Yayın',
        artwork: artwork || undefined,
        isLiveStream: true, // Important for live streams!
      });

      console.log('[TrackPlayerService] Stream loaded successfully');
      this.updatePlayerState('buffering');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to load stream:', error);
      this.updatePlayerState('error');
      this.notifyError(error as Error);
      throw error;
    }
  }

  /**
   * Update now playing metadata WITHOUT interrupting playback
   * This is the key advantage over expo-video!
   */
  async updateNowPlayingInfo(nowPlaying: {
    title?: string;
    artist?: string;
    song?: string;
  } | null): Promise<void> {
    if (!nowPlaying || !(nowPlaying.song || nowPlaying.title)) {
      console.log('[TrackPlayerService] Skipping metadata update - missing data');
      return;
    }

    try {
      const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
      if (currentTrackIndex === undefined) {
        console.log('[TrackPlayerService] No active track to update');
        return;
      }

      // Build display strings
      const titleString = nowPlaying.song || nowPlaying.title || 'Trend Ankara';
      const artistString = nowPlaying.artist || 'Canlı Yayın';

      console.log('[TrackPlayerService] Updating metadata:', {
        title: titleString,
        artist: artistString,
      });

      // Update metadata - NO PLAYBACK INTERRUPTION!
      await TrackPlayer.updateMetadataForTrack(currentTrackIndex, {
        title: titleString,
        artist: artistString,
      });

      console.log('[TrackPlayerService] Metadata updated successfully');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to update metadata:', error);
      // Don't throw - metadata update failure shouldn't break playback
    }
  }

  /**
   * Start metadata polling (for iOS, since AudioCommonMetadataReceived is Android-only)
   */
  private startMetadataPolling(metadataUrl: string): void {
    if (this.metadataUpdateInterval) {
      clearInterval(this.metadataUpdateInterval);
    }

    // Only needed for iOS - Android gets metadata from the stream
    if (Platform.OS === 'ios') {
      this.metadataUpdateInterval = setInterval(async () => {
        try {
          const response = await fetch(metadataUrl, {
            headers: { 'Cache-Control': 'no-cache' },
          });
          const data = await response.json();

          if (data.nowPlaying) {
            const parts = data.nowPlaying.split(' - ');
            await this.updateNowPlayingInfo({
              song: parts[0]?.trim(),
              artist: parts[1]?.trim(),
              title: data.nowPlaying,
            });
          }
        } catch (error) {
          console.error('[TrackPlayerService] Metadata polling error:', error);
        }
      }, 5000); // Poll every 5 seconds
    }
  }

  private stopMetadataPolling(): void {
    if (this.metadataUpdateInterval) {
      clearInterval(this.metadataUpdateInterval);
      this.metadataUpdateInterval = null;
    }
  }

  async play(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('TrackPlayerService not initialized');
    }

    try {
      await TrackPlayer.play();
      console.log('[TrackPlayerService] Playback started');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to start playback:', error);
      this.updatePlayerState('error');
      this.notifyError(error as Error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      await TrackPlayer.pause();
      console.log('[TrackPlayerService] Playback paused');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to pause playback:', error);
      this.notifyError(error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await TrackPlayer.stop();
      await TrackPlayer.reset();
      this.stopMetadataPolling();
      this.updatePlayerState('stopped');
      this.currentConfig = null;
      console.log('[TrackPlayerService] Playback stopped');
    } catch (error) {
      console.error('[TrackPlayerService] Failed to stop playback:', error);
      this.notifyError(error as Error);
    }
  }

  async togglePlayPause(): Promise<void> {
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Playing) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  get isPlaying(): boolean {
    return this.playerState === 'playing';
  }

  async setVolume(value: number): Promise<void> {
    await TrackPlayer.setVolume(Math.max(0, Math.min(1, value)));
  }

  async cleanup(): Promise<void> {
    await this.stop();
    this.stateListeners.clear();
    this.errorListeners.clear();
    this.stopMetadataPolling();

    // Reset player
    await TrackPlayer.reset();
    this.isInitialized = false;
  }

  // State management methods (same as VideoPlayerService)
  private updatePlayerState(state: PlayerStateType): void {
    this.playerState = state;
    this.notifyStateListeners(state);
  }

  private notifyStateListeners(state: PlayerStateType): void {
    this.stateListeners.forEach((listener) => listener(state));
  }

  private notifyError(error: Error): void {
    this.errorListeners.forEach((listener) => listener(error));
  }

  addStateListener(listener: (state: PlayerStateType) => void): void {
    this.stateListeners.add(listener);
    listener(this.playerState);
  }

  removeStateListener(listener: (state: PlayerStateType) => void): void {
    this.stateListeners.delete(listener);
  }

  addErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.add(listener);
  }

  removeErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.delete(listener);
  }

  onStateChange(listener: (state: PlayerStateType) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.playerState);
    return () => this.stateListeners.delete(listener);
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  get currentState(): PlayerStateType {
    return this.playerState;
  }

  getState(): PlayerStateType {
    return this.playerState;
  }

  get radioConfig(): RadioConfig | null {
    return this.currentConfig;
  }
}

// Create and export singleton instance
const trackPlayerService = new TrackPlayerService();
export default trackPlayerService;
```

### 8.3 Updated RadioPlayerControls Component

**File:** `components/radio/RadioPlayerControls.tsx` (Updated to support both systems)

```typescript
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import videoPlayerService from '@/services/audio/VideoPlayerService';
import trackPlayerService from '@/services/audio/TrackPlayerService';
import { FEATURES } from '@/constants/config';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import type { PlayerStateType } from '@/types/models';

interface RadioPlayerControlsProps {
  streamUrl: string;
  metadataUrl?: string;
  onError?: (error: Error) => void;
  onStateChange?: (state: PlayerStateType) => void;
  style?: any;
  compact?: boolean;
}

export const RadioPlayerControls: React.FC<RadioPlayerControlsProps> = ({
  streamUrl,
  metadataUrl,
  onError,
  onStateChange,
  style,
  compact = false,
}) => {
  const [playerState, setPlayerState] = useState<PlayerStateType>('stopped');
  const [isInitializing, setIsInitializing] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get now playing info from metadata endpoint
  const { nowPlaying } = useNowPlaying(metadataUrl);

  // Determine which player to use based on feature flag
  const useTrackPlayer = FEATURES.USE_TRACK_PLAYER === true;
  const playerService = useTrackPlayer ? trackPlayerService : videoPlayerService;

  // Update player metadata when nowPlaying changes
  useEffect(() => {
    console.log('[RadioPlayerControls] nowPlaying updated:', nowPlaying);

    if (nowPlaying && (nowPlaying.song || nowPlaying.title)) {
      // Update the player service with new metadata
      // TrackPlayerService will update WITHOUT interruption
      // VideoPlayerService will use static metadata (current behavior)
      playerService.updateNowPlayingInfo(nowPlaying);
    }
  }, [nowPlaying, playerService]);

  // Notify parent component when player state changes
  useEffect(() => {
    onStateChange?.(playerState);
  }, [playerState, onStateChange]);

  useEffect(() => {
    initializeAudio();

    return () => {
      playerService.stop();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      setIsInitializing(true);

      await playerService.initialize();

      playerService.addStateListener((state) => {
        setPlayerState(state);
      });

      playerService.addErrorListener((error) => {
        console.error('[RadioPlayerControls] Player error:', error);
        onError?.(error);
      });

      setIsInitializing(false);
      console.log('[RadioPlayerControls] Player initialized:',
        useTrackPlayer ? 'TrackPlayer' : 'VideoPlayer'
      );
    } catch (error) {
      console.error('[RadioPlayerControls] Failed to initialize audio:', error);
      setIsInitializing(false);
      onError?.(error as Error);
    }
  };

  const handlePlayPause = async () => {
    try {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const actualPlayerState = playerService.getState();

      if (actualPlayerState === 'stopped' || actualPlayerState === 'error') {
        setPlayerState('buffering');
        await playerService.loadStream(streamUrl);
        await playerService.play();
        console.log('[RadioPlayerControls] Stream loaded and playing');
      } else if (actualPlayerState === 'playing') {
        await playerService.pause();
      } else if (actualPlayerState === 'paused' || actualPlayerState === 'buffering') {
        await playerService.play();
      }
    } catch (error) {
      console.error('[RadioPlayerControls] Failed to toggle playback:', error);
      setPlayerState('error');
      onError?.(error as Error);
    }
  };

  const handleStop = async () => {
    try {
      await playerService.stop();
      setPlayerState('stopped');
    } catch (error) {
      console.error('[RadioPlayerControls] Failed to stop playback:', error);
      onError?.(error as Error);
    }
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await playerService.setVolume(newMuted ? 0 : volume);
  };

  const getPlayPauseIcon = () => {
    switch (playerState) {
      case 'playing':
        return 'pause';
      case 'buffering':
        return 'hourglass';
      default:
        return 'play';
    }
  };

  const getStateText = () => {
    switch (playerState) {
      case 'playing':
        return 'CANLI YAYIN';
      case 'paused':
        return 'DURAKLATILDI';
      case 'buffering':
        return 'YÜKLENİYOR...';
      case 'error':
        return 'BAĞLANTI HATASI';
      default:
        return 'BAŞLAT';
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={handlePlayPause}
          disabled={isInitializing}
        >
          {isInitializing || playerState === 'buffering' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={getPlayPauseIcon()} size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* State Display */}
      <View
        style={[
          styles.stateContainer,
          isDark && styles.stateContainerDark,
          playerState === 'playing' && styles.stateContainerActive,
        ]}
      >
        <View
          style={[
            styles.stateIndicator,
            playerState === 'playing' && styles.stateActive,
          ]}
        />
        <Text
          style={[
            styles.stateText,
            isDark && styles.stateTextDark,
            playerState === 'playing' && styles.stateTextActive,
          ]}
        >
          {getStateText()}
        </Text>
      </View>

      {/* Main Control Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            playerState === 'playing' && styles.mainButtonActive,
            playerState === 'error' && styles.mainButtonError,
          ]}
          onPress={handlePlayPause}
          disabled={isInitializing}
        >
          {isInitializing || playerState === 'buffering' ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Ionicons name={getPlayPauseIcon()} size={48} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity
          style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
          onPress={handleStop}
        >
          <Ionicons name="stop" size={20} color={isDark ? '#E6E6E6' : '#666666'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={20}
            color={isDark ? '#E6E6E6' : '#666666'}
          />
        </TouchableOpacity>
      </View>

      {/* Now Playing Info */}
      <View
        style={[
          styles.nowPlayingContainer,
          isDark && styles.nowPlayingContainerDark,
          playerState === 'playing' && styles.nowPlayingContainerActive,
        ]}
      >
        <View
          style={[
            styles.nowPlayingIndicator,
            playerState === 'playing' && styles.nowPlayingIndicatorActive,
          ]}
        />
        <View style={styles.nowPlayingTextContainer}>
          {nowPlaying?.song || nowPlaying?.title ? (
            <>
              <Text
                style={[
                  styles.nowPlayingSong,
                  isDark && styles.nowPlayingTextDark,
                  playerState === 'playing' && styles.nowPlayingTextActive,
                ]}
                numberOfLines={1}
              >
                {nowPlaying.song || nowPlaying.title}
              </Text>
              {nowPlaying.artist && (
                <Text
                  style={[
                    styles.nowPlayingArtist,
                    isDark && styles.nowPlayingArtistDark,
                    playerState === 'playing' && styles.nowPlayingArtistActive,
                  ]}
                  numberOfLines={1}
                >
                  {nowPlaying.artist}
                </Text>
              )}
            </>
          ) : (
            <Text
              style={[
                styles.nowPlayingText,
                isDark && styles.nowPlayingTextDark,
                playerState === 'playing' && styles.nowPlayingTextActive,
              ]}
            >
              {useTrackPlayer
                ? 'Şarkı bilgisi yükleniyor...'
                : 'Trend Ankara - Canlı Yayın'}
            </Text>
          )}
        </View>
      </View>

      {/* Player Type Indicator (for debugging) */}
      {__DEV__ && (
        <Text style={styles.debugText}>
          Player: {useTrackPlayer ? 'TrackPlayer' : 'VideoPlayer'}
        </Text>
      )}
    </View>
  );
};

// Styles remain the same...
const styles = StyleSheet.create({
  // ... (keep existing styles)
  debugText: {
    marginTop: 8,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
});

export default RadioPlayerControls;
```

### 8.4 Updated Feature Flags

**File:** `constants/config.ts`

```typescript
export const FEATURES = {
  /**
   * Enable mounted state checks in components
   */
  USE_MOUNTED_STATE: true,

  /**
   * Use VideoPlayerService exclusively for audio
   * When false, falls back to previous dual system implementation
   */
  USE_VIDEO_PLAYER_ONLY: true,

  /**
   * Use TrackPlayerService instead of VideoPlayerService
   * When true, uses react-native-track-player for seamless metadata updates
   * When false, uses expo-video (current implementation)
   */
  USE_TRACK_PLAYER: false, // Set to true to enable TrackPlayerService

  /**
   * Show empty state components when no data
   */
  SHOW_EMPTY_STATES: true,
} as const;
```

---

## 9. Platform-Specific Considerations

### Android

#### Advantages
✅ **Native Metadata Events:** Android supports `Event.AudioCommonMetadataReceived`, which automatically detects metadata changes from Shoutcast/Icecast streams
✅ **Caching:** Supports media caching for better performance
✅ **More buffering options:** Fine-grained control over buffering behavior

#### Configuration
```typescript
await TrackPlayer.setupPlayer({
  autoUpdateMetadata: true,
  autoHandleInterruptions: true,
  androidAudioContentType: AndroidAudioContentType.Music,
  maxBuffer: 50, // seconds
  minBuffer: 15, // seconds
  playBuffer: 2.5, // seconds
});
```

### iOS

#### Limitations
⚠️ **No Native Metadata Events:** iOS doesn't support `Event.AudioCommonMetadataReceived`
⚠️ **No Caching:** Media caching not supported
⚠️ **Limited Buffering Control:** Some buffer settings don't apply

#### Workaround for Metadata
Use polling approach (already implemented in your `useNowPlaying` hook):

```typescript
// iOS: Poll metadata endpoint every 5 seconds
setInterval(async () => {
  const response = await fetch(metadataUrl);
  const data = await response.json();

  await TrackPlayer.updateMetadataForTrack(0, {
    title: data.nowPlaying,
    artist: data.artist,
  });
}, 5000);
```

#### Configuration
```typescript
await TrackPlayer.setupPlayer({
  autoUpdateMetadata: true,
  autoHandleInterruptions: true,
  iosCategory: IOSCategory.Playback,
  iosCategoryOptions: [], // Can add options like .mixWithOthers
  iosCategoryMode: IOSCategoryMode.Default,
});
```

### Background Audio (Both Platforms)

Your `app.json` already has the correct configuration:

**iOS:** ✅ `UIBackgroundModes: ["audio"]`
**Android:** ✅ `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission

---

## 10. Migration Strategy

### Phase 1: Setup (1-2 hours)

1. ✅ Install react-native-track-player
2. ✅ Add plugin to app.json
3. ✅ Rebuild development client
4. ✅ Create PlaybackService.ts
5. ✅ Register playback service in index.js

### Phase 2: Implementation (2-3 hours)

1. ✅ Create TrackPlayerService.ts (parallel to VideoPlayerService.ts)
2. ✅ Add `USE_TRACK_PLAYER` feature flag to config
3. ✅ Update RadioPlayerControls to support both systems
4. ✅ Test basic playback with TrackPlayerService

### Phase 3: Testing (2-3 hours)

1. ✅ Test basic playback (play, pause, stop)
2. ✅ Test background playback
3. ✅ Test lock screen/notification controls
4. ✅ Test metadata updates (the critical feature!)
5. ✅ Test on both iOS and Android
6. ✅ Verify no audio interruption during metadata updates

### Phase 4: Gradual Rollout

**Week 1:** Internal testing
- Enable `USE_TRACK_PLAYER: true` for dev builds only
- Test all scenarios
- Verify metadata updates work seamlessly

**Week 2:** Beta testing
- Enable for beta users
- Monitor for issues
- Collect feedback

**Week 3:** Production rollout
- Enable for all users
- Monitor analytics and error rates
- Keep VideoPlayerService as fallback

### Phase 5: Cleanup (Optional)

After 2-3 weeks of stable TrackPlayer operation:
- Remove VideoPlayerService.ts
- Remove expo-video dependency
- Remove `USE_VIDEO_PLAYER_ONLY` feature flag
- Keep only `USE_TRACK_PLAYER` system

---

## 11. Testing & Validation

### Test Checklist

#### Basic Playback
- [ ] Stream loads successfully
- [ ] Play button starts playback
- [ ] Pause button pauses playback
- [ ] Stop button stops playback
- [ ] Volume control works
- [ ] Mute/unmute works

#### Background Playback
- [ ] Audio continues when app is backgrounded
- [ ] Audio continues when screen is locked
- [ ] Playback survives app switching

#### Native Controls
- [ ] Lock screen controls appear (iOS)
- [ ] Control center shows player (iOS)
- [ ] Notification shows player (Android)
- [ ] Play/pause from lock screen works
- [ ] Play/pause from notification works
- [ ] Bluetooth controls work (if available)

#### Metadata Updates (Critical!)
- [ ] Initial metadata displays correctly
- [ ] Metadata updates when song changes
- [ ] **NO audio interruption during metadata update** 🎯
- [ ] Lock screen/notification reflects new metadata
- [ ] Multiple rapid metadata updates handled gracefully

#### Error Handling
- [ ] Network error shows error state
- [ ] Stream interruption handled gracefully
- [ ] Recovery from error works
- [ ] Error listeners fire correctly

#### Platform-Specific
**Android:**
- [ ] Notification customization works
- [ ] Foreground service runs correctly
- [ ] AudioCommonMetadataReceived event fires (if stream supports it)

**iOS:**
- [ ] Audio session category correct
- [ ] Interruptions handled (phone calls, etc.)
- [ ] Metadata polling works correctly

### Test Scenarios

#### Scenario 1: Normal Playback with Metadata Updates
```
1. Open app
2. Press play
3. Wait for stream to start
4. Wait for first metadata update (~5 seconds)
5. Verify: Audio continues without interruption ✅
6. Verify: Lock screen shows new song info ✅
7. Wait for second metadata update
8. Verify: Audio continues without interruption ✅
```

#### Scenario 2: Background Playback
```
1. Start playback
2. Lock device
3. Wait for metadata update
4. Unlock device
5. Verify: Audio continued during lock ✅
6. Verify: Metadata updated on lock screen ✅
```

#### Scenario 3: Rapid Metadata Changes
```
1. Start playback
2. Simulate rapid metadata updates (modify polling interval to 1s)
3. Verify: Audio remains stable ✅
4. Verify: No crashes or stuttering ✅
```

---

## 12. Rollback Plan

### Quick Rollback (< 5 minutes)

If issues are discovered after enabling TrackPlayer:

```typescript
// constants/config.ts
export const FEATURES = {
  USE_VIDEO_PLAYER_ONLY: true,
  USE_TRACK_PLAYER: false, // ← Change this to false
  // ...
};
```

**Result:** App immediately reverts to VideoPlayerService (expo-video) with static metadata.

### Gradual Rollback

If partial issues are discovered:

1. **Option A:** Keep TrackPlayer for Android, use VideoPlayer for iOS
   ```typescript
   const useTrackPlayer = Platform.OS === 'android' && FEATURES.USE_TRACK_PLAYER;
   ```

2. **Option B:** Use TrackPlayer but disable metadata updates
   ```typescript
   // In TrackPlayerService
   async updateNowPlayingInfo() {
     if (!FEATURES.ENABLE_METADATA_UPDATES) {
       return; // Skip metadata updates
     }
     // ... rest of implementation
   }
   ```

3. **Option C:** Remove TrackPlayer entirely
   - Uninstall: `npm uninstall react-native-track-player`
   - Remove from app.json plugins
   - Delete TrackPlayerService.ts
   - Delete PlaybackService.ts
   - Rebuild app

---

## 13. Resources & References

### Official Documentation
- 📚 Main Docs: https://rntp.dev/
- 📖 Installation: https://rntp.dev/docs/basics/installation
- 🚀 Getting Started: https://rntp.dev/docs/basics/getting-started
- 🎯 Playback Service: https://rntp.dev/docs/basics/playback-service
- 📱 Platform Support: https://rntp.dev/docs/basics/platform-support

### API Reference
- 🎵 Player Functions: https://rntp.dev/docs/api/functions/player
- 📋 Queue Functions: https://rntp.dev/docs/api/functions/queue
- 🔄 Lifecycle Functions: https://rntp.dev/docs/api/functions/lifecycle
- 🎭 Events: https://rntp.dev/docs/api/events
- 🪝 Hooks: https://rntp.dev/docs/api/hooks

### Objects & Constants
- 🎼 Track Object: https://rntp.dev/docs/api/objects/track
- ⚙️ Player Options: https://rntp.dev/docs/api/objects/player-options
- 📊 Update Options: https://rntp.dev/docs/api/objects/update-options
- 🎛️ Capabilities: https://rntp.dev/docs/api/constants/capability
- 📻 State Constants: https://rntp.dev/docs/api/constants/state

### Community Resources
- 💬 GitHub Repo: https://github.com/doublesymmetry/react-native-track-player
- 🐛 Issue #636 (Shoutcast Metadata): https://github.com/doublesymmetry/react-native-track-player/issues/636
- 🐛 Issue #1038 (Metadata Extension): https://github.com/doublesymmetry/react-native-track-player/issues/1038
- 💡 Discord Community: Join via GitHub repo

### Package Managers
- 📦 NPM: https://www.npmjs.com/package/react-native-track-player
- 📦 Current Version: 4.1.2 (August 2025)

### Related Articles
- 📝 LogRocket Guide: https://blog.logrocket.com/react-native-track-player-complete-guide/
- 📝 Scaler Tutorial: https://www.scaler.com/topics/react-native-track-player/
- 📝 AddJam Tutorial: https://addjam.com/blog/2025-04-04/playing-audio-in-react-native/

---

## Conclusion

### Summary

react-native-track-player provides the **exact solution** you need for updating Shoutcast metadata without audio interruption. The `updateMetadataForTrack()` function is specifically designed for this use case.

### Key Benefits

✅ **No Audio Interruption** - Seamless metadata updates
✅ **Better API** - Purpose-built for audio playback
✅ **Native Integration** - Better media controls support
✅ **Active Community** - 3.6k stars, well-maintained
✅ **Comprehensive Features** - Queue management, hooks, events
✅ **Easy Migration** - Similar API to your current VideoPlayerService

### Recommendation

**Proceed with implementation** using the feature flag approach outlined in this report. This allows you to:

1. ✅ Implement TrackPlayerService in parallel to VideoPlayerService
2. ✅ Test thoroughly in development
3. ✅ Gradually roll out to users
4. ✅ Quickly rollback if needed
5. ✅ Eventually remove VideoPlayerService when confident

### Next Steps

1. **Week 1:** Implement TrackPlayerService and PlaybackService
2. **Week 2:** Test on both platforms, verify metadata updates
3. **Week 3:** Enable for beta users
4. **Week 4:** Monitor and prepare for full rollout

---

**Report Prepared By:** Claude
**Date:** 2025-10-01
**Version:** 1.0
**Status:** Ready for Implementation
