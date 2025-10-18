# Requirements Document: Store Release Preparation

## Introduction

This specification outlines the necessary requirements for preparing the TrendAnkara mobile app for public release on both Google Play Store and Apple App Store. The focus is on achieving full compliance with store policies, technical requirements, and best practices to ensure a successful submission and approval process.

The primary objective is to address all compliance gaps, technical requirements, missing documentation, and configuration issues that could lead to app rejection or delayed approval. This includes ensuring proper privacy policy documentation, permission descriptions, metadata completion, SDK compliance, and content ratings.

## Alignment with Product Vision

Successfully releasing TrendAnkara on both major app stores is critical to achieving the product's core mission of providing users with 24/7 access to radio streaming, news, polls, and community engagement. Store presence ensures:

- **Maximum Reach**: Users can discover and install the app through trusted official channels
- **Trust and Credibility**: Presence on official stores validates the app's quality and security
- **Compliance**: Meeting store requirements ensures user privacy protection and platform standards
- **Sustainability**: Enables proper versioning, updates, and long-term app maintenance

## Current Implementation Analysis

### Privacy Policy Status
- Privacy policy page does NOT exist at https://trendankara.com/privacy-policy (returns 404)
- Terms of service page does NOT exist at https://trendankara.com/terms (returns 404)

### iOS Permission Descriptions Status
- NSMicrophoneUsageDescription: Generic text "This app may require microphone access for audio features"
- NSCameraUsageDescription: Generic text "This app may require camera access for sharing features"
- NSPhotoLibraryUsageDescription: Generic text "This app may require photo library access for sharing features"

### Android Permissions Status
- RECEIVE_BOOT_COMPLETED permission is declared (high scrutiny from Google)
- Must justify this permission for audio service initialization

### Build Configuration Status
- Current API level needs verification (must target API 35 by August 31, 2025)
- Xcode version and iOS SDK compliance needs verification
- Expo SDK 54 is in use and should support requirements

### Submission Configuration Status
- eas.json contains placeholder values for iOS submission:
  - "appleId": "your-apple-id@example.com"
  - "ascAppId": "your-app-store-connect-app-id"
  - "appleTeamId": "your-apple-team-id"
- Android service account key path needs verification

### Dependency Status
- @types/jest: Expected 29.5.14, found 30.0.0 (major mismatch)
- 11 packages have patch version mismatches
- expo-doctor recommends running `npx expo install --check`

### app.json Schema Status
- Contains invalid properties per expo-doctor:
  - "keywords" (should be in store metadata, not app.json)
  - "privacy" (should be "privacyPolicyUrl")
  - "linking" (may need reconfiguration)

### New Architecture Compatibility Status
- react-native-track-player is marked as unsupported on New Architecture
- app.json has "newArchEnabled": true
- Need to verify if this causes issues or if workarounds exist

### Content Rating Status
- Content rating questionnaire not yet completed
- Must be done in respective store consoles

## Assumptions

- EAS Build is already configured for both iOS and Android platforms
- Developer accounts for both App Store Connect and Google Play Console are active and in good standing
- TrendAnkara domain (trendankara.com) is under team control and can host privacy policy documentation
- Expo SDK 54 supports required SDK versions for both platforms (iOS 18, Android 15)
- Current app functionality does not violate any store content policies
- Team has access to all necessary credentials and signing certificates
- Background audio is the primary use case for RECEIVE_BOOT_COMPLETED permission
- App content (music, news, polls) is licensed and appropriate for general audiences

## Constraints

- Must meet August 31, 2025 deadline for Android API level 35 requirement for new app submissions
- Privacy policy must be hosted on trendankara.com domain (not third-party services) for brand consistency
- Cannot change package name (com.trendankara.mobile) or bundle identifier after initial submission
- Must maintain backward compatibility with iOS 13+ and Android 7+ for maximum user reach
- App binary size must be under 100MB for Apple's cellular download limit
- Review process typically takes 1-3 days for Apple, 24 hours for Google (but can be longer)
- Cannot use prohibited APIs or private frameworks not approved by store guidelines
- Must comply with local regulations in Turkey regarding content streaming and news distribution

## Dependencies

### External Services
- **Google Play Console**: Required for Android app submission and content rating
- **App Store Connect**: Required for iOS app submission and metadata configuration
- **EAS Build**: Used for creating production builds for both platforms
- **IARC (International Age Rating Coalition)**: Provides content rating system for Google Play

### Third-Party Tools
- **Expo SDK 54**: Framework for building and deploying the app
- **Xcode 16 or later**: Required for iOS app compilation and submission
- **Android Studio**: Recommended for Android build verification
- **Node.js and npm**: Required for dependency management and build scripts

### Team Dependencies
- **Legal Team**: Must review and approve privacy policy and terms of service
- **Marketing Team**: Must provide store assets (screenshots, descriptions, promotional text)
- **Content Team**: Must ensure radio stream, news, and polls comply with content policies
- **DevOps Team**: Must manage signing certificates and service account credentials

### Third-Party Libraries
- **react-native-track-player**: Critical for audio playback (New Architecture compatibility concern)
- **expo-av**: Alternative audio solution if track-player has issues
- **@react-native-async-storage/async-storage**: For data persistence
- **axios**: For API communication with backend services

## Requirements

### Requirement 1: Privacy Policy and Legal Documentation

**User Story:** As a user, I want to understand what data the app collects and how it's used, so that I can make informed decisions about my privacy and trust the app.

#### Acceptance Criteria

1. WHEN a user views the app store listing THEN the app SHALL display a valid, publicly accessible privacy policy URL at https://trendankara.com/privacy-policy
2. IF the app collects any user data THEN the privacy policy SHALL explicitly describe what data is collected, how it's stored, how it's used, and how long it's retained
3. WHEN a user accesses app settings THEN the app SHALL provide an easily accessible link to the privacy policy within the app
4. WHEN the privacy policy URL is accessed THEN it SHALL load within 3 seconds and be readable on mobile devices
5. IF the privacy policy is updated THEN users SHALL be notified on next app launch with option to review changes
6. WHEN the device has no internet connection THEN a cached version of the privacy policy SHALL be accessible with a warning message

#### Technical Verification Criteria

1. WHEN the app is submitted to Apple App Store THEN it SHALL include privacy policy link in App Store Connect metadata
2. WHEN the app is submitted to Google Play THEN it SHALL include privacy policy link in the Play Console metadata
3. WHEN expo-doctor validates app.json THEN the "privacyPolicyUrl" field SHALL contain valid URL
4. WHEN app.json is validated THEN the invalid "privacy" field SHALL be removed or replaced

### Requirement 2: iOS Permission Descriptions (NSUsageDescription)

**User Story:** As an iOS user, I want to understand exactly why the app needs specific permissions, so that I can trust the app with my device capabilities and make informed decisions about granting access.

#### Acceptance Criteria

1. WHEN the app requests camera access THEN it SHALL display a clear explanation that specifically describes the feature requiring the permission (e.g., "To share photos of events you're attending")
2. WHEN the app requests photo library access THEN it SHALL display a clear explanation of how photos will be used (e.g., "To choose and share photos from your library")
3. WHEN the app requests microphone access THEN it SHALL display a clear explanation of the audio feature (e.g., "To allow voice messages for song requests")
4. IF I deny a permission THEN the app SHALL continue to function with features gracefully disabled and provide explanation of what functionality is unavailable
5. WHEN I review permission requests THEN each description SHALL be in my language (Turkish/English) and use simple, non-technical terms

#### Technical Verification Criteria

1. WHEN validating Info.plist THEN all NSUsageDescription keys SHALL contain specific, feature-related text (not generic boilerplate)
2. IF a permission is not actually used by the app THEN it SHALL be removed from the Info.plist configuration
3. WHEN Apple reviews the app THEN all permission descriptions SHALL clearly justify their necessity for core app functionality
4. WHEN testing permission flows THEN denied permissions SHALL not cause app crashes

### Requirement 3: Android Permissions Justification

**User Story:** As an Android user, I want the app to only request necessary permissions, so that my device security and privacy are protected and I can trust the app.

#### Acceptance Criteria

1. WHEN I install the app THEN it SHALL only request permissions that are essential for core radio streaming, news, and polling features
2. IF the app starts in the background after device reboot THEN it SHALL only do so to resume audio playback I had previously started
3. WHEN I review app permissions in Android settings THEN each permission SHALL have a clear justification visible in the Play Store listing
4. IF I revoke a permission THEN the app SHALL continue to function with that feature gracefully disabled
5. WHEN the app runs in the background THEN it SHALL only use background capabilities for audio playback, not for data collection or other purposes

#### Technical Verification Criteria

1. WHEN the app uses RECEIVE_BOOT_COMPLETED permission THEN it SHALL be justified for essential background audio functionality in Play Console submission
2. IF any permission is not critical for app functionality THEN it SHALL be removed from the AndroidManifest.xml
3. WHEN Google reviews permissions THEN the app SHALL provide clear documentation of why each permission is necessary
4. WHEN expo-doctor validates permissions THEN no unnecessary permissions SHALL be flagged

### Requirement 4: Android Device Compatibility

**User Story:** As an Android user with a modern device, I want to discover and install the TrendAnkara app from the Play Store, so that I can enjoy radio streaming and news on my device.

#### Acceptance Criteria

1. WHEN I search for "TrendAnkara" on my Android 15 device THEN the app SHALL appear in search results and be installable
2. IF I have an Android 7.0 or newer device THEN the app SHALL be compatible with my device
3. WHEN the app launches on my device THEN it SHALL use modern Android features and UI patterns appropriate for my OS version
4. IF new Android features are available on my device THEN the app SHALL take advantage of them for better performance and user experience
5. WHEN I install the app on my latest Samsung/Google Pixel device THEN it SHALL work smoothly without compatibility warnings

#### Technical Verification Criteria

1. WHEN building for production THEN the app SHALL target Android API level 35 (Android 15) or higher
2. WHEN submitting to Play Store THEN the app SHALL meet the August 31, 2025 deadline for API level 35 requirement
3. WHEN users search for the app on newer Android devices THEN it SHALL be discoverable and installable (not filtered out)
4. WHEN testing on various Android versions THEN the app SHALL function correctly on Android 7.0 through Android 15

### Requirement 5: iOS Device Compatibility

**User Story:** As an iOS user with a modern iPhone or iPad, I want to install and use the TrendAnkara app, so that I can listen to radio and read news on my Apple device.

#### Acceptance Criteria

1. WHEN I search for "TrendAnkara" on my iPhone running iOS 18 THEN the app SHALL appear and be installable
2. IF I have an iPhone or iPad running iOS 13 or newer THEN the app SHALL be compatible with my device
3. WHEN the app runs on my device THEN it SHALL look and feel native to iOS with proper navigation and gestures
4. IF I have a newer iOS version with new features THEN the app SHALL take advantage of them for better experience
5. WHEN I use the app on iPad THEN it SHALL have a properly adapted layout that uses the larger screen effectively

#### Technical Verification Criteria

1. WHEN building for production THEN the app SHALL be built with Xcode 16 or later
2. WHEN submitting to App Store THEN the app SHALL use iOS 18 SDK or later
3. WHEN testing on various iOS versions THEN the app SHALL function correctly on iOS 13 through iOS 18
4. WHEN Apple reviews the build THEN all SDK requirements SHALL be satisfied

### Requirement 6: App Store Availability and Submission

**User Story:** As a user, I want to find and install the TrendAnkara app through official app stores, so that I can trust its authenticity and receive automatic updates.

#### Acceptance Criteria

1. WHEN I search for "TrendAnkara" in the App Store or Play Store THEN the app SHALL appear in search results with correct name and icon
2. WHEN I view the app listing THEN I SHALL see screenshots, description, and all required metadata properly displayed
3. IF updates are available THEN I SHALL receive notifications and be able to update easily
4. WHEN I download the app THEN it SHALL install within reasonable time (under 2 minutes on average connection)
5. IF I have questions about the app THEN I SHALL be able to contact the developer through store listing information

#### Technical Verification Criteria

1. WHEN configuring iOS submission THEN eas.json SHALL contain valid Apple ID, ASC App ID, and Team ID (not placeholders)
2. WHEN configuring Android submission THEN eas.json SHALL contain valid service account key path
3. WHEN running EAS submit THEN all required authentication SHALL be configured correctly without errors
4. WHEN submitted to stores THEN the app SHALL pass automated pre-checks before human review

### Requirement 7: App Content Rating and Age Appropriateness

**User Story:** As a user (or parent), I want to see an appropriate age rating for the app, so that I know if it's suitable for me or my family members.

#### Acceptance Criteria

1. WHEN I view the app in the store THEN I SHALL see a clear age rating (e.g., "12+", "Everyone", "Teen")
2. IF the app contains news that may include mature topics THEN the rating SHALL appropriately reflect this content
3. WHEN I review the rating details THEN I SHALL see specific information about why the app received that rating (e.g., "Mild Language", "News Content")
4. IF the app streams music that may contain explicit lyrics THEN the rating SHALL reflect this possibility
5. WHEN I make decisions about downloading THEN the age rating SHALL be prominently displayed and accurate

#### Technical Verification Criteria

1. WHEN submitting to Google Play THEN the app SHALL have a completed IARC content rating questionnaire
2. WHEN submitting to App Store THEN the app SHALL have completed age rating questions in App Store Connect
3. WHEN the app appears in stores THEN it SHALL not be marked as "Unrated"
4. WHEN content rating is reviewed THEN all questionnaire answers SHALL be truthful and accurate

### Requirement 8: App Stability and Reliability

**User Story:** As a user, I want the app to run smoothly without crashes or errors, so that I can enjoy uninterrupted radio streaming and news reading.

#### Acceptance Criteria

1. WHEN I use the app THEN it SHALL not crash unexpectedly during normal operation
2. IF the app uses external libraries THEN they SHALL be stable, secure versions without known vulnerabilities
3. WHEN I stream radio THEN the audio SHALL play continuously without interruptions due to app instability
4. IF I use the app for extended periods THEN it SHALL not become slow or unresponsive due to memory leaks
5. WHEN updates are released THEN they SHALL be tested to ensure they don't introduce new crashes

#### Technical Verification Criteria

1. WHEN checking dependencies with expo-doctor THEN major version mismatches SHALL be resolved
2. WHEN running `npx expo install --check` THEN critical patch version warnings SHALL be reviewed and updated
3. IF a package has security vulnerabilities THEN it SHALL be updated to a safe version
4. WHEN @types/jest shows major mismatch THEN it SHALL be downgraded or dependencies adjusted for build stability

### Requirement 9: App Build and Configuration Correctness

**User Story:** As a user, I want to receive app updates seamlessly, so that I can always have the latest features and bug fixes without issues.

#### Acceptance Criteria

1. WHEN an app update is released THEN it SHALL install successfully without errors
2. IF there are configuration issues THEN they SHALL be caught before release, not after users download the app
3. WHEN I install the app THEN deep links SHALL work correctly to navigate to specific content (news articles, polls)
4. IF I click a link to TrendAnkara content from outside the app THEN it SHALL open in the app if installed
5. WHEN the app is built THEN it SHALL pass all validation checks without warnings or errors

#### Technical Verification Criteria

1. WHEN validating app.json with expo-doctor THEN it SHALL not contain invalid properties
2. WHEN "keywords" are needed for app discoverability THEN they SHALL be configured in store submission metadata, not app.json
3. WHEN privacy policy is referenced THEN app.json SHALL use "privacyPolicyUrl" field correctly
4. WHEN deep linking is configured THEN the "linking" property SHALL pass Expo schema validation

### Requirement 10: App Performance and Modern Platform Support

**User Story:** As a user with a modern smartphone, I want the app to run smoothly and take advantage of my device's capabilities, so that I have a fast and responsive experience.

#### Acceptance Criteria

1. WHEN I use the app on my latest device THEN it SHALL feel fast and responsive
2. IF my device supports modern platform features THEN the app SHALL use them for better performance
3. WHEN I switch between screens THEN animations SHALL be smooth without lag or stuttering
4. IF I have an older device THEN the app SHALL still run acceptably, though perhaps not with all performance optimizations
5. WHEN streaming audio THEN battery usage SHALL be reasonable and not drain my device excessively

#### Technical Verification Criteria

1. WHEN react-native-track-player is used THEN it SHALL either support New Architecture or New Architecture SHALL be disabled
2. IF New Architecture is enabled THEN all critical libraries SHALL be verified to support it without crashes
3. WHEN the app is tested on various devices THEN there SHALL be no architecture-related crashes or failures
4. IF a library doesn't support New Architecture THEN either find an alternative, add to exclude list, or disable New Architecture

## Non-Functional Requirements

### Performance
- App store screenshots and preview videos must load within 3 seconds
- App binary size must be under 100MB (Apple's cellular download limit) and ideally under 50MB for optimal user experience
- App splash screen to main screen transition must complete within 3 seconds on average devices
- Audio streaming must start playing within 5 seconds of user tapping play button
- News and polls content must load and display within 2 seconds on 4G connection

### Security
- Privacy policy must accurately describe all data collection and transmission
- API endpoints must use HTTPS (currently using GCP proxy for secure connections)
- User data must be handled according to GDPR and other privacy regulations
- No sensitive credentials should be hardcoded in the app

### Reliability
- App must achieve 99.5% crash-free rate in production (less than 0.5% of sessions crash)
- App must pass all store review automated tests without failures
- Background audio must work reliably for at least 2 hours continuous playback without interruptions
- App must handle network failures gracefully with retry logic (3 attempts with exponential backoff)
- App must survive device orientation changes, app backgrounding, and incoming calls without losing state

### Usability
- Permission requests must be clear and understandable to average users
- App store listings must have clear, compelling descriptions
- Screenshots must accurately represent app functionality
- App must provide intuitive navigation and controls

### Compliance
- Must comply with Google Play Developer Program Policies
- Must comply with Apple App Store Review Guidelines
- Must comply with GDPR, CCPA, and other applicable privacy laws
- Must complete content rating questionnaires honestly and accurately

---

**Document Version:** 1.0
**Last Updated:** October 17, 2025
**Status:** Draft - Ready for Review
