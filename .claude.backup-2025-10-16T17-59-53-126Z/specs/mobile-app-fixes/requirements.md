# Requirements Document - Mobile App Fixes

## Introduction

This specification addresses critical bugs and improvements needed for the TrendAnkara mobile application. The fixes focus on API endpoint stability, React state management, audio system consolidation, and background service reliability. These improvements are essential for delivering a stable, production-ready mobile application that provides uninterrupted radio streaming and content access to users.

## Alignment with Product Vision

These fixes directly support the product vision outlined in product.md:
- **Simple is better**: Consolidating to a single audio system simplifies the codebase
- **Respect user resources**: Fixing memory leaks and state update warnings improves performance
- **Instant playback**: Resolving API endpoint errors ensures content loads immediately
- **Uninterrupted streaming**: Background refresh fixes maintain continuous playback
- **Offline resilience**: Proper error handling when API returns empty data

## Requirements

### Requirement 1: Fix API Endpoint Malformation

**User Story:** As a user, I want the news content to load reliably when I open the app, so that I can read the latest media industry news without errors.

#### Acceptance Criteria

1. WHEN the app initializes THEN the news API endpoint SHALL use the correct URL format without `[object Object]` prefix
2. IF the news API is called during initialization THEN the system SHALL use the buildApiUrl helper function consistently
3. WHEN a user navigates to the news tab THEN news articles SHALL load without 404 errors
4. IF the API configuration changes THEN all endpoint references SHALL update automatically

### Requirement 2: Resolve React State Update Warnings

**User Story:** As a user, I want the app to run smoothly without crashes or performance issues, so that I can enjoy uninterrupted radio streaming.

#### Acceptance Criteria

1. WHEN a component unmounts during data fetching THEN the system SHALL cancel pending state updates
2. IF an async operation completes after component unmount THEN the system SHALL NOT attempt state updates
3. WHEN network requests are in progress AND the user navigates away THEN cleanup functions SHALL execute properly
4. IF a component uses async data THEN it SHALL implement proper cleanup in useEffect hooks

### Requirement 3: Fix Background Refresh Service

**User Story:** As a user, I want the app to maintain updated content in the background, so that fresh data is available when I return to the app.

#### Acceptance Criteria

1. WHEN the background refresh service runs THEN it SHALL have access to all required service imports
2. IF radioService is referenced in the code THEN it SHALL be properly imported as radioApi
3. WHEN background refresh executes THEN it SHALL successfully update radio configuration
4. IF the background service encounters an error THEN it SHALL log the error and continue gracefully

### Requirement 4: Consolidate Audio System

**User Story:** As a user, I want consistent audio playback behavior across the app, so that radio streaming works reliably without conflicts.

#### Acceptance Criteria

1. WHEN the app uses audio services THEN it SHALL use only expo-video for all audio functionality
2. IF expo-av is present in the codebase THEN it SHALL be completely removed and replaced
3. WHEN audio components are initialized THEN they SHALL use the unified VideoPlayerService
4. IF deprecated warnings appear THEN they SHALL be resolved by migrating to the modern audio API

### Requirement 5: Handle Empty API Responses

**User Story:** As a user, I want to see appropriate messages when content is unavailable, so that I understand the app is working but content is temporarily missing.

#### Acceptance Criteria

1. WHEN an API returns empty data THEN the UI SHALL display an appropriate empty state message
2. IF cards API returns 0 items THEN the sponsors page SHALL show "No sponsors available" message
3. WHEN polls API returns empty THEN the polls page SHALL display "No active polls" message
4. IF news API returns no articles THEN the news page SHALL show "No news available" message

## Non-Functional Requirements

### Performance
- State update operations must complete within 16ms to maintain 60fps UI
- Memory leaks must be prevented through proper cleanup
- Background refresh must complete within 30 seconds
- API calls must use cached data when network is unavailable

### Security
- All API communications must use HTTPS through the GCP proxy
- No sensitive data should be logged in error messages
- Input validation must be applied to all user interactions

### Reliability
- App must handle network failures gracefully
- Background services must recover from errors automatically
- Audio playback must continue during app backgrounding
- Cache must provide offline functionality for all content types

### Usability
- Error messages must be in Turkish and user-friendly
- Loading states must be shown for all async operations
- Empty states must provide clear information to users
- All fixes must maintain existing UI/UX patterns