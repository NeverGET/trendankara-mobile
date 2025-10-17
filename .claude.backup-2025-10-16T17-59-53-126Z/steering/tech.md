# Technology Steering Document - Trend Ankara

## Platform
- **Framework**: Expo (SDK 54)
- **Runtime**: React Native 0.81.4
- **Language**: TypeScript 5.9.2
- **Platforms**: iOS and Android

## Core Dependencies

### Navigation & Animation
- `@react-navigation/native` - Core navigation framework
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Tab navigation
- `react-native-screens` - Native navigation optimization
- `react-native-safe-area-context` - Safe area handling
- `react-native-reanimated` - Animation library
- `react-native-gesture-handler` - Gesture recognition

### UI & Styling
- `styled-components` - CSS-in-JS styling (to be added)
- `@expo/vector-icons` - Icon library
- `expo-image` - Optimized image component
- Custom theme system with RED/BLACK/WHITE colors
- No blue colors except news badges

### State & Data Management
- `zustand` or `@reduxjs/toolkit` - Global state (to be chosen)
- `@tanstack/react-query` - Server state and caching (to be added)
- `axios` - HTTP client (to be added)
- `react-hook-form` - Form management (to be added)
- `yup` - Schema validation (to be added)

### Device & Storage
- `@react-native-async-storage/async-storage` - Local storage (to be added)
- `expo-device` - Device information
- `expo-constants` - App constants
- Background audio playback capability (to be implemented)

### Media & Streaming
- Shoutcast streaming integration (https://radyo.yayin.com.tr:5132/)
- Background playback support
- Audio interruption handling
- Network state management

### Development & Quality
- `ESLint` with expo config
- TypeScript for type safety
- Testing framework (when needed, not priority)
- Performance monitoring (future consideration)

## Technical Constraints
- **No overengineering** - Choose simple solutions
- **Minimal dependencies** - Only add what's necessary
- **Data efficiency** - Minimize network usage
- **Battery conscious** - Optimize background operations
- **Cross-platform parity** - Features work same on iOS/Android

## API Integration
- Backend service for dynamic content
- Endpoints for:
  - News articles
  - Poll data and voting
  - Sponsorship/advertisement content
- Caching strategy for all API responses
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

## Code Standards
- **Language**: All code and comments in English
- **UI Strings**: Turkish using JSX expressions `{""}`, `{''}`, `` {``} ``
- **Formatting**: Consistent with ESLint rules
- **Components**: Functional components with hooks
- **State**: Minimize component state, prefer global state
- **Types**: Full TypeScript typing, no `any` types

## Testing Approach (When Required)
- Unit tests for business logic
- Integration tests for API interactions
- Manual testing for UI/UX flows
- Platform-specific testing (iOS and Android)

## Build & Deployment
- Expo EAS Build for production builds
- Over-the-air updates via Expo
- App Store and Google Play deployment
- Version management following semantic versioning

## Third-Party Services
- Shoutcast streaming service
- WhatsApp deep linking for messaging
- Instagram deep linking for messaging
- Backend API service (TBD)
- Push notifications (future consideration)

## Future Considerations
- Analytics integration
- Crash reporting
- A/B testing framework
- Performance monitoring
- User feedback system

## Development Philosophy
- **KISS Principle** - Keep It Simple, Stupid
- **YAGNI** - You Aren't Gonna Need It
- **DRY** - Don't Repeat Yourself
- **Test First** - Verify functionality before moving on
- **Progressive Enhancement** - Core features first, enhancements later