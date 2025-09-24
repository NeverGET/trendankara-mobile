# Bug Report

## Bug Summary
Native OS media controls (lock screen controls, control center, notification controls) are not working with the current Shoutcast streaming implementation in the React Native Expo application.

## Bug Details

### Expected Behavior
When playing the Shoutcast radio stream, users should be able to:
- See media playback controls on the lock screen (iOS/Android)
- Control playback (play/pause) from lock screen controls
- See currently playing information (station name, logo) on lock screen
- Control playback from control center (iOS) or notification shade (Android)
- Continue playback control when app is in background

### Actual Behavior
- No media controls appear on lock screen when stream is playing
- No playback notification appears on Android
- No control center integration on iOS
- Users must return to the app to control playback
- Background playback works but without any native control interface

### Steps to Reproduce
1. Open the Trend Ankara app
2. Start playing the radio stream (https://radyo.yayin.com.tr:5132/)
3. Lock the device or minimize the app
4. Check lock screen - no media controls appear
5. Open control center (iOS) or notification shade (Android) - no playback controls visible
6. Try to pause/resume from lock screen - not possible

### Environment
- **Version**: Expo SDK 54
- **Platform**: iOS 18.6 and Android 16
- **Configuration**:
  - React Native: 0.81.4
  - expo-av: Deprecated (being replaced by expo-audio)
  - Current audio implementation: Basic streaming without native controls

## Impact Assessment

### Severity
- [x] High - Major functionality broken

### Affected Users
All iOS and Android users who want to control playback without returning to the app, especially those who:
- Listen while using other apps
- Want quick access to pause/resume
- Expect standard mobile audio app behavior

### Affected Features
- Background audio control
- Lock screen integration
- Notification/Control Center integration
- User experience for multitasking scenarios

## Additional Context

### Error Messages
No specific error messages - feature simply not implemented with current audio solution.

### Screenshots/Media
Native controls should appear like standard music apps (Spotify, Apple Music) but are completely absent.

### Related Issues
- expo-av deprecation in SDK 54 (will be removed in SDK 55)
- expo-audio lacks native control support currently
- New React Native architecture (Fabric/TurboModules) compatibility issues with audio libraries

## Initial Analysis

### Suspected Root Cause
The current audio implementation doesn't include the necessary native media session APIs:
- Missing MediaSession API integration (Android)
- Missing MPNowPlayingInfoCenter/MPRemoteCommandCenter integration (iOS)
- expo-audio (replacement for expo-av) doesn't yet support native controls

### Affected Components
- Audio playback service implementation
- Background audio configuration
- Native module integration for media controls
- App configuration for background modes