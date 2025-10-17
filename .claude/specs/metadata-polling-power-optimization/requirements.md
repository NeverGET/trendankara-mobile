# Requirements Document - Metadata Polling Power Optimization

## Introduction

This feature addresses excessive power consumption during background audio playback caused by aggressive metadata polling. The current implementation polls the metadata endpoint every 5 seconds continuously, resulting in 65% CPU usage (expected: <10%), device heating, and significant battery drain. This optimization will implement platform-specific, context-aware metadata updates that respect device resources while maintaining a quality user experience.

**Investigation Summary:**
- Device testing confirmed 240 metadata requests in 20 minutes (exactly 5-second intervals)
- CPU usage: 65.5% (6-7x higher than expected)
- Battery drain: ~35%/hour (3.5x higher than normal)
- Root cause: `hooks/useNowPlaying.ts:140` - continuous `setInterval(fetchMetadata, 5000)`

This "bug-turned-feature" will reduce power consumption by 85-95% while leveraging native platform capabilities.

## Alignment with Product Vision

This feature directly supports the core product principle: **"Respect user resources"**

From `product.md`:
> - **Respect user resources** - Minimal data usage, efficient caching, battery-conscious

**Key Alignments:**

1. **Simple is Better**: The solution leverages existing native capabilities rather than adding complexity
2. **No Overengineering**: Platform-specific optimizations using built-in features (Android's ExoPlayer events, iOS's AppState)
3. **Test Everything**: Comprehensive testing plan with quantifiable metrics
4. **User Experience Goals**: Maintains "Uninterrupted streaming" while enabling true "Background listening"

**Business Impact:**
- Improved app store ratings (eliminates "battery drain" complaints)
- Competitive parity with YouTube Music and Spotify
- Compliance with Apple and Google platform guidelines
- Increased user retention through better resource management

## Requirements

### Requirement 1: Platform-Specific Metadata Strategy

**User Story:** As a mobile app developer, I want the app to use platform-native capabilities for metadata updates, so that we minimize unnecessary polling and power consumption.

#### Acceptance Criteria

1. WHEN the app runs on Android THEN the system SHALL disable HTTP metadata polling entirely
2. WHEN the app runs on Android THEN the system SHALL rely solely on `Event.AudioCommonMetadataReceived` from react-native-track-player
3. WHEN the app runs on iOS THEN the system SHALL implement context-aware polling intervals
4. IF the platform detection fails THEN the system SHALL default to iOS behavior (safe fallback)

### Requirement 2: iOS Context-Aware Polling

**User Story:** As an iOS user, I want the app to reduce metadata polling when backgrounded, so that my battery lasts longer during extended listening sessions.

#### Acceptance Criteria

1. WHEN the iOS app is in foreground state ("active") THEN the system SHALL poll metadata every 5 seconds
2. WHEN the iOS app is in background or inactive state THEN the system SHALL poll metadata every 2 minutes
3. WHEN the iOS app transitions from background to foreground THEN the system SHALL fetch metadata immediately
4. WHEN the app state changes THEN the system SHALL restart the polling interval with the appropriate timing
5. IF AppState listener fails THEN the system SHALL default to 2-minute intervals (power-safe fallback)

### Requirement 3: Android Native Event Integration

**User Story:** As an Android user, I want song metadata to update automatically when the stream provides it, so that I see current information without draining my battery.

#### Acceptance Criteria

1. WHEN Android platform is detected THEN the system SHALL skip useNowPlaying hook initialization
2. WHEN ExoPlayer receives ICY metadata from Shoutcast stream THEN PlaybackService SHALL update TrackPlayer metadata
3. WHEN metadata is received on Android THEN the system SHALL NOT make any HTTP requests
4. WHEN a song changes on Android THEN the system SHALL update within 1 second of stream metadata change
5. IF native metadata extraction fails THEN the system SHALL log the error but continue playback

### Requirement 4: Event-Driven Metadata Refresh

**User Story:** As a user, I want to see fresh metadata when I interact with playback controls, so that lock screen information is up-to-date when I check it.

#### Acceptance Criteria

1. WHEN user triggers RemotePlay event (from notification, lock screen, Bluetooth) THEN the system SHALL fetch fresh metadata immediately (iOS only)
2. WHEN user opens the app from background THEN the system SHALL fetch fresh metadata immediately
3. WHEN event-triggered fetch occurs THEN the system SHALL NOT interfere with normal polling schedule
4. IF event-triggered fetch fails THEN the system SHALL continue with scheduled polling

### Requirement 5: Metadata Update Throttling

**User Story:** As a developer, I want metadata updates to be throttled, so that we prevent duplicate updates and unnecessary re-renders.

#### Acceptance Criteria

1. WHEN metadata is identical to previous update THEN the system SHALL skip the update
2. WHEN metadata update is requested within 1 second of previous update THEN the system SHALL throttle the update
3. WHEN throttled update contains different metadata THEN the system SHALL apply it after throttle period
4. IF metadata changes rapidly THEN the system SHALL respect the 1-second minimum interval

### Requirement 6: Power Consumption Reduction

**User Story:** As a user, I want the app to consume minimal battery during background playback, so that I can listen for hours without significant battery drain.

#### Acceptance Criteria

1. WHEN app is playing audio on Android THEN CPU usage SHALL be less than 10% in background
2. WHEN app is playing audio on iOS in background THEN CPU usage SHALL be less than 10%
3. WHEN app is playing audio on iOS in foreground THEN CPU usage SHALL be less than 20%
4. WHEN measured over 1 hour of playback THEN battery drain SHALL be reduced by at least 60% compared to current implementation
5. IF power consumption exceeds targets THEN the system SHALL log diagnostic information

### Requirement 7: Graceful Degradation

**User Story:** As a user, I want metadata to continue working even if optimizations fail, so that my listening experience is not disrupted.

#### Acceptance Criteria

1. IF platform detection fails THEN the system SHALL default to iOS polling behavior
2. IF AppState monitoring fails on iOS THEN the system SHALL use 2-minute intervals
3. IF native events fail on Android THEN the system SHALL log errors but continue playback
4. WHEN any metadata mechanism fails THEN the system SHALL fall back to default metadata ("Trend Ankara - Canlı Yayın")
5. IF all metadata sources fail THEN playback SHALL continue uninterrupted

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want the changes to be backward compatible with existing code, so that we don't break other features.

#### Acceptance Criteria

1. WHEN useNowPlaying hook is called THEN it SHALL return the same interface (nowPlaying, isLoading)
2. WHEN RadioPlayerControls consumes useNowPlaying THEN it SHALL work without modification
3. WHEN TrackPlayerService receives metadata updates THEN it SHALL process them identically
4. IF useNowPlaying returns null on Android THEN components SHALL handle it gracefully

## Non-Functional Requirements

### Performance

1. **Network Efficiency**
   - Android: Zero metadata HTTP requests during playback
   - iOS Foreground: Maximum 720 requests/hour (1 per 5 seconds)
   - iOS Background: Maximum 30 requests/hour (1 per 2 minutes)
   - Request timeout: 5 seconds maximum

2. **CPU Efficiency**
   - Background playback: <10% CPU usage
   - Foreground playback: <20% CPU usage
   - No polling-induced wake locks on Android

3. **Memory Efficiency**
   - No memory leaks from interval timers
   - Proper cleanup of AppState listeners
   - AbortController cleanup for pending requests

4. **Response Time**
   - App state transitions: Immediate metadata fetch (<500ms)
   - Event-triggered fetches: <500ms to initiate
   - Metadata display latency: <1 second from fetch completion

### Security

1. **Network Security**
   - All metadata requests use HTTPS
   - Request timeouts prevent hanging connections
   - AbortController prevents orphaned requests

2. **Error Handling**
   - No sensitive information in error logs
   - Failed requests don't expose internal state
   - Graceful degradation prevents crashes

### Reliability

1. **Stability**
   - 99.9% uptime for metadata display
   - No crashes from platform detection failures
   - No playback interruptions from metadata updates

2. **Error Recovery**
   - Automatic retry on network failures (via next polling cycle)
   - Fallback to default metadata on parse errors
   - Continue playback on metadata service failures

3. **Testing Coverage**
   - Unit tests for platform detection
   - Unit tests for interval calculation
   - Integration tests on physical Android device
   - Integration tests on physical iOS device

### Usability

1. **User Experience**
   - Metadata updates appear seamless
   - No noticeable delay in foreground
   - Acceptable staleness in background (max 2 minutes on iOS)
   - Fresh metadata on app wake

2. **Developer Experience**
   - Clear console logs for debugging
   - Platform-specific logic well-documented
   - Easy to test on both platforms

3. **Monitoring**
   - Log polling frequency changes
   - Log platform detection results
   - Log metadata fetch successes/failures
   - Log power-saving mode activations

### Compatibility

1. **Platform Support**
   - iOS: All versions supported by Expo SDK 54
   - Android: All versions supported by Expo SDK 54
   - react-native-track-player: ^4.1.1

2. **Device Support**
   - Physical iOS devices (iPhone 8+)
   - Physical Android devices (Android 8.0+)
   - iOS Simulator (for development only, not performance testing)
   - Android Emulator (for development only, not performance testing)

### Compliance

1. **App Store Guidelines**
   - Apple: Background audio legitimate use case ✅
   - Apple: Minimal background processing ✅
   - Google: Foreground service properly declared ✅
   - Google: Event-driven on Android (best practice) ✅

2. **Best Practices**
   - Follow React Native performance guidelines
   - Follow react-native-track-player documentation
   - Respect platform-specific capabilities
   - Minimize wake locks and background activity

---

**Requirements Version:** 1.0
**Date:** October 17, 2025
**Status:** Ready for Design Phase
**Investigation Reference:** `.claude/bugs/power-consumption-investigation/`
**Solution Reference:** `docs/power-optimization/METADATA_POLLING_SOLUTION.md`
