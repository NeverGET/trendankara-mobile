# Requirements Document - Track Player Migration

## Introduction

This feature implements react-native-track-player as an alternative audio streaming solution for the TrendAnkara mobile app while maintaining expo-video as a fallback. Currently, updating native media controls (iOS lock screen, Control Center, Android notifications) with live "Now Playing" information requires destroying and recreating the player notification system, causing 200-500ms audio interruptions that disrupt the listening experience. This feature solves this by using react-native-track-player's `updateMetadataForTrack()` method, which updates metadata without interrupting playback, enabling seamless dynamic metadata updates on native controls.

## Alignment with Product Vision

This feature directly supports the Product Vision principles:

- **Simple is better**: Maintains existing UI while improving backend audio handling
- **No overengineering**: Implements a proven library (3,600+ GitHub stars) with feature flag for easy rollback
- **Test everything**: Includes comprehensive testing strategy across both platforms
- **Respect user resources**: Eliminates audio stuttering, provides smoother listening experience
- **Uninterrupted streaming**: Core goal - seamless metadata updates without playback disruption

**Key Product Goals Supported**:
- **Instant playback** - TrackPlayer provides better buffering control
- **Uninterrupted streaming** - Solves the metadata update audio cutoff issue
- **Background listening** - Enhanced background playback capabilities
- **Simple navigation** - No UI changes required

## Requirements

### Requirement 1: Install and Configure react-native-track-player

**User Story**: As a developer, I want to install react-native-track-player as an additional dependency, so that I can implement an alternative audio streaming solution without affecting the existing expo-video implementation.

#### Acceptance Criteria

1. WHEN the package is installed THEN the system SHALL add `react-native-track-player@4.1.2` to package.json dependencies
2. WHEN app.json is configured THEN the system SHALL add the react-native-track-player plugin alongside the existing expo-video plugin
3. WHEN the plugin configuration is added THEN the system SHALL specify `playbackServiceName: "PlaybackService"` to register the background service
4. WHEN the app is rebuilt THEN the system SHALL successfully compile on both iOS and Android with both audio libraries available
5. WHEN dependencies are validated THEN the system SHALL ensure compatibility with Expo SDK 54, React Native 0.81.4, and TypeScript 5.9.2

### Requirement 2: Create TrackPlayerService Parallel to VideoPlayerService

**User Story**: As a developer, I want to create a new TrackPlayerService class with the same interface as VideoPlayerService, so that I can switch between implementations using a feature flag without changing component code.

#### Acceptance Criteria

1. WHEN TrackPlayerService is created THEN the system SHALL implement all methods from VideoPlayerService interface (initialize, loadStream, play, pause, stop, setVolume, updateNowPlayingInfo, addStateListener, etc.)
2. WHEN the service is initialized THEN the system SHALL configure TrackPlayer with background playback enabled and native media controls support
3. WHEN the service manages state THEN the system SHALL maintain the same PlayerStateType values ('stopped', 'playing', 'paused', 'buffering', 'error') as VideoPlayerService
4. WHEN error handling is implemented THEN the system SHALL provide the same error listener pattern as VideoPlayerService for consistent error handling

### Requirement 3: Implement Background Playback Service

**User Story**: As a developer, I want to create a background PlaybackService module that handles remote media control events, so that the audio continues playing when the app is backgrounded and responds to lock screen controls.

#### Acceptance Criteria

1. WHEN the PlaybackService is registered THEN the system SHALL export a function that TrackPlayer can invoke in the background
2. WHEN remote play event is received THEN the system SHALL call TrackPlayer.play() to start playback
3. WHEN remote pause event is received THEN the system SHALL call TrackPlayer.pause() to pause playback
4. WHEN remote stop event is received THEN the system SHALL call TrackPlayer.stop() to stop playback
5. WHEN audio becomes noisy (headphones unplugged) THEN the system SHALL automatically pause playback
6. IF platform is Android AND metadata is received from stream THEN the system SHALL automatically update track metadata using updateMetadataForTrack()

### Requirement 4: Implement Seamless Metadata Updates

**User Story**: As a listener, I want the "Now Playing" information on my lock screen and notification to update automatically when songs change, so that I can see what's currently playing without opening the app and WITHOUT hearing any audio interruption.

#### Acceptance Criteria

1. WHEN nowPlaying data changes from useNowPlaying hook THEN the system SHALL call TrackPlayerService.updateNowPlayingInfo() with the new metadata
2. WHEN updateNowPlayingInfo is called THEN the system SHALL invoke TrackPlayer.updateMetadataForTrack() to update the current track's metadata
3. WHEN metadata is updated THEN the system SHALL NOT interrupt audio playback (no stuttering or gaps)
4. WHEN metadata is updated THEN the system SHALL reflect changes on iOS lock screen, Control Center, and Android notification within 1 second
5. IF metadata hasn't changed from previous update THEN the system SHALL skip the update to prevent unnecessary operations
6. IF TrackPlayer encounters an error during metadata update THEN the system SHALL log the error but NOT throw to avoid breaking playback
7. WHEN metadata updates occur more frequently than every 1 second THEN the system SHALL throttle updates to prevent performance degradation
8. WHEN multiple rapid metadata changes occur THEN the system SHALL process only the most recent update and skip intermediate updates

### Requirement 5: Add Feature Flag for Easy Switching

**User Story**: As a developer, I want a feature flag to switch between VideoPlayerService (expo-video) and TrackPlayerService (react-native-track-player), so that I can quickly rollback to the stable implementation if issues are discovered.

#### Acceptance Criteria

1. WHEN the feature flag is added to constants/config.ts THEN the system SHALL define USE_TRACK_PLAYER boolean flag with default value false
2. WHEN RadioPlayerControls initializes THEN the system SHALL check FEATURES.USE_TRACK_PLAYER to determine which service to use
3. WHEN USE_TRACK_PLAYER is true THEN the system SHALL use TrackPlayerService for all audio operations
4. WHEN USE_TRACK_PLAYER is false THEN the system SHALL use VideoPlayerService for all audio operations (current behavior)
5. WHEN switching between services THEN the system SHALL maintain the same component interface and state management patterns
6. WHEN feature flag changes at runtime THEN the system SHALL properly cleanup the previously active service before initializing the new one
7. WHEN feature flag changes THEN the system SHALL preserve current playback position and state where possible
8. WHEN rolling back from TrackPlayerService to VideoPlayerService THEN the system SHALL maintain existing audio playback without interruption
9. WHEN rollback occurs THEN the system SHALL log the rollback event for debugging purposes

### Requirement 6: Maintain API Compatibility with Existing Components

**User Story**: As a developer, I want both audio services to expose the same public API, so that RadioPlayerControls and other components don't need to change when switching implementations.

#### Acceptance Criteria

1. WHEN either service is used THEN the system SHALL provide the same methods: initialize(), loadStream(), play(), pause(), stop(), togglePlayPause(), setVolume(), updateNowPlayingInfo()
2. WHEN either service is used THEN the system SHALL emit state changes through the same listener pattern: addStateListener(), removeStateListener(), onStateChange()
3. WHEN either service is used THEN the system SHALL emit errors through the same pattern: addErrorListener(), removeErrorListener(), onError()
4. WHEN either service is used THEN the system SHALL expose the same getters: isPlaying, currentState, getState(), radioConfig
5. WHEN RadioPlayerControls uses the selected service THEN the system SHALL work identically regardless of which implementation is active

### Requirement 7: Platform-Specific Metadata Handling

**User Story**: As a developer, I want to handle metadata updates differently on iOS and Android based on platform capabilities, so that I can leverage native features where available while providing consistent fallback behavior.

#### Acceptance Criteria

1. WHEN platform is Android THEN the system SHALL use TrackPlayer's Event.AudioCommonMetadataReceived to automatically detect metadata from the stream
2. WHEN Event.AudioCommonMetadataReceived fires THEN the system SHALL extract title and artist from the event and update track metadata
3. WHEN platform is iOS THEN the system SHALL continue using the existing useNowPlaying hook with 5-second polling to fetch metadata from the endpoint
4. WHEN metadata is fetched via polling (iOS) THEN the system SHALL call updateNowPlayingInfo() with the parsed data
5. IF metadata format is "SONG - ARTIST" THEN the system SHALL split and assign correctly to title and artist fields

### Requirement 8: Preserve Existing UI and User Experience

**User Story**: As a listener, I want the radio player controls to look and behave exactly the same, so that I don't notice any changes to the interface when the underlying audio system is upgraded.

#### Acceptance Criteria

1. WHEN TrackPlayerService is enabled THEN the system SHALL maintain the same button layout, colors, and styles in RadioPlayerControls
2. WHEN playback state changes THEN the system SHALL update the UI indicators (CANLI YAYIN, DURAKLATILDI, YÜKLENİYOR, etc.) identically to the current implementation
3. WHEN now playing info updates THEN the system SHALL display song and artist in the same format and position as the current implementation
4. WHEN controls are interacted with THEN the system SHALL provide the same button press animations and feedback
5. WHEN compact mode is used THEN the system SHALL render the same compact player layout

## Non-Functional Requirements

### Performance
- Metadata updates SHALL complete within 500ms from the time new data is received
- Initial stream loading SHALL start playback within 3 seconds on a stable network connection
- State listener notifications SHALL fire within 100ms of actual state changes
- Background service SHALL consume less than 2MB of additional memory
- Audio playback SHALL maintain stable bitrate without stuttering during metadata updates

### Security
- Stream URLs SHALL be validated before passing to TrackPlayer to prevent injection attacks
- Metadata content SHALL be sanitized to prevent potential XSS issues in native controls
- Background service SHALL NOT store sensitive data in memory
- All network requests SHALL use HTTPS when communicating with backend services

### Reliability
- TrackPlayerService SHALL handle network disconnections gracefully and attempt to reconnect
- IF TrackPlayer initialization fails THEN the system SHALL log the error and allow fallback to VideoPlayerService
- IF metadata update fails THEN the system SHALL continue playback and retry on next metadata change
- Background service SHALL automatically restart if terminated by the system (iOS/Android)
- Player state SHALL remain consistent even after app backgrounding and foregrounding

### Usability
- Feature flag change SHALL require only a code constant change and app reload (no rebuild required for switching)
- Error messages SHALL be logged with clear context for debugging (service name, operation, timestamp)
- Both services SHALL provide identical logging patterns for consistent debugging experience
- Developer SHALL be able to identify which service is active through __DEV__ mode indicators

### Maintainability
- TrackPlayerService SHALL follow the same class structure and patterns as VideoPlayerService
- Code comments SHALL explain platform-specific workarounds and decisions
- Both services SHALL use TypeScript with full type safety and no `any` types
- Service switching logic SHALL be centralized in RadioPlayerControls to minimize code changes

### Testing Requirements
- Platform tests SHALL verify both iOS and Android implementations independently
- Integration tests SHALL verify seamless switching between VideoPlayerService and TrackPlayerService
- Performance tests SHALL measure metadata update latency under various network conditions (WiFi, 4G, 5G)
- Regression tests SHALL ensure existing RadioPlayerControls functionality remains unchanged
- End-to-end tests SHALL verify background playback continues during metadata updates on both platforms
- Memory leak tests SHALL confirm proper cleanup when switching between services

### Compatibility
- Solution SHALL work with Expo SDK 54 and React Native 0.81.4
- Solution SHALL support both iOS and Android with feature parity
- Solution SHALL integrate with existing useNowPlaying hook without modifications
- Solution SHALL support both development and production builds without configuration changes
