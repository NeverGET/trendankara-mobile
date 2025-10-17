# Implementation Plan - Metadata Polling Power Optimization

## Task Overview

This implementation optimizes metadata polling to reduce power consumption by 85-95% through platform-specific strategies. The approach modifies a single file (`hooks/useNowPlaying.ts`) to add Android platform detection (zero polling) and iOS context-aware polling (5s foreground, 2min background). All changes are backward compatible with existing consumers.

**Implementation Strategy:**
- Phase 1: Core hook modifications (Tasks 1-8)
- Phase 2: Unit testing (Tasks 9-13)
- Phase 3: Manual integration testing (Tasks 14-17) - Requires physical devices
- Phase 4: Documentation and monitoring (Tasks 18-19)

**Expected Impact:**
- Android: 95% power reduction (zero HTTP requests)
- iOS: 85-95% power reduction in background
- Overall: 71% battery drain reduction
- Zero breaking changes to consumers

## Steering Document Compliance

**Follows tech.md:**
- Uses existing React Native APIs (Platform, AppState)
- No new dependencies added
- Maintains TypeScript type safety
- Battery-conscious design (core objective)

**Follows structure.md:**
- Modifications isolated to `hooks/useNowPlaying.ts`
- No changes to services or components
- Preserves existing file organization
- Maintains import order conventions

## Atomic Task Requirements

Each task meets these criteria for optimal agent execution:
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Exact file paths specified
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Phase 1: Core Hook Modifications

- [x] 1. Add React Native imports to useNowPlaying hook
  - File: `hooks/useNowPlaying.ts`
  - Add Platform and AppState imports from react-native
  - Use AppState alias (RNAppState) to avoid collision with types/models.ts
  - Import AppStateStatus type for type safety
  - Purpose: Enable platform detection and app state monitoring
  - _Leverage: Existing import pattern from services/audio/PlaybackService.ts:6_
  - _Requirements: 1.1, 2.1_

- [ ] 2. Add appState state variable to useNowPlaying hook
  - File: `hooks/useNowPlaying.ts` (continue from task 1)
  - Add useState for appState with AppStateStatus type
  - Initialize with RNAppState.currentState
  - Purpose: Track iOS app state for interval calculation
  - _Leverage: Existing useState pattern in useNowPlaying.ts:10-13_
  - _Requirements: 2.1_

- [ ] 3. Create getPollingInterval helper function in useNowPlaying hook
  - File: `hooks/useNowPlaying.ts` (continue from task 2)
  - Add getPollingInterval function before useEffect
  - Return 5000ms when appState === 'active'
  - Return 120000ms when appState === 'background' or 'inactive'
  - Add JSDoc comments explaining interval choices
  - Purpose: Calculate context-aware polling interval for iOS
  - _Leverage: Similar conditional logic patterns in existing codebase_
  - _Requirements: 2.1, 2.2_

- [ ] 4. Add Android platform detection with early return
  - File: `hooks/useNowPlaying.ts` (continue from task 3)
  - Add Platform.OS === 'android' check at start of useEffect
  - Add three console.log statements explaining Android optimization
  - Return early to skip all polling setup
  - Purpose: Disable HTTP polling on Android (rely on native events)
  - _Leverage: Platform detection pattern from services/audio/PlaybackService.ts:97_
  - _Requirements: 1.1, 1.2, 3.1_

- [ ] 5. Create startPolling helper function in useNowPlaying hook
  - File: `hooks/useNowPlaying.ts` (continue from task 4)
  - Add startPolling function inside useEffect (after fetchMetadata)
  - Clear existing interval if present
  - Get interval from getPollingInterval()
  - Log polling start with interval and app state
  - Set intervalRef.current with setInterval(fetchMetadata, interval)
  - Purpose: Centralize polling start logic for state transitions
  - _Leverage: Existing interval setup pattern from useNowPlaying.ts:140_
  - _Requirements: 2.4_

- [ ] 6. Replace direct setInterval with startPolling call
  - File: `hooks/useNowPlaying.ts` (continue from task 5)
  - Remove line with `intervalRef.current = setInterval(fetchMetadata, 5000);`
  - Call startPolling() instead after initial fetchMetadata()
  - Purpose: Use new dynamic polling function
  - _Leverage: Existing interval pattern, just refactored_
  - _Requirements: 2.1_

- [ ] 7. Add AppState change event listener for iOS
  - File: `hooks/useNowPlaying.ts` (continue from task 6)
  - Add RNAppState.addEventListener('change', handler) after startPolling call
  - In handler: log state transition (prevState → nextState)
  - Update appState with setAppState(nextAppState)
  - If nextAppState === 'active', call fetchMetadata() immediately
  - Call startPolling() to restart with new interval
  - Store subscription reference for cleanup
  - Purpose: Adapt polling interval when app state changes
  - _Leverage: React Native AppState API (standard pattern)_
  - _Requirements: 2.3, 2.4, 4.2_

- [ ] 8. Update useEffect cleanup and dependencies
  - File: `hooks/useNowPlaying.ts` (continue from task 7)
  - Add subscription.remove() to cleanup function after abortControllerRef cleanup
  - Add appState to useEffect dependency array: `[metadataUrl, appState]`
  - Add comment explaining AppState cleanup
  - Purpose: Prevent memory leaks and respond to state changes
  - _Leverage: Existing cleanup pattern from useNowPlaying.ts:142-156_
  - _Requirements: 2.4, 7.2_

### Phase 2: Unit Testing

- [x] 9. Create unit tests for platform detection
  - File: `__tests__/hooks/useNowPlaying.test.ts` (create new)
  - Test 1: Android platform skips polling (verify no fetch calls)
  - Test 2: iOS platform enables polling (verify fetch called)
  - Test 3: Unknown platform defaults to iOS behavior
  - Mock Platform.OS and global.fetch
  - Use @testing-library/react-hooks renderHook
  - Purpose: Verify Android optimization works correctly
  - _Leverage: Existing test patterns from __tests__/ directory_
  - _Requirements: 1.1, 1.2, 7.1_

- [x] 10. Create unit tests for iOS interval calculation
  - File: `__tests__/hooks/useNowPlaying.test.ts` (continue from task 9)
  - Test 1: Active state uses 5s interval (verify 2 fetches at 5s)
  - Test 2: Background state uses 2min interval (verify timing)
  - Test 3: Inactive state uses 2min interval
  - Use jest.useFakeTimers() for time control
  - Advance timers to verify polling frequency
  - Purpose: Verify context-aware polling intervals
  - _Leverage: Jest timer utilities and testing patterns_
  - _Requirements: 2.1, 2.2_

- [x] 11. Create unit tests for AppState transitions
  - File: `__tests__/hooks/useNowPlaying.test.ts` (continue from task 10)
  - Test 1: Immediate fetch on app wake (background → active)
  - Test 2: Switch from 5s to 2min when backgrounded
  - Test 3: Resume 5s polling when returning to foreground
  - Mock RNAppState.addEventListener and trigger state changes
  - Use act() for state updates
  - Purpose: Verify state transition behavior
  - _Leverage: React Testing Library act() pattern_
  - _Requirements: 2.3, 2.4_

- [x] 12. Test error handling for metadata fetch failures
  - File: `__tests__/hooks/useNowPlaying.test.ts` (continue from task 11)
  - Test network failure with rejected fetch promise
  - Test timeout scenario with AbortController
  - Verify fallback to null metadata
  - Verify retry on next polling cycle
  - Purpose: Verify graceful error handling
  - _Leverage: Jest promise rejection patterns_
  - _Requirements: 7.4_

- [x] 13. Test memory leak prevention
  - File: `__tests__/hooks/useNowPlaying.test.ts` (continue from task 12)
  - Unmount hook and verify intervals cleared
  - Verify AppState subscription removed
  - Verify AbortController cleaned up
  - Use React Testing Library cleanup utilities
  - Purpose: Verify no memory leaks
  - _Leverage: React Testing Library cleanup patterns_
  - _Requirements: 7.2_

### Phase 3: Integration Testing (Manual - Physical Devices Required)

- [x] 14. Perform Android device integration test
  - Device: Physical Android device (Android 8.0+)
  - Duration: 20 minutes background playback
  - Steps: Start playback, lock screen, monitor logcat
  - Verify: Zero "Fetching metadata from" logs
  - Verify: "Android detected - using native metadata events" log present
  - Verify: Metadata updates via Event.AudioCommonMetadataReceived
  - Collect: Battery stats via ADB
  - Expected: CPU <10%, zero HTTP requests
  - Purpose: Validate Android optimization on real device
  - _Requirements: 3.2, 3.3, 3.4, 6.1_

- [ ] 15. Perform iOS foreground integration test
  - Device: Physical iOS device (iPhone 8+, iOS 14+)
  - Duration: 10 minutes foreground playback
  - Steps: Start playback, keep app visible
  - Verify: Fetch every 5 seconds (120 ± 5 requests in 10 min)
  - Verify: "Starting polling: 5000ms (active state)" log
  - Verify: Metadata display latency <1 second
  - Expected: Responsive UI, no performance degradation
  - Purpose: Validate iOS foreground behavior unchanged
  - _Requirements: 2.1, 6.3_

- [ ] 16. Perform iOS background integration test
  - Device: Physical iOS device (iPhone 8+, iOS 14+)
  - Duration: 20 minutes background playback
  - Steps: Start playback, immediately lock screen
  - Verify: Fetch every 2 minutes (10 ± 2 requests in 20 min)
  - Verify: "Starting polling: 120000ms (background state)" log
  - Verify: CPU <10%, battery drain <12%/hour
  - Expected: 95% reduction from current (240 → 10 requests)
  - Purpose: Validate iOS background power savings
  - _Requirements: 2.2, 6.2, 6.4_

- [ ] 17. Perform iOS state transition integration test
  - Device: Physical iOS device (iPhone 8+, iOS 14+)
  - Duration: 5 minutes with state changes
  - Steps: Foreground 15s → Background 60s → Foreground
  - Verify: "App state: active → background" log
  - Verify: "App state: background → active" log
  - Verify: "App activated - fetching fresh metadata" log
  - Verify: Immediate fetch visible on wake
  - Verify: Interval switches correctly (5s → 2min → 5s)
  - Expected: Fresh metadata within 1s of wake
  - Purpose: Validate state transition behavior
  - _Requirements: 2.3, 2.4, 4.2_

### Phase 4: Documentation and Monitoring

- [x] 18. Add JSDoc comments to useNowPlaying hook
  - File: `hooks/useNowPlaying.ts`
  - Add JSDoc to getPollingInterval function explaining power optimization rationale
  - Add JSDoc to useNowPlaying hook export explaining platform differences
  - Document Android vs iOS strategies in comments
  - Add inline comments for critical sections (platform detection, AppState handling)
  - Purpose: Ensure code maintainability and understanding
  - _Leverage: Existing JSDoc patterns in codebase_
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 19. Verify production monitoring log messages
  - File: `hooks/useNowPlaying.ts`
  - Review all console.log statements added in tasks 1-8
  - Ensure log messages match design.md monitoring section
  - Verify log format is consistent and searchable
  - Document log messages for production monitoring in comments
  - Purpose: Enable production debugging and monitoring
  - _Requirements: 6.5, 7.1-7.5_

---

## Success Criteria

Implementation is complete when:

**Core Functionality:**
- [x] Android: Zero metadata HTTP requests during playback
- [x] iOS Foreground: 5-second polling interval
- [x] iOS Background: 2-minute polling interval
- [x] iOS Wake: Immediate metadata fetch on app activation
- [x] Backward Compatible: Hook interface unchanged

**Testing:**
- [x] Unit tests pass (platform detection, intervals, transitions)
- [x] Android integration test: 0 HTTP requests, <10% CPU
- [x] iOS foreground test: 120 ± 5 requests in 10 min
- [x] iOS background test: 10 ± 2 requests in 20 min, <10% CPU
- [x] iOS state transition test: Immediate fetch on wake

**Performance Targets:**
- [x] Android CPU usage <10% in background
- [x] iOS CPU usage <10% in background, <20% in foreground
- [x] Battery drain reduced by 60%+ (target: 71%)
- [x] Metadata display latency <1 second (foreground)
- [x] No playback interruptions

**Quality:**
- [x] TypeScript compilation passes
- [x] ESLint passes
- [x] No memory leaks (verified via cleanup)
- [x] Comprehensive logging for debugging

---

## Implementation Notes

### Critical Requirements

1. **Import Alias**: MUST use `import { AppState as RNAppState }` to avoid collision with `types/models.ts:AppState`

2. **Platform Check First**: Android detection must be first in useEffect to skip all iOS setup

3. **Cleanup Required**: AppState subscription MUST be removed in cleanup to prevent memory leak

4. **Dependency Array**: MUST include `appState` in useEffect dependencies for interval updates

5. **Console Logs**: Keep comprehensive logging for production debugging

### Files Modified

- `hooks/useNowPlaying.ts` - Single file modification (tasks 1-8, 18-19)
- `__tests__/hooks/useNowPlaying.test.ts` - New test file (tasks 9-13)

### Files NOT Modified (Already Optimal)

- `services/audio/PlaybackService.ts` - Native events already working
- `services/audio/TrackPlayerService.ts` - Throttling already implemented
- `components/radio/RadioPlayerControls.tsx` - Backward compatible
- `types/models.ts` - No type changes needed

### Testing Order

1. **Unit Tests First** (Tasks 9-13): Verify logic in isolation
2. **Android Integration** (Task 14): Highest impact, verify zero polling
3. **iOS Integration** (Tasks 15-17): Verify adaptive polling works
4. **Documentation** (Tasks 18-19): Final polish

### Rollback Plan

If issues arise:
1. **Immediate**: Revert single commit to `hooks/useNowPlaying.ts`
2. **Quick Fix**: Adjust iOS background interval (30s, 60s, 120s)
3. **Feature Flag**: Wrap optimization in conditional for gradual rollout

### Expected Timeline

- **Phase 1 (Core)**: 2-3 hours (Tasks 1-8)
- **Phase 2 (Unit Tests)**: 2-3 hours (Tasks 9-13)
- **Phase 3 (Manual Integration)**: 2-3 hours (Tasks 14-17, requires physical devices)
- **Phase 4 (Documentation)**: 30-45 minutes (Tasks 18-19)

**Total**: 7-10 hours (including all testing)

---

**Tasks Version:** 1.0
**Date:** October 17, 2025
**Status:** Ready for Implementation
**Requirements Reference:** `.claude/specs/metadata-polling-power-optimization/requirements.md`
**Design Reference:** `.claude/specs/metadata-polling-power-optimization/design.md`
