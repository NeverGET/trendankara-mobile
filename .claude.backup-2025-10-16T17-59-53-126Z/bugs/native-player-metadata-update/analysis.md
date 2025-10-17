# Bug Analysis

## Root Cause Analysis

### Investigation Summary
After thorough investigation of the codebase and expo-video behavior, I've identified the precise issues preventing native controls from updating with new metadata. The problem involves multiple interconnected timing and async/await issues in the `VideoPlayerService.updateNowPlayingInfo()` method.

**Key Findings**:
1. ✅ Metadata fetching works perfectly (`useNowPlaying` hook)
2. ✅ App UI updates correctly with new song info
3. ❌ Native controls don't refresh due to async flow issues
4. ❌ `player.replace()` not awaited properly before state operations
5. ❌ `setTimeout` callback creates race condition with async operations

### Root Cause
**Primary Issue**: The Android code path uses `setTimeout` with async callback, which breaks the promise chain and creates race conditions.

**Critical Code Flaws in `VideoPlayerService.ts:140-229`**:

1. **Line 199** - Android path: `await this.player.replace(updatedSource)` but immediately enters setTimeout
   - The `replace()` call IS awaited, BUT control flow immediately continues to setTimeout
   - Result: State checks and subsequent operations happen before replace completes

2. **Lines 202-210** - Android: `setTimeout` with async callback breaks promise chain
   ```typescript
   setTimeout(async () => {  // ❌ async function inside setTimeout
     if (this.player) {
       this.player.showNowPlayingNotification = true;
       if (wasPlaying) {
         await this.player.play();  // This await doesn't block the outer promise
       }
     }
   }, 100);
   ```
   - The parent `updateNowPlayingInfo()` completes before setTimeout callback executes
   - No way to know if notification re-enable and play() succeeded
   - Creates "fire and forget" behavior

3. **Line 169** - Playback state captured too early
   ```typescript
   const wasPlaying = this.player.playing;
   ```
   - State captured before any operations, may become stale
   - By the time setTimeout executes (100ms later), state could have changed

4. **Line 216** - iOS: Uses `await this.player.replace()` but this might be the wrong method
   - Should use `replaceAsync()` for proper promise handling
   - Documentation suggests `replaceAsync` for async operations

### Contributing Factors
- **expo-video API confusion**: Both `replace()` and `replaceAsync()` exist, unclear which to use
- **Platform differences**: Android needs notification toggle, iOS doesn't
- **Timeout necessity**: Android requires delay for notification recreation, but setTimeout breaks async flow
- **No error handling**: If replace fails silently, metadata never updates
- **Missing audio session reset**: iOS may need `expo-audio` audio session reconfiguration

## Technical Details

### Affected Code Locations

**File**: `services/audio/VideoPlayerService.ts`
- **Method**: `updateNowPlayingInfo(nowPlaying)`
- **Lines**: `140-229`
- **Specific Issues**:

  **Line 169**: State captured too early
  ```typescript
  const wasPlaying = this.player.playing;  // ❌ May be stale by setTimeout execution
  ```

  **Line 199**: Replace awaited but followed by setTimeout
  ```typescript
  await this.player.replace(updatedSource);  // ✅ Awaited
  setTimeout(async () => { ... }, 100);      // ❌ Breaks promise chain
  ```

  **Lines 202-210**: Async callback in setTimeout (Android)
  ```typescript
  setTimeout(async () => {
    this.player.showNowPlayingNotification = true;
    if (wasPlaying) {
      await this.player.play();  // ❌ Parent promise doesn't wait for this
    }
  }, 100);
  ```

  **Line 216**: Wrong method used (iOS)
  ```typescript
  await this.player.replace(updatedSource);  // ⚠️ Should use replaceAsync
  ```

  **Line 220**: Play called immediately after replace
  ```typescript
  if (wasPlaying) {
    await this.player.play();  // ✅ Properly awaited (iOS only)
  }
  ```

**File**: `components/radio/RadioPlayerControls.tsx`
- **Lines**: `50-58` - useEffect that calls updateNowPlayingInfo
- **Status**: ✅ Works correctly, triggers on nowPlaying change

**File**: `hooks/useNowPlaying.ts`
- **Lines**: `24-133` - Metadata fetching logic
- **Status**: ✅ Works perfectly, polls every 5 seconds, updates state correctly

### Data Flow Analysis
1. ✅ `useNowPlaying` hook fetches metadata every 5 seconds from Shoutcast stream
2. ✅ Hook parses metadata and updates `nowPlaying` state correctly
3. ✅ `RadioPlayerControls` component detects `nowPlaying` change via useEffect (line 50-58)
4. ✅ Component calls `videoPlayerService.updateNowPlayingInfo(nowPlaying)`
5. ⚠️ `updateNowPlayingInfo` attempts to update native controls via `replace()`
6. ❌ **FAILURE POINT**: Native controls do not refresh due to:
   - Android: setTimeout breaks promise chain, notification re-enable happens too late or fails
   - iOS: Using wrong method (`replace` vs `replaceAsync`) or missing audio session reset
7. ❌ Result: App UI shows correct metadata, native controls show old metadata

**Visual Flow**:
```
Shoutcast Stream → useNowPlaying (fetch) → State Update → useEffect Trigger
                                                              ↓
                                                    updateNowPlayingInfo()
                                                              ↓
                                    ┌─────────────────────────┴─────────────────────────┐
                                    ↓ Android                                   iOS ↓
                          disable notification                          replace source
                          await replace                                 await play
                          setTimeout (100ms) ← BREAKS HERE              ← May need audio session
                            enable notification
                            await play
```

### Dependencies
- `expo-video` (v3.0.11) - Video player with native controls support via `showNowPlayingNotification`
- `expo-audio` (v1.0.13) - Audio session configuration (available but underutilized)
- `expo-av` (v16.0.7) - Legacy audio support (deprecated, but still installed)
- React Native Platform API - Platform-specific code paths
- Native frameworks:
  - **iOS**: AVFoundation, MPNowPlayingInfoCenter, MediaPlayer framework
  - **Android**: MediaSession, MediaStyle notifications, ExoPlayer (underlying)

**Important Discovery**: `expo-audio` IS installed (line 60 of package.json) despite user saying it's "deprecated and not useful". This is actually the NEW audio API that replaces expo-av. We can use `expo-audio` for audio session management!

## Impact Analysis

### Direct Impact
- Users cannot see current song information in native controls
- Poor user experience during background playback
- Professional app appearance is diminished
- Users may think the app is frozen or not working

### Indirect Impact
- Reduced engagement with background playback feature
- Higher user churn if users expect this functionality
- Negative app store reviews mentioning broken "now playing" feature
- Competitive disadvantage compared to other radio apps

### Risk Assessment
**High Priority**: This is a core feature for a radio streaming app. Without proper native controls integration:
- Users will not adopt background playback
- App store ratings may suffer
- User retention will be negatively impacted

## Solution Approach

### Fix Strategy
Rewrite the `updateNowPlayingInfo` method with proper async/await flow and eliminate the setTimeout race condition.

**Core Strategy**:
1. **Use `replaceAsync()`** instead of `replace()` for guaranteed promise completion
2. **Wrap setTimeout in Promise** to maintain async chain for Android
3. **Increase Android delay** from 100ms to 200ms for reliable notification recreation
4. **Validate player state** immediately before operations (not at start)
5. **Add comprehensive error handling** and logging
6. **Consider expo-audio** for iOS audio session management (if needed)

**Detailed Solution**:

**For Android**:
```typescript
// 1. Disable notification
this.player.showNowPlayingNotification = false;

// 2. Replace source with new metadata
await this.player.replaceAsync(updatedSource);

// 3. Wait for notification system to settle (wrapped in Promise)
await new Promise(resolve => setTimeout(resolve, 200));

// 4. Re-enable notification (forces recreation with new metadata)
this.player.showNowPlayingNotification = true;

// 5. Resume playback if it was playing
if (wasPlaying) {
  await this.player.play();
}
```

**For iOS**:
```typescript
// 1. Replace source with new metadata
await this.player.replaceAsync(updatedSource);

// 2. Resume playback if it was playing
if (wasPlaying) {
  await this.player.play();
}

// 3. (Optional) Reset audio session to force refresh
// await Audio.setAudioModeAsync({ ... });
```

### Alternative Solutions Considered

1. **Recreate Player Entirely** ❌
   - Destroy and recreate the entire VideoPlayer instance on metadata change
   - **Pros**: Guaranteed fresh native controls
   - **Cons**: Causes audio interruption, loses playback position, resource intensive
   - **Decision**: Rejected - poor user experience

2. **Switch to expo-av** ❌
   - Use `expo-av` with `setNowPlayingInfoAsync` for direct metadata control
   - **Pros**: Direct control over MPNowPlayingInfoCenter
   - **Cons**: expo-av is deprecated, user stated not to use it
   - **Decision**: Rejected - against technical constraints

3. **Custom Native Module** ❌
   - Create native bridge to directly update MediaSession/MPNowPlayingInfo
   - **Pros**: Full control, most reliable
   - **Cons**: Requires Objective-C/Swift and Java/Kotlin code, high maintenance
   - **Decision**: Rejected - violates "no overengineering" principle

4. **Enhanced Replace with Promise Wrapper** ✅ **CHOSEN**
   - Fix async flow issues while keeping expo-video
   - **Pros**: Minimal changes, maintains simplicity, follows existing patterns
   - **Cons**: Requires careful timing management
   - **Decision**: Selected - best balance of reliability and simplicity

### Risks and Trade-offs

**Chosen Solution Risks**:
1. **Audio Glitch Risk**: Replace may cause brief interruption
   - **Mitigation**: Already happening in current code, no worse than current state
   - **Impact**: Low - streaming resumes within milliseconds

2. **Timing Dependency**: 200ms delay may not work on all Android devices
   - **Mitigation**: Use promisified delay, test on multiple devices
   - **Impact**: Medium - may need adjustment, but controllable

3. **API Changes**: expo-video API may change in future versions
   - **Mitigation**: Document version dependency, monitor changelog
   - **Impact**: Low - Expo maintains API stability

**Benefits**:
- ✅ Maintains simple, readable code
- ✅ No new dependencies required
- ✅ Platform-specific optimizations
- ✅ Proper error handling and logging
- ✅ Follows project's "KISS" principle
- ✅ Aligns with documentation provided by user

## Implementation Plan

### Changes Required

**PRIMARY CHANGE**: Rewrite `updateNowPlayingInfo()` method in `VideoPlayerService.ts:140-229`

**Specific Modifications**:

1. **Change 1**: Replace `replace()` with `replaceAsync()` throughout
   - **File**: `services/audio/VideoPlayerService.ts`
   - **Lines**: 199, 216
   - **Modification**:
     ```typescript
     // OLD: await this.player.replace(updatedSource);
     // NEW: await this.player.replaceAsync(updatedSource);
     ```

2. **Change 2**: Wrap Android setTimeout in Promise
   - **File**: `services/audio/VideoPlayerService.ts`
   - **Lines**: 194-210 (Android block)
   - **Modification**:
     ```typescript
     // OLD: setTimeout(async () => { ... }, 100);
     // NEW: await new Promise<void>(resolve => setTimeout(resolve, 200));
     //      then synchronous operations outside Promise
     ```

3. **Change 3**: Increase Android delay from 100ms to 200ms
   - **File**: `services/audio/VideoPlayerService.ts`
   - **Line**: 202
   - **Modification**: Change delay to 200ms in promisified timeout

4. **Change 4**: Move playback state check closer to usage
   - **File**: `services/audio/VideoPlayerService.ts`
   - **Line**: 169
   - **Modification**: For Android, re-check `wasPlaying` after delay

5. **Change 5**: Add comprehensive error handling
   - **File**: `services/audio/VideoPlayerService.ts`
   - **Lines**: 226-228
   - **Modification**: Enhanced error logging with platform info and state details

6. **Change 6** (Optional): Add iOS audio session reset
   - **File**: `services/audio/VideoPlayerService.ts`
   - **Lines**: 212-224 (iOS block)
   - **Modification**: Add `expo-audio` import and audio session reset if iOS updates still fail

**NO changes needed**:
- ✅ `hooks/useNowPlaying.ts` - Already works correctly
- ✅ `components/radio/RadioPlayerControls.tsx` - Already works correctly
- ✅ Metadata validation (lines 154-158) - Already adequate

### Testing Strategy

**Manual Testing (Primary)**:

**Android Testing**:
1. ✅ Start playback on Android device
2. ✅ Verify initial metadata appears in notification
3. ⏱️ Wait 5 seconds for Shoutcast metadata to change
4. ✅ Check notification updates with new song/artist
5. ✅ Test with app backgrounded
6. ✅ Test with screen locked
7. ✅ Test rapid metadata changes (multiple songs < 30 seconds)
8. ✅ Test pause/resume during metadata update
9. ✅ Test with phone calls interrupting playback

**iOS Testing**:
1. ✅ Start playback on iOS device
2. ✅ Verify initial metadata in Control Center
3. ⏱️ Wait 5 seconds for metadata change
4. ✅ Check Control Center updates
5. ✅ Check Lock Screen player widget updates
6. ✅ Test with app backgrounded
7. ✅ Test with screen locked
8. ✅ Test rapid changes
9. ✅ Test pause/resume
10. ✅ Test with Siri, calls, other apps

**Edge Cases**:
- ⚠️ Metadata updates while paused (should work but not critical)
- ⚠️ Metadata updates during buffering (may be delayed)
- ✅ Empty artist field (show song only)
- ✅ Missing metadata (show "Trend Ankara")
- ✅ Very long names (OS should truncate)
- ✅ Special characters: Turkish (çğıöşü), emojis, non-Latin

**Automated Testing (Nice to have, not critical)**:
- Mock `nowPlaying` changes in component test
- Verify `updateNowPlayingInfo` called with correct data
- Unit test metadata string construction
- Unit test update debouncing (already present in code)

### Performance Validation
- ✅ No audio interruptions longer than 100ms
- ✅ Metadata updates within 1-2 seconds of change
- ✅ No memory leaks from repeated updates
- ✅ CPU usage remains low during updates
- ✅ Battery usage unchanged

### Rollback Plan

**If fix causes issues**:

1. **Minor Issues** (metadata still not updating reliably):
   - Adjust Android delay (try 300ms, 500ms)
   - Add iOS audio session reset (Change 6)
   - Add retry logic with exponential backoff

2. **Major Issues** (playback interruptions, crashes):
   - Immediately revert `VideoPlayerService.ts` changes
   - Use git to restore to previous working version
   - Document exact failure scenario
   - Consider alternative approaches:
     - Option A: Disable metadata updates, use static "Trend Ankara"
     - Option B: Only update on track start, not during playback
     - Option C: Investigate native module solution (last resort)

3. **Critical Issues** (app unusable):
   - Emergency rollback via git
   - Deploy hotfix build
   - Disable `showNowPlayingNotification` temporarily
   - Full investigation before next attempt

**Safety Note**: This fix only affects metadata display, NOT core streaming playback. If anything breaks, playback will continue working with stale metadata - app remains functional.
