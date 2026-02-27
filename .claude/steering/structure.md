# Project Structure Steering Document - Trend Ankara Mobile

## Directory Organization

```
mobile/
├── app/                          # Expo Router pages (file-based routing)
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── _layout.tsx           # Tab layout configuration
│   │   ├── index.tsx             # Radio Player (main tab)
│   │   ├── polls.tsx             # Polls page
│   │   ├── news.tsx              # News page
│   │   ├── sponsors.tsx          # Sponsorship/Ads page
│   │   └── settings.tsx          # Settings page
│   ├── _layout.tsx               # Root layout
│   ├── about.tsx                 # About page
│   ├── modal.tsx                 # Modal screen
│   ├── onboarding.tsx            # Onboarding screen
│   └── notification.click.tsx    # Notification click handler
├── components/                   # Reusable components
│   ├── player/                   # Audio player components
│   ├── radio/                    # Radio-specific components
│   ├── polls/                    # Poll components
│   ├── news/                     # News components
│   ├── cards/                    # Card components
│   ├── social/                   # Social media components
│   ├── common/                   # Shared components
│   ├── navigation/               # Navigation components
│   ├── ui/                       # UI primitives
│   ├── ErrorBoundary.tsx         # Error boundary
│   ├── OfflineIndicator.tsx      # Offline status indicator
│   ├── OptimizedImage.tsx        # Optimized image component
│   ├── themed-text.tsx           # Themed text component
│   ├── themed-view.tsx           # Themed view component
│   ├── external-link.tsx         # External link handler
│   ├── haptic-tab.tsx            # Haptic feedback tab
│   ├── hello-wave.tsx            # Animated wave component
│   └── parallax-scroll-view.tsx  # Parallax scroll view
├── services/                     # Business logic & API
│   ├── api/                      # API integration
│   │   ├── client.ts             # Axios instance
│   │   ├── config.ts             # API configuration
│   │   ├── endpoints.ts          # API endpoint definitions
│   │   ├── initialization.ts     # API initialization
│   │   ├── news.ts               # News API calls
│   │   ├── polls.ts              # Polls API calls
│   │   ├── radio.ts              # Radio API calls
│   │   └── cards.ts              # Cards/sponsors API calls
│   ├── audio/                    # Audio streaming
│   │   ├── index.ts              # Audio service barrel export
│   │   ├── TrackPlayerService.ts # Track Player integration
│   │   ├── ExpoVideoAudioService.ts  # Expo Video audio service
│   │   ├── ExpoVideoPlayerProvider.tsx # Expo Video provider
│   │   ├── SimpleAudioService.ts # Simple audio fallback
│   │   ├── VideoPlayerService.ts # Video player service
│   │   ├── PlaybackService.ts    # Playback service (TS)
│   │   ├── PlaybackService.js    # Playback service (JS entry)
│   │   ├── MediaNotificationService.ts  # Media notifications
│   │   ├── MediaSessionManager.ts       # Media session
│   │   ├── NativeMediaControls.ts       # Native controls
│   │   ├── NotificationService.android.ts # Android notifications
│   │   ├── NotificationService.ios.ts     # iOS notifications
│   │   ├── AudioFocusState.ts    # Audio focus management
│   │   ├── ErrorHandler.ts       # Audio error handling
│   │   ├── types.ts              # Audio type definitions
│   │   └── legacy/               # Legacy audio implementations
│   ├── cache/                    # Caching logic
│   │   ├── CacheManager.ts       # Cache management
│   │   ├── apiCache.ts           # API response caching
│   │   └── cacheKeys.ts          # Cache key definitions
│   ├── cards/                    # Cards/sponsors service
│   ├── settings/                 # Settings service
│   ├── analytics.ts              # Analytics service
│   ├── crashReporting.tsx        # Crash reporting
│   └── notifications.ts          # Push notifications
├── hooks/                        # Custom React hooks
│   ├── useAudio.ts               # Audio player hook
│   ├── useAudioWithNativeControls.ts # Audio with native controls
│   ├── useNowPlaying.ts          # Now playing metadata hook
│   ├── usePlaybackAnimation.ts   # Playback animation hook
│   ├── usePolls.ts               # Polls data hook
│   ├── useSettings.ts            # Settings hook
│   ├── useNetworkStatus.ts       # Network status hook
│   ├── useDeepLinking.ts         # Deep linking hook
│   ├── useMountedState.ts        # Mounted state hook
│   ├── use-color-scheme.ts       # Color scheme hook
│   ├── use-color-scheme.web.ts   # Color scheme (web)
│   └── use-theme-color.ts        # Theme color hook
├── store/                        # Redux state management
│   ├── index.ts                  # Store configuration
│   ├── hooks.ts                  # Typed hooks (useAppSelector, useAppDispatch)
│   └── slices/                   # Redux Toolkit slices
├── constants/                    # App constants
│   ├── theme.ts                  # Theme configuration
│   ├── themes.ts                 # Theme definitions
│   ├── navigationTheme.ts        # Navigation theme
│   ├── screenStyles.ts           # Screen style constants
│   ├── api.ts                    # API constants
│   ├── audio.ts                  # Audio constants (stream URL)
│   ├── artwork.ts                # Default artwork paths
│   ├── cache.ts                  # Cache configuration
│   ├── config.ts                 # App configuration
│   ├── strings.ts                # Turkish UI strings
│   └── animations.ts             # Animation constants
├── types/                        # TypeScript definitions
│   ├── api.ts                    # API response types
│   ├── models.ts                 # Data models
│   ├── navigation.ts             # Navigation types
│   └── theme.ts                  # Theme types
├── utils/                        # Utility functions
│   ├── appInitializer.tsx        # App initialization
│   ├── appReview.tsx             # Store review prompt
│   ├── iconValidator.ts          # Icon validation
│   ├── imageProxy.ts             # Image proxy utility
│   ├── listOptimizations.tsx     # FlatList optimizations
│   ├── navigation.ts             # Navigation helpers
│   ├── performance.tsx           # Performance utilities
│   ├── responsive.ts             # Responsive sizing
│   ├── share.ts                  # Share utilities
│   └── splashScreen.tsx          # Splash screen helpers
├── scripts/                      # Build & utility scripts
│   ├── generate-icons.ts         # Icon generation from SVG/PNG
│   ├── reset-project.js          # Project reset script
│   └── android-install.sh        # Android install script
├── assets/                       # Static assets
│   ├── icons/                    # App icons
│   │   ├── ios/                  # iOS icons (17 files: icon.png, light/dark/tinted, sized variants)
│   │   ├── android/              # Android icons
│   │   │   ├── adaptive/         # Adaptive icon (foreground, background, monochrome)
│   │   │   └── icon-legacy-*.png # Legacy icons
│   │   ├── web/                  # Web icons (favicon-32, favicon-192)
│   │   └── notification.png      # Notification icon (monochrome)
│   ├── images/                   # In-app images
│   │   ├── Trendankara2.png      # Default artwork (1024x1024)
│   │   ├── Trendankara3.png      # Player artwork (1024x1024)
│   │   ├── splash-icon.png       # Splash screen (200x200)
│   │   ├── icon.png              # App icon (1024x1024)
│   │   └── favicon.png           # Web favicon
│   └── logo/                     # Brand logos
│       ├── TrendAnkaraLogo.png       # Primary logo (512x512)
│       ├── TrendAnkaraLogoMonochrome.png # Monochrome variant
│       ├── TrendAnkara_Logo.svg      # SVG logo
│       └── trendankaralogo.svg       # SVG logo (alternate)
├── docs/                         # Project documentation
│   ├── GOOGLE_PLAY_LESSONS_LEARNED.md  # Google Play release lessons
│   ├── STORE_RELEASE_CHECKLIST.md      # Store release checklist
│   ├── ANDROID_RELEASE_GUIDE.md        # Android release guide
│   ├── IOS_RELEASE_GUIDE.md            # iOS release guide
│   ├── GOOGLE_PLAY_PRODUCTION_ACCESS.md # Production access questionnaire
│   ├── api/                            # API documentation
│   ├── privacy-policy/                 # Privacy policy docs
│   ├── power-optimization/             # Power optimization docs
│   └── static-pages/                   # Static page guides
├── patches/                      # patch-package patches
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

## File Naming Conventions

### Components
- **PascalCase** for component files: `PlayerControls.tsx`
- **PascalCase** for component names: `export const PlayerControls`
- One component per file
- Platform-specific files: `NotificationService.android.ts`, `NotificationService.ios.ts`

### Services & Utilities
- **PascalCase** for service classes: `CacheManager.ts`, `TrackPlayerService.ts`
- **camelCase** for utility files: `imageProxy.ts`, `appInitializer.tsx`
- Descriptive names that indicate purpose

### Hooks
- **camelCase** starting with 'use': `useAudio.ts`
- Hook name matches filename: `export const useAudio`

### Types
- **PascalCase** for interfaces: `interface RadioStation`
- **PascalCase** for type aliases: `type PlaybackState`
- **UPPER_CASE** for enums: `enum PLAYER_STATUS`

## Import Order
```typescript
// 1. React and React Native
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party libraries
import { useNavigation } from '@react-navigation/native';

// 3. Expo modules
import { Image } from 'expo-image';

// 4. Services and utilities
import { audioService } from '@/services/audio';
import { formatTime } from '@/utils/format';

// 5. Store and hooks
import { useAppSelector } from '@/store/hooks';
import { useAudio } from '@/hooks/useAudio';

// 6. Components
import { PlayButton } from '@/components/player';

// 7. Types
import type { PlaybackState } from '@/types/models';

// 8. Constants and assets
import { Colors } from '@/constants/theme';
```

## State Management Pattern
- Redux Toolkit with slices in `store/slices/`
- `redux-persist` for state persistence to AsyncStorage
- Typed hooks: `useAppSelector`, `useAppDispatch` in `store/hooks.ts`
- Separate slices by domain

## API Integration Pattern
- Axios client with base URL from `constants/api.ts`
- API response caching via `services/cache/apiCache.ts`
- CacheManager for general caching
- Image proxy for CORS/SSL handling
- Offline-first: return cached data when network unavailable

## Code Quality Rules
- No `console.log` in production (use crashReporting/analytics)
- No commented-out code
- No `any` types in TypeScript
- All async operations must have error handling
- All network requests must handle offline state
- All UI strings in Turkish using JSX expressions
- Components must be memoized when appropriate
- Lists must have proper keys

## Git Conventions
- Feature branches: `feature/audio-player`
- Bug fixes: `fix/streaming-issue`
- Refactoring: `refactor/api-client`
- Cleanup: `feature/log-cleanup-code-removal`
- Commit messages in English
- Small, atomic commits
