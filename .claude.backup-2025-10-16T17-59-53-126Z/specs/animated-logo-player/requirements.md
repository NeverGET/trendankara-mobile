# Requirements Document

## Introduction

This feature enhances the TrendAnkara Radio player screen with an animated brand logo and dynamic visual effects that react to the audio playback state. The logo will be displayed prominently with animated spotlight effects that create an engaging, modern visual experience while maintaining the app's minimalist design philosophy. The feature will use the transparent logo variant (Trendankara3.png) with animated background lighting effects that pulse and move in response to music playback, creating a pseudo-audio reactive visualization. Additionally, the logo will be integrated into the system's media session controls as album artwork, providing consistent branding across the OS-level media player interface during background playback.

## Alignment with Product Vision

This feature directly supports the product vision and goals outlined in product.md:

- **Professional Brand Presence**: Prominently displays the TrendAnkara logo, reinforcing brand identity
- **Simple, Elegant Experience**: Uses subtle, tasteful animations that enhance without overwhelming
- **Minimalist Design Philosophy**: Clean implementation with focused visual effects that don't distract from core functionality
- **User Engagement**: Creates a more immersive listening experience through visual feedback
- **Performance Conscious**: Lightweight animations that respect device resources and battery life
- **Brand Colors**: Utilizes the red/black/white color scheme with a reddish-purple accent for the glow effects

## Requirements

### Requirement 1: Logo Display with Background Effects

**User Story:** As a radio listener, I want to see the TrendAnkara logo prominently displayed with attractive visual effects, so that I have a branded and engaging visual experience while listening.

#### Acceptance Criteria

1. WHEN the player screen loads THEN the transparent logo (Trendankara3.png) SHALL be displayed in the center of the player area
2. WHEN the logo is displayed THEN 2-3 blurred circular light spots SHALL appear behind the logo as a background effect (dynamically adjusted based on device performance)
3. WHEN the lights are rendered THEN they SHALL use a red gradient effect (#DC2626 to #EF4444) that stays within the brand color palette
4. IF the theme is dark mode THEN the light effects SHALL be more vibrant and visible
5. IF the theme is light mode THEN the light effects SHALL be subtler with reduced opacity

### Requirement 2: Ambient Light Animation

**User Story:** As a user, I want to see gentle animated lighting effects, so that the player screen feels alive and modern.

#### Acceptance Criteria

1. WHEN the lights are displayed AND music is not playing THEN each light SHALL slowly drift in a random circular pattern
2. WHEN lights are moving THEN they SHALL move at different speeds (between 10-20 seconds per cycle)
3. WHEN lights reach their movement bounds THEN they SHALL smoothly reverse direction without jarring transitions
4. IF the app is in background mode THEN animations SHALL pause to conserve battery
5. WHEN returning from background THEN animations SHALL smoothly resume from their last position

### Requirement 3: Music-Reactive Pulse Effects

**User Story:** As a listener, I want the visual effects to react when music is playing, so that I have visual feedback that enhances my listening experience.

#### Acceptance Criteria

1. WHEN playback starts THEN the light spots SHALL begin pulsing with a scale animation
2. WHEN pulsing THEN each light SHALL scale up quickly (0.2s) to 1.3x size and scale down slowly (0.8s) to original size
3. WHEN multiple lights are pulsing THEN each SHALL have a random offset (0-500ms) to create organic movement
4. IF playback is paused THEN pulsing SHALL stop and return to ambient movement within 1 second
5. WHEN buffering or loading THEN lights SHALL pulse slowly and uniformly to indicate loading state

### Requirement 4: Navigation Bar Enhancement

**User Story:** As a user, I want the radio tab to be visually prominent in the navigation, so that I can easily identify the main player screen.

#### Acceptance Criteria

1. WHEN the radio tab is active THEN its icon SHALL be 20% larger than other tab icons
2. WHEN switching to the radio tab THEN the icon SHALL smoothly scale up with a spring animation
3. WHEN leaving the radio tab THEN the icon SHALL smoothly scale down to normal size
4. IF music is playing THEN a subtle pulsing indicator SHALL appear on the radio tab icon
5. WHEN the tab bar is rendered THEN the radio tab SHALL be visually centered with adjusted spacing

### Requirement 5: Responsive Layout

**User Story:** As a user on different devices, I want the logo and effects to scale appropriately, so that the experience is consistent across all screen sizes.

#### Acceptance Criteria

1. WHEN on small screens (<375px width) THEN the logo SHALL scale to 60% of screen width
2. WHEN on regular screens (375-414px) THEN the logo SHALL scale to 50% of screen width
3. WHEN on large screens (>414px) THEN the logo SHALL scale to 40% of screen width with max 200px
4. IF device orientation changes THEN layout SHALL smoothly animate to new positions
5. WHEN effects are scaled THEN blur radius and opacity SHALL adjust proportionally

### Requirement 6: Media Session Album Artwork

**User Story:** As a user, I want to see the TrendAnkara logo as album artwork in my device's media controls, so that I have a branded experience even when controlling playback from outside the app.

#### Acceptance Criteria

1. WHEN background playback is active THEN the TrendAnkara logo SHALL be displayed as album artwork in the system media controls
2. WHEN on iOS THEN the logo SHALL appear in Control Center and lock screen media controls
3. WHEN on Android THEN the logo SHALL appear in the notification media controls and lock screen
4. IF the logo image fails to load THEN a fallback color background with text SHALL be used
5. WHEN media session is updated THEN the artwork SHALL be set to the transparent logo with appropriate background color (#DC2626)

## Non-Functional Requirements

### Performance
- Animations SHALL maintain 60 FPS on devices from the last 3 years
- Total CPU usage for animations SHALL not exceed 5% when active
- Memory usage for animation components SHALL not exceed 10MB
- Animations SHALL use hardware acceleration where available
- Battery impact SHALL be less than 2% per hour when animations are running

### Security
- Image assets SHALL be bundled locally, not fetched from network
- No user data SHALL be collected or transmitted through animation components
- Animation parameters SHALL be sanitized to prevent performance exploits

### Reliability
- Animations SHALL gracefully degrade on low-end devices
- Component SHALL handle missing image assets with fallback to text logo
- Animations SHALL pause when app is backgrounded
- State SHALL be preserved across app suspensions
- Memory SHALL be properly released when component unmounts

### Usability
- Animations SHALL be subtle and not distract from primary controls
- Effects SHALL respect system animation preferences (reduce motion)
- Visual feedback SHALL be immediate when playback state changes
- Logo SHALL remain clearly visible over animation effects
- All effects SHALL work in both light and dark themes