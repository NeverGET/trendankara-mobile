# Requirements: Navigation Structure

## Overview
Implement a complete bottom tab navigation system with 5 tabs for the Trend Ankara radio app, featuring Turkish labels, appropriate icons, and proper screen routing configuration for all major app sections.

## User Stories

### 1. Bottom Tab Navigation
**As a** Trend Ankara app user
**I want** to navigate between app sections using bottom tabs
**So that** I can quickly access all app features with one tap

**Acceptance Criteria:**
- WHEN I open the app THEN I see 5 tabs at the bottom of the screen
- WHEN I tap any tab THEN I navigate to that section immediately
- WHEN I'm on a tab THEN that tab icon and label are highlighted in red
- IF I tap the current tab again THEN nothing happens (no reload)
- WHEN switching tabs THEN the previous screen state is preserved

### 2. Radio Player Access
**As a** radio listener
**I want** the radio player to be the default/home tab
**So that** I can start listening immediately when opening the app

**Acceptance Criteria:**
- WHEN I launch the app THEN the Radio tab is selected by default
- WHEN the Radio tab is active THEN I see the player controls
- WHEN I navigate away and return THEN playback continues uninterrupted
- IF audio is playing THEN tab switches don't affect playback

### 3. Turkish Navigation Labels
**As a** Turkish user
**I want** all navigation labels in Turkish
**So that** I can understand the app navigation in my native language

**Acceptance Criteria:**
- WHEN I see the tab labels THEN they display: Radyo, Anketler, Haberler, Sponsorlar, Ayarlar
- WHEN labels are displayed THEN Turkish characters (ç, ğ, ı, ö, ş, ü) render correctly
- IF a label is too long THEN it's truncated with ellipsis
- WHEN device font size changes THEN labels remain readable

### 4. Visual Icon Indicators
**As a** user
**I want** clear icons for each tab
**So that** I can identify sections even without reading labels

**Acceptance Criteria:**
- WHEN I see the Radio tab THEN it displays a radio/play icon
- WHEN I see the Polls tab THEN it displays a chart/poll icon
- WHEN I see the News tab THEN it displays a newspaper/article icon
- WHEN I see the Sponsors tab THEN it displays a megaphone/ad icon
- WHEN I see the Settings tab THEN it displays a gear/settings icon
- IF an icon loads slowly THEN a placeholder is shown

### 5. Screen Routing Configuration
**As a** user navigating the app
**I want** each tab to lead to its correct screen
**So that** I can access the intended functionality

**Acceptance Criteria:**
- WHEN I tap Radyo THEN I navigate to the player screen
- WHEN I tap Anketler THEN I navigate to the polls listing
- WHEN I tap Haberler THEN I navigate to the news feed
- WHEN I tap Sponsorlar THEN I navigate to the dynamic ads page
- WHEN I tap Ayarlar THEN I navigate to app settings
- IF a screen fails to load THEN an error message is displayed

## Technical Requirements

### Navigation Framework
- Use React Navigation with bottom tabs (@react-navigation/bottom-tabs)
- Leverage existing expo-router tab navigation
- Maintain haptic feedback on iOS (existing HapticTab component)
- Support both iOS and Android navigation patterns

### Tab Configuration
**Required Tabs (in order):**
1. **Radyo** (Radio) - index.tsx - Default tab
2. **Anketler** (Polls) - polls.tsx
3. **Haberler** (News) - news.tsx
4. **Sponsorlar** (Sponsors) - sponsors.tsx
5. **Ayarlar** (Settings) - settings.tsx

### Icon Requirements
- Use SF Symbols on iOS via IconSymbol component
- Use Material Icons on Android/web via fallback
- Icon size: 28px (consistent with current implementation)
- Support active/inactive color states

### Screen Files Structure
```
app/(tabs)/
├── _layout.tsx      # Tab navigation configuration
├── index.tsx        # Radio Player (Radyo)
├── polls.tsx        # Polls (Anketler)
├── news.tsx         # News (Haberler)
├── sponsors.tsx     # Sponsors (Sponsorlar)
└── settings.tsx     # Settings (Ayarlar)
```

### Styling Requirements
- Active tab: Red color from theme (#DC2626)
- Inactive tab: Gray color from theme
- Tab bar background: Adapt to light/dark theme
- Follow existing Colors constant patterns

## Constraints

### Technical Constraints
- Must work with Expo Router file-based routing
- Must maintain existing HapticTab functionality
- Cannot break current theme integration
- Must support React Navigation 7.x

### Platform Constraints
- iOS: Must feel native with proper transitions
- Android: Must follow Material Design patterns
- Tab bar height must be platform-appropriate
- Safe area insets must be respected

### Performance Constraints
- Tab switching must be instant (< 100ms)
- Icons must load immediately (use bundled assets)
- No unnecessary re-renders when switching tabs
- Memory-efficient screen management

## Non-Functional Requirements

### Accessibility
- All tabs must be accessible via screen readers
- Tab labels must be announced in Turkish
- Focus indicators must be visible
- Minimum touch target: 44x44px (iOS) / 48x48dp (Android)

### Usability
- Tab bar must always be visible (except in modals)
- Active state must be clearly distinguishable
- Icons and labels must both be visible
- Smooth transitions between screens

### Maintainability
- Tab configuration centralized in _layout.tsx
- Easy to add/remove/reorder tabs
- Icon mappings clearly documented
- Screen components follow consistent patterns

## Risks & Mitigations

### Risk: Tab Label Truncation
**Description:** Turkish labels might be longer than English equivalents
**Mitigation:** Use appropriate font sizes and consider icon-only mode on small screens

### Risk: Icon Availability
**Description:** Not all required icons may exist in SF Symbols/Material Icons
**Mitigation:** Create custom icon mappings or use close alternatives

### Risk: Navigation State Loss
**Description:** Screen state might be lost when switching tabs
**Mitigation:** Implement proper state persistence and navigation lifecycle handling

### Risk: Performance on Low-End Devices
**Description:** Multiple screens in memory might cause performance issues
**Mitigation:** Implement lazy loading and proper screen cleanup

## Dependencies
- @react-navigation/bottom-tabs (already installed)
- expo-router (already configured)
- React Navigation native dependencies (installed)
- IconSymbol component (existing)
- HapticTab component (existing)
- Theme colors (must complete theme setup first)

## Acceptance Criteria Summary
- [ ] 5 bottom tabs implemented and visible
- [ ] All tabs navigate to correct screens
- [ ] Turkish labels display correctly
- [ ] Icons appear for all tabs
- [ ] Active tab shows red, inactive shows gray
- [ ] Radio tab is default on app launch
- [ ] Haptic feedback works on iOS
- [ ] Tab bar adapts to dark/light theme
- [ ] All screens load without errors
- [ ] Navigation is smooth and instant