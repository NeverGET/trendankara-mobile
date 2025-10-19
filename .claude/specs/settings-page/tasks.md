# Implementation Plan - Settings Page

## Task Overview

This implementation replaces the existing comprehensive settings page with a simplified version containing only four essential settings. The approach leverages existing Redux patterns, themed components, and AsyncStorage persistence. Tasks are organized to minimize file changes per task, with each task completing in 15-30 minutes and producing a single, testable outcome.

## Steering Document Compliance

**structure.md Compliance:**
- Settings screen in `app/settings.tsx` (modify existing file)
- Settings state in `store/slices/settingsSlice.ts` (simplify existing slice)
- Turkish strings in `constants/strings.ts` (add to existing file)
- No new directories or components needed

**tech.md Compliance:**
- Uses existing Redux Toolkit patterns
- Leverages existing ThemedView/ThemedText components
- Follows TypeScript best practices with full typing
- Turkish UI strings in JSX expressions from constants

## Atomic Task Requirements

**Each task meets these criteria:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Exact file paths specified
- **Agent-Friendly**: Clear input/output, minimal context switching

## Tasks

### Phase 1: Data Layer (State Management)

- [x] 1. Add Turkish strings for settings UI to constants/strings.ts
  - **File**: `constants/strings.ts`
  - Add new `settings` object with Turkish strings for 4 settings
  - Include labels, descriptions, and button text
  - Add confirmation dialog messages
  - **Purpose**: Centralize all Turkish UI text before building UI
  - _Leverage: Existing strings.ts structure and Turkish character encoding_
  - _Requirements: All (Turkish localization)_

- [x] 2. Simplify UserPreferences interface in settingsSlice.ts
  - **Files**: `store/slices/settingsSlice.ts`
  - Remove old interface fields (audioQuality, notifications, cache settings)
  - Keep only 4 settings: useSystemTheme, isDarkMode, backgroundPlayEnabled, autoPlayOnStart
  - Update default values to match requirements
  - **Purpose**: Establish clean state structure for simplified settings
  - _Leverage: Existing settingsSlice.ts Redux Toolkit pattern_
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 3. Update Redux actions in settingsSlice.ts
  - **Files**: `store/slices/settingsSlice.ts` (continue from task 2)
  - Remove unused action creators (setAudioQuality, setNotificationsEnabled, cache actions)
  - Keep: setBackgroundPlayEnabled, setAutoPlayOnStart
  - Add: setUseSystemTheme, setIsDarkMode
  - Update resetUserPreferences to restore default values
  - **Purpose**: Provide action creators for the 4 settings
  - _Leverage: Existing Redux Toolkit createSlice pattern_
  - _Requirements: 1.1-1.6, 2.1-2.8, 3.1-3.7, 4.1-4.7, 5.1-5.7_

- [x] 4. Add redux-persist migration logic to settingsSlice.ts
  - **Files**: `store/slices/settingsSlice.ts` (continue from task 3)
  - Import createMigrate from redux-persist
  - Add migrations object with version 1 migration function
  - Transform old theme format to new useSystemTheme/isDarkMode format
  - Export settingsPersistConfig with version and migrate
  - **Purpose**: Ensure smooth upgrade for existing users with old settings structure
  - _Leverage: Existing redux-persist configuration in store/index.ts_
  - _Requirements: All (backward compatibility)_

### Phase 2: Theme Integration

- [x] 5. Update theme provider in app/_layout.tsx to use settings state
  - **Files**: `app/_layout.tsx`
  - Import useAppSelector hook and theme calculation logic
  - Subscribe to useSystemTheme and isDarkMode from Redux state
  - Use useColorScheme() for system theme detection
  - Calculate currentTheme with useMemo based on settings
  - Pass currentTheme to CustomThemeProvider and ThemeProvider
  - **Purpose**: Connect Redux theme settings to app-wide theme application
  - _Leverage: Existing CustomThemeProvider and theme system_
  - _Requirements: 1.1-1.6, 2.1-2.8_

### Phase 3: Settings Screen UI

- [x] 6. Create simplified settings screen UI in app/settings.tsx
  - **Files**: `app/settings.tsx` (replace existing comprehensive UI)
  - Import ThemedView, ThemedText, Switch, Alert from React Native
  - Import Turkish strings from constants/strings.ts
  - Create ScrollView with two sections: "TEMA" and "OYNATMA"
  - Add "System Settings" toggle (first item)
  - Add "Dark Mode" toggle (second item, will wire logic next)
  - Add "Background Play" toggle (third item)
  - Add "Autoplay" toggle (fourth item)
  - Add "Restore Defaults" button at bottom
  - **Purpose**: Build visual structure with all 4 toggles and button
  - _Leverage: ThemedView, ThemedText components, existing Switch patterns_
  - _Requirements: All (UI structure)_

- [x] 7. Wire Redux state and actions to settings toggles in app/settings.tsx
  - **Files**: `app/settings.tsx` (continue from task 6)
  - Import useAppSelector and useAppDispatch hooks
  - Subscribe to all 4 settings from Redux state
  - Create toggle handlers that dispatch actions
  - Connect Switch value props to Redux state
  - Connect Switch onValueChange to toggle handlers
  - **Purpose**: Make toggles functional with Redux state management
  - _Leverage: Existing Redux typed hooks (useAppSelector, useAppDispatch)_
  - _Requirements: 1.1-1.6, 2.1-2.8, 3.1-3.7, 4.1-4.7_

- [x] 8. Implement conditional disable logic for dark mode toggle in app/settings.tsx
  - **Files**: `app/settings.tsx` (continue from task 7)
  - Add disabled prop to dark mode Switch based on useSystemTheme state
  - When useSystemTheme is true, disable dark mode toggle
  - Apply visual styling (opacity 0.4) to disabled toggle
  - Update toggle handler to early return if disabled
  - **Purpose**: Implement requirement for disabled manual toggle when system setting is on
  - _Leverage: React Native Switch disabled prop_
  - _Requirements: 2.2, 2.3, 2.6_

- [x] 9. Implement restore defaults confirmation dialog in app/settings.tsx
  - **Files**: `app/settings.tsx` (continue from task 8)
  - Create handleRestoreDefaults function
  - Show Alert.alert with Turkish title and message
  - Add two buttons: "İptal" (cancel) and "Evet" (confirm)
  - On confirm, dispatch resetUserPreferences action
  - Show success Alert after reset completes
  - **Purpose**: Complete restore defaults functionality with confirmation
  - _Leverage: React Native Alert component_
  - _Requirements: 5.1-5.7_

### Phase 4: Autoplay Logic

- [x] 10. Implement autoplay on launch in app/(tabs)/index.tsx
  - **Files**: `app/(tabs)/index.tsx` (Radio Player Screen)
  - Import useAppSelector, useState, useEffect, AppState, Alert
  - Subscribe to autoPlayOnStart and backgroundPlayEnabled from Redux
  - Add hasAttemptedAutoplay state flag
  - Create useEffect that runs once on mount
  - Check autoPlayOnStart flag and AppState to determine if should play
  - Call TrackPlayerService.play() with try/catch error handling
  - Show error Alert if autoplay fails
  - **Purpose**: Implement automatic playback on app launch when enabled
  - _Leverage: Existing TrackPlayerService_
  - _Requirements: 4.1-4.7_

### Phase 5: Background Play Integration

- [x] 11. Add background play capabilities subscription to Radio Player Screen
  - **Files**: `app/(tabs)/index.tsx` (continue from task 10)
  - Import store from @/store
  - Create store.subscribe callback to monitor backgroundPlayEnabled changes
  - Call TrackPlayer.updateOptions to set capabilities and notificationCapabilities
  - When backgroundPlayEnabled is true, enable notification controls
  - When backgroundPlayEnabled is false, disable notification controls
  - **Purpose**: Control notification playback controls based on background play setting
  - _Leverage: react-native-track-player updateOptions API_
  - _Requirements: 3.2, 3.3, 3.6, 3.7_

### Phase 6: Testing & Verification

- [x] 12. Test theme switching functionality
  - **Files**: Manual testing (no code changes)
  - Toggle system theme ON/OFF and verify theme changes
  - Toggle dark mode and verify app switches themes
  - Verify disabled state when system theme is on
  - Close and reopen app to verify theme persists
  - **Purpose**: Verify theme functionality works correctly
  - _Leverage: Manual testing checklist from design.md_
  - _Requirements: 1.1-1.6, 2.1-2.8_

- [x] 13. Test background play and autoplay functionality
  - **Files**: Manual testing (no code changes)
  - Toggle background play and minimize app to verify audio behavior
  - Toggle autoplay and relaunch app to verify automatic playback
  - Test autoplay with network disconnected (should show error)
  - Verify notification controls appear/disappear correctly
  - **Purpose**: Verify playback settings work correctly
  - _Leverage: Manual testing checklist from design.md_
  - _Requirements: 3.1-3.7, 4.1-4.7_

- [x] 14. Test restore defaults functionality
  - **Files**: Manual testing (no code changes)
  - Change all 4 settings from defaults
  - Tap restore defaults button
  - Cancel confirmation dialog and verify settings unchanged
  - Tap restore defaults again and confirm
  - Verify all settings reset to defaults
  - Verify success message appears
  - Close and reopen app to verify defaults persisted
  - **Purpose**: Verify restore defaults works correctly
  - _Leverage: Manual testing checklist from design.md_
  - _Requirements: 5.1-5.7_

- [x] 15. Test Turkish localization and accessibility
  - **Files**: Manual testing (no code changes)
  - Verify all Turkish strings render correctly with special characters (ç, ğ, ı, ö, ş, ü)
  - Test with VoiceOver (iOS) or TalkBack (Android) screen reader
  - Verify toggle labels are announced in Turkish
  - Verify disabled toggle announces disabled state
  - Check touch target sizes are adequate (minimum 44pt)
  - **Purpose**: Verify localization and accessibility requirements
  - _Leverage: iOS VoiceOver and Android TalkBack_
  - _Requirements: All (Turkish localization and accessibility)_

### Phase 7: Platform Testing

- [x] 16. Test on iOS device
  - **Files**: Manual testing (no code changes)
  - Run all functionality tests on iOS physical device or simulator
  - Verify Switch appearance matches iOS design guidelines
  - Verify Alert dialogs use iOS native style
  - Test theme switching with iOS system dark mode changes
  - Verify background playback with iOS audio session
  - **Purpose**: Ensure iOS platform compatibility
  - _Leverage: iOS Simulator or physical device_
  - _Requirements: All (iOS compatibility)_

- [x] 17. Test on Android device
  - **Files**: Manual testing (no code changes)
  - Run all functionality tests on Android physical device or emulator
  - Verify Switch appearance matches Material Design
  - Verify Alert dialogs use Android native style
  - Test theme switching with Android system dark mode changes
  - Verify background playback with Android foreground service
  - **Purpose**: Ensure Android platform compatibility
  - _Leverage: Android Emulator or physical device_
  - _Requirements: All (Android compatibility)_

- [x] 18. Final verification and cleanup
  - **Files**: Review all modified files
  - Run ESLint to check for code quality issues
  - Remove any console.log statements
  - Verify no TypeScript errors with npm run type-check
  - Review git diff to ensure no unintended changes
  - Verify all Turkish strings are in constants/strings.ts (not hardcoded)
  - **Purpose**: Final code quality check before completion
  - _Leverage: ESLint, TypeScript compiler_
  - _Requirements: All (code quality and maintainability)_

## Task Execution Notes

**Sequential Dependencies:**
- Tasks 1-4 must complete before tasks 5-9 (need state structure before UI)
- Task 5 must complete before tasks 6-9 (need theme integration before testing theme switching)
- Tasks 6-9 can be done sequentially (each builds on previous)
- Task 10 independent from tasks 6-9 but needs tasks 1-4
- Task 11 should follow task 10 (both modify same file)
- Tasks 12-18 are testing tasks that should be done after all implementation

**Parallel Opportunities:**
- Task 1 can be done independently and early
- Task 5 (theme integration) can be done in parallel with tasks 2-4 if needed
- Tasks 12-15 (different test suites) can be distributed to multiple testers

**Risk Mitigation:**
- Test after each phase (not just at the end) to catch issues early
- Commit after each major phase (Phase 1, Phase 2, Phase 3, etc.)
- Keep existing settings.tsx as backup until new version is verified
- Use feature flag if deploying to production before full testing

## Success Criteria

Implementation is complete when:
- [x] All 4 settings (system theme, dark mode, background play, autoplay) functional
- [x] Theme switching works instantly with visual feedback
- [x] Dark mode toggle disabled when system theme is on
- [x] Restore defaults shows confirmation and resets all settings
- [x] Autoplay starts playback on app launch when enabled
- [x] Background play controls appear/disappear correctly
- [x] Settings persist across app restarts and device reboots
- [x] All Turkish strings render correctly
- [x] Accessibility features work (screen readers, touch targets)
- [x] Works identically on iOS and Android
- [x] No TypeScript errors or ESLint warnings
- [x] Code follows existing project patterns and conventions
