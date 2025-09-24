# Requirements: Radio Player UI

## Overview
Design and implement an intuitive radio player user interface for Trend Ankara app featuring a prominent play/pause button, station logo, and mute control, providing users with simple and immediate control over their listening experience.

## User Stories

### 1. Play/Pause Control
**As a** radio listener
**I want** a large, easily tappable play/pause button
**So that** I can quickly control playback without looking closely at the screen

**Acceptance Criteria:**
- WHEN I see the player screen THEN a giant play/pause button is prominently displayed
- WHEN audio is stopped THEN the button shows a play icon
- WHEN audio is playing THEN the button shows a pause icon
- WHEN I tap the play button THEN audio starts within 3 seconds
- WHEN I tap the pause button THEN audio stops immediately
- IF the button is pressed THEN haptic feedback is provided (iOS)
- WHEN loading audio THEN a loading indicator appears on/near the button

### 2. Station Branding
**As a** Trend Ankara listener
**I want** to see the station logo prominently displayed
**So that** I feel connected to the brand while listening

**Acceptance Criteria:**
- WHEN I open the player screen THEN the Trend Ankara logo is visible
- WHEN the logo is displayed THEN it uses high-quality graphics
- IF no custom logo exists THEN a placeholder is shown
- WHEN in dark mode THEN the logo adapts appropriately
- WHEN on smaller screens THEN the logo scales proportionally

### 3. Mute Control
**As a** user
**I want** a mute button to quickly silence the audio
**So that** I can instantly mute without stopping playback

**Acceptance Criteria:**
- WHEN I see the player screen THEN a mute button is visible
- WHEN audio is unmuted THEN the button shows a speaker icon
- WHEN audio is muted THEN the button shows a muted speaker icon
- WHEN I tap the mute button THEN audio is muted instantly
- WHEN muted and I tap again THEN audio returns to previous volume
- IF muted THEN playback continues silently

### 4. Visual Feedback
**As a** user interacting with controls
**I want** clear visual feedback for all actions
**So that** I know my inputs are recognized

**Acceptance Criteria:**
- WHEN I press any button THEN it shows a pressed state
- WHEN a button is disabled THEN it appears grayed out
- WHEN transitioning states THEN smooth animations occur
- IF an error occurs THEN visual error indication is shown
- WHEN buttons are tapped THEN they respond within 100ms

### 5. Responsive Layout
**As a** user with different devices
**I want** the player UI to adapt to my screen size
**So that** controls are always accessible and properly sized

**Acceptance Criteria:**
- WHEN on a small phone THEN all controls remain tappable (min 44x44px)
- WHEN on a tablet THEN controls scale appropriately
- WHEN rotating device THEN layout adjusts smoothly
- IF text is too long THEN it truncates with ellipsis
- WHEN in landscape THEN controls remain centered and balanced

## Technical Requirements

### UI Components
**Control Elements:**
- Play/Pause button: Minimum 80x80px, centered
- Mute button: Minimum 44x44px
- Station logo: Flexible size, maintains aspect ratio
- Touch targets: Follow platform guidelines (iOS: 44x44, Android: 48x48)

**Visual Design:**
- Use Trend Ankara colors (RED: #DC2626, BLACK, WHITE)
- No blue colors in UI
- Consistent with app theme system
- Support dark/light modes

### Layout Structure
```
┌─────────────────────────┐
│                         │
│     [Station Logo]      │
│                         │
│    ┌─────────────┐     │
│    │             │     │
│    │  Play/Pause │     │
│    │   (Giant)   │     │
│    │             │     │
│    └─────────────┘     │
│                         │
│        [Mute]           │
│                         │
└─────────────────────────┘
```

### Component Architecture
- Use existing ThemedView and ThemedText components
- Leverage IconSymbol for button icons
- Implement with TouchableOpacity for press feedback
- Integrate with useAudio hook for state management

### State Integration
**Player States to Display:**
- `idle`: Show play button
- `loading`: Show loading indicator
- `playing`: Show pause button
- `paused`: Show play button
- `error`: Show play button with error indication

### Icon Requirements
- Play icon: "play.circle.fill" or similar
- Pause icon: "pause.circle.fill" or similar
- Mute icon: "speaker.wave.2.fill" or similar
- Muted icon: "speaker.slash.fill" or similar
- Use SF Symbols on iOS, Material Icons on Android

## Constraints

### Technical Constraints
- Must work with existing audio service
- Compatible with React Native 0.81.4
- Use TypeScript for type safety
- Follow existing component patterns
- Integrate with theme system

### Design Constraints
- Follow "simple is better" principle
- Maintain Trend Ankara brand identity
- Use only RED/BLACK/WHITE colors
- Giant button must be thumb-friendly
- Clear visual hierarchy required

### Platform Constraints
- iOS: Support iOS 13+
- Android: Support Android 5.0+
- Consistent behavior across platforms
- Respect platform-specific patterns
- Handle safe area insets

### Performance Constraints
- Button response < 100ms
- Smooth animations at 60fps
- No layout shifts during state changes
- Minimal re-renders
- Efficient image loading for logo

## Non-Functional Requirements

### Accessibility
- All controls accessible via screen readers
- Proper accessibility labels in Turkish
- Sufficient color contrast (WCAG AA)
- Focus indicators for keyboard navigation
- Announce state changes to screen readers

### Usability
- One-thumb operation possible
- Controls reachable with natural grip
- Clear affordances (buttons look tappable)
- Consistent with platform conventions
- No accidental taps possible

### Maintainability
- Reusable component structure
- Clear separation of concerns
- Well-documented props and state
- Easy to modify layout
- Theme-aware implementation

### Localization
- UI labels in Turkish
- Support for RTL languages (future)
- Text scaling support
- Proper character encoding

## Risks & Mitigations

### Risk: Logo Loading Failure
**Description:** Station logo might fail to load
**Mitigation:** Provide fallback text or default image

### Risk: Button Size on Small Screens
**Description:** Giant button might be too large for small devices
**Mitigation:** Use responsive sizing with maximum constraints

### Risk: State Sync Issues
**Description:** UI might not reflect actual audio state
**Mitigation:** Subscribe to audio service state updates

### Risk: Touch Target Overlap
**Description:** Buttons might be too close together
**Mitigation:** Enforce minimum spacing between controls

### Risk: Performance on Animations
**Description:** Animations might stutter on low-end devices
**Mitigation:** Use native driver for animations, provide reduced motion option

## Dependencies
- Audio streaming service (must be implemented)
- useAudio hook for state management
- Station logo asset (to be provided)
- IconSymbol component (existing)
- ThemedView/ThemedText components (existing)
- Theme system with colors (existing)

## Acceptance Criteria Summary
- [ ] Giant play/pause button implemented (min 80x80px)
- [ ] Button shows correct icon based on state
- [ ] Station logo displayed prominently
- [ ] Mute button functional with icon states
- [ ] All controls respond within 100ms
- [ ] Haptic feedback on iOS
- [ ] Loading indicator during stream connection
- [ ] Error states handled visually
- [ ] Dark/light mode support
- [ ] Responsive layout for all screen sizes
- [ ] Turkish accessibility labels
- [ ] No blue colors used
- [ ] RED/BLACK/WHITE theme applied