# Implementation Plan

## Task Overview

This implementation plan breaks down the log cleanup and code removal work into **atomic, agent-friendly tasks**. Each task focuses on 1-3 files, has a clear single purpose, and can be completed in 15-30 minutes. Tasks are organized into logical phases with verification checkpoints after each phase.

**Total Tasks**: 24 atomic tasks across 8 phases
**Estimated Duration**: 8-12 hours total (including verification and testing)

## Steering Document Compliance

This implementation follows:
- **tech.md**: "No console.log in production", "No commented-out code", professional code standards
- **structure.md**: Respects existing project structure (services/, utils/, store/, app/, hooks/)
- **React Native patterns**: Uses `__DEV__` flag for conditional compilation
- **Git workflow**: Feature branch with atomic commits for safe rollback

## Atomic Task Requirements

**Each task meets these criteria for optimal agent execution:**
- ✓ **File Scope**: Touches 1-3 related files maximum
- ✓ **Time Boxing**: Completable in 15-30 minutes
- ✓ **Single Purpose**: One testable outcome per task
- ✓ **Specific Files**: Exact file paths to create/modify specified
- ✓ **Agent-Friendly**: Clear input/output with minimal context switching
- ✓ **Verifiable**: Each task has specific verification criteria

## Task Format Guidelines

- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to modify
- **Include implementation details** as bullet points under each task
- Reference requirements using: `_Requirements: LOG-CLEANUP-XXX.Y_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts_`
- Focus only on coding tasks (no deployment, user testing covered separately)

## Tasks

### Phase 1: Setup & Baseline Establishment

- [x] 1. Create feature branch and establish baseline measurements
  - File: Create `baseline-measurements.txt` in project root (temporary file)
  - Create git feature branch: `git checkout -b feature/log-cleanup-code-removal`
  - Count current console statements: `grep -r "console\." --include="*.ts" --include="*.tsx" services/ utils/ app/ store/ hooks/ | wc -l > baseline-measurements.txt`
  - Count console.error/warn: `grep -r "console\.error\|console\.warn" --include="*.ts" --include="*.tsx" . | wc -l >> baseline-measurements.txt`
  - Record baseline for NFR-REL-001 verification (±10% tolerance)
  - Purpose: Establish baseline for comparison and verification
  - _Requirements: LOG-CLEANUP-005.5, NFR-REL-001_

- [x] 2. Add ESLint no-console rule to configuration
  - File: `eslint.config.js`
  - Add new rule object to the defineConfig array with no-console rule
  - Rule configuration: `'no-console': ['error', { allow: ['warn', 'error'] }]`
  - Run `npm run lint` to verify configuration works (expect many violations initially)
  - Purpose: Establish automated enforcement for future development
  - _Leverage: eslint.config.js (existing flat config structure)_
  - _Requirements: LOG-CLEANUP-001.5_

- [x] 3. Run automated scans and document findings
  - File: Create `cleanup-scan-results.txt` in project root (temporary file)
  - Run emoji detection scan: `grep -r --include="*.ts" --include="*.tsx" -E "console\.(log|warn|error|debug).*[🚀📤📋🔗🎯⏱️📦❌🔴📱🌐🔒📊🔄🐛🚨🍞🧪📶🔍📡✅🎵📻🗑️⏹️⚠️]" services/ utils/ app/ store/ hooks/ > cleanup-scan-results.txt`
  - Run SSL code scan: `grep -r "testConnection\|rejectUnauthorized" --exclude="trendankara-proxy/index.js" . >> cleanup-scan-results.txt`
  - Run commented code scan: `grep -rn "^[[:space:]]*//[[:space:]]*const \|^[[:space:]]*//[[:space:]]*import \|^[[:space:]]*//[[:space:]]*async " --include="*.ts" store/ services/ >> cleanup-scan-results.txt`
  - Review scan results to understand scope
  - Purpose: Automated discovery of all cleanup targets
  - _Requirements: LOG-CLEANUP-001.1, LOG-CLEANUP-002.1, LOG-CLEANUP-003.1_

### Phase 2: Clean Emoji Logs - Services Layer

- [x] 4. Clean emoji logs from services/api/client.ts
  - File: `services/api/client.ts`
  - Remove lines 23: emoji log for API Client initialization (🚀)
  - Remove lines 56-65: emoji logs for request interceptor (📤, 📋, 🔗, 🎯, ⏱️, 📦)
  - Remove lines 70-73: emoji logs for request error (❌)
  - Remove lines 94-126: emoji logs for response error (🔴, 📱, 🌐, 🔒, 📊, 🔄)
  - Remove line 135: emoji log for retry logic (🔄)
  - Keep all console.error calls (remove emoji only, keep error context)
  - Wrap useful debug info in `if (__DEV__) { }` blocks if needed
  - Run TypeScript check: `npx tsc --noEmit` to verify no errors
  - Purpose: Remove emoji from API client logging while preserving error tracking
  - _Leverage: React Native __DEV__ flag pattern from services/api/initialization.ts_
  - _Requirements: LOG-CLEANUP-001.1, LOG-CLEANUP-001.2, NFR-REL-001_

- [x] 5. Clean emoji logs from services/crashReporting.ts
  - File: `services/crashReporting.ts`
  - Remove line 93: emoji log for crash reporting disabled (🐛)
  - Remove line 107: emoji log for crash reporting initialized (🚨)
  - Remove line 160: emoji log for breadcrumb tracking (🍞)
  - Remove lines 268-274: emoji from console.group crash report display (🚨)
  - Keep all error handling logic intact
  - Wrap development-only breadcrumb logs in `if (__DEV__) { }` if valuable for debugging
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Clean crash reporting logs while maintaining error tracking functionality
  - _Requirements: LOG-CLEANUP-001.1, LOG-CLEANUP-001.4_

- [x] 6. Clean emoji logs from services/api/cards.ts
  - File: `services/api/cards.ts`
  - Locate and remove emoji log for data transformation tracking (🔄)
  - Review all console statements in file for emoji
  - Ensure data transformation logic remains unchanged
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Clean service layer logs
  - _Requirements: LOG-CLEANUP-001.1_

- [ ] 7. Clean emoji logs from utils directory (appInitializer.ts, performance.ts, appReview.ts)
  - Files: `utils/appInitializer.ts`, `utils/performance.ts`, `utils/appReview.ts`
  - In appInitializer.ts: Remove emoji from initialization logs (🚀, ✅, ❌)
  - In performance.ts: Remove emoji from performance monitoring logs (🚀, ⏹️, 📊, ⚠️)
  - In appReview.ts: Remove emoji from app review tracking logs (📱, 📊, ✅, ❌, 🗑️)
  - Wrap useful initialization info in `if (__DEV__) { }` blocks
  - Keep console.error for actual errors (remove emoji only)
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Clean utility layer logging
  - _Requirements: LOG-CLEANUP-001.1, LOG-CLEANUP-001.2, LOG-CLEANUP-001.4_

### Phase 3: Clean Emoji Logs - Store & App Layers

- [ ] 8. Clean emoji logs from Redux slices (playerSlice.ts, newsSlice.ts)
  - Files: `store/slices/playerSlice.ts`, `store/slices/newsSlice.ts`
  - In playerSlice.ts: Remove debug logs for player state changes (play/pause/volume)
  - In newsSlice.ts: Remove debug logs for fetching news and article details
  - Keep error handling logs in thunks if they exist
  - Consider wrapping useful debug logs in `if (__DEV__) { }` for development
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Clean Redux state management logging
  - _Requirements: LOG-CLEANUP-001.1, LOG-CLEANUP-001.4_

- [ ] 9. Clean emoji logs and isolate dev code in app/_layout.tsx
  - File: `app/_layout.tsx`
  - Remove line 33: emoji log for cache clearing (🗑️)
  - Remove emoji from line 36: initialization log
  - Remove emoji from line 40: initialization success log
  - Keep lines 41, 43: loaded/failed endpoints logs (remove emoji only)
  - Remove emoji from line 61: deep link log
  - Evaluate lines 31-33: cache clearing code - either remove entirely (temporary) OR keep wrapped in `if (__DEV__) { }` without emoji log
  - Keep console.error on line 43 (failedEndpoints) and line 64 (deep link error)
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Clean app initialization logging and isolate dev-only cache clearing
  - _Requirements: LOG-CLEANUP-001.1, LOG-CLEANUP-004.1_

- [ ] 10. Review and clean error logs in app tabs and hooks
  - Files: `app/(tabs)/index.tsx`, `app/(tabs)/news.tsx`, `app/about.tsx`, `hooks/useNetworkStatus.ts`, `hooks/useDeepLinking.ts`
  - Review all console.error and console.warn statements
  - Remove emoji if present (keep the error/warning itself)
  - Ensure error messages are professional and actionable
  - Verify error context is descriptive (component name, error details)
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Ensure error handling logs are professional and emoji-free
  - _Requirements: LOG-CLEANUP-001.2, LOG-CLEANUP-001.3, NFR-USE-002_

### Phase 4: SSL Testing Code Removal

- [x] 11. Delete SSL testing utility file
  - File: `services/api/testConnection.ts` (DELETE entire file)
  - Delete the entire file (143 lines)
  - Verify file deletion: `test ! -f services/api/testConnection.ts && echo "File deleted successfully"`
  - Purpose: Remove SSL testing infrastructure no longer needed
  - _Requirements: LOG-CLEANUP-002.1_

- [x] 12. Remove testConnection import and usage from initialization service
  - File: `services/api/initialization.ts`
  - Remove import statement for testConnection (line 1 or wherever import is)
  - Remove lines 53-56: `if (__DEV__) { await testApiConnection(); }` call
  - Verify no other references to testConnection in file
  - Run TypeScript check: `npx tsc --noEmit` (should pass with no errors)
  - Verify with grep: `grep -n "testConnection" services/api/initialization.ts` returns no results
  - Purpose: Remove SSL testing code from initialization flow
  - _Requirements: LOG-CLEANUP-002.4_

- [ ] 13. Delete proxy testing utility files
  - Files: `trendankara-proxy/local-server.js` (DELETE), `trendankara-proxy/test-proxy.js` (DELETE)
  - Delete both local development/testing files
  - Verify files deleted: `test ! -f trendankara-proxy/local-server.js && test ! -f trendankara-proxy/test-proxy.js && echo "Files deleted successfully"`
  - Verify production proxy preserved: `test -f trendankara-proxy/index.js && echo "Production proxy intact"`
  - Run grep to verify no references to deleted files: `grep -r "local-server\|test-proxy" . --exclude-dir=node_modules`
  - Purpose: Remove local testing infrastructure for proxy
  - _Leverage: Keep trendankara-proxy/index.js (production code)_
  - _Requirements: LOG-CLEANUP-002.3_

### Phase 5: Commented Code Cleanup

- [ ] 14. Clean commented code from store/slices/newsSlice.ts
  - File: `store/slices/newsSlice.ts`
  - Remove lines ~120-122: Commented API call in fetchNews thunk
  - Remove lines ~170-172: Commented API call in fetchArticleDetails thunk
  - If mock implementation is being used, keep it but ensure it's clearly documented (will be addressed in Task 18)
  - If real API is implemented, uncomment and use; if not, remove commented code entirely
  - Ensure thunk functionality remains intact
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Remove commented-out API implementation examples
  - _Requirements: LOG-CLEANUP-003.1, LOG-CLEANUP-003.3_

- [ ] 15. Clean commented code from store/slices/pollsSlice.ts
  - File: `store/slices/pollsSlice.ts`
  - Remove lines ~85-86: Commented API call in fetchPolls thunk
  - Remove lines ~115-116: Commented API call in submitVote thunk
  - Similar to newsSlice, handle mock vs. real implementation appropriately
  - Ensure voting logic remains functional
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Remove commented-out API examples from polls logic
  - _Requirements: LOG-CLEANUP-003.1_

- [ ] 16. Clean commented code from services/analytics.ts
  - File: `services/analytics.ts`
  - Remove lines ~107-110: Commented fetch implementation
  - Verify analytics functionality remains intact (likely replaced with axios or newer implementation)
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Remove obsolete commented fetch code
  - _Requirements: LOG-CLEANUP-003.1_

- [ ] 17. Clean commented imports and exports
  - Files: `utils/share.ts`, `store/index.ts`
  - In utils/share.ts (line ~8): Remove commented clipboard import
  - In store/index.ts (line ~29): Evaluate commented export - either remove or uncomment if needed
  - Review comment above line 29 in store/index.ts about circular dependency - document decision
  - Run TypeScript check: `npx tsc --noEmit`
  - Verify no unused imports remain: Check ESLint output for unused-imports warnings
  - Purpose: Clean up commented imports and resolve export issues
  - _Requirements: LOG-CLEANUP-003.2, LOG-CLEANUP-003.3_

### Phase 6: Mock Data Documentation

- [ ] 18. Document mock data usage in store/slices/newsSlice.ts
  - File: `store/slices/newsSlice.ts`
  - Add JSDoc comment above mockCategories array (lines 58-64): "Mock category data - DEVELOPMENT ONLY. Used when __DEV__ is true to enable local testing without API. In production builds, real API calls are used instead."
  - Add similar JSDoc above mockArticles array
  - Verify mock data usage is conditional (if not, make it conditional or document why it's used)
  - Add inline comment explaining when mocks vs. real API are used
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Clearly document development mock data usage
  - _Requirements: LOG-CLEANUP-004.2, LOG-CLEANUP-004.4_

- [ ] 19. Document mock data usage in store/slices/pollsSlice.ts
  - File: `store/slices/pollsSlice.ts`
  - Add JSDoc comment above mockPolls array (lines 36-72): "Mock poll data - DEVELOPMENT ONLY. Used when __DEV__ is true to enable local testing without API. In production builds, real API calls are used instead."
  - Document the conditional usage of mock data vs. real API
  - Ensure clear distinction between development and production data sources
  - Run TypeScript check: `npx tsc --noEmit`
  - Purpose: Document mock data for future developers
  - _Requirements: LOG-CLEANUP-004.2, LOG-CLEANUP-004.4_

### Phase 7: Verification & Testing

- [ ] 20. Run TypeScript compilation and verify zero errors
  - Command: `npx tsc --noEmit`
  - Verify: Zero TypeScript errors
  - If errors exist, review and fix before proceeding
  - Document any errors found and their resolution
  - Purpose: Ensure type safety maintained throughout cleanup
  - _Requirements: LOG-CLEANUP-005.1, NFR-MAINT-001_

- [ ] 21. Run full test suite and verify 100% pass rate
  - Command: `npm test` (or equivalent for the project)
  - Verify: All tests pass (100% success rate)
  - If any tests fail, investigate and fix OR revert related changes
  - Compare test count to baseline to ensure no tests were accidentally removed
  - Document test results
  - Purpose: Ensure no functionality was broken during cleanup
  - _Requirements: LOG-CLEANUP-005.1, LOG-CLEANUP-003.5_

- [ ] 22. Establish bundle size baseline and compare
  - Commands:
    - Generate production bundle: `npx expo export --platform ios --output-dir cleanup-bundle`
    - Measure size: `du -sh cleanup-bundle/ > bundle-size-after.txt`
    - Compare to baseline-measurements.txt from Task 1
  - Verify: Bundle size reduced by ≥1KB OR remained same (SHALL NOT increase)
  - Document bundle size comparison results
  - If bundle size increased, investigate and determine cause
  - Purpose: Verify development code is stripped from production builds
  - _Requirements: LOG-CLEANUP-004.3, NFR-PERF-002_

- [ ] 23. Run verification scans to confirm cleanup success
  - Run emoji detection scan: `grep -r --include="*.ts" --include="*.tsx" -E "console\.(log|warn|error|debug).*[🚀📤📋🔗🎯⏱️📦❌🔴📱🌐🔒📊🔄🐛🚨🍞🧪📶🔍📡✅🎵📻🗑️⏹️⚠️]" services/ utils/ app/ store/ hooks/` (should return zero results)
  - Run SSL code scan: `grep -r "testConnection" services/` (should return zero results)
  - Verify testConnection.ts deleted: `test ! -f services/api/testConnection.ts && echo "PASS"`
  - Verify proxy test files deleted: `test ! -f trendankara-proxy/local-server.js && echo "PASS"`
  - Run ESLint: `npm run lint` (verify no-console violations only in allowed locations)
  - Count console.error/warn and verify within ±10% of baseline (NFR-REL-001)
  - Document all verification results
  - Purpose: Automated verification of all cleanup requirements
  - _Requirements: LOG-CLEANUP-001.5, LOG-CLEANUP-002.1, LOG-CLEANUP-002.2, LOG-CLEANUP-002.3, NFR-REL-001_

### Phase 8: Manual Testing & PR Creation

- [ ] 24. Run manual smoke test and create pull request
  - Manual smoke test checklist:
    - [ ] Radio player: Play/pause/volume controls work
    - [ ] Radio player: Background playback functions
    - [ ] News page: Articles load successfully
    - [ ] News page: Article details display correctly
    - [ ] Polls page: Polls load and display
    - [ ] Polls page: Voting mechanism works
    - [ ] Settings: Settings load and preferences persist
    - [ ] Error handling: Network errors show appropriate messages
    - [ ] Console output: Review production logs - no emoji, professional format
  - Create PR:
    - Title: "feat: Clean up debug logs, remove SSL testing code, and improve code quality"
    - Description: Include baseline measurements, scan results, test results, bundle size comparison
    - Link to design document: `.claude/specs/log-cleanup-code-removal/design.md`
    - Request code review
  - Delete temporary files: `baseline-measurements.txt`, `cleanup-scan-results.txt`, `bundle-size-after.txt`, `cleanup-bundle/` directory
  - Purpose: Final verification and PR submission for review
  - _Requirements: LOG-CLEANUP-005.4, LOG-CLEANUP-005.5_

## Verification Summary

After completing all tasks, the following shall be verified:

**Logging Cleanup**:
- ✓ Zero emoji characters in console statements outside `__DEV__` blocks
- ✓ All error/warning logs preserved and professional
- ✓ ESLint no-console rule enforced

**SSL Testing Code Removal**:
- ✓ services/api/testConnection.ts deleted
- ✓ trendankara-proxy/local-server.js deleted
- ✓ trendankara-proxy/test-proxy.js deleted
- ✓ No references to testConnection in codebase
- ✓ Production proxy configuration intact

**Code Quality**:
- ✓ Zero commented-out implementations in Redux slices
- ✓ No unused imports
- ✓ Mock data clearly documented

**Build & Test**:
- ✓ TypeScript compilation: zero errors
- ✓ Test suite: 100% pass rate
- ✓ iOS/Android builds: successful
- ✓ Bundle size: reduced or maintained (not increased)

**Functionality**:
- ✓ All core features working (manual smoke test passed)
- ✓ Error tracking preserved
- ✓ Production logs clean and professional
