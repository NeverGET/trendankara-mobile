# Theme Testing Guide - Task 3.5

## Dark/Light Mode Switching Test Documentation

This document outlines the comprehensive testing approach for verifying dark/light mode switching functionality in the Trend Ankara mobile application.

## Test Objectives

1. Verify immediate theme updates when system theme changes
2. Ensure proper color transitions for all UI elements
3. Confirm useColorScheme hook responsiveness
4. Validate brand color consistency across themes

## Test Environment

### Prerequisites
- iOS Simulator and/or Android Emulator running
- React Native development environment set up
- App running on both platforms

### Test Screen Location
- **Primary Test Screen:** `app/(tabs)/explore.tsx` (Explore tab)
- This screen contains comprehensive theme verification elements:
  - Current theme indicator
  - Brand color swatches
  - Typography samples with different font families
  - Turkish character verification
  - Semantic color displays

## Manual Testing Procedures

### 1. iOS Simulator Testing

#### Steps:
1. **Launch iOS Simulator**
   ```bash
   npx expo run:ios
   ```

2. **Navigate to Test Screen**
   - Open the app
   - Tap on "Explore" tab
   - Verify the test screen loads properly

3. **Initial Theme Verification**
   - Note the current theme displayed at the top
   - Verify color swatches match expected brand colors
   - Check text readability and contrast

4. **Theme Switching Test**
   - Open iOS Settings app (⌘+Shift+H to go to home, then Settings)
   - Navigate to: Settings > Developer > Dark Appearance
   - Toggle dark/light mode
   - Return to the app immediately (⌘+Tab or swipe up and tap the app)

5. **Post-Switch Verification**
   - Verify theme indicator updates immediately
   - Check all color swatches remain consistent
   - Confirm text colors switch appropriately:
     - Light mode: Dark text on light background
     - Dark mode: Light text on dark background
   - Verify brand colors (red, black, white) remain unchanged
   - Check gray palette adapts correctly

### 2. Android Emulator Testing

#### Steps:
1. **Launch Android Emulator**
   ```bash
   npx expo run:android
   ```

2. **Navigate to Test Screen**
   - Open the app
   - Tap on "Explore" tab
   - Verify the test screen loads properly

3. **Theme Switching Test**
   - Pull down notification panel
   - Look for "Dark theme" toggle (or use Settings > Display > Dark theme)
   - Toggle dark/light mode
   - Return to the app immediately

4. **Post-Switch Verification**
   - Same verification steps as iOS
   - Pay special attention to platform-specific font rendering

### 3. Device Settings Alternative Method

#### For both platforms:
1. Open device Settings
2. Navigate to Display settings
3. Toggle Dark/Light mode
4. Return to app and verify immediate updates

## Expected Results

### Light Mode Theme Values
- **Background:** White (#FFFFFF)
- **Text:** Dark gray (#111827)
- **Tint:** Primary red (#DC2626)
- **Icons:** Medium gray (#4B5563)
- **Borders:** Light gray (#E5E7EB)

### Dark Mode Theme Values
- **Background:** Black (#000000)
- **Text:** White (#FFFFFF)
- **Tint:** White (#FFFFFF)
- **Icons:** Light gray (#9CA3AF)
- **Borders:** Dark gray (#374151)

### Brand Colors (Consistent Across Themes)
- **Primary:** #DC2626 (Red)
- **Secondary:** #000000 (Black)
- **Tertiary:** #FFFFFF (White)
- **Error:** #DC2626 (Red)
- **Warning:** #F59E0B (Orange)
- **Success:** #10B981 (Green)
- **Info:** #3B82F6 (Blue)

## Test Verification Checklist

### ✅ Immediate Response Tests
- [ ] Theme changes instantly when system setting is toggled
- [ ] No delays or flickering during transitions
- [ ] useColorScheme hook updates immediately

### ✅ Visual Consistency Tests
- [ ] All text remains readable in both themes
- [ ] Color contrasts meet accessibility standards
- [ ] Brand colors maintain consistency
- [ ] Gray palette adapts appropriately

### ✅ Component-Level Tests
- [ ] ThemedView components update backgrounds
- [ ] ThemedText components update text colors
- [ ] Icon colors update appropriately
- [ ] Navigation elements reflect theme changes

### ✅ Platform-Specific Tests
- [ ] iOS theme switching works via Settings
- [ ] Android theme switching works via Quick Settings
- [ ] Font rendering is consistent across platforms

### ✅ Typography Tests
- [ ] All font families render correctly in both themes
- [ ] Turkish characters display properly in both themes
- [ ] Text hierarchy remains clear in both themes

## Common Issues to Watch For

1. **Delayed Updates:** Theme should change immediately, not after app restart
2. **Color Inconsistencies:** Some elements might not update properly
3. **Contrast Problems:** Text might become unreadable in certain combinations
4. **Platform Differences:** iOS and Android might handle theme changes differently

## Testing Notes

- Test on multiple screen sizes if possible
- Verify with real devices in addition to simulators
- Test during different times of day (some users have automatic theme switching)
- Check if theme preference persists after app backgrounding/foregrounding

## Conclusion

This testing approach ensures comprehensive verification of the dark/light mode switching functionality. The test screen in the Explore tab provides an excellent foundation for visual verification of all theme-related elements.

## Test Completion Criteria

- [ ] All manual tests completed on iOS
- [ ] All manual tests completed on Android
- [ ] No visual inconsistencies found
- [ ] Theme switching is immediate and reliable
- [ ] All checklist items verified