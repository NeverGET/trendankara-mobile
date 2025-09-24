# Implementation Plan

## Task Overview

Implementation of animated logo display with dynamic lighting effects for the TrendAnkara Radio player screen. The tasks are organized to build components incrementally, starting with static display, adding animations, integrating with playback state, and finally updating system media controls. Each task is atomic, focused on a single file or feature, and designed for completion in 15-30 minutes.

## Steering Document Compliance

Tasks follow structure.md conventions with components in `/components/player/`, hooks in `/hooks/`, and constants in `/constants/`. Each task leverages existing code from the audio infrastructure, theme system, and animation libraries already present in the project.

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

- [x] 1. Create animation constants in constants/animations.ts
  - File: constants/animations.ts (create)
  - Define AnimationConfig interface with timing values
  - Export ANIMATION_CONFIG constant with default values
  - Include light colors using brand palette (#DC2626, #EF4444)
  - Purpose: Centralize animation configuration values
  - _Leverage: constants/theme.ts BrandColors_
  - _Requirements: 1.3, 2.2, 3.2_

- [x] 2. Create LogoDisplay component in components/player/LogoDisplay.tsx
  - File: components/player/LogoDisplay.tsx (create)
  - Use expo-image to display Trendankara3.png
  - Add responsive sizing logic based on screen width
  - Implement onError fallback to text logo
  - Purpose: Display logo with proper sizing and fallback
  - _Leverage: components/themed-text.tsx, expo-image package_
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [x] 3. Create SpotlightOrb component in components/player/SpotlightOrb.tsx
  - File: components/player/SpotlightOrb.tsx (create)
  - Create single animated orb with View and shadow/elevation
  - Use Animated.View from react-native-reanimated
  - Apply red gradient colors as backgroundColor
  - Purpose: Single reusable animated light orb
  - _Leverage: react-native-reanimated, constants/theme.ts_
  - _Requirements: 1.2, 1.3_

- [x] 4. Create SpotlightEffects container in components/player/SpotlightEffects.tsx
  - File: components/player/SpotlightEffects.tsx (create)
  - Render 2-3 SpotlightOrb components
  - Position orbs behind logo using absolute positioning
  - Adjust opacity based on theme (dark/light)
  - Purpose: Container for multiple animated orbs
  - _Leverage: components/player/SpotlightOrb.tsx, hooks/use-color-scheme.ts_
  - _Requirements: 1.2, 1.4, 1.5_

- [x] 5. Create usePlaybackAnimation hook in hooks/usePlaybackAnimation.ts
  - File: hooks/usePlaybackAnimation.ts (create)
  - Import useAudio to get playback state
  - Create shared animation values with useSharedValue
  - Export animation control methods (start, pause, reset)
  - Purpose: Manage animation state based on playback
  - _Leverage: hooks/useAudio.ts, react-native-reanimated_
  - _Requirements: 3.1, 3.4_

- [x] 6. Add ambient movement animations to SpotlightOrb.tsx
  - File: components/player/SpotlightOrb.tsx (modify)
  - Add circular motion using withRepeat and withSequence
  - Set random cycle duration (10-20 seconds)
  - Use interpolate for smooth position transitions
  - Purpose: Add slow drifting movement to orbs
  - _Leverage: react-native-reanimated animation functions_
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Add pulse animations to SpotlightOrb.tsx
  - File: components/player/SpotlightOrb.tsx (modify)
  - Add scale animation with withTiming
  - Implement quick scale up (0.2s) and slow down (0.8s)
  - Add random offset prop for organic movement
  - Purpose: Music-reactive pulsing effect
  - _Leverage: constants/animations.ts timing values_
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Create AnimatedLogoContainer in components/player/AnimatedLogoContainer.tsx
  - File: components/player/AnimatedLogoContainer.tsx (create)
  - Combine LogoDisplay and SpotlightEffects components
  - Pass isPlaying prop from useAudio to children
  - Use ThemedView for base container styling
  - Purpose: Main container orchestrating all logo animations
  - _Leverage: components/themed-view.tsx, components/player/LogoDisplay.tsx, components/player/SpotlightEffects.tsx_
  - _Requirements: 1.1, 1.2_

- [x] 9. Add AppState listener to AnimatedLogoContainer.tsx
  - File: components/player/AnimatedLogoContainer.tsx (modify)
  - Import AppState from react-native
  - Add useEffect to listen for background/foreground changes
  - Call pauseAnimations() when backgrounded
  - Purpose: Battery optimization by pausing when not visible
  - _Leverage: React Native AppState API_
  - _Requirements: 2.4, 2.5_

- [x] 10. Create AnimationErrorBoundary in components/player/AnimationErrorBoundary.tsx
  - File: components/player/AnimationErrorBoundary.tsx (create)
  - Create class component extending React.Component
  - Implement componentDidCatch for error handling
  - Render fallback UI with static logo on error
  - Purpose: Prevent animation crashes from breaking player
  - _Leverage: React error boundary pattern_
  - _Requirements: NFR - Reliability_

- [x] 11. Add performance monitoring to SpotlightEffects.tsx
  - File: components/player/SpotlightEffects.tsx (modify)
  - Add frame rate measurement using runOnJS
  - Reduce orb count if FPS drops below 50
  - Switch to simpler animations on low performance
  - Purpose: Adaptive performance optimization
  - _Leverage: react-native-reanimated runOnJS_
  - _Requirements: NFR - Performance_

- [x] 12. Replace logo area in app/(tabs)/index.tsx RadioScreen
  - File: app/(tabs)/index.tsx (modify)
  - Import AnimatedLogoContainer component
  - Replace title text with AnimatedLogoContainer
  - Wrap in AnimationErrorBoundary for safety
  - Purpose: Integrate animated logo into player screen
  - _Leverage: existing RadioScreen structure_
  - _Requirements: 1.1_

- [x] 13. Create AnimatedTabIcon component in components/navigation/AnimatedTabIcon.tsx
  - File: components/navigation/AnimatedTabIcon.tsx (create)
  - Wrap IconSymbol with Animated.View
  - Add scale animation when focused (1.2x)
  - Use withSpring for smooth transitions
  - Purpose: Enhanced tab icon with scale animation
  - _Leverage: components/ui/icon-symbol.tsx_
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 14. Add pulse indicator to AnimatedTabIcon.tsx
  - File: components/navigation/AnimatedTabIcon.tsx (modify)
  - Add small animated dot overlay when playing
  - Use withRepeat for continuous pulse
  - Position absolutely in top-right corner
  - Purpose: Visual indicator for active playback
  - _Leverage: useAudio hook for isPlaying state_
  - _Requirements: 4.4_

- [x] 15. Update tab layout to use AnimatedTabIcon for radio tab
  - File: app/(tabs)/_layout.tsx (modify)
  - Import AnimatedTabIcon component
  - Replace radio tab's tabBarIcon with AnimatedTabIcon
  - Pass isPlaying state from useAudio
  - Purpose: Integrate animated tab icon
  - _Leverage: existing tab configuration_
  - _Requirements: 4.1, 4.5_

- [x] 16. Add custom artwork method to MediaSessionManager.ts
  - File: services/audio/MediaSessionManager.ts (modify)
  - Add setCustomArtwork(uri, backgroundColor) method
  - Update metadata interface to accept artwork parameter
  - Use Image.resolveAssetSource for local asset URI
  - Purpose: Enable custom album artwork in media controls
  - _Leverage: existing MediaSessionManager class_
  - _Requirements: 6.1, 6.5_

- [x] 17. Update MediaSessionManager updateMetadata for logo artwork
  - File: services/audio/MediaSessionManager.ts (modify)
  - Modify updateMetadata to use logo as artwork
  - Set artwork to Trendankara3.png with red background
  - Add fallback to text if image unavailable
  - Purpose: Display logo in system media controls
  - _Leverage: expo-av Audio.setNowPlayingInfoAsync_
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 18. Call setCustomArtwork from AudioService initialization
  - File: services/audio/AudioService.ts (modify)
  - Import logo asset path
  - Call mediaSessionManager.setCustomArtwork on init
  - Pass logo URI and brand red color (#DC2626)
  - Purpose: Set logo as default artwork for media session
  - _Leverage: existing AudioService initialization_
  - _Requirements: 6.1, 6.5_

- [x] 19. Add responsive calculations helper in utils/responsive.ts
  - File: utils/responsive.ts (create)
  - Create getLogoSize(screenWidth) function
  - Create getOrbSize(screenWidth) function
  - Export ResponsiveSize interface
  - Purpose: Centralize responsive size calculations
  - _Leverage: React Native Dimensions API_
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 20. Update LogoDisplay.tsx to use responsive helper
  - File: components/player/LogoDisplay.tsx (modify)
  - Import responsive helper functions
  - Use Dimensions.get('window') for screen width
  - Apply calculated sizes to logo Image component
  - Purpose: Make logo properly responsive
  - _Leverage: utils/responsive.ts_
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 21. Add orientation change handling to AnimatedLogoContainer
  - File: components/player/AnimatedLogoContainer.tsx (modify)
  - Add Dimensions event listener for orientation
  - Recalculate sizes on orientation change
  - Animate position changes with withTiming
  - Purpose: Smooth transitions on device rotation
  - _Leverage: React Native Dimensions API_
  - _Requirements: 5.4_

- [x] 22. Add reduce motion support to usePlaybackAnimation hook
  - File: hooks/usePlaybackAnimation.ts (modify)
  - Import AccessibilityInfo from react-native
  - Check isReduceMotionEnabled preference
  - Disable or simplify animations when enabled
  - Purpose: Respect system accessibility settings
  - _Leverage: React Native AccessibilityInfo API_
  - _Requirements: NFR - Usability_

- [x] 23. Create buffering state animations in SpotlightEffects.tsx
  - File: components/player/SpotlightEffects.tsx (modify)
  - Add uniform slow pulse when state is 'buffering'
  - Sync all orbs for loading indication
  - Use longer duration for calmer effect
  - Purpose: Visual feedback during buffering
  - _Leverage: useAudio state prop_
  - _Requirements: 3.5_

- [x] 24. Add theme transition animations to SpotlightEffects.tsx
  - File: components/player/SpotlightEffects.tsx (modify)
  - Animate opacity changes when theme switches
  - Use withTiming for smooth transitions
  - Adjust blur radius based on theme
  - Purpose: Smooth theme change transitions
  - _Leverage: useColorScheme hook_
  - _Requirements: 1.4, 1.5_

- [x] 25. Create unit tests for LogoDisplay component
  - File: __tests__/components/player/LogoDisplay.test.tsx (create)
  - Test responsive sizing calculations
  - Test image load error handling
  - Test fallback text rendering
  - Purpose: Ensure logo display reliability
  - _Leverage: Jest testing framework_
  - _Requirements: 1.1, 5.0_

- [x] 26. Create unit tests for usePlaybackAnimation hook
  - File: __tests__/hooks/usePlaybackAnimation.test.tsx (create)
  - Test animation state transitions
  - Test play/pause/stop behaviors
  - Mock useAudio responses
  - Purpose: Validate animation logic
  - _Leverage: Jest, @testing-library/react-hooks_
  - _Requirements: 3.0_

- [x] 27. Add memory cleanup to all animation components
  - File: components/player/SpotlightOrb.tsx (modify)
  - File: components/player/AnimatedLogoContainer.tsx (modify)
  - Add cleanup in useEffect return functions
  - Cancel animations on unmount
  - Purpose: Prevent memory leaks
  - _Leverage: React cleanup patterns_
  - _Requirements: NFR - Reliability_

- [x] 28. Create integration test for full animation flow
  - File: __tests__/integration/AnimatedLogo.test.tsx (create)
  - Test play → pause → stop animation sequence
  - Test background/foreground transitions
  - Verify performance metrics
  - Purpose: Ensure end-to-end functionality
  - _Leverage: Jest, React Native Testing Library_
  - _Requirements: All_