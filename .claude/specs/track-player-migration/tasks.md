# Implementation Plan - Track Player Migration

## Task Overview

This implementation follows a safe, incremental approach to add react-native-track-player as a parallel audio system alongside expo-video. Each task is atomic (1-3 files, 15-30 minutes), enabling easy tracking and rollback. The feature flag pattern allows instant switching between implementations without code changes.

**Implementation Strategy**:
1. Install dependencies and configure project
2. Create service infrastructure (TrackPlayerService, PlaybackService)
3. Integrate with existing components via feature flag
4. Test and validate on both platforms
5. Enable gradual rollout

## Steering Document Compliance

**Follows structure.md conventions**:
- Services in `services/audio/` directory
- Feature flags in `constants/config.ts`
- Minimal component changes in `components/radio/`
- TypeScript types maintained in existing files

**Follows tech.md patterns**:
- Singleton service pattern (matches VideoPlayerService)
- Listener-based state management
- Full TypeScript type safety
- No overengineering - simple feature flag toggle

## Atomic Task Requirements

**Each task meets these criteria**:
- ✅ **File Scope**: 1-3 related files maximum
- ✅ **Time Boxing**: 15-30 minutes completion time
- ✅ **Single Purpose**: One testable outcome per task
- ✅ **Specific Files**: Exact file paths specified
- ✅ **Agent-Friendly**: Clear input/output, minimal context switching

## Tasks

### Phase 1: Installation & Configuration (Tasks 1-5)

- [ ] 1. Install react-native-track-player package
  - File: `package.json`
  - Run: `npm install --save react-native-track-player@4.1.2`
  - Verify package added to dependencies section
  - Purpose: Add TrackPlayer library to project
  - _Requirements: 1.1_

- [ ] 2. Add react-native-track-player plugin to app.json
  - File: `app.json`
  - Add plugin configuration after existing expo-video plugin
  - Configuration: `["react-native-track-player", {"playbackServiceName": "PlaybackService"}]`
  - Purpose: Register TrackPlayer with Expo build system
  - _Leverage: app.json existing plugins array_
  - _Requirements: 1.2, 1.3_

- [ ] 3. Add USE_TRACK_PLAYER feature flag to config
  - File: `constants/config.ts`
  - Add new boolean flag: `USE_TRACK_PLAYER: false` to FEATURES object
  - Add JSDoc comment explaining the flag purpose
  - Purpose: Enable runtime switching between audio services
  - _Leverage: constants/config.ts existing FEATURES pattern_
  - _Requirements: 5.1_

- [ ] 4. Register PlaybackService in app entry point
  - File: `index.js` (create if doesn't exist, or modify existing entry file)
  - Import TrackPlayer and register playback service
  - Add: `TrackPlayer.registerPlaybackService(() => require('./services/audio/PlaybackService'))`
  - Purpose: Enable background playback service for TrackPlayer
  - _Requirements: 3.1_

- [ ] 5. Rebuild development client
  - Run: `npx expo prebuild --clean` (if needed)
  - Run: `npm run ios:dev` or `npm run android:dev`
  - Verify app compiles successfully on both platforms
  - Purpose: Apply native module changes from plugin configuration
  - _Requirements: 1.4, 1.5_

### Phase 2: Create PlaybackService (Tasks 6-7)

- [ ] 6. Create PlaybackService module with event handlers
  - File: `services/audio/PlaybackService.ts`
  - Export async function that registers TrackPlayer event listeners
  - Implement handlers for: RemotePlay, RemotePause, RemoteStop, RemoteDuck
  - Add console.log statements for debugging
  - Purpose: Handle remote media control events in background
  - _Leverage: Track Player Event API_
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Add Android metadata event handler to PlaybackService
  - File: `services/audio/PlaybackService.ts` (continue from task 6)
  - Add Event.AudioCommonMetadataReceived listener (Android only)
  - Extract title/artist from event and call updateMetadataForTrack
  - Add platform check to only register on Android
  - Purpose: Enable automatic metadata updates from Shoutcast stream on Android
  - _Leverage: services/audio/PlaybackService.ts_
  - _Requirements: 3.6, 7.1, 7.2_

### Phase 3: Create TrackPlayerService (Tasks 8-16)

- [ ] 8. Create TrackPlayerService class skeleton
  - File: `services/audio/TrackPlayerService.ts`
  - Create class with private properties: isInitialized, currentConfig, playerState, listeners
  - Define PlayerStateType same as VideoPlayerService
  - Export singleton instance at bottom of file
  - Purpose: Establish service structure matching VideoPlayerService
  - _Leverage: services/audio/VideoPlayerService.ts (interface pattern)_
  - _Requirements: 2.1, 2.3_

- [ ] 9. Implement initialize() method in TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 8)
  - Implement async initialize() method
  - Call TrackPlayer.setupPlayer() with autoUpdateMetadata and autoHandleInterruptions
  - Call TrackPlayer.updateOptions() with capabilities (Play, Pause, Stop)
  - Set isInitialized flag and initial state
  - Purpose: Initialize TrackPlayer with correct configuration
  - _Leverage: services/audio/TrackPlayerService.ts_
  - _Requirements: 2.2_

- [ ] 10. Implement state management methods in TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 9)
  - Implement: addStateListener(), removeStateListener(), onStateChange()
  - Implement: addErrorListener(), removeErrorListener(), onError()
  - Implement private: updatePlayerState(), notifyStateListeners(), notifyError()
  - Purpose: Provide state management API matching VideoPlayerService
  - _Leverage: services/audio/VideoPlayerService.ts (listener pattern)_
  - _Requirements: 2.4, 6.2, 6.3_

- [ ] 11. Implement event listener setup in TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 10)
  - Create private setupEventListeners() method
  - Add listener for Event.PlaybackState and map to PlayerStateType
  - Add listener for Event.PlaybackError
  - Call from initialize() method
  - Purpose: Handle TrackPlayer state changes and errors
  - _Leverage: services/audio/TrackPlayerService.ts_
  - _Requirements: 2.3, 2.4_

- [ ] 12. Implement loadStream() method in TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 11)
  - Implement async loadStream(url, config) method
  - Call TrackPlayer.reset() to clear queue
  - Fetch artwork from SettingsService
  - Add track with: url, title, artist, artwork, isLiveStream: true
  - Update playerState to 'buffering'
  - Purpose: Load stream URL into TrackPlayer queue
  - _Leverage: services/settings/SettingsService.ts, services/audio/TrackPlayerService.ts_
  - _Requirements: 6.1_

- [ ] 13. Implement playback control methods in TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 12)
  - Implement: play(), pause(), stop(), togglePlayPause()
  - Each method calls corresponding TrackPlayer API
  - Add state checks and error handling
  - Purpose: Provide playback control API matching VideoPlayerService
  - _Leverage: services/audio/TrackPlayerService.ts_
  - _Requirements: 6.1_

- [ ] 14. Implement setVolume() method in TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 13)
  - Implement async setVolume(value) method
  - Clamp value between 0 and 1
  - Call TrackPlayer.setVolume(value)
  - Purpose: Provide volume control matching VideoPlayerService
  - _Leverage: services/audio/TrackPlayerService.ts_
  - _Requirements: 6.1_

- [ ] 15. Implement updateNowPlayingInfo() method in TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 14)
  - Implement async updateNowPlayingInfo(nowPlaying) method
  - Get active track index with getActiveTrackIndex()
  - Build title and artist strings from nowPlaying object
  - Call TrackPlayer.updateMetadataForTrack() with new metadata
  - Add error handling that logs but doesn't throw
  - Purpose: Update metadata WITHOUT interrupting playback (core feature!)
  - _Leverage: services/audio/TrackPlayerService.ts_
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

- [ ] 16. Add metadata throttling and change detection to TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 15)
  - Add private properties: lastMetadataUpdate, lastMetadataTitle
  - Add throttle check (1 second minimum) at start of updateNowPlayingInfo()
  - Add metadata change detection (skip if title unchanged)
  - Purpose: Prevent unnecessary metadata updates and performance degradation
  - _Leverage: services/audio/TrackPlayerService.ts_
  - _Requirements: 4.5, 4.7, 4.8_

- [ ] 17. Implement cleanup() and getter methods in TrackPlayerService
  - File: `services/audio/TrackPlayerService.ts` (continue from task 16)
  - Implement async cleanup() method (stop, clear listeners, reset player)
  - Implement getters: isPlaying, currentState, getState(), radioConfig
  - Purpose: Complete service API matching VideoPlayerService
  - _Leverage: services/audio/TrackPlayerService.ts_
  - _Requirements: 6.4_

- [ ] 18. Export TrackPlayerService from audio services index
  - File: `services/audio/index.ts`
  - Add export for trackPlayerService singleton
  - Keep existing videoPlayerService export
  - Add comment explaining dual export for feature flag support
  - Purpose: Make both services available for import
  - _Leverage: services/audio/index.ts_
  - _Requirements: 6.5_

### Phase 4: Integrate with RadioPlayerControls (Tasks 19-21)

- [ ] 19. Add service selection logic to RadioPlayerControls
  - File: `components/radio/RadioPlayerControls.tsx`
  - Import trackPlayerService and FEATURES constant
  - Add service selection: `const playerService = FEATURES.USE_TRACK_PLAYER ? trackPlayerService : videoPlayerService`
  - Replace all videoPlayerService references with playerService
  - Purpose: Enable feature flag-based service switching
  - _Leverage: components/radio/RadioPlayerControls.tsx, constants/config.ts_
  - _Requirements: 5.2, 5.3, 5.4, 6.5_

- [ ] 20. Update metadata handling in RadioPlayerControls
  - File: `components/radio/RadioPlayerControls.tsx` (continue from task 19)
  - Update useEffect that watches nowPlaying changes
  - Call playerService.updateNowPlayingInfo() for both services
  - Remove VideoPlayerService-specific static metadata logic
  - Purpose: Enable dynamic metadata updates for both services
  - _Leverage: components/radio/RadioPlayerControls.tsx, hooks/useNowPlaying.ts_
  - _Requirements: 4.1, 7.4_

- [ ] 21. Add debug mode indicator to RadioPlayerControls
  - File: `components/radio/RadioPlayerControls.tsx` (continue from task 20)
  - Add conditional debug text showing which service is active
  - Wrap in `__DEV__` check to only show in development
  - Add to styles: debugText style (small, gray, centered)
  - Purpose: Help developers identify active service during testing
  - _Leverage: components/radio/RadioPlayerControls.tsx_
  - _Requirements: Non-functional: Usability_

### Phase 5: Testing & Validation (Tasks 22-28)

- [ ] 22. Create TrackPlayerService unit tests
  - File: `__tests__/services/TrackPlayerService.test.ts`
  - Test: initialize() configures TrackPlayer correctly
  - Test: updateNowPlayingInfo() calls updateMetadataForTrack
  - Test: State mapping (Playing → 'playing', Paused → 'paused', etc.)
  - Test: Metadata throttling (rapid updates only call API once)
  - Purpose: Verify service core functionality
  - _Leverage: __tests__/services/VideoPlayerService.test.ts (test patterns)_
  - _Requirements: Non-functional: Testing_

- [ ] 23. Create PlaybackService unit tests
  - File: `__tests__/services/PlaybackService.test.ts`
  - Test: RemotePlay event calls TrackPlayer.play()
  - Test: RemotePause event calls TrackPlayer.pause()
  - Test: RemoteStop event calls TrackPlayer.stop()
  - Test: AudioCommonMetadataReceived extracts metadata (Android)
  - Purpose: Verify background service event handling
  - _Requirements: Non-functional: Testing_

- [ ] 24. Create RadioPlayerControls integration tests
  - File: `__tests__/components/RadioPlayerControls.test.tsx`
  - Test: Uses TrackPlayerService when USE_TRACK_PLAYER = true
  - Test: Uses VideoPlayerService when USE_TRACK_PLAYER = false
  - Test: Metadata updates flow through selected service
  - Test: UI renders identically regardless of service
  - Purpose: Verify feature flag switching works correctly
  - _Leverage: __tests__/components/ (test patterns)_
  - _Requirements: Non-functional: Testing, 8.1_

- [ ] 25. Test basic playback on iOS device
  - Device: Physical iOS device or simulator
  - Enable USE_TRACK_PLAYER = true
  - Test: Play button starts audio
  - Test: Pause button pauses audio
  - Test: Stop button stops audio
  - Test: Lock screen controls appear and work
  - Test: Background playback continues
  - Purpose: Verify iOS platform functionality
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 26. Test metadata updates on iOS device
  - Device: Physical iOS device or simulator
  - Start playback with USE_TRACK_PLAYER = true
  - Wait for metadata update from useNowPlaying (5 seconds)
  - Verify: Audio continues without interruption
  - Verify: Lock screen shows new song info
  - Verify: No audio gaps or stuttering
  - Purpose: Verify seamless metadata updates on iOS (core feature!)
  - _Requirements: 4.3, 4.4, 7.3, 7.4_

- [ ] 27. Test basic playback on Android device
  - Device: Physical Android device or emulator
  - Enable USE_TRACK_PLAYER = true
  - Test: Play button starts audio
  - Test: Pause button pauses audio
  - Test: Stop button stops audio
  - Test: Notification controls appear and work
  - Test: Background playback continues
  - Purpose: Verify Android platform functionality
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 28. Test metadata updates on Android device
  - Device: Physical Android device or emulator
  - Start playback with USE_TRACK_PLAYER = true
  - Wait for metadata update (native event or polling)
  - Verify: Audio continues without interruption
  - Verify: Notification shows new song info
  - Verify: No audio gaps or stuttering
  - Purpose: Verify seamless metadata updates on Android (core feature!)
  - _Requirements: 4.3, 4.4, 7.1, 7.2_

### Phase 6: Rollback Verification (Tasks 29-30)

- [ ] 29. Test rollback to VideoPlayerService
  - Set USE_TRACK_PLAYER = false in constants/config.ts
  - Reload app (no rebuild required)
  - Test: Playback works with VideoPlayerService
  - Test: Metadata shows static "Trend Ankara" text
  - Verify: No errors in console
  - Purpose: Verify feature flag rollback works
  - _Requirements: 5.4, 5.8, 5.9_

- [ ] 30. Document rollback procedure
  - File: `.claude/specs/track-player-migration/ROLLBACK.md` (create new file)
  - Document steps to disable TrackPlayer (change feature flag)
  - Document steps to remove TrackPlayer entirely if needed
  - Add troubleshooting section for common issues
  - Purpose: Provide clear rollback instructions for production
  - _Requirements: 5.8, 5.9_

## Task Completion Checklist

### Installation & Configuration (Phase 1)
- [ ] Package installed and configured
- [ ] Expo plugin registered
- [ ] Feature flag added
- [ ] PlaybackService registered
- [ ] Development client rebuilt

### Service Implementation (Phases 2-3)
- [ ] PlaybackService created with event handlers
- [ ] TrackPlayerService created with full API
- [ ] Metadata update logic implemented with throttling
- [ ] Services exported from index

### Component Integration (Phase 4)
- [ ] RadioPlayerControls updated with service selection
- [ ] Metadata updates flow through selected service
- [ ] Debug indicator added

### Testing (Phase 5)
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] iOS device testing completed
- [ ] Android device testing completed
- [ ] Metadata updates verified without audio interruption

### Rollback (Phase 6)
- [ ] Rollback tested and verified
- [ ] Rollback documentation created

## Success Criteria

✅ **All 30 tasks completed**
✅ **Both services expose identical API**
✅ **Feature flag switches services without rebuild**
✅ **Metadata updates without audio interruption (< 500ms)**
✅ **Tests passing on both platforms**
✅ **UI unchanged from user perspective**
✅ **Rollback procedure documented and tested**

## Notes

- Each task is designed to be completed independently
- Tasks can be executed in sequence or selectively
- Feature flag allows testing at any point during implementation
- Rollback is instant via feature flag change
- No UI changes visible to end users
