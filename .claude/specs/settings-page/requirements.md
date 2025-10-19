# Requirements Document - Settings Page

## Introduction

The Settings Page provides users with a simplified, focused interface to control essential app preferences. This feature replaces the existing comprehensive settings implementation with a streamlined version containing only four critical settings: theme management (with system preference option), background playback control, autoplay behavior, and the ability to restore defaults. The page will be fully localized in Turkish, maintaining consistency with the rest of the application.

This simplified approach aligns with Trend Ankara's core principle of "Simple is better" by reducing cognitive load and focusing only on settings that directly impact the user's listening experience.

## Alignment with Product Vision

This feature directly supports the product vision and principles outlined in product.md:

- **Simple is better**: By reducing settings to only the essential four options, we eliminate decision fatigue and maintain a clean, focused interface
- **Respect user resources**: Background play and autoplay settings give users control over battery and data usage based on their preferences
- **User Experience Goals - Simple navigation**: A straightforward settings page with clear toggles and Turkish labels makes configuration intuitive
- **Localization**: Full Turkish language support maintains consistency across the entire app
- **Key Feature - Settings Page**: Fulfills the documented need for background play toggle and dark/light mode selection

The simplified settings page ensures users can quickly configure their listening experience without being overwhelmed by options, staying true to the "elegant radio station app" vision.

### Migration from Existing Settings

This simplified settings page replaces the existing comprehensive settings implementation. For existing users, the migration strategy is as follows:

- **Theme/Appearance**: Existing theme preference will be mapped to the new system. If user had a theme set, "Sistem Ayarlarını Kullan" will be set to OFF and their chosen theme will be preserved
- **Background Play**: Existing `backgroundPlayEnabled` preference will be directly migrated with no changes
- **Autoplay**: Existing `autoPlayOnStart` preference will be directly migrated with no changes
- **Removed Settings**: Other settings (audio quality, notifications, cache management) will be removed from user preferences. Audio quality will continue to be controlled by the Shoutcast server settings as before
- **No Data Loss**: All removed settings were UI-only preferences and don't affect core functionality or user data

## Requirements

### Requirement 1

**User Story:** As a user, I want to use my device's system theme settings automatically, so that the app appearance matches my device preferences without manual configuration

**Feature:** System Theme Preference

#### Acceptance Criteria

1. WHEN the app is installed for the first time THEN the system SHALL set "Sistem Ayarlarını Kullan" (Use System Settings) toggle to ON by default
2. WHEN "Sistem Ayarlarını Kullan" toggle is ON THEN the system SHALL follow the device's light/dark mode preference
3. WHEN "Sistem Ayarlarını Kullan" toggle is toggled OFF THEN the system SHALL enable the manual dark/light mode toggle
4. WHEN "Sistem Ayarlarını Kullan" toggle is toggled ON THEN the system SHALL disable the manual dark/light mode toggle and revert to system theme
5. WHEN the device system theme changes AND "Sistem Ayarlarını Kullan" is ON THEN the system SHALL automatically update the app theme to match
6. WHEN the user preference is saved THEN the system SHALL persist the setting across app restarts

### Requirement 2

**User Story:** As a user, I want to manually choose between dark and light themes, so that I can override my system settings and use my preferred appearance

**Feature:** Manual Dark/Light Mode Toggle

#### Acceptance Criteria

1. WHEN the app is installed for the first time THEN the system SHALL set the dark/light mode toggle to OFF (Light mode) by default
2. WHEN "Sistem Ayarlarını Kullan" toggle is ON THEN the system SHALL disable the dark/light mode toggle visually (grayed out but visible)
3. WHEN "Sistem Ayarlarını Kullan" toggle is OFF THEN the system SHALL enable the dark/light mode toggle for user interaction
4. WHEN the dark/light mode toggle is enabled AND user toggles it ON THEN the system SHALL apply dark theme colors throughout the app
5. WHEN the dark/light mode toggle is enabled AND user toggles it OFF THEN the system SHALL apply light theme colors throughout the app
6. WHEN the dark/light mode toggle is disabled THEN the system SHALL prevent toggle interaction and display visual feedback (opacity/color change)
7. WHEN the user changes the manual theme preference THEN the system SHALL persist the setting across app restarts
8. WHEN system settings toggle is turned OFF THEN the system SHALL apply the last saved manual theme preference

### Requirement 3

**User Story:** As a user, I want to control whether audio continues playing when I switch to other apps, so that I can multitask while listening or save battery by stopping playback when the app is minimized

**Feature:** Background Playback Control

#### Acceptance Criteria

1. WHEN the app is installed for the first time THEN the system SHALL set "Arka Planda Çal" (Background Play) toggle to ON by default
2. WHEN "Arka Planda Çal" toggle is ON AND audio is playing AND user minimizes the app THEN the system SHALL continue audio playback
3. WHEN "Arka Planda Çal" toggle is OFF AND audio is playing AND user minimizes the app THEN the system SHALL pause audio playback
4. WHEN "Arka Planda Çal" toggle is OFF AND user returns to the app THEN the system SHALL keep audio paused (not auto-resume)
5. WHEN the user changes the background play setting THEN the system SHALL persist the setting across app restarts
6. WHEN background play is enabled THEN the system SHALL show playback controls in device notification/control center
7. WHEN background play is disabled THEN the system SHALL remove playback controls from device notification/control center when app is minimized

### Requirement 4

**User Story:** As a user, I want the app to automatically start playing radio when I launch it, so that I can immediately enjoy content without tapping the play button

**Feature:** Autoplay on Launch

#### Acceptance Criteria

1. WHEN the app is installed for the first time THEN the system SHALL set "Otomatik Başlat" (Autoplay) toggle to OFF by default
2. WHEN "Otomatik Başlat" toggle is ON AND user launches the app THEN the system SHALL automatically start radio playback within 3 seconds
3. WHEN "Otomatik Başlat" toggle is OFF AND user launches the app THEN the system SHALL show the player in ready state without starting playback
4. WHEN autoplay is triggered AND network is unavailable THEN the system SHALL show error message and not retry automatically
5. WHEN the user changes the autoplay setting THEN the system SHALL persist the setting across app restarts
6. WHEN autoplay is ON AND app is launched in background (deep link, notification) AND background play is enabled THEN the system SHALL start playback; IF background play is disabled THEN the system SHALL NOT start playback
7. IF autoplay fails due to audio permissions THEN the system SHALL show permission request dialog and retry after permission granted

### Requirement 5

**User Story:** As a user, I want to restore all settings to their factory defaults, so that I can reset my preferences if I'm unsatisfied with my changes

**Feature:** Restore Default Settings

#### Acceptance Criteria

1. WHEN the user taps "Varsayılana Dön" (Restore Defaults) button THEN the system SHALL display a confirmation dialog with the message "Emin misiniz?" (Are you sure?)
2. WHEN the user confirms the restore action THEN the system SHALL reset all four settings to their default values:
   - "Sistem Ayarlarını Kullan" = ON
   - Dark/Light Mode = OFF (Light mode)
   - "Arka Planda Çal" = ON
   - "Otomatik Başlat" = OFF
3. WHEN the user cancels the confirmation dialog THEN the system SHALL close the dialog without changing any settings
4. WHEN settings are restored to defaults THEN the system SHALL immediately apply the default theme and persist all changes
5. WHEN settings are restored to defaults THEN the system SHALL show a success feedback (toast/alert) confirming "Ayarlar varsayılana döndürüldü" (Settings restored to defaults)
6. WHEN settings are restored AND audio is currently playing in foreground OR background THEN the system SHALL continue playback without interruption regardless of background play setting change
7. WHEN the restore defaults button is tapped AND no settings have been changed from defaults THEN the system SHALL still show confirmation dialog and allow reset

## Non-Functional Requirements

### Performance
- Theme changes SHALL apply instantly (< 100ms visual update)
- Toggle interactions SHALL have immediate visual feedback (< 50ms)
- Settings persistence to AsyncStorage SHALL not block UI thread
- Autoplay SHALL begin playback within 3 seconds of app launch
- Settings page SHALL load in < 500ms

### Security
- Settings data SHALL be stored locally only in AsyncStorage
- No sensitive data SHALL be included in settings storage
- Settings SHALL not be transmitted to external servers without user consent

### Reliability
- Settings SHALL persist correctly across app restarts, force quits, and device reboots
- Failed AsyncStorage writes SHALL not crash the app and SHALL show user-friendly error
- Theme changes SHALL apply consistently across all screens in the app
- Background play setting SHALL reliably control playback behavior on both iOS and Android

### Usability
- All UI text SHALL be in Turkish as specified in requirements
- Toggle switches SHALL follow platform conventions (iOS/Android native behavior)
- Disabled toggle SHALL be visually distinct (reduced opacity/grayed out) but remain visible
- Confirmation dialog SHALL use clear, concise Turkish language
- Settings page SHALL be accessible via bottom tab navigation
- Each setting SHALL have clear, descriptive labels in Turkish
- Settings SHALL be organized in a single scrollable list with appropriate spacing

### Localization
- All user-facing text SHALL use Turkish strings from constants/strings.ts
- Turkish characters (ç, ğ, ı, ö, ş, ü) SHALL render correctly on all devices
- Text labels SHALL use native Turkish language conventions and phrasing

### Accessibility
- Toggle switches SHALL be operable via screen readers
- Toggle labels SHALL be read by screen readers in Turkish
- Disabled toggle SHALL announce disabled state to screen readers
- Buttons SHALL have sufficient touch target size (minimum 44x44 points)
- Text SHALL maintain sufficient contrast ratio for readability in both themes

### Compatibility
- Settings page SHALL function identically on iOS and Android platforms
- Theme system SHALL integrate with React Navigation theme provider
- Background play SHALL work with react-native-track-player on both platforms
- Settings persistence SHALL use @react-native-async-storage/async-storage cross-platform API

### Maintainability
- Settings state SHALL use existing Redux Toolkit settingsSlice pattern
- Settings page SHALL use existing ThemedView and ThemedText components
- Code SHALL follow existing TypeScript patterns and ESLint rules
- Turkish strings SHALL be centralized in constants/strings.ts
