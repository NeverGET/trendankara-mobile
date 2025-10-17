# Requirements: Core Theme & Colors Setup

## Overview
Replace the default Expo blue theme with Trend Ankara's RED/BLACK/WHITE brand colors, implement proper dark/light mode support, and establish Turkish language strings infrastructure for the app's UI.

## User Stories

### 1. Brand Theme Integration
**As a** Trend Ankara user
**I want** to see the app in brand colors (red, black, white)
**So that** I experience consistent brand identity across all screens

**Acceptance Criteria:**
- WHEN the app opens THEN all primary colors show red instead of blue
- WHEN I navigate through tabs THEN active tab indicators are red
- WHEN I see links or interactive elements THEN they use red for primary actions
- IF a component uses the default blue color THEN it must be replaced with appropriate brand colors
- WHEN I view the app THEN no blue colors appear except in news page badges

### 2. Dark Mode Support
**As a** user who prefers dark themes
**I want** the app to support dark mode with proper contrast
**So that** I can use the app comfortably in low-light conditions

**Acceptance Criteria:**
- WHEN device is in dark mode THEN app switches to dark theme automatically
- WHEN in dark mode THEN background is black/dark gray with white text
- WHEN in light mode THEN background is white with black text
- IF user switches system theme THEN app theme updates immediately
- WHEN viewing red elements in dark mode THEN they remain clearly visible

### 3. Turkish UI Strings
**As a** Turkish user
**I want** all UI text to be in Turkish
**So that** I can navigate the app in my native language

**Acceptance Criteria:**
- WHEN I open the app THEN all navigation labels are in Turkish
- WHEN I see any UI text THEN it uses proper Turkish characters (ç, ğ, ı, ö, ş, ü)
- WHEN strings are rendered THEN they use JSX expressions (`{""}`, `{''}`, or `` {``} ``)
- IF a new screen is added THEN Turkish strings must be centralized for maintainability

## Technical Requirements

### Theme System
- Must support both light and dark color schemes
- Color definitions must be centralized in constants/theme.ts
- All color references must use theme constants, no hardcoded values
- Theme must be accessible via useThemeColor hook

### Color Palette
**Primary Colors:**
- Red: Main brand color for actions, active states, and emphasis
- Black: Primary text and strong UI elements
- White: Backgrounds and contrast elements

**Secondary Colors:**
- Dark grays: For subtle UI elements and disabled states
- Light grays: For borders and dividers

**Forbidden:**
- Blue: Not allowed anywhere except news page badges

### String Management
- All UI strings must be defined in a centralized location
- Strings must be organized by feature/screen
- Must support Turkish characters (UTF-8)
- All string rendering must use JSX expressions

### Component Updates Required
- ThemedText component (remove blue from link style)
- Tab navigation (update active/inactive colors)
- All components using Colors constant
- Any component with hardcoded blue values

## Constraints

### Technical Constraints
- Must work with Expo SDK 54
- Must maintain compatibility with React Native 0.81.4
- Cannot break existing navigation structure
- Must preserve existing dark/light mode switching logic

### Design Constraints
- Must follow "simple is better" principle
- No overengineering of theme system
- Colors must have sufficient contrast for accessibility
- Red must be vibrant enough for brand recognition

### Performance Constraints
- Theme switching must be instant (< 100ms)
- No noticeable lag when changing color scheme
- Minimal bundle size increase

## Non-Functional Requirements

### Maintainability
- Theme values must be easily adjustable
- New developers must understand theme system quickly
- String changes must not require code changes

### Compatibility
- Must work on iOS 13+
- Must work on Android 5.0+
- Must handle both phone and tablet layouts
- Must work with system-wide dark mode settings

### Testing
- All color changes must be visually verified
- Dark/light mode switching must be tested
- Turkish strings must be reviewed for correctness
- No blue colors should remain (except news badges)

## Risks & Mitigations

### Risk: Hardcoded Colors
**Description:** Some third-party components may have hardcoded blue colors
**Mitigation:** Override styles for third-party components or wrap them

### Risk: String Truncation
**Description:** Turkish translations may be longer than English
**Mitigation:** Design UI with flexible layouts that accommodate longer text

### Risk: Color Contrast Issues
**Description:** Red on black might have poor contrast in dark mode
**Mitigation:** Test different shades of red and adjust for optimal visibility

## Dependencies
- Existing theme.ts file needs complete overhaul
- useThemeColor hook is already available
- ThemedText and ThemedView components exist
- React Native's useColorScheme for system theme detection

## Acceptance Criteria Summary
- [ ] All blue colors replaced with brand colors (except news badges)
- [ ] Dark mode shows black/dark gray backgrounds with white text
- [ ] Light mode shows white backgrounds with black text
- [ ] All UI strings are in Turkish
- [ ] String rendering uses JSX expressions
- [ ] Tab navigation uses red for active state
- [ ] Theme colors are centralized in constants
- [ ] No hardcoded color values in components
- [ ] Theme switching is instant and smooth
- [ ] Turkish characters display correctly