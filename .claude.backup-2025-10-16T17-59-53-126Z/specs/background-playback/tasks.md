# Implementation Plan

## Task Overview
Implementation of background playback capabilities for the TrendAnkara Radio app, extending the existing AudioService with platform-specific background modes, media session management, and notification controls. Tasks are designed to be atomic, focusing on single-file changes that can be completed independently.

## Steering Document Compliance
Tasks follow the existing project structure with services in `/services/audio/`, constants in `/constants/`, and hooks in `/hooks/`. Each task leverages existing components where possible and maintains the established singleton and event-driven patterns.

## Atomic Task Requirements
**Each task must meet these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines
- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: `_Requirements: X.Y, Z.A_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Tasks

- [x] 1. Install required dependencies for background playback
  - File: package.json (modify)
  - Add expo-notifications, expo-task-manager, @react-native-async-storage/async-storage
  - Run npm install to update package-lock.json
  - Purpose: Install necessary packages for background functionality
  - _Requirements: Requirement 1, Requirement 2, Requirement 3_

- [x] 2. Update app.json with iOS background audio configuration
  - File: app.json (modify)
  - Add ios.infoPlist.UIBackgroundModes: ["audio"]
  - Add ios.infoPlist.NSMicrophoneUsageDescription for audio permissions
  - Purpose: Enable iOS background audio capability
  - _Leverage: existing app.json structure_
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Create BackgroundConfig interface in constants/audio.ts
  - File: constants/audio.ts (modify)
  - Add BackgroundConfig interface with iOS/Android settings
  - Add BACKGROUND_CONFIG constant with default values
  - Purpose: Define configuration for background playback
  - _Leverage: existing AudioConfig in constants/audio.ts_
  - _Requirements: 1.0, 2.0_

- [x] 4. Create MediaSessionMetadata type in services/audio/types.ts
  - File: services/audio/types.ts (create)
  - Define MediaSessionMetadata interface
  - Define RemoteCommand interface
  - Define EnhancedAudioStatus extending AudioStatus
  - Purpose: Type definitions for media session management
  - _Leverage: AudioStatus from services/audio/AudioService.ts_
  - _Requirements: 3.0, 5.0_

- [x] 5. Create BackgroundHandler base class in services/audio/BackgroundHandler.ts
  - File: services/audio/BackgroundHandler.ts (create)
  - Create abstract class with platform-agnostic methods
  - Define initialize(), enableBackground(), disableBackground() interfaces
  - Import Platform from react-native for platform detection
  - Purpose: Base class for platform-specific background handling
  - _Leverage: AudioConfig from constants/audio.ts_
  - _Requirements: 1.0, 2.0, 4.0_

- [x] 6. Create iOS BackgroundHandler in services/audio/BackgroundHandler.ios.ts
  - File: services/audio/BackgroundHandler.ios.ts (create)
  - Extend BackgroundHandler base class
  - Implement iOS-specific audio session configuration
  - Use expo-av Audio.setAudioModeAsync for background mode
  - Purpose: iOS-specific background audio implementation
  - _Leverage: BackgroundHandler.ts base class, expo-av Audio module_
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 7. Create Android BackgroundHandler in services/audio/BackgroundHandler.android.ts
  - File: services/audio/BackgroundHandler.android.ts (create)
  - Extend BackgroundHandler base class
  - Implement Android-specific foreground service setup
  - Configure expo-notifications for persistent notification
  - Purpose: Android-specific foreground service implementation
  - _Leverage: BackgroundHandler.ts base class, expo-notifications_
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 8. Create MediaSessionManager in services/audio/MediaSessionManager.ts
  - File: services/audio/MediaSessionManager.ts (create)
  - Implement updateMetadata() using expo-av setNowPlayingInfoAsync
  - Add setPlaybackState() and handleRemoteCommand() methods
  - Import AsyncStorage for session persistence
  - Purpose: Manage media session and lock screen controls
  - _Leverage: AudioStatus types, expo-av media session APIs_
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 9. Add session persistence methods to MediaSessionManager.ts
  - File: services/audio/MediaSessionManager.ts (modify)
  - Implement persistSessionState() with AsyncStorage
  - Implement restoreSessionState() for app restart
  - Add error handling for storage operations
  - Purpose: Persist and restore playback state
  - _Leverage: @react-native-async-storage/async-storage_
  - _Requirements: 5.1, 5.2_

- [x] 10. Create NotificationService for Android in services/audio/NotificationService.android.ts
  - File: services/audio/NotificationService.android.ts (create)
  - Implement createNotification() with media controls
  - Add updateNotificationState() for state changes
  - Configure notification channel and priority
  - Purpose: Android notification with playback controls
  - _Leverage: expo-notifications, AudioStatus types_
  - _Requirements: 2.1, 2.2, 2.3, 3.0_

- [x] 11. Create stub NotificationService for iOS in services/audio/NotificationService.ios.ts
  - File: services/audio/NotificationService.ios.ts (create)
  - Create no-op implementation for iOS (uses native controls)
  - Export same interface as Android version
  - Purpose: Maintain platform abstraction
  - _Leverage: NotificationService.android.ts interface_
  - _Requirements: 3.0_

- [x] 12. Add audio focus management to BackgroundHandler.ts
  - File: services/audio/BackgroundHandler.ts (modify)
  - Add requestAudioFocus() and abandonAudioFocus() methods
  - Add handleAudioFocusChange() for focus state changes
  - Define audio focus states enum
  - Purpose: Handle audio focus for interruption management
  - _Leverage: existing BackgroundHandler.ts_
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 13. Implement iOS audio interruption handling in BackgroundHandler.ios.ts
  - File: services/audio/BackgroundHandler.ios.ts (modify)
  - Override handleAudioFocusChange() for iOS interruptions
  - Handle phone calls and other audio apps
  - Implement volume ducking for transient interruptions
  - Purpose: iOS-specific interruption handling
  - _Leverage: expo-av interruption mode settings_
  - _Requirements: 1.5, 4.1, 4.2, 4.3_

- [x] 14. Implement Android audio focus in BackgroundHandler.android.ts
  - File: services/audio/BackgroundHandler.android.ts (modify)
  - Override audio focus methods for Android
  - Handle transient vs permanent focus loss
  - Implement automatic resume on focus regain
  - Purpose: Android-specific audio focus handling
  - _Leverage: expo-av audio mode settings_
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 15. Import background components in AudioService.ts
  - File: services/audio/AudioService.ts (modify)
  - Import BackgroundHandler and MediaSessionManager classes
  - Import NotificationService for platform-specific notifications
  - Purpose: Add imports for background functionality
  - _Leverage: existing AudioService import pattern_
  - _Requirements: Requirement 1, Requirement 2, Requirement 3_

- [x] 16. Add background initialization method to AudioService.ts
  - File: services/audio/AudioService.ts (modify)
  - Create initializeBackground() private method
  - Initialize BackgroundHandler with platform detection
  - Initialize MediaSessionManager and NotificationService
  - Purpose: Set up background components
  - _Leverage: existing AudioService initialization patterns_
  - _Requirements: Requirement 1, Requirement 2, Requirement 3_

- [x] 17. Call background initialization in AudioService constructor
  - File: services/audio/AudioService.ts (modify)
  - Call initializeBackground() in constructor
  - Add error handling for background initialization failures
  - Purpose: Integrate background setup into service lifecycle
  - _Leverage: existing AudioService constructor_
  - _Requirements: Requirement 1, Requirement 2, Requirement 3_

- [ ] 16. Update AudioService play() method for background support
  - File: services/audio/AudioService.ts (modify)
  - Enable background mode when playback starts
  - Create foreground service on Android
  - Update media session metadata
  - Purpose: Activate background features on playback
  - _Leverage: existing play() method, BackgroundHandler, MediaSessionManager_
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 17. Update AudioService pause() and stop() for background cleanup
  - File: services/audio/AudioService.ts (modify)
  - Update media session state on pause
  - Destroy foreground service on stop
  - Clear media session on stop
  - Purpose: Proper cleanup of background resources
  - _Leverage: existing pause()/stop() methods_
  - _Requirements: 2.5, 3.2, 3.3_

- [x] 18. Add remote command handling to AudioService.ts
  - File: services/audio/AudioService.ts (modify)
  - Subscribe to remote commands from MediaSessionManager
  - Map commands to play/pause/stop methods
  - Handle command source tracking
  - Purpose: Process media control commands
  - _Leverage: existing AudioService methods_
  - _Requirements: 3.2, 3.3_

- [x] 19. Update onPlaybackStatusUpdate in AudioService.ts
  - File: services/audio/AudioService.ts (modify)
  - Update media session playback state
  - Update notification state for Android
  - Handle background-specific states
  - Purpose: Sync background UI with playback state
  - _Leverage: existing onPlaybackStatusUpdate()_
  - _Requirements: 3.1, 3.4_

- [x] 20. Add headphone detection to BackgroundHandler.ts
  - File: services/audio/BackgroundHandler.ts (modify)
  - Add headphone connection listener
  - Implement auto-pause on disconnect
  - Add headphone state to status
  - Purpose: Handle headphone disconnection
  - _Leverage: expo-av audio routing APIs_
  - _Requirements: 4.5_

- [x] 21. Enhance useAudio hook with background state
  - File: hooks/useAudio.ts (modify)
  - Add isBackgroundMode to returned state
  - Add hasAudioFocus to status
  - Export background-specific state values
  - Purpose: Expose background state to UI
  - _Leverage: existing useAudio hook, AudioService subscription_
  - _Requirements: 5.1_

- [x] 22. Add AppState handling to AudioService.ts
  - File: services/audio/AudioService.ts (modify)
  - Import AppState from react-native
  - Add listener for app state changes
  - Update background mode on state transitions
  - Purpose: Handle app lifecycle transitions
  - _Leverage: React Native AppState API_
  - _Requirements: 1.1, 2.0, 5.1_

- [x] 23. Add network recovery for background in StreamController.ts
  - File: services/audio/StreamController.ts (modify)
  - Enhance retry logic for background mode
  - Add background-specific retry delays
  - Update status during background recovery
  - Purpose: Robust network handling in background
  - _Leverage: existing retry mechanism in StreamController_
  - _Requirements: 5.4_

- [x] 24. Create unit tests for BackgroundHandler in __tests__/BackgroundHandler.test.ts
  - File: __tests__/services/audio/BackgroundHandler.test.ts (create)
  - Test platform detection and initialization
  - Mock expo-av and expo-notifications
  - Test audio focus state changes
  - Purpose: Unit test coverage for background handler
  - _Leverage: Jest testing framework_
  - _Requirements: All_

- [x] 25. Create unit tests for MediaSessionManager in __tests__/MediaSessionManager.test.ts
  - File: __tests__/services/audio/MediaSessionManager.test.ts (create)
  - Test metadata updates and command handling
  - Mock AsyncStorage for persistence tests
  - Test session state save/restore
  - Purpose: Unit test coverage for media session
  - _Leverage: Jest testing framework_
  - _Requirements: 3.0, 5.0_

- [x] 26. Update RadioScreen UI for background state in app/(tabs)/index.tsx
  - File: app/(tabs)/index.tsx (modify)
  - Display background mode indicator when active
  - Show audio focus loss message
  - Add background-specific UI states
  - Purpose: UI feedback for background playback
  - _Leverage: existing RadioScreen component, useAudio hook_
  - _Requirements: 5.1_

- [x] 27. Add buffering indicator to media controls
  - File: services/audio/MediaSessionManager.ts (modify)
  - Update setPlaybackState() to handle buffering state
  - Show loading indicator in media controls during buffering
  - Update both iOS and Android media session states
  - Purpose: Show buffering status in lock screen controls
  - _Leverage: existing playback state management_
  - _Requirements: Requirement 3 (AC 3.4)_

- [x] 28. Set app icon and title in media controls
  - File: services/audio/MediaSessionManager.ts (modify)
  - Set app icon as artwork in updateMetadata()
  - Ensure "TrendAnkara Radyo" appears as title
  - Configure consistent branding across platforms
  - Purpose: Display app identity in media controls
  - _Leverage: expo-av setNowPlayingInfoAsync_
  - _Requirements: Requirement 3 (AC 3.5)_

- [x] 29. Add external app playback detection
  - File: services/audio/BackgroundHandler.ts (modify)
  - Listen for other audio app playback events
  - Stop radio when external music app starts
  - Add external playback state to audio focus handling
  - Purpose: Respect other audio apps starting playback
  - _Leverage: expo-av audio focus events_
  - _Requirements: Requirement 4 (AC 4.4)_