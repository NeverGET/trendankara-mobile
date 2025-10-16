# React Native Track Player Setup Guide

## Problem Overview

When implementing `react-native-track-player` v4.1.2 for audio streaming, media controller play/pause buttons in the notification shade and lock screen were not functioning, even though:
- Media controls were visible in notification and lock screen
- Now playing metadata was displaying correctly
- The PlaybackService was properly registered

Pressing play/pause buttons on the media controller had no effect on playback.

## Root Cause Analysis

### Android: The Issue

react-native-track-player's default configuration uses:
```kotlin
interceptPlayerActionsTriggeredExternally = true
```

This setting intercepts all media control actions (play, pause, next, previous, stop) and routes them through JavaScript via HeadlessJsTaskService. The flow is:

1. User presses play/pause on media controller
2. MediaSession receives the action
3. Action is intercepted (not executed)
4. Event is emitted to JavaScript via ReactContext
5. JavaScript handles the event and calls native methods

**The problem**: This flow fails when ReactContext is null, which commonly occurs:
- During service startup
- When app is backgrounded
- Before React Native is fully initialized

### Android: Evidence from Logs

```
10-02 19:37:40.850 D MusicService: Media control event received: MediaSessionCallback$PAUSE
10-02 19:37:40.850 D MusicService: Emitting BUTTON_PAUSE (remote-pause) event
10-02 19:37:40.851 E MusicService: ReactContext is null, cannot emit event: remote-pause
```

The events were being received and emitted, but couldn't reach JavaScript.

### iOS: The Issue

iOS has a similar architectural issue in the remote command handlers. The default implementation in RNTrackPlayer.swift:

```swift
player.remoteCommandController.handlePauseCommand = { [weak self] _ in
    self?.emit(event: EventType.RemotePause)  // Only emits event
    return MPRemoteCommandHandlerStatus.success
}
```

The flow is:
1. User presses play/pause on lock screen or Control Center
2. MPRemoteCommandCenter receives the action
3. Handler emits event to JavaScript via RCTEventEmitter
4. Handler returns success (without actually controlling playback)
5. JavaScript receives event and calls native methods

**The problem**: This creates a race condition and indirect control flow:
- Media controls update UI state but playback continues
- JavaScript must receive event and call back to native code to actually control playback
- If JavaScript is busy or slow, playback state becomes inconsistent with UI state

### iOS: Evidence from Behavior

User reported: "on ios we have similar problem. but a bit interesting. the native media control play/pause button triggers some stuff like changes state on player tab(the app play button become paused state, the badges colors changes) but music keeps playing"

This confirms:
- Events were being emitted to JavaScript ✓
- JavaScript was updating UI state ✓
- Native playback was NOT being controlled ✗

Additional issue discovered through logging:
- Duplicate remote event listeners in TrackPlayerService.ts were intercepting events before PlaybackService could handle them
- PlaybackService was initially calling VideoPlayerService instead of TrackPlayer methods

## The Solution

### Architecture Change

Change the architecture to match `expo-video`'s approach: let the underlying MediaSession handle standard actions automatically rather than routing through JavaScript.

**Key Configuration Change** in `MusicService.kt:144`:

```kotlin
// BEFORE (BROKEN)
val playerConfig = PlayerConfig(
    interceptPlayerActionsTriggeredExternally = true,  // Routes to JavaScript
    handleAudioBecomingNoisy = true,
    handleAudioFocus = true
)

// AFTER (FIXED)
val playerConfig = PlayerConfig(
    interceptPlayerActionsTriggeredExternally = false,  // Let MediaSession handle automatically
    handleAudioBecomingNoisy = true,
    handleAudioFocus = true
)
```

### How It Works

With `interceptPlayerActionsTriggeredExternally = false`:

1. User presses play/pause on media controller
2. MediaSession receives the action
3. MediaSession **automatically executes** the action on the player
4. Playback state changes immediately
5. Events are still emitted to JavaScript (when ReactContext is available) for app logic

This approach:
- ✅ Works immediately, even when ReactContext is null
- ✅ Provides responsive media controls
- ✅ Still allows JavaScript to react to events when available
- ✅ Matches the architecture used by expo-video

## Step-by-Step Implementation

### 1. Modify MusicService.kt

**File**: `node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt`

**Line 144**, change the PlayerConfig:

```kotlin
val playerConfig = PlayerConfig(
    interceptPlayerActionsTriggeredExternally = false,  // Changed from true
    handleAudioBecomingNoisy = true,
    handleAudioFocus = true
)
```

### 2. Modify RNTrackPlayer.swift (iOS)

**File**: `node_modules/react-native-track-player/ios/RNTrackPlayer/RNTrackPlayer.swift`

iOS requires three remote command handler modifications to directly control playback before emitting events. This matches the architectural change made on Android.

#### handlePauseCommand (Line ~226)

**BEFORE (Broken)**:
```swift
player.remoteCommandController.handlePauseCommand = { [weak self] _ in
    self?.emit(event: EventType.RemotePause)  // Only emits, doesn't pause
    return MPRemoteCommandHandlerStatus.success
}
```

**AFTER (Fixed)**:
```swift
player.remoteCommandController.handlePauseCommand = { [weak self] _ in
    // Directly pause playback to ensure immediate response
    // Similar to Android's interceptPlayerActionsTriggeredExternally = false
    self?.player.pause()  // ✓ Actually pauses playback
    self?.emit(event: EventType.RemotePause)  // Then emits event
    return MPRemoteCommandHandlerStatus.success
}
```

#### handlePlayCommand (Line ~234)

**BEFORE (Broken)**:
```swift
player.remoteCommandController.handlePlayCommand = { [weak self] _ in
    self?.emit(event: EventType.RemotePlay)  // Only emits, doesn't play
    return MPRemoteCommandHandlerStatus.success
}
```

**AFTER (Fixed)**:
```swift
player.remoteCommandController.handlePlayCommand = { [weak self] _ in
    // Directly start playback to ensure immediate response
    // Similar to Android's interceptPlayerActionsTriggeredExternally = false
    self?.player.play()  // ✓ Actually starts playback
    self?.emit(event: EventType.RemotePlay)  // Then emits event
    return MPRemoteCommandHandlerStatus.success
}
```

#### handleTogglePlayPauseCommand (Line ~272)

**BEFORE (Broken)**:
```swift
player.remoteCommandController.handleTogglePlayPauseCommand = { [weak self] _ in
    self?.emit(event: EventType.RemoteTogglePlayPause)  // Only emits, doesn't toggle
    return MPRemoteCommandHandlerStatus.success
}
```

**AFTER (Fixed)**:
```swift
player.remoteCommandController.handleTogglePlayPauseCommand = { [weak self] _ in
    // Directly toggle playback to ensure immediate response
    // Similar to Android's interceptPlayerActionsTriggeredExternally = false
    if self?.player.playerState == .paused {
        self?.player.play()  // ✓ Actually plays
        self?.emit(event: EventType.RemotePlay)
    } else {
        self?.player.pause()  // ✓ Actually pauses
        self?.emit(event: EventType.RemotePause)
    }
    return MPRemoteCommandHandlerStatus.success
}
```

**Key Changes**:
- All handlers now call `self?.player.play()` or `self?.player.pause()` BEFORE emitting events
- This ensures playback is controlled immediately, regardless of JavaScript state
- Events are still emitted for app-level state management
- Matches the Android architectural fix (direct native control)

### 3. JavaScript-Side Fixes

In addition to native code changes, several JavaScript-level issues were discovered and fixed during iOS testing.

#### Fix 1: Remove Duplicate Remote Event Listeners in TrackPlayerService

**File**: `services/audio/TrackPlayerService.ts`

**Problem**: TrackPlayerService was adding its own remote event listeners, which intercepted events before PlaybackService could handle them.

**Location**: Lines 110-123 (in the `setupEventListeners` method)

**REMOVE these duplicate listeners**:
```typescript
// REMOVE - These interfere with PlaybackService!
TrackPlayer.addEventListener(Event.RemotePlay, async () => {
  console.log('[TrackPlayerService] Remote play triggered');
  await this.play();
});

TrackPlayer.addEventListener(Event.RemotePause, async () => {
  console.log('[TrackPlayerService] Remote pause triggered');
  await this.pause();
});

TrackPlayer.addEventListener(Event.RemoteStop, async () => {
  console.log('[TrackPlayerService] Remote stop triggered');
  await this.stop();
});
```

**ADD this documentation comment instead**:
```typescript
// NOTE: Remote control events (RemotePlay, RemotePause, RemoteStop) are handled
// in PlaybackService.ts, which is registered via TrackPlayer.registerPlaybackService()
// in index.js. Do NOT add duplicate event listeners here as they will interfere
// with the PlaybackService handlers.
```

**Why**: PlaybackService is registered as the headless service and is the proper place to handle remote events. Having duplicate listeners creates race conditions.

#### Fix 2: Ensure PlaybackService Calls TrackPlayer Methods

**File**: `services/audio/PlaybackService.ts`

**Problem**: PlaybackService was initially calling VideoPlayerService methods instead of TrackPlayer methods.

**CORRECT Implementation**:
```typescript
import TrackPlayer, { Event } from 'react-native-track-player';

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('[PlaybackService] Remote play event received');
    try {
      await TrackPlayer.play();  // ✓ Call TrackPlayer directly
      console.log('[PlaybackService] TrackPlayer.play() completed');
    } catch (error) {
      console.error('[PlaybackService] Failed to play:', error);
    }
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log('[PlaybackService] Remote pause event received');
    try {
      await TrackPlayer.pause();  // ✓ Call TrackPlayer directly
      console.log('[PlaybackService] TrackPlayer.pause() completed');
    } catch (error) {
      console.error('[PlaybackService] Failed to pause:', error);
    }
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    try {
      await TrackPlayer.stop();  // ✓ Call TrackPlayer directly
    } catch (error) {
      console.error('[PlaybackService] Failed to stop:', error);
    }
  });
};
```

**Why**: With native fixes in place, PlaybackService should call TrackPlayer methods directly. The native handlers will execute the playback control first, then emit events that PlaybackService receives for app-level state management.

### 4. Artwork Bundling for Production Builds

**File**: `constants/artwork.ts` (NEW FILE)

**Problem**: Remote URLs and file:// paths for artwork don't work reliably in production builds. The artwork needs to be bundled with the app and provided to TrackPlayer correctly.

**Solution**: Pass the `require()` result directly to TrackPlayer. TrackPlayer accepts either a number (from require()) for bundled images or a URL string for remote images.

**Create** `constants/artwork.ts`:
```typescript
/**
 * Default artwork for native media controls
 * Returns the require() result directly for TrackPlayer to use
 */

// Import the image using require() to ensure it's bundled
const DEFAULT_ARTWORK_IMAGE = require('@/assets/images/Trendankara2.png');

/**
 * Get the artwork for native media controls
 * Returns the require() result (number) for bundled images
 * This works in both dev and production builds
 */
export function getDefaultArtwork(): number {
  return DEFAULT_ARTWORK_IMAGE;
}

/**
 * Get the artwork for use in TrackPlayer metadata
 * Returns remote URL if provided, otherwise bundled image
 * TrackPlayer accepts either a URL string or a require() number
 */
export function getArtwork(remoteUrl?: string | null): string | number {
  // If a remote URL is provided and valid, use it
  if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
    return remoteUrl;
  }

  // Otherwise, use the bundled default artwork (as a number from require)
  return getDefaultArtwork();
}

export default {
  getDefaultArtwork,
  getArtwork,
};
```

**Update** `services/audio/TrackPlayerService.ts` in the `loadStream` method:
```typescript
import { getArtwork } from '@/constants/artwork';

async loadStream(url: string, config?: RadioConfig): Promise<void> {
  // ... existing code ...

  // Get artwork - uses bundled image with fallback to remote URL from settings
  const settings = await SettingsService.getSettings();
  const artwork = getArtwork(settings.playerLogoUrl);

  console.log('[TrackPlayerService] Using artwork:', typeof artwork === 'number' ? 'bundled image' : artwork);

  // Clear existing queue
  await TrackPlayer.reset();

  // Add stream as a track
  await TrackPlayer.add({
    url: url,
    title: 'Trend Ankara',
    artist: 'Canlı Yayın',
    artwork: artwork,  // ✓ Will work in production builds (number or URL string)
    isLiveStream: true,
  });
}
```

**Important - Artwork Persistence**:

The artwork must also be stored and included in all metadata updates, otherwise it will be cleared when updating song/artist info:

```typescript
// In TrackPlayerService class, add artwork tracking:
private currentArtwork: string | number | null = null;

// In loadStream method, store the artwork:
this.currentArtwork = artwork;

// In updateNowPlayingInfo method, ALWAYS include artwork:
await TrackPlayer.updateMetadataForTrack(currentTrackIndex, {
  title: titleString,
  artist: artistString,
  ...(this.currentArtwork && { artwork: this.currentArtwork }), // ✓ Prevents artwork from being cleared
});

// In stop method, clear the artwork:
this.currentArtwork = null;
```

**Why**:
- TrackPlayer accepts either a require() result (number) for bundled images OR a URL string for remote images
- Returning the require() result directly works in both development and production builds
- No need for `Image.resolveAssetSource()` - the native player handles bundled images automatically
- **CRITICAL**: Metadata updates that don't include artwork will clear the artwork from native controls
- Always include artwork in `updateMetadataForTrack()` calls to maintain persistence

### 5. Create Patch File

```bash
npx patch-package react-native-track-player
```

This creates: `patches/react-native-track-player+4.1.2.patch`

The patch file will contain all changes for both Android and iOS.

### 6. Verify postinstall Script

Ensure `package.json` has:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

### 7. Rebuild the App

For Expo Development Build:

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios --device <UDID>
# or build from Xcode if sandbox issues occur
```

**Important**: You MUST rebuild the native app (not just reload). Both Android and iOS require native rebuilds for these changes to take effect.

### 8. Test Media Controls

#### Android Testing:
1. Start playing audio
2. Pull down notification shade - media controls should appear
3. Test play/pause button - should work immediately
4. Test on lock screen - should work
5. Test when app is backgrounded - should work
6. Check that now playing metadata updates correctly
7. Check that artwork displays correctly

#### iOS Testing:
1. Start playing audio
2. Open Control Center - media controls should appear
3. Test play/pause button on Control Center - should work immediately
4. Lock device and check lock screen controls - should work
5. Test play/pause button on lock screen - should work
6. Test when app is backgrounded - should work
7. Check that now playing metadata updates correctly
8. Check that artwork displays correctly on both Control Center and lock screen

## Comparison with expo-video

### expo-video Architecture

`expo-video` uses `MediaSessionService` with automatic action handling:

```kotlin
// ExpoVideoPlaybackService.kt
class ExpoVideoPlaybackService : MediaSessionService() {
    val mediaSession = MediaSession.Builder(this, player)
        .setCallback(VideoMediaSessionCallback())  // Only for custom commands
        .build()
    // MediaSession handles play/pause automatically
}

// VideoMediaSessionCallback.kt
class VideoMediaSessionCallback : MediaSession.Callback {
    override fun onCustomCommand(...) {
        // Only handles custom commands like seek forward/backward
        // No handling of PLAY/PAUSE - MediaSession does it automatically
    }
}
```

### react-native-track-player (Fixed)

Now uses the same pattern:

```kotlin
// MusicService.kt
val playerConfig = PlayerConfig(
    interceptPlayerActionsTriggeredExternally = false,  // Like expo-video
    // ...
)

// Events still emitted to JavaScript when available
scope.launch {
    event.onPlayerActionTriggeredExternally.collect {
        when (it) {
            MediaSessionCallback.PLAY -> emit(MusicEvents.BUTTON_PLAY)
            MediaSessionCallback.PAUSE -> emit(MusicEvents.BUTTON_PAUSE)
            // ... other events
        }
    }
}
```

## Troubleshooting

### Common Issues (Both Platforms)

#### Issue: Media controls not appearing

**Check**:
1. Verify PlaybackService is registered in `app.json`:
```json
{
  "expo": {
    "plugins": [
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

2. Ensure service is started:
```typescript
await TrackPlayer.setupPlayer();
```

#### Issue: Patch not persisting

**Check**:
1. Verify `postinstall` script runs:
```bash
npm run postinstall
```

2. Check patch file exists:
```bash
ls patches/react-native-track-player+4.1.2.patch
```

3. Ensure `patch-package` is installed:
```bash
npm install --save-dev patch-package
```

### Android-Specific Issues

#### Issue: Play/pause still not working on Android

**Check**:
1. Verify patch was applied:
```bash
cat node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt | grep -A2 "val playerConfig"
```

Should show `interceptPlayerActionsTriggeredExternally = false`

2. Rebuild the native app (not just reload):
```bash
npx expo run:android
```

3. Check logs for ReactContext errors:
```bash
adb logcat | grep "ReactContext is null"
```

If you see "ReactContext is null" errors, the patch wasn't applied correctly.

### iOS-Specific Issues

#### Issue: Play/pause still not working on iOS

**Check**:
1. Verify patch was applied to all three handlers:
```bash
# Check handlePauseCommand
grep -A3 "handlePauseCommand" node_modules/react-native-track-player/ios/RNTrackPlayer/RNTrackPlayer.swift | grep "pause()"

# Check handlePlayCommand
grep -A3 "handlePlayCommand" node_modules/react-native-track-player/ios/RNTrackPlayer/RNTrackPlayer.swift | grep "play()"

# Check handleTogglePlayPauseCommand
grep -A5 "handleTogglePlayPauseCommand" node_modules/react-native-track-player/ios/RNTrackPlayer/RNTrackPlayer.swift | grep -E "(play\(\)|pause\(\))"
```

All three commands should show the player method calls.

2. Rebuild the native app (not just reload):
```bash
npx expo run:ios --device <UDID>
```

3. Check for duplicate remote event listeners:
```bash
grep -A10 "setupEventListeners" services/audio/TrackPlayerService.ts | grep "Event.Remote"
```

Should NOT show any `TrackPlayer.addEventListener(Event.RemotePlay, ...)` calls. If it does, remove them as they interfere with PlaybackService.

4. Check that PlaybackService calls TrackPlayer methods:
```bash
grep -A5 "Event.RemotePlay" services/audio/PlaybackService.ts | grep "TrackPlayer.play()"
```

Should show `await TrackPlayer.play()`, not videoPlayerService or any other service.

#### Issue: UI updates but playback continues (iOS)

**This is the classic symptom of the iOS bug.** It means:
- ✗ Native handlers are NOT calling player.play()/pause()
- ✓ Events ARE being emitted to JavaScript
- ✓ JavaScript IS updating UI state

**Fix**:
1. Re-verify the RNTrackPlayer.swift patch is applied correctly
2. Make sure you rebuilt the native app (not just reloaded)
3. Check for duplicate listeners in TrackPlayerService.ts

#### Issue: Xcode sandbox errors during build

**Error**: `Sandbox: bash(xxxxx) deny(1) file-write-create ...`

**Fix**:
```bash
# Disable sandbox for script build phases
defaults write com.apple.dt.Xcode IDEBuildOperationEnableScriptSandboxing -bool NO
```

**Alternative**: Build from Xcode directly with sandbox disabled in project settings

#### Issue: Artwork not displaying in production builds

**Symptom**: Artwork shows in development but not in release builds (both iOS and Android)

**Check**:
1. Verify artwork helper is being used:
```bash
grep "getArtwork" services/audio/TrackPlayerService.ts
```

Should show `import { getArtwork } from '@/constants/artwork'`

2. Check the artwork value in logs:
```typescript
// In TrackPlayerService.ts loadStream method
console.log('[TrackPlayerService] Using artwork:', typeof artwork === 'number' ? 'bundled image' : artwork);
```

Should log "bundled image" (if using bundled asset) or a URL string (if using remote URL).

3. Verify the image exists:
```bash
ls -la assets/images/Trendankara2.png
```

4. Common mistake - using Image.resolveAssetSource():
```typescript
// ✗ WRONG - returns URI string which doesn't work in production
const artwork = Image.resolveAssetSource(require('@/assets/images/artwork.png')).uri;

// ✓ CORRECT - return require() result directly
const artwork = require('@/assets/images/artwork.png');
```

TrackPlayer needs the require() result (a number), not a resolved URI string.

#### Issue: Artwork appears then disappears on metadata updates

**Symptom**: Artwork shows initially when starting playback, but disappears when song/artist info changes (Android and iOS)

**Root Cause**: When calling `updateMetadataForTrack()` to update song/artist, if artwork is not included, the native media controls clear the artwork.

**Fix**:
1. Store the artwork when loading the stream:
```typescript
private currentArtwork: string | number | null = null;

async loadStream(url: string, config?: RadioConfig): Promise<void> {
  const artwork = getArtwork(settings.playerLogoUrl);
  this.currentArtwork = artwork; // ✓ Store for later use
  // ...
}
```

2. Always include artwork in metadata updates:
```typescript
async updateNowPlayingInfo(nowPlaying: {...}): Promise<void> {
  await TrackPlayer.updateMetadataForTrack(currentTrackIndex, {
    title: titleString,
    artist: artistString,
    ...(this.currentArtwork && { artwork: this.currentArtwork }), // ✓ Include artwork
  });
}
```

3. Clear artwork when stopping:
```typescript
async stop(): Promise<void> {
  await TrackPlayer.stop();
  this.currentArtwork = null; // ✓ Clean up
}
```

## Testing Checklist

### Android Testing
- [ ] Media controls appear in notification shade
- [ ] Media controls appear on lock screen
- [ ] Play button works when app is backgrounded
- [ ] Pause button works when app is backgrounded
- [ ] Controls work immediately after app launch
- [ ] Controls work after device cold boot
- [ ] Now playing metadata displays correctly in notification
- [ ] Artwork displays correctly in notification shade
- [ ] Artwork displays correctly on lock screen
- [ ] No "ReactContext is null" errors in logs
- [ ] Patch verification: `interceptPlayerActionsTriggeredExternally = false` in MusicService.kt

### iOS Testing
- [ ] Media controls appear in Control Center
- [ ] Media controls appear on lock screen
- [ ] Play button works in Control Center when app is backgrounded
- [ ] Pause button works in Control Center when app is backgrounded
- [ ] Play button works on lock screen
- [ ] Pause button works on lock screen
- [ ] Controls work immediately after app launch
- [ ] Controls work after device reboot
- [ ] Now playing metadata displays correctly in Control Center
- [ ] Now playing metadata displays correctly on lock screen
- [ ] Artwork displays correctly in Control Center
- [ ] Artwork displays correctly on lock screen
- [ ] No duplicate remote event listeners in TrackPlayerService.ts
- [ ] PlaybackService calls TrackPlayer methods (not videoPlayerService)
- [ ] Patch verification: All three handlers (pause, play, toggle) call player methods

### Cross-Platform Testing
- [ ] Metadata updates don't interrupt playback
- [ ] Artwork persists across metadata updates (song/artist changes)
- [ ] Artwork displays correctly in both development and production builds
- [ ] Audio continues when app is backgrounded
- [ ] Audio continues when screen is locked
- [ ] Media controls disappear when playback is stopped
- [ ] Media controls reappear when playback restarts
- [ ] App handles phone calls correctly (audio pauses/resumes)
- [ ] Multiple app restarts work correctly

## Additional Notes

### Why This Works

The underlying `kotlin-audio` library (QueuedAudioPlayer) and Media3's MediaSession are fully capable of handling playback actions natively without JavaScript. By setting `interceptPlayerActionsTriggeredExternally = false`, we:

1. **Enable immediate response**: MediaSession executes actions directly on the player
2. **Remove dependency on ReactContext**: No need for JavaScript bridge to be ready
3. **Maintain event emissions**: JavaScript still receives events when ReactContext is available
4. **Follow Android best practices**: Native media controls should work natively

### When to Use This Configuration

✅ **Use `interceptPlayerActionsTriggeredExternally = false` when**:
- Building a radio/streaming app where controls must always work
- App needs to work immediately after launch
- Service runs independently of React Native lifecycle
- Following standard Android media app patterns

❌ **Consider `interceptPlayerActionsTriggeredExternally = true` when**:
- Need custom JavaScript logic before every action
- App controls the entire playback lifecycle
- JavaScript is always guaranteed to be running
- Need to intercept and potentially prevent actions

### Future Projects

To reproduce this complete solution in a new project, follow this checklist:

#### 1. Install Dependencies
```bash
npm install react-native-track-player
npm install --save-dev patch-package
```

#### 2. Configure app.json
```json
{
  "expo": {
    "plugins": [
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

#### 3. Create PlaybackService.ts
Create `services/audio/PlaybackService.ts` that calls TrackPlayer methods directly:
```typescript
import TrackPlayer, { Event } from 'react-native-track-player';

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await TrackPlayer.stop();
  });
};
```

#### 4. Apply Android Native Fix
Edit `node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt` (line 144):
```kotlin
val playerConfig = PlayerConfig(
    interceptPlayerActionsTriggeredExternally = false,  // Changed from true
    handleAudioBecomingNoisy = true,
    handleAudioFocus = true
)
```

#### 5. Apply iOS Native Fixes
Edit `node_modules/react-native-track-player/ios/RNTrackPlayer/RNTrackPlayer.swift`:

- Line ~226: Add `self?.player.pause()` before emit in handlePauseCommand
- Line ~234: Add `self?.player.play()` before emit in handlePlayCommand
- Line ~272: Add play/pause logic before emit in handleTogglePlayPauseCommand

#### 6. Setup Artwork Bundling
Create `constants/artwork.ts` that returns `require()` result directly (see full implementation above in Step 4)

#### 7. Avoid Duplicate Listeners
In your TrackPlayerService (or equivalent), do NOT add remote event listeners. Only add PlaybackState and PlaybackError listeners. Document with a comment that PlaybackService handles remote events.

#### 8. Create and Commit Patch
```bash
npx patch-package react-native-track-player
git add patches/
git commit -m "Add react-native-track-player media controls fix"
```

#### 9. Configure postinstall
Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

#### 10. Test Both Platforms
Follow the comprehensive testing checklist above for both Android and iOS.

This approach is sustainable across library updates - simply reapply the patch after updating react-native-track-player. The patch will show conflicts if the library code changes significantly, allowing you to review and update the fix if needed.

## References

### Libraries and Source Code
- [react-native-track-player GitHub](https://github.com/doublesymmetry/react-native-track-player)
- [react-native-track-player Documentation](https://react-native-track-player.js.org/)
- [expo-video source code](https://github.com/expo/expo/tree/sdk-54/packages/expo-video)
- [kotlin-audio library](https://github.com/doublesymmetry/kotlin-audio)
- [patch-package](https://github.com/ds300/patch-package)

### Android Documentation
- [Android MediaSession documentation](https://developer.android.com/guide/topics/media/media3/session)
- [Media3 Architecture](https://developer.android.com/media/media3)
- [Android Media Controls Guide](https://developer.android.com/guide/topics/media-apps/audio-app/building-an-audio-app)

### iOS Documentation
- [MPRemoteCommandCenter Documentation](https://developer.apple.com/documentation/mediaplayer/mpremotecommandcenter)
- [MPNowPlayingInfoCenter Documentation](https://developer.apple.com/documentation/mediaplayer/mpnowplayinginfocenter)
- [iOS Media Playback Programming Guide](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/MediaPlaybackGuide/Contents/Resources/en.lproj/Introduction/Introduction.html)
- [AVAudioSession Documentation](https://developer.apple.com/documentation/avfoundation/avaudiosession)
