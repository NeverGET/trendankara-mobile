# Mobile App - Tech Stack

## Core
- Expo SDK 54, React Native 0.81.4, TypeScript 5.9.2, React 19.1.0
- Expo Router ~6.0.12 (file-based routing)
- Redux Toolkit + react-redux + redux-persist for state

## Audio
- `react-native-track-player` ^4.1.2 - Primary audio with native media controls
- `expo-video` ^3.0.11 - Background audio support
- Stream URL: https://radyo.yayin.com.tr:5132/
- Services in `services/audio/` (TrackPlayerService, ExpoVideoAudioService, etc.)

## Key Dependencies
- `axios` ^1.12.2 for HTTP
- `@react-native-async-storage/async-storage` ^2.2.0 for storage
- `@react-native-community/netinfo` ^11.4.1 for network status
- `expo-notifications` ~0.32.12 for push notifications
- `expo-image` ~3.0.9 for optimized images

## Build
- iOS: Xcode archive + export IPA (team YN2RSJCUDX, automatic signing)
- Android: Gradle assembleRelease (APK) / bundleRelease (AAB)
- `npx expo prebuild --clean` to regenerate native projects
- Icon generation: `npm run generate-icons` (scripts/generate-icons.ts)

## Project Structure
- `app/` - Expo Router pages (tabs: index, polls, news, sponsors, settings)
- `components/` - UI components (player, radio, polls, news, cards, social, ui)
- `services/` - Business logic (api, audio, cache, cards, settings)
- `hooks/` - Custom hooks (useAudio, usePolls, useSettings, etc.)
- `store/` - Redux store with slices
- `constants/` - Theme, API, audio, cache, strings
- `types/` - TypeScript definitions
- `utils/` - Utilities (imageProxy, responsive, share, etc.)
- `assets/` - Icons (ios, android, web), images, logos
