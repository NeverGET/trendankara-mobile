# Technology Steering Document - Trend Ankara Mobile

## Platform
- **Framework**: Expo (SDK 54)
- **Runtime**: React Native 0.81.4
- **Language**: TypeScript 5.9.2
- **React**: 19.1.0
- **Platforms**: iOS and Android

## Core Dependencies

### Navigation & Routing
- `expo-router` ~6.0.12 - File-based routing (Expo Router v3)
- `@react-navigation/native` ^7.1.8 - Core navigation framework
- `@react-navigation/bottom-tabs` ^7.4.0 - Tab navigation
- `@react-navigation/elements` ^2.6.3 - Navigation UI elements
- `react-native-screens` ~4.16.0 - Native navigation optimization
- `react-native-safe-area-context` ~5.6.0 - Safe area handling

### Animation & Gestures
- `react-native-reanimated` ~4.1.1 - Animation library
- `react-native-gesture-handler` ~2.28.0 - Gesture recognition

### UI & Styling
- `@expo/vector-icons` ^15.0.2 - Icon library
- `expo-image` ~3.0.9 - Optimized image component
- `expo-symbols` ~1.0.7 - SF Symbols support
- Custom theme system with RED/BLACK/WHITE colors
- No blue colors except news badges
- Inline StyleSheet-based styling (no styled-components)

### State Management
- `@reduxjs/toolkit` ^2.9.0 - Global state management
- `react-redux` ^9.2.0 - React bindings for Redux
- `redux-persist` ^6.0.0 - State persistence to AsyncStorage

### Data & Networking
- `axios` ^1.12.2 - HTTP client
- `@react-native-async-storage/async-storage` ^2.2.0 - Local storage
- `@react-native-community/netinfo` ^11.4.1 - Network status

### Audio & Media
- `react-native-track-player` ^4.1.2 - Primary audio player with native media controls
- `expo-video` ^3.0.11 - Video playback (background audio support)
- `expo-audio` ^1.0.13 - Expo audio API
- `expo-av` ~16.0.7 - Legacy audio/video
- `react-native-worklets` 0.5.1 - Worklets for track player

### Device & System
- `expo-device` ~8.0.9 - Device information
- `expo-constants` ~18.0.9 - App constants
- `expo-battery` ^10.0.7 - Battery monitoring
- `expo-haptics` ~15.0.7 - Haptic feedback
- `expo-status-bar` ~3.0.8 - Status bar control
- `expo-system-ui` ~6.0.7 - System UI control
- `expo-splash-screen` ~31.0.10 - Splash screen

### Notifications & Tasks
- `expo-notifications` ~0.32.12 - Push notifications
- `expo-task-manager` 14.0.7 - Background tasks

### Deep Linking & Browser
- `expo-linking` ~8.0.8 - Deep linking
- `expo-web-browser` ~15.0.8 - In-app browser
- `expo-store-review` ~9.0.8 - App store review prompt

### Development & Quality
- `eslint` ^9.25.0 with expo config
- `typescript` ~5.9.2 for type safety
- `jest` ^29.7.0 with `ts-jest` ^29.4.4
- `@testing-library/react-native` ^13.3.3
- `patch-package` ^8.0.0 for dependency patches
- `sharp` ^0.33.0 - Image processing (icon generation)

## Technical Constraints
- **No overengineering** - Choose simple solutions
- **Minimal dependencies** - Only add what's necessary
- **Data efficiency** - Minimize network usage
- **Battery conscious** - Optimize background operations
- **Cross-platform parity** - Features work same on iOS/Android

## API Integration
- Backend: webapp Next.js API at `https://www.trendankara.com/api/mobile/v1/`
- Radio stream: `https://radyo.yayin.com.tr:5132/`
- Endpoints for: radio config, news articles, poll data/voting, sponsorship content
- Image proxy utility for CORS/SSL handling
- Caching strategy for all API responses (CacheManager + apiCache)
- Offline-first architecture

## Performance Requirements
- Instant audio stream start (< 3 seconds)
- Smooth UI transitions (60 fps)
- Fast app launch (< 2 seconds)
- Minimal memory footprint
- Efficient battery usage during background play

## Security Considerations
- No sensitive data storage
- HTTPS for all API communications
- Input validation on forms
- Safe deep linking practices
- `ITSAppUsesNonExemptEncryption: false` declared

## Code Standards
- **Language**: All code and comments in English
- **UI Strings**: Turkish using JSX expressions `{""}`, `{''}`, `` {``} ``
- **Formatting**: Consistent with ESLint rules
- **Components**: Functional components with hooks
- **State**: Redux Toolkit slices with persist
- **Types**: Full TypeScript typing, no `any` types

## Store & Distribution

### Google Play Requirements
- **Build format**: AAB (Android App Bundle) required - APK not accepted for Play Store
- **Foreground service justification**: `RECEIVE_BOOT_COMPLETED` permission needs explicit justification (used for restarting background audio after device reboot)
- **Metadata policy**: Store descriptions must avoid superlative/promotional language (see `docs/GOOGLE_PLAY_LESSONS_LEARNED.md`)
- **Closed testing**: 14-day period with 12+ testers, 2-3 updates, and feedback URL required before production access
- **Data safety form**: Must accurately declare data collection (app interactions, device ID for analytics)

### iOS Requirements
- **Background playback**: `UIBackgroundModes: ["audio"]` required in Info.plist for background audio streaming
- **Encryption declaration**: `ITSAppUsesNonExemptEncryption: false` declared in app.json
- **Signing**: Automatic code signing with `DEVELOPMENT_TEAM=YN2RSJCUDX`

### Architecture
- **New Architecture**: Enabled (`newArchEnabled: true`) and confirmed working with `react-native-track-player`
- No compatibility issues observed with RN 0.81.4 + track-player ^4.1.2

## Build & Deployment

### iOS
- Local builds with Xcode (archive + export IPA)
- Team ID: `YN2RSJCUDX`
- Signing: Automatic with development team
- Upload via Xcode Organizer to App Store Connect
- Bundle ID: `com.trendankara.neverget`

### Android
- Local builds with Gradle
- APK: `./gradlew assembleRelease`
- AAB: `./gradlew bundleRelease`
- Package: `com.trendankara.mobile`
- Upload AAB to Google Play Console

### General
- `npx expo prebuild --clean` to regenerate native projects after config changes
- Icon generation: `npm run generate-icons` (uses `scripts/generate-icons.ts`)
- EAS Build available but local builds preferred for now

## Third-Party Services
- Shoutcast streaming service (radyo.yayin.com.tr)
- WhatsApp deep linking for messaging
- Instagram deep linking for messaging
- Backend API service (trendankara.com)

## Experiments (app.json)
- `typedRoutes: true` - Type-safe routing
- `reactCompiler: true` - React Compiler enabled

## Development Philosophy
- **KISS Principle** - Keep It Simple, Stupid
- **YAGNI** - You Aren't Gonna Need It
- **DRY** - Don't Repeat Yourself
- **Progressive Enhancement** - Core features first, enhancements later
