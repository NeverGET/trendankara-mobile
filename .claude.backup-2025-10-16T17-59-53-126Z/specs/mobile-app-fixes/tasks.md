# Implementation Plan - Mobile App Fixes

## Task Overview
This implementation plan breaks down the mobile app fixes into atomic, agent-friendly tasks. Each task focuses on a single file or small set of related changes that can be completed independently. The tasks are organized to minimize dependencies and allow for incremental testing and rollback if needed.

## Steering Document Compliance
All tasks follow the established patterns from structure.md:
- Service modifications stay within `/services/` directory structure
- Component updates follow existing component patterns
- Hook creation follows `/hooks/` directory conventions
- All imports maintain the established order from structure.md

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines
- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: `_Requirements: X.Y_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Tasks

### Phase 1: Critical Import and API Fixes

- [ ] 1. Verify news endpoint URL construction
  - File: `/services/api/news.ts`
  - Check all API calls use buildApiUrl helper function
  - Verify no string concatenation creates `[object Object]` patterns
  - Test endpoint URL formation with console.log
  - Purpose: Ensure news endpoints are properly formed
  - _Leverage: services/api/endpoints.ts (buildApiUrl function)_
  - _Requirements: 1.1, 1.2_

- [ ] 2. Fix news initialization endpoint
  - File: `/services/api/initialization.ts`
  - Search for any news endpoint calls
  - Ensure all use buildApiUrl from endpoints.ts
  - Verify line ~250 uses proper URL construction
  - Purpose: Fix initial news loading errors
  - _Leverage: services/api/endpoints.ts, services/api/news.ts_
  - _Requirements: 1.3, 1.4_

- [ ] 3. Fix radioApi import in initialization service
  - File: `/services/api/initialization.ts`
  - Change line 7 from `import { radioService } from './radio';` to `import { radioApi } from './radio';`
  - Update line 64: Replace `radioService.getRadioConfig` with `radioApi.getRadioConfig`
  - Update line 174: Replace `radioService.getRadioConfig` with `radioApi.getRadioConfig`
  - Update line 248: Replace `radioService.getRadioConfig` with `radioApi.getRadioConfig`
  - Purpose: Fix background refresh undefined error
  - _Leverage: services/api/radio.ts (exports radioApi)_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Create useMountedState hook
  - File: `/hooks/useMountedState.ts` (create new)
  - Implement hook with mountedRef and abortControllerRef
  - Export useMountedState function with isMounted, setStateIfMounted, and signal
  - Add TypeScript types for return values
  - Purpose: Provide reusable cleanup pattern for components
  - _Leverage: Existing hook patterns in /hooks/ directory_
  - _Requirements: 2.1, 2.2_

- [ ] 5. Add mounted state check to NewsList component
  - File: `/components/news/NewsList.tsx`
  - Import useMountedState hook at top
  - Replace setState calls with setStateIfMounted wrapper
  - Add signal to fetch requests for cancellation
  - Purpose: Prevent state updates on unmounted component
  - _Leverage: hooks/useMountedState.ts (from task 4)_
  - _Requirements: 2.3, 2.4_

- [ ] 6. Add mounted state check to NewsCard component
  - File: `/components/news/NewsCard.tsx`
  - Import useMountedState hook
  - Wrap any async state updates with mounted check
  - Add cleanup to useEffect returns
  - Purpose: Prevent memory leaks in news cards
  - _Leverage: hooks/useMountedState.ts (from task 4)_
  - _Requirements: 2.3, 2.4_

- [ ] 7. Add mounted state check to PollCard component
  - File: `/components/polls/PollCard.tsx`
  - Import useMountedState hook
  - Update voting logic to check mounted state
  - Add signal to API calls
  - Purpose: Prevent state updates during navigation
  - _Leverage: hooks/useMountedState.ts (from task 4)_
  - _Requirements: 2.3, 2.4_

### Phase 2: Audio System Consolidation

- [ ] 8. Remove expo-av from RadioPlayerControls
  - File: `/components/radio/RadioPlayerControls.tsx`
  - Remove line 11: `import { Audio } from 'expo-av';`
  - Remove any Audio.Sound references
  - Update to use VideoPlayerService methods instead
  - Purpose: Eliminate expo-av dependency from UI components
  - _Leverage: services/audio/VideoPlayerService.ts_
  - _Requirements: 4.1, 4.2_

- [ ] 9. Replace Audio.Sound methods in RadioPlayerControls
  - File: `/components/radio/RadioPlayerControls.tsx`
  - Import VideoPlayerService at top of file
  - Replace Audio.Sound() calls with VideoPlayerService methods
  - Update play/pause/stop method calls only
  - Purpose: Replace audio method calls
  - _Leverage: services/audio/VideoPlayerService.ts_
  - _Requirements: 4.3_

- [ ] 10. Update state management in RadioPlayerControls
  - File: `/components/radio/RadioPlayerControls.tsx`
  - Update state variables to match VideoPlayerService patterns
  - Replace Audio state checks with VideoPlayerService state
  - Update useEffect hooks for player state changes
  - Purpose: Align state management with VideoPlayerService
  - _Leverage: services/audio/VideoPlayerService.ts, types/models.ts (PlayerState)_
  - _Requirements: 4.3_

- [ ] 11. Create legacy directory and archive WorkingAudioService
  - File: Create directory `/services/audio/legacy/`
  - File: `/services/audio/WorkingAudioService.ts`
  - Create legacy directory if it doesn't exist
  - Move WorkingAudioService.ts to `/services/audio/legacy/WorkingAudioService.ts.bak`
  - Add header comment: "// DEPRECATED: Using VideoPlayerService instead"
  - Purpose: Clean up unused audio service
  - _Leverage: None - archival only_
  - _Requirements: 4.2_

- [ ] 12. Archive legacy AudioService
  - File: `/services/audio/AudioService.ts`
  - Move file to `/services/audio/legacy/AudioService.ts.bak`
  - Add deprecation notice in comment
  - Purpose: Remove conflicting audio implementation
  - _Leverage: None - archival only_
  - _Requirements: 4.2_

- [ ] 13. Archive legacy StreamController
  - File: `/services/audio/StreamController.ts`
  - Move file to `/services/audio/legacy/StreamController.ts.bak`
  - Document reason for deprecation
  - Purpose: Clean up expo-av dependent code
  - _Leverage: None - archival only_
  - _Requirements: 4.2_

- [ ] 14. Update audio service exports
  - File: `/services/audio/index.ts`
  - Remove exports for archived services
  - Ensure VideoPlayerService is the primary export
  - Update any re-exports to point to VideoPlayerService
  - Purpose: Centralize audio service exports
  - _Leverage: services/audio/VideoPlayerService.ts_
  - _Requirements: 4.3_

- [ ] 15. Remove expo-av dependency
  - File: `/package.json`
  - Remove "expo-av" entry from dependencies section
  - Save file
  - Purpose: Remove unused dependency from project
  - _Leverage: None - dependency removal_
  - _Requirements: 4.1, 4.2_

- [ ] 16. Update package-lock.json
  - Run command: `npm install`
  - This will update package-lock.json automatically
  - Verify expo-av is removed from lock file
  - Purpose: Sync lock file with package.json
  - _Leverage: None - npm command_
  - _Requirements: 4.1_

### Phase 3: Empty State Components

- [ ] 17. Create EmptyState component
  - File: `/components/common/EmptyState.tsx` (create new)
  - Create functional component with message and icon props
  - Use ThemedText for message display
  - Add Ionicons for icon display
  - Purpose: Provide reusable empty state UI
  - _Leverage: components/themed-text.tsx, @expo/vector-icons_
  - _Requirements: 5_

- [ ] 18. Add empty state styles and theme integration
  - File: `/components/common/EmptyState.tsx` (continue from task 17)
  - Add StyleSheet with centered layout
  - Integrate with Colors from constants/theme
  - Add proper padding and typography
  - Purpose: Ensure consistent styling across themes
  - _Leverage: constants/theme.ts, existing style patterns_
  - _Requirements: 5_

- [ ] 19. Implement empty state in sponsors page
  - File: `/app/(tabs)/sponsors.tsx`
  - Import EmptyState component
  - Add condition to check for empty cards array
  - Display "Sponsor bulunmamaktadır" message when empty
  - Purpose: Handle empty sponsors gracefully
  - _Leverage: components/common/EmptyState.tsx (from task 17)_
  - _Requirements: 5_

- [ ] 20. Implement empty state in polls page
  - File: `/app/(tabs)/polls.tsx`
  - Import EmptyState component
  - Check for empty polls data
  - Display "Aktif anket bulunmamaktadır" message
  - Purpose: Handle empty polls gracefully
  - _Leverage: components/common/EmptyState.tsx (from task 17)_
  - _Requirements: 5_

- [ ] 21. Implement empty state in news page
  - File: `/app/(tabs)/news.tsx`
  - Import EmptyState component
  - Add empty check for news articles
  - Display "Haber bulunmamaktadır" message
  - Purpose: Handle empty news gracefully
  - _Leverage: components/common/EmptyState.tsx (from task 17)_
  - _Requirements: 5_

### Phase 4: Testing and Verification

- [ ] 22. Create useMountedState hook tests
  - File: `/__ tests__/hooks/useMountedState.test.ts` (create new)
  - Test hook initialization
  - Test cleanup on unmount
  - Test state update prevention after unmount
  - Purpose: Ensure hook reliability
  - _Leverage: Jest testing framework, React Testing Library_
  - _Requirements: 2_

- [ ] 23. Test background refresh with radioApi
  - File: `/__tests__/services/api/backgroundRefresh.test.ts` (create new)
  - Mock radioApi.getRadioConfig
  - Test successful refresh cycle
  - Test error handling
  - Purpose: Verify background refresh works correctly
  - _Leverage: Jest mocks, existing test utilities_
  - _Requirements: 3_

- [ ] 24. Create empty state component tests
  - File: `/__tests__/components/common/EmptyState.test.tsx` (create new)
  - Test component rendering with different props
  - Test theme integration
  - Test icon display
  - Purpose: Ensure empty state component works correctly
  - _Leverage: React Testing Library, existing component test patterns_
  - _Requirements: 5_

### Phase 5: Configuration and Documentation

- [ ] 25. Add feature flags for rollback capability
  - File: `/constants/config.ts`
  - Add FEATURES object with USE_MOUNTED_STATE flag
  - Add USE_VIDEO_PLAYER_ONLY flag
  - Add SHOW_EMPTY_STATES flag
  - Purpose: Enable gradual rollout and quick rollback
  - _Leverage: Existing constants patterns_
  - _Requirements: All - rollback support_

- [ ] 26. Add feature flag to NewsList component
  - File: `/components/news/NewsList.tsx`
  - Import FEATURES from constants/config
  - Wrap useMountedState usage with USE_MOUNTED_STATE flag
  - Provide fallback to direct setState when flag is false
  - Purpose: Allow rollback of mounted state checks
  - _Leverage: constants/config.ts (from task 25)_
  - _Requirements: 2.1, 2.2 - rollback support_

- [ ] 27. Add feature flag to sponsors page
  - File: `/app/(tabs)/sponsors.tsx`
  - Import FEATURES from constants/config
  - Wrap EmptyState component with SHOW_EMPTY_STATES flag
  - Show loading spinner as fallback when flag is false
  - Purpose: Allow rollback of empty states
  - _Leverage: constants/config.ts (from task 25)_
  - _Requirements: 5 - rollback support_

- [ ] 28. Add feature flag to RadioPlayerControls
  - File: `/components/radio/RadioPlayerControls.tsx`
  - Import FEATURES from constants/config
  - Use USE_VIDEO_PLAYER_ONLY flag to select audio service
  - Keep expo-av code commented for fallback if needed
  - Purpose: Allow rollback to dual audio system
  - _Leverage: constants/config.ts (from task 25)_
  - _Requirements: 4.1, 4.3 - rollback support_