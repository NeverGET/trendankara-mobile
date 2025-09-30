# Implementation Plan - Trend Ankara Mobile Application

## Metadata
- **Feature Name**: mobile-app-implementation
- **Version**: 1.0.0
- **Status**: Draft
- **Created**: 2025-09-28
- **Last Updated**: 2025-09-28

## Task Overview
This implementation plan breaks down the Trend Ankara Mobile Application into atomic, agent-executable tasks. Each task is designed to be completed in 15-30 minutes, touches 1-3 related files, and has a single testable outcome. The plan follows the existing project structure and leverages existing components where possible.

## Steering Document Compliance
Tasks follow structure.md conventions:
- Components in PascalCase in components/ directory
- Services in camelCase in services/ directory
- Hooks with use* prefix in hooks/ directory
- Types in types/ directory
- Theme and constants in constants/ directory

Tech.md patterns:
- TypeScript with no any types
- Expo SDK 54 and React Native conventions
- Simple solutions over complexity
- Test-first approach where applicable

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Phase 1: Core Infrastructure Setup

- [x] 1. Create TypeScript interfaces for mobile settings in types/api.ts
  - File: types/api.ts (create new)
  - Define MobileSettings, RadioConfig interfaces
  - Add type exports for API responses
  - Purpose: Establish type safety for settings management
  - _Requirements: 2.1, 2.2_

- [x] 2. Create TypeScript interfaces for content models in types/models.ts
  - File: types/models.ts (create new)
  - Define ContentCard, Poll, PollOption, NewsArticle interfaces
  - Include all properties from design document
  - Purpose: Type definitions for data models
  - _Requirements: 3.1, 4.1, 5.1_

- [x] 3. Install and configure axios in package.json
  - Files: package.json (modify), package-lock.json (auto-update)
  - Run: npm install axios
  - Add axios to dependencies
  - Purpose: HTTP client for API communication
  - _Requirements: 2.1_

- [x] 4. Create API client base configuration in services/api/client.ts
  - File: services/api/client.ts (create new)
  - Configure axios instance with base URL and timeout
  - Add request/response interceptors for error handling
  - Purpose: Centralized API client configuration
  - _Leverage: services/audio/ErrorHandler.ts_
  - _Requirements: 2.1, 3.1, 4.2, 5.2_

- [x] 5. Create API endpoints constants in services/api/endpoints.ts
  - File: services/api/endpoints.ts (create new)
  - Define all API endpoint URLs as constants
  - Export endpoint configuration object
  - Purpose: Centralized endpoint management
  - _Requirements: 2.1, 3.1, 4.2, 5.2_

### Phase 2: Settings Service Implementation

- [x] 6. Create settings service class in services/settings/SettingsService.ts
  - File: services/settings/SettingsService.ts (create new)
  - Implement fetchSettings, getCachedSettings methods
  - Add singleton pattern for service instance
  - Purpose: Remote configuration management
  - _Leverage: AsyncStorage patterns from existing services_
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Add settings cache logic to SettingsService.ts
  - File: services/settings/SettingsService.ts (modify)
  - Implement cacheSettings, getDefaultSettings methods
  - Add 7-day TTL for cached settings
  - Purpose: Offline settings support
  - _Requirements: 2.2, 7.6_

- [x] 8. Create settings helper methods in SettingsService.ts
  - File: services/settings/SettingsService.ts (modify)
  - Add isPollsEnabled, isNewsEnabled, getSocialLinks methods
  - Implement getPlayerLogo, getCardSettings methods
  - Purpose: Convenient settings access
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 9. Create useSettings hook in hooks/useSettings.ts
  - File: hooks/useSettings.ts (create new)
  - Implement React hook for settings access
  - Add loading and error states
  - Purpose: Component-level settings integration
  - _Leverage: Existing hook patterns_
  - _Requirements: 2.3_

### Phase 3: Cache Manager Implementation

- [x] 10. Create cache manager service in services/cache/CacheManager.ts
  - File: services/cache/CacheManager.ts (create new)
  - Implement set, get methods with TTL support
  - Add AsyncStorage integration
  - Purpose: Unified caching strategy
  - _Requirements: 7.1, 7.2_

- [x] 11. Add cache purging logic to CacheManager.ts
  - File: services/cache/CacheManager.ts (modify)
  - Implement purgeOld, clear methods
  - Add size limit checking
  - Purpose: Automatic cache management
  - _Requirements: 7.4, 7.6_

- [x] 12. Create cache keys constants in services/cache/cacheKeys.ts
  - File: services/cache/cacheKeys.ts (create new)
  - Define standardized cache key patterns
  - Export cache key generator functions
  - Purpose: Consistent cache key management
  - _Requirements: 7.1_

### Phase 4: Radio Player Enhancement

- [x] 13. Extend VideoPlayerService with settings integration
  - File: services/audio/VideoPlayerService.ts (modify)
  - Add settings-based logo URL support
  - Integrate with SettingsService
  - Purpose: Dynamic player configuration
  - _Leverage: Existing VideoPlayerService_
  - _Requirements: 1.1, 2.4_

- [x] 14. Create RadioPlayerControls component in components/player/RadioPlayerControls.tsx
  - File: components/player/RadioPlayerControls.tsx (create new)
  - Implement play/pause button with brand colors
  - Add loading and error states
  - Purpose: Main player control interface
  - _Leverage: constants/theme.ts, components/player/AnimationErrorBoundary.tsx_
  - _Requirements: 1.1, 1.2, 8.5_

- [x] 15. Create SocialMediaButtons component in components/player/SocialMediaButtons.tsx
  - File: components/player/SocialMediaButtons.tsx (create new)
  - Add WhatsApp, Instagram, Facebook, Call buttons
  - Implement Linking for app launches
  - Purpose: Social media integration
  - _Leverage: hooks/useSettings.ts_
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 16. Update RadioPlayerScreen in app/(tabs)/index.tsx
  - File: app/(tabs)/index.tsx (modify)
  - Integrate RadioPlayerControls and SocialMediaButtons
  - Add VideoPlayerService initialization
  - Purpose: Complete player screen assembly
  - _Leverage: components/player/AnimatedLogoContainer.tsx, components/player/SpotlightOrb.tsx_
  - _Requirements: 1.1, 1.3, 1.4_

### Phase 5: Content Cards Implementation

- [x] 17. Create cards API service in services/api/cards.ts
  - File: services/api/cards.ts (create new)
  - Implement getCards with query params
  - Add caching with CacheManager
  - Purpose: Cards data fetching
  - _Leverage: services/api/client.ts, services/cache/CacheManager.ts_
  - _Requirements: 3.1, 3.7_

- [x] 18. Create ContentCard component in components/cards/ContentCard.tsx
  - File: components/cards/ContentCard.tsx (create new)
  - Implement card UI with image and text
  - Add featured badge for featured cards
  - Purpose: Individual card display
  - _Leverage: components/themed-view.tsx, components/themed-text.tsx_
  - _Requirements: 3.6, 8.1_

- [x] 19. Add contact actions to ContentCard.tsx
  - File: components/cards/ContentCard.tsx (modify)
  - Implement phone, WhatsApp, email, Instagram buttons
  - Add Linking for each contact type
  - Purpose: Contact functionality
  - _Requirements: 3.2, 3.3_

- [x] 20. Add location and expiration handling to ContentCard.tsx
  - File: components/cards/ContentCard.tsx (modify)
  - Implement map button for location data
  - Add expiration date checking
  - Purpose: Advanced card features
  - _Requirements: 3.4, 3.5_

- [x] 21. Create basic CardsGrid component in components/cards/CardsGrid.tsx
  - File: components/cards/CardsGrid.tsx (create new)
  - Implement FlatList with renderItem for ContentCard
  - Set up basic container structure
  - Purpose: Basic cards container
  - _Leverage: components/cards/ContentCard.tsx_
  - _Requirements: 3.1_

- [x] 22. Add grid/list mode switching to CardsGrid.tsx
  - File: components/cards/CardsGrid.tsx (modify)
  - Implement numColumns prop based on displayMode
  - Add layout mode toggle logic
  - Purpose: Layout mode support
  - _Leverage: hooks/useSettings.ts_
  - _Requirements: 2.7, 2.8_

- [x] 23. Add loading and empty states to CardsGrid.tsx
  - File: components/cards/CardsGrid.tsx (modify)
  - Implement ListEmptyComponent
  - Add loading indicator with ActivityIndicator
  - Purpose: Loading and empty UI states
  - _Leverage: components/common/LoadingScreen.tsx_
  - _Requirements: 3.1_

- [x] 24. Update sponsors screen in app/(tabs)/sponsors.tsx
  - File: app/(tabs)/sponsors.tsx (modify)
  - Integrate CardsGrid component
  - Add pull-to-refresh functionality
  - Purpose: Complete sponsors screen
  - _Requirements: 3.1, 3.8_

### Phase 6: Polls System Implementation

- [x] 25. Create polls API service in services/api/polls.ts
  - File: services/api/polls.ts (create new)
  - Implement getCurrentPolls, submitVote methods
  - Add device ID handling for voting
  - Purpose: Polls data and voting
  - _Leverage: services/api/client.ts, expo-device_
  - _Requirements: 4.2, 4.5_

- [x] 26. Create PollCard component in components/polls/PollCard.tsx
  - File: components/polls/PollCard.tsx (create new)
  - Display poll question and options
  - Add selection state management
  - Purpose: Individual poll display
  - _Leverage: components/themed-view.tsx_
  - _Requirements: 4.2, 4.4_

- [x] 27. Create PollResults component in components/polls/PollResults.tsx
  - File: components/polls/PollResults.tsx (create new)
  - Display vote counts and percentages
  - Add animated progress bars
  - Purpose: Poll results visualization
  - _Leverage: react-native-reanimated_
  - _Requirements: 4.6_

- [x] 28. Create VoteConfirmation modal in components/polls/VoteConfirmation.tsx
  - File: components/polls/VoteConfirmation.tsx (create new)
  - Implement confirmation dialog
  - Add submit and cancel actions
  - Purpose: Vote confirmation UI
  - _Requirements: 4.4_

- [x] 29. Update polls screen in app/(tabs)/polls.tsx
  - File: app/(tabs)/polls.tsx (modify)
  - Integrate PollCard and VoteConfirmation
  - Add voting logic with duplicate prevention
  - Purpose: Complete polls screen
  - _Leverage: services/api/polls.ts_
  - _Requirements: 4.1, 4.3, 4.5_

### Phase 7: News Feed Implementation

- [x] 30. Create news API service in services/api/news.ts
  - File: services/api/news.ts (create new)
  - Implement getNews with pagination
  - Add getNewsDetail method
  - Purpose: News data fetching
  - _Leverage: services/api/client.ts, services/cache/CacheManager.ts_
  - _Requirements: 5.2, 5.4_

- [x] 31. Create NewsCard component in components/news/NewsCard.tsx
  - File: components/news/NewsCard.tsx (create new)
  - Display article preview with image
  - Add new badge for recent articles
  - Purpose: News item display
  - _Leverage: expo-image_
  - _Requirements: 5.3, 5.8_

- [x] 32. Create NewsList component in components/news/NewsList.tsx
  - File: components/news/NewsList.tsx (create new)
  - Implement FlatList with pagination
  - Add pull-to-refresh functionality
  - Purpose: News feed container
  - _Requirements: 5.2, 5.7_

- [x] 33. Create basic NewsDetail screen in app/news/[slug].tsx
  - File: app/news/[slug].tsx (create new)
  - Set up screen structure with ScrollView
  - Display article title and content
  - Purpose: Basic article detail view
  - _Requirements: 5.4_

- [x] 34. Add image loading to NewsDetail screen
  - File: app/news/[slug].tsx (modify)
  - Integrate expo-image for article image
  - Add progressive loading with placeholder
  - Purpose: Article image display
  - _Leverage: expo-image_
  - _Requirements: 5.8_

- [x] 35. Update news tab in app/(tabs)/news.tsx
  - File: app/(tabs)/news.tsx (modify)
  - Integrate NewsList component
  - Add navigation to NewsDetail
  - Purpose: Complete news screen
  - _Requirements: 5.1, 5.2_

### Phase 8: State Management Setup

- [x] 36. Install and configure Zustand
  - Files: package.json (modify), package-lock.json (auto-update)
  - Run: npm install zustand
  - Add zustand to dependencies
  - Purpose: Global state management
  - _Leverage: Existing package.json structure_
  - _Requirements: 1.5, 2.3, 3.1, 4.2, 5.2_
  - Files: package.json (modify), package-lock.json (auto-update)
  - Run: npm install zustand
  - Add zustand to dependencies
  - Purpose: Global state management
  - _Requirements: All_

- [x] 37. Create player store in store/playerStore.ts
  - File: store/playerStore.ts (create new)
  - Define playback state, isPlaying, volume
  - Add play, pause, togglePlayback actions
  - Purpose: Audio player state
  - _Leverage: services/audio/VideoPlayerService.ts_
  - _Requirements: 1.5_

- [x] 38. Create settings store in store/settingsStore.ts
  - File: store/settingsStore.ts (create new)
  - Define settings, loading, error states
  - Add fetchSettings, updateSettings actions
  - Purpose: Settings state management
  - _Leverage: services/settings/SettingsService.ts_
  - _Requirements: 2.1, 2.3_

- [x] 39. Create cards store in store/cardsStore.ts
  - File: store/cardsStore.ts (create new)
  - Define cards, featured, loading states
  - Add fetchCards, filterCards actions
  - Purpose: Content cards state
  - _Leverage: services/api/cards.ts_
  - _Requirements: 3.1_

- [x] 40. Create polls store in store/pollsStore.ts
  - File: store/pollsStore.ts (create new)
  - Define polls, votes, results states
  - Add fetchPolls, submitVote actions
  - Purpose: Polls state management
  - _Leverage: services/api/polls.ts_
  - _Requirements: 4.2, 4.5_

- [x] 41. Create news store in store/newsStore.ts
  - File: store/newsStore.ts (create new)
  - Define articles, categories, badges states
  - Add fetchNews, markAsRead actions
  - Purpose: News state management
  - _Leverage: services/api/news.ts_
  - _Requirements: 5.2, 5.3_

### Phase 9: Navigation & Theme Integration

- [x] 42. Add conditional tab rendering in app/(tabs)/_layout.tsx
  - File: app/(tabs)/_layout.tsx (modify)
  - Implement conditional rendering based on settings
  - Hide/show tabs based on feature flags
  - Purpose: Dynamic navigation based on settings
  - _Leverage: hooks/useSettings.ts_
  - _Requirements: 2.3, 4.1, 5.1_

- [x] 43. Configure tab labels and icons in Turkish
  - File: app/(tabs)/_layout.tsx (modify)
  - Set Turkish labels for all tabs
  - Configure appropriate icons for each tab
  - Purpose: Turkish localization and icons
  - _Leverage: constants/navigationTheme.ts, constants/strings.ts_
  - _Requirements: 2.3_

- [x] 44. Create LoadingScreen component in components/common/LoadingScreen.tsx
  - File: components/common/LoadingScreen.tsx (create new)
  - Implement brand-colored loading indicator
  - Add loading text in Turkish
  - Purpose: Consistent loading states
  - _Leverage: constants/theme.ts_
  - _Requirements: 8.1_

- [x] 45. Create ErrorScreen component in components/common/ErrorScreen.tsx
  - File: components/common/ErrorScreen.tsx (create new)
  - Display user-friendly error messages in Turkish
  - Add retry action button
  - Purpose: Consistent error handling UI
  - _Leverage: constants/theme.ts_
  - _Requirements: 8.1_

- [x] 46. Create OfflineIndicator component in components/common/OfflineIndicator.tsx
  - File: components/common/OfflineIndicator.tsx (create new)
  - Display "Çevrimdışı" badge
  - Add network status monitoring
  - Purpose: Offline status indication
  - _Requirements: 7.5_

### Phase 10: Settings Screen Implementation

- [x] 47. Create SettingsItem component in components/settings/SettingsItem.tsx
  - File: components/settings/SettingsItem.tsx (create new)
  - Implement settings row with icon and toggle
  - Add touch feedback with brand colors
  - Purpose: Individual setting control
  - _Leverage: components/themed-view.tsx_
  - _Requirements: 8.1_

- [x] 48. Create ThemeToggle component in components/settings/ThemeToggle.tsx
  - File: components/settings/ThemeToggle.tsx (create new)
  - Implement dark/light mode switcher
  - Store preference in AsyncStorage
  - Purpose: Theme mode control
  - _Leverage: hooks/use-color-scheme.ts_
  - _Requirements: 8.3, 8.4_

- [x] 49. Add settings items to settings screen
  - File: app/(tabs)/settings.tsx (modify)
  - Integrate SettingsItem components
  - Add background play, theme, and notification settings
  - Purpose: Settings UI integration
  - _Leverage: components/settings/SettingsItem.tsx_
  - _Requirements: 7.1_

- [x] 50. Add cache management to settings screen
  - File: app/(tabs)/settings.tsx (modify)
  - Implement cache clear button
  - Add cache size display
  - Purpose: Cache management UI
  - _Leverage: services/cache/CacheManager.ts_
  - _Requirements: 7.1_

### Phase 11: Performance Optimization

- [x] 51. Optimize image loading in ContentCard component
  - File: components/cards/ContentCard.tsx (modify)
  - Replace Image with expo-image
  - Add progressive loading and caching
  - Purpose: Image performance improvement
  - _Leverage: expo-image_
  - _Requirements: 5.8_

- [x] 52. Add list optimization to CardsGrid component
  - File: components/cards/CardsGrid.tsx (modify)
  - Implement getItemLayout for known heights
  - Add windowSize and initialNumToRender props
  - Purpose: List scrolling performance
  - _Requirements: 3.1_

- [x] 53. Add list optimization to NewsList component
  - File: components/news/NewsList.tsx (modify)
  - Implement removeClippedSubviews
  - Add maxToRenderPerBatch optimization
  - Purpose: News list performance
  - _Requirements: 5.2_

### Phase 12: Error Handling & Recovery

- [x] 54. Add stream retry logic to VideoPlayerService
  - File: services/audio/VideoPlayerService.ts (modify)
  - Implement exponential backoff for retries
  - Add fallback URL support
  - Purpose: Robust stream connection
  - _Leverage: services/audio/ErrorHandler.ts_
  - _Requirements: 1.6, 1.7_

- [x] 55. Add audio focus handling to VideoPlayerService
  - File: services/audio/VideoPlayerService.ts (modify)
  - Implement call interruption handling
  - Add focus recovery logic
  - Purpose: Audio focus management
  - _Leverage: services/audio/AudioFocusState.ts_
  - _Requirements: 1.8_

- [x] 56. Add network monitoring to API client
  - File: services/api/client.ts (modify)
  - Implement network state detection
  - Add offline queue for failed requests
  - Purpose: Offline resilience
  - _Requirements: 7.2, 7.3_

### Phase 13: Localization & Accessibility

- [x] 57. Update Turkish strings in constants/strings.ts
  - File: constants/strings.ts (modify)
  - Add all UI text in Turkish
  - Use JSX string expressions format
  - Purpose: Turkish localization
  - _Requirements: 8.1_

- [x] 58. Add accessibility labels to RadioPlayerControls
  - File: components/player/RadioPlayerControls.tsx (modify)
  - Add accessibilityLabel props in Turkish
  - Set accessibilityRole for buttons
  - Purpose: Screen reader support
  - _Requirements: 8.8_

- [x] 59. Add accessibility to ContentCard component
  - File: components/cards/ContentCard.tsx (modify)
  - Add accessibilityLabel to contact buttons
  - Ensure 44x44 minimum touch targets
  - Purpose: Card accessibility
  - _Requirements: 8.8_

- [x] 60. Add accessibility to PollCard component
  - File: components/polls/PollCard.tsx (modify)
  - Add accessibilityLabel to poll options
  - Add accessibilityHint for voting
  - Purpose: Poll accessibility
  - _Requirements: 8.8_

- [x] 61. Add accessibility to SocialMediaButtons component
  - File: components/player/SocialMediaButtons.tsx (modify)
  - Add accessibilityLabel to each social button
  - Set proper accessibilityRole
  - Purpose: Social button accessibility
  - _Requirements: 8.8_

### Phase 14: Final Integration & Testing

- [x] 62. Create app initialization flow in app/_layout.tsx
  - File: app/_layout.tsx (modify)
  - Add settings loading on app start
  - Show loading screen during initialization
  - Purpose: Proper app bootstrap
  - _Leverage: services/settings/SettingsService.ts, components/common/LoadingScreen.tsx_
  - _Requirements: 2.1_

- [x] 63. Add maintenance mode handling in app/_layout.tsx
  - File: app/_layout.tsx (modify)
  - Check maintenanceMode from settings
  - Display maintenance screen when active
  - Purpose: Maintenance mode support
  - _Requirements: 2.6_

- [x] 64. Add deep linking configuration in app.json
  - File: app.json (modify)
  - Configure scheme for deep links (trendankara://)
  - Add URL patterns for social media (whatsapp, instagram)
  - Purpose: Deep linking setup
  - _Leverage: Existing app.json structure_
  - _Requirements: 6.6_
  - File: app.json (modify)
  - Configure scheme for deep links
  - Add URL patterns for social media
  - Purpose: Deep linking setup
  - _Requirements: 6.6_

- [x] 65. Create basic EAS build configuration
  - File: eas.json (create new)
  - Set up development and production profiles
  - Configure basic build settings
  - Purpose: EAS build setup
  - _Leverage: Expo documentation patterns_
  - _Requirements: 1.1_

- [x] 66. Configure platform-specific build settings
  - File: eas.json (modify)
  - Add iOS specific configuration (bundleIdentifier)
  - Add Android specific configuration (package name)
  - Purpose: Platform-specific build settings
  - _Requirements: 1.1_

- [x] 67. Add app icons and splash screen
  - Files: assets/icon.png (1024x1024), assets/splash.png (1284x2778) (create/modify)
  - Create brand-colored app icons with logo
  - Design splash screen with red background and logo
  - Purpose: Brand identity
  - _Leverage: Existing assets if available_
  - _Requirements: 8.1_
  - Files: assets/icon.png, assets/splash.png (create/modify)
  - Create brand-colored app icons
  - Design splash screen with logo
  - Purpose: Brand identity
  - _Requirements: 8.1_

- [x] 68. Create README with setup instructions
  - File: README.md (modify)
  - Document environment setup steps
  - Add build and deployment instructions
  - Purpose: Project documentation
  - _Leverage: Existing README structure_
  - _Requirements: 1.1_
  - File: README.md (modify)
  - Document environment setup
  - Add build and deployment instructions
  - Purpose: Project documentation
  - _Requirements: All_