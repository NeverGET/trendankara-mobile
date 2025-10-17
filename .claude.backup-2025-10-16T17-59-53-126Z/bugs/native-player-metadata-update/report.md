# Bug Report

## Bug Summary
Native media controls (iOS Control Center/Lock Screen and Android notification) are not updating when the now playing metadata changes during Shoutcast streaming playback.

## Bug Details

### Expected Behavior
When the Shoutcast stream metadata changes (new song/artist information), the native media player controls should automatically update to display the current song and artist information in:
- **iOS**: Lock screen and Control Center
- **Android**: Media notification

### Actual Behavior
The native media controls remain static and do not refresh when new metadata arrives from the Shoutcast stream. The initial metadata (or "Trend Ankara" placeholder) stays displayed even though the `nowPlaying` state is updating correctly in the app UI.

### Steps to Reproduce
1. Open the app and start playing the radio stream
2. Wait for the Shoutcast metadata to update (polls every 5 seconds via `useNowPlaying` hook)
3. Observe the app UI updates with new song/artist information
4. Check the native media controls (iOS Control Center or Android notification)
5. Notice that the native controls still show the old/initial metadata

### Environment
- **Version**: Current mobile app (expo-video integration)
- **Platform**: iOS and Android
- **Configuration**:
  - Using `expo-video` with `VideoPlayer.showNowPlayingNotification = true`
  - Shoutcast streaming URL: https://radyo.yayin.com.tr:5132/
  - Metadata URL: Fetched every 5 seconds via `useNowPlaying` hook
  - Using `VideoPlayerService` singleton for audio management

## Impact Assessment

### Severity
- [x] High - Major functionality broken
- [ ] Critical - System unusable
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
All users who:
- Listen to the radio stream in the background
- Use lock screen/Control Center (iOS) or notification controls (Android)
- Want to see current song information while multitasking

### Affected Features
- Native media controls metadata display
- Background playback user experience
- "Now Playing" information synchronization between app UI and OS-level controls

## Additional Context

### Error Messages
No error messages or exceptions are thrown. The metadata update methods execute without errors, but the native controls simply don't refresh visually.

### Screenshots/Media
- App UI correctly shows updated song information
- Native controls remain stuck with old/initial metadata

### Related Issues
- Similar issue documented in expo-video GitHub discussions
- Known limitation: Native controls don't auto-refresh on metadata changes
- Requires forced update strategy using `player.replace()` method

## Initial Analysis

### Suspected Root Cause
The `expo-video` library's `showNowPlayingNotification` does not automatically refresh the native media controls when metadata changes. The controls are only updated when:
1. The player is first created
2. The source is replaced using `player.replace()`

Current implementation in `VideoPlayerService.updateNowPlayingInfo()` (lines 140-229) attempts platform-specific workarounds:
- **Android**: Toggles `showNowPlayingNotification` off/on
- **iOS**: Uses `replace()` method with updated metadata

However, these workarounds are not working consistently on both platforms.

### Affected Components
**Primary:**
- `services/audio/VideoPlayerService.ts` - Lines 140-229 (`updateNowPlayingInfo` method)
- `hooks/useNowPlaying.ts` - Metadata fetching hook
- `components/radio/RadioPlayerControls.tsx` - Lines 50-58 (calls `updateNowPlayingInfo`)

**Supporting:**
- Native media controls (iOS/Android)
- `expo-video` library integration

### Additional Notes
- User has provided documentation suggesting to use `player.replace()` with updated metadata
- Current implementation already attempts this but timing or execution method may be incorrect
- May need to investigate `player.replaceAsync()` vs `player.replace()` behavior
- Android may require longer delay (currently 100ms) before re-enabling notification
- iOS may require audio session reconfiguration (currently not implemented)

### Technical Constraints
- **Cannot use**: `expo-av` or `expo-audio` (deprecated)
- **Must use**: `expo-video` with native controls support
- **Must support**: Both iOS and Android with platform-specific implementations
