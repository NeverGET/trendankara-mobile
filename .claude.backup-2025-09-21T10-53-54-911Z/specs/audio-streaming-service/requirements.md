# Requirements: Audio Streaming Service

## Overview
Implement a robust audio streaming service for the Trend Ankara radio app that connects to the Shoutcast stream, provides basic playback controls, and manages audio state as a singleton service throughout the app lifecycle.

## User Stories

### 1. Stream Connection
**As a** radio listener
**I want** to connect to the Trend Ankara radio stream
**So that** I can listen to live radio content

**Acceptance Criteria:**
- WHEN I tap the play button THEN the app connects to https://radyo.yayin.com.tr:5132/
- WHEN connection is successful THEN audio starts playing within 3 seconds
- WHEN connection fails THEN an error message is displayed
- IF network is unavailable THEN user sees "No internet connection" message
- WHEN stream URL is unreachable THEN fallback/retry logic is triggered

### 2. Basic Playback Controls
**As a** user listening to radio
**I want** to control playback with play/pause functionality
**So that** I can manage when I'm listening

**Acceptance Criteria:**
- WHEN I tap play THEN audio stream starts playing
- WHEN I tap pause THEN audio stream pauses immediately
- WHEN audio is playing THEN the play button shows pause icon
- WHEN audio is paused THEN the pause button shows play icon
- IF stream is buffering THEN a loading indicator is shown

### 3. Audio Service Singleton
**As a** user navigating the app
**I want** audio to continue playing while I browse different screens
**So that** my listening experience is uninterrupted

**Acceptance Criteria:**
- WHEN I navigate between tabs THEN audio continues playing
- WHEN I open different screens THEN playback state is maintained
- WHEN multiple components access the service THEN they share the same instance
- IF app is in background THEN audio continues (background capability)
- WHEN returning to player screen THEN current playback state is reflected

### 4. Stream State Management
**As a** user
**I want** the app to handle various stream states properly
**So that** I understand what's happening with my audio

**Acceptance Criteria:**
- WHEN stream is loading THEN state shows "loading"
- WHEN stream is playing THEN state shows "playing"
- WHEN stream is paused THEN state shows "paused"
- WHEN stream encounters error THEN state shows "error" with details
- WHEN stream is stopped THEN state shows "stopped"

### 5. Network Resilience
**As a** user with varying network conditions
**I want** the stream to handle network changes gracefully
**So that** I can continue listening despite connectivity issues

**Acceptance Criteria:**
- WHEN network drops temporarily THEN stream attempts to reconnect
- WHEN network returns THEN stream automatically resumes
- WHEN switching from WiFi to cellular THEN stream continues
- IF buffering occurs THEN appropriate feedback is shown
- WHEN stream quality degrades THEN it continues without crashing

## Technical Requirements

### Audio Library Selection
- Use `expo-av` for audio playback (native Expo solution)
- Leverage Audio.Sound class for stream handling
- Configure audio mode for background playback
- Handle audio interruptions (calls, other apps)

### Service Architecture
**Singleton Pattern:**
- Single AudioService instance throughout app lifecycle
- Centralized state management
- Observable pattern for state updates
- Clean initialization and cleanup

**Core Methods:**
- `play()` - Start stream playback
- `pause()` - Pause stream playback
- `stop()` - Stop and cleanup stream
- `getStatus()` - Get current playback status
- `isPlaying()` - Check if currently playing

### Stream Configuration
```
URL: https://radyo.yayin.com.tr:5132/
Format: Shoutcast/MP3 stream
Bitrate: Variable (handle dynamically)
Buffer Size: Optimize for mobile (2-5 seconds)
```

### State Management
**Playback States:**
- `idle` - Initial state, no stream loaded
- `loading` - Connecting to stream
- `playing` - Stream is playing
- `paused` - Stream is paused
- `stopped` - Stream stopped by user
- `error` - Error occurred
- `buffering` - Stream is buffering

### Error Handling
- Network connection errors
- Stream URL unreachable
- Audio codec issues
- Permission denied (iOS/Android)
- Audio focus conflicts
- Background playback restrictions

## Constraints

### Technical Constraints
- Must work with Expo SDK 54
- Compatible with React Native 0.81.4
- TypeScript implementation required
- Must handle both iOS and Android audio APIs
- Memory efficient for long playback sessions

### Platform Constraints
**iOS:**
- Requires audio background mode capability
- Handle audio session categories
- Respond to control center commands
- Support AirPlay where available

**Android:**
- Requires foreground service for background playback
- Handle audio focus requests
- Support notification controls
- Work with different Android versions (5.0+)

### Performance Constraints
- Stream connection < 3 seconds
- Minimal battery consumption
- Low memory footprint
- Smooth state transitions
- No UI blocking during operations

## Non-Functional Requirements

### Reliability
- 99% uptime when network is available
- Graceful degradation on poor networks
- Automatic recovery from errors
- No app crashes from audio errors

### User Experience
- Instant visual feedback on actions
- Clear error messages
- Smooth playback without stuttering
- Consistent behavior across platforms

### Maintainability
- Clean, documented code
- Separation of concerns
- Testable service methods
- Easy to extend with new features

### Compatibility
- iOS 13.0+ support
- Android 5.0+ support
- Works on tablets and phones
- Handles various network speeds

## Risks & Mitigations

### Risk: Stream URL Changes
**Description:** Radio stream URL might change in future
**Mitigation:** Make URL configurable via constants or environment variable

### Risk: Background Playback Restrictions
**Description:** OS might kill background audio
**Mitigation:** Implement proper background modes and foreground services

### Risk: Network Data Usage
**Description:** Users might consume excessive mobile data
**Mitigation:** Add data usage warnings and WiFi-only option in settings

### Risk: Audio Interruptions
**Description:** Phone calls or other apps might interrupt playback
**Mitigation:** Implement proper audio interruption handling and auto-resume

### Risk: Memory Leaks
**Description:** Long playback sessions might cause memory issues
**Mitigation:** Proper cleanup, event listener management, and testing

## Dependencies
- `expo-av` - Audio playback library (to be installed)
- Network connectivity monitoring
- State management solution (Zustand/Redux)
- Error tracking/logging system

## Acceptance Criteria Summary
- [ ] Connects to Shoutcast stream URL successfully
- [ ] Play button starts audio stream
- [ ] Pause button pauses audio stream
- [ ] Audio continues when navigating between screens
- [ ] Service maintains singleton instance
- [ ] All playback states properly handled
- [ ] Network changes handled gracefully
- [ ] Error messages displayed appropriately
- [ ] Background playback works on iOS
- [ ] Background playback works on Android
- [ ] No memory leaks during extended playback
- [ ] Stream reconnects after network recovery