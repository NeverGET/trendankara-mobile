# iOS State Transition Integration Test (Task 17)

## Test ID
Task 17: iOS State Transition Integration Test - Dynamic Interval Switching

## Objective
Verify that on iOS devices, the application correctly detects app state transitions (active ↔ background) and dynamically adjusts metadata polling intervals, with immediate metadata fetch on wake-up to provide fresh data within 1 second.

## Prerequisites

### Required Hardware
- Physical iOS device (iPhone 8 or newer, iOS 14+)
- Lightning/USB-C cable for Mac connection
- Mac computer with Xcode installed
- Stopwatch or timer app on separate device (for precise timing)

### Required Software
- Xcode installed with iOS development tools
- iOS Console app (or Xcode Devices window)
- Latest build of Trend Ankara app installed
- Fully charged device recommended

### Test Environment
1. Stable Wi-Fi connection
2. Quiet environment to verify audio
3. 5+ minutes of uninterrupted time
4. Second device for timing measurements (phone timer, stopwatch, etc.)

## Test Environment Setup

### 1. Prepare Device
1. Charge device to >50%
2. Close all background apps
3. Disable Low Power Mode: Settings > Battery > Low Power Mode (OFF)
4. Set Auto-Lock to 30 seconds: Settings > Display & Brightness > Auto-Lock
5. Disable Do Not Disturb to ensure no interruptions
6. Enable good Wi-Fi signal

### 2. Start Console Monitoring
1. Connect iPhone to Mac via cable
2. Open Xcode
3. Window > Devices and Simulators
4. Select your device
5. Click "Open Console"
6. Clear existing logs
7. Set filter to "useNowPlaying" or "App state"

**Important**: Keep Console open and Mac awake throughout entire test.

### 3. Prepare Timing Device
- Use a separate phone, stopwatch, or Mac timer
- You'll need to measure precise intervals
- Prepare to take screenshots at specific moments

## Test Procedure Overview

This test consists of **THREE state transitions** with precise timing:

```
Phase 1: Active (foreground)    →  15 seconds
Phase 2: Background (locked)    →  60 seconds
Phase 3: Active (wake + unlock) →  Verify immediate fetch
```

**Total test time**: ~5 minutes
**Key measurement**: Immediate fetch latency on wake

## Phase 1: Initial Active State (0-15 seconds)

### Step 1.1: Start Playback in Foreground
1. **Clear Console logs**
2. **Start timer** (or note exact time: ___:___:___)
3. Launch Trend Ankara app
4. Navigate to radio player
5. Tap Play button
6. **Keep app in foreground** (visible on screen)
7. **Keep screen on** (don't lock)

### Step 1.2: Verify Active State Polling
Watch Console for these logs within 1-2 seconds:
```
[useNowPlaying] Starting with URL: <metadata-url>
[useNowPlaying] Starting polling with 5000ms interval (appState: active)
[useNowPlaying] Fetching metadata from: <url>
```

### Step 1.3: Wait Exactly 15 Seconds
- Keep app visible
- Monitor Console for "Fetching metadata from:" logs
- Expected: 3-4 fetch events in 15 seconds (at 5s intervals)
- Count actual fetches: _____

**Success Criteria (Phase 1):**
- [ ] "Starting polling with 5000ms interval (appState: active)" appears
- [ ] At least 3 fetch events in 15 seconds
- [ ] Playback smooth and responsive
- [ ] App state remains "active"

## Phase 2: Transition to Background (15-75 seconds)

### Step 2.1: Lock Device at T=15s
**At exactly 15 seconds after playback start:**
1. **Press power button** to lock device
2. **Note lock time**: ___:___:___
3. Keep device locked, face down
4. Continue monitoring Console on Mac
5. **Do not touch device for 60 seconds**

### Step 2.2: Verify Background State Transition
**Within 5 seconds of locking**, watch for this exact sequence:
```
[useNowPlaying] App state transition: active → background
[useNowPlaying] Starting polling with 120000ms interval (appState: background)
```

**Critical**: These logs MUST appear to confirm state detection works.

### Step 2.3: Monitor Background Polling for 60 Seconds
From lock time (T=15s) to wake time (T=75s):
- Keep device locked
- Monitor Console for any fetch events
- Expected: 0-1 fetch event (background interval is 2 minutes)
- Audio should continue playing

**What to expect:**
- If a fetch happens, it will be at the new 2-minute interval
- Most likely, NO fetch will occur during this 60s window
- This is correct behavior (proving interval changed)

**Success Criteria (Phase 2):**
- [ ] "App state transition: active → background" log appears
- [ ] "Starting polling with 120000ms interval (appState: background)" appears
- [ ] State transition occurred within 5 seconds of lock
- [ ] No fetch events (or at most 1) during 60-second background period
- [ ] Audio continues playing throughout

## Phase 3: Transition to Active - Wake Test (75-90 seconds)

This is the **CRITICAL PHASE** testing immediate fetch on wake.

### Step 3.1: Wake Device at T=75s
**At exactly 75 seconds after initial playback start:**
1. **Note wake time**: ___:___:___
2. **Press power button OR raise device** to wake screen
3. **Immediately start stopwatch/timer** (for latency measurement)
4. **Unlock device** (swipe up, Face ID, or passcode)
5. **Navigate back to app** (if not already visible)
6. **Watch Console AND app UI simultaneously**

### Step 3.2: Verify State Transition Logs
**Within 1-2 seconds of unlocking**, watch for this exact sequence:
```
[useNowPlaying] App state transition: background → active
[useNowPlaying] App became active - fetching metadata immediately
[useNowPlaying] Fetching metadata from: <url>
[useNowPlaying] Starting polling with 5000ms interval (appState: active)
```

**Critical logs:**
1. **"App state transition: background → active"** - confirms state detection
2. **"App became active - fetching metadata immediately"** - confirms wake optimization
3. **Immediate fetch** - should happen before next scheduled poll

### Step 3.3: Measure Immediate Fetch Latency
**Measure time from unlock to metadata display:**

1. **Start**: When you complete unlock gesture
2. **End**: When you see new metadata in app UI

**How to measure:**
- Use external timer started at unlock
- Stop timer when UI updates with fresh metadata
- Record latency: _____ milliseconds

**Or use Console timestamps:**
```
Example:
10:05:30.125 - "App became active - fetching metadata immediately"
10:05:30.890 - "Setting now playing (TrendAnkara format): {...}"
Latency: 890 - 125 = 765ms ✓
```

**Expected latency**: <1000ms (1 second)

### Step 3.4: Verify Interval Switches Back
After wake-up and immediate fetch:
- [ ] Next fetch occurs ~5 seconds later (not 2 minutes)
- [ ] "Starting polling with 5000ms interval (appState: active)" present
- [ ] Foreground polling resumes normally

### Step 3.5: Continue for 15 More Seconds
After wake, stay in foreground for 15 seconds:
- Count fetches: Should be 3-4 (at 5s intervals)
- Verify consistent 5-second intervals
- Verify metadata updates visible in UI

**Success Criteria (Phase 3):**
- [ ] "App state transition: background → active" log appears
- [ ] "App became active - fetching metadata immediately" log appears
- [ ] Immediate fetch occurs (not waiting for next scheduled interval)
- [ ] Fresh metadata displays within 1 second of unlock
- [ ] Polling switches back to 5s intervals (appState: active)
- [ ] Subsequent fetches at 5s intervals (3-4 in 15 seconds)

## Detailed Log Sequence to Verify

Here's the complete expected log sequence for the entire test:

```
=== Phase 1: Initial Active (T=0-15s) ===
T=0s:
[useNowPlaying] Starting with URL: https://...
[useNowPlaying] Starting polling with 5000ms interval (appState: active)

T=0s:
[useNowPlaying] Fetching metadata from: https://...

T=5s:
[useNowPlaying] Fetching metadata from: https://...

T=10s:
[useNowPlaying] Fetching metadata from: https://...

T=15s:
[useNowPlaying] Fetching metadata from: https://...

=== Phase 2: Transition to Background (T=15s) ===
T=15s (device locked):
[useNowPlaying] App state transition: active → background
[useNowPlaying] Starting polling with 120000ms interval (appState: background)

T=15s-75s:
(No fetch logs expected - 2min interval not reached)
(Audio continues playing)

=== Phase 3: Wake Transition (T=75s) ===
T=75s (device unlocked):
[useNowPlaying] App state transition: background → active
[useNowPlaying] App became active - fetching metadata immediately
[useNowPlaying] Fetching metadata from: https://...
[useNowPlaying] Response status: 200
[useNowPlaying] Setting now playing (TrendAnkara format): {...}
[useNowPlaying] Starting polling with 5000ms interval (appState: active)

T=80s:
[useNowPlaying] Fetching metadata from: https://...

T=85s:
[useNowPlaying] Fetching metadata from: https://...

T=90s:
[useNowPlaying] Fetching metadata from: https://...
```

## Measurement Checklist

### Interval Measurements
Record actual intervals between fetches:

**Active state (Phase 1):**
```
Fetch 1 → Fetch 2: _____ seconds (expected: ~5s)
Fetch 2 → Fetch 3: _____ seconds (expected: ~5s)
Fetch 3 → Fetch 4: _____ seconds (expected: ~5s)
Average: _____ seconds
Acceptable: 4-6 seconds
```

**Background state (Phase 2):**
```
Last active fetch → First background fetch: _____ seconds
Expected: No fetch (60s < 120s interval)
Or if fetch occurs: >120 seconds
```

**Wake transition (Phase 3):**
```
Unlock time → Immediate fetch: _____ ms (expected: <500ms)
Immediate fetch → Next fetch: _____ seconds (expected: ~5s)
```

### State Transition Timing
Record time for each state change:

```
Lock action → "active → background" log: _____ ms (expected: <500ms)
Unlock action → "background → active" log: _____ ms (expected: <500ms)
"background → active" → Immediate fetch: _____ ms (expected: <100ms)
```

### Metadata Display Latency (Phase 3 Wake)
```
Unlock completion → Metadata visible: _____ ms
Target: <1000ms (1 second)
Acceptable: <1500ms
```

## Success Criteria Summary

### Critical Requirements (Must Pass)

**State Detection:**
- [ ] "App state transition: active → background" appears on lock
- [ ] "App state transition: background → active" appears on wake
- [ ] State transitions detected within 500ms of action

**Interval Switching:**
- [ ] Initial: "5000ms interval (appState: active)"
- [ ] After lock: "120000ms interval (appState: background)"
- [ ] After wake: "5000ms interval (appState: active)" restored

**Wake-up Optimization:**
- [ ] "App became active - fetching metadata immediately" appears
- [ ] Immediate fetch occurs (not waiting for scheduled interval)
- [ ] Fresh metadata displays within 1 second of unlock

**Polling Behavior:**
- [ ] Active state: 3-4 fetches per 15 seconds (5s intervals)
- [ ] Background: 0-1 fetches in 60 seconds (2min interval)
- [ ] Post-wake: 3-4 fetches per 15 seconds (5s intervals)

### Performance Requirements
- [ ] Audio continuous throughout all transitions
- [ ] No glitches during state changes
- [ ] App responsive immediately after wake
- [ ] Metadata display latency <1 second

### Functional Requirements
- [ ] Lock screen controls work throughout
- [ ] App doesn't crash during transitions
- [ ] State changes happen automatically (no user action needed)
- [ ] Metadata updates visible after wake

## Expected Results

### State Transition Behavior
- **Lock action**: State changes in <500ms
- **Polling update**: New interval starts immediately
- **Wake action**: State changes in <500ms
- **Immediate fetch**: Triggered within 100ms of wake
- **Metadata display**: Updates within 1 second

### Interval Verification
| State       | Interval | Fetches/min | Fetches/15s |
|-------------|----------|-------------|-------------|
| Active      | 5s       | 12          | 3-4         |
| Background  | 120s     | 0.5         | 0-1         |
| Post-wake   | 5s       | 12          | 3-4         |

### Wake-up Optimization Impact
- **Without optimization**: Wait up to 120 seconds for next fetch
- **With optimization**: <1 second for fresh metadata
- **User benefit**: Immediate, responsive metadata on wake

## Troubleshooting

### Issue: State Transition Not Detected
**Symptoms**: No "App state transition" logs appear

**Debug Steps**:
```bash
# Check if AppState listener registered
grep "addEventListener" console.log

# Verify React Native AppState module working
grep "AppState" console.log
```

**Possible Causes**:
- AppState listener not set up
- React Native bridge issue
- App killed/restarted

**Solution**: Restart app, ensure clean install

### Issue: Immediate Fetch Not Triggered
**Symptoms**: No "fetching metadata immediately" log on wake

**Debug Steps**:
```bash
# Check if wake handler executing
grep "App became active" console.log

# Verify fetchMetadata function called
grep "Fetching metadata from" console.log
```

**Possible Causes**:
- Wake handler not registered
- State transition too fast
- Fetch already in progress

**Solution**: Verify code at lines 344-356 in useNowPlaying.ts

### Issue: Interval Not Switching
**Symptoms**: Still 5s intervals after locking

**Debug Steps**:
```bash
# Check interval values in logs
grep "Starting polling with.*interval" console.log

# Verify appState value
grep "appState:" console.log
```

**Possible Causes**:
- getPollingInterval() not called
- appState state variable not updating
- startPolling() not called after state change

### Issue: High Latency on Wake
**Symptoms**: >1 second for metadata to appear

**Debug Steps**:
1. Check network speed
2. Verify fetch response time in logs
3. Check UI render performance

**Possible Causes**:
- Slow network connection
- Server response delay
- UI thread blocked
- App state restoration overhead

**Solution**: Test on good Wi-Fi, ensure app fully wakes before test

### Issue: Audio Interruption During Transition
**Symptoms**: Audio glitches when locking/unlocking

**Debug Steps**:
```bash
# Check for TrackPlayer errors
grep "TrackPlayerService\|PlaybackService" console.log

# Look for audio focus issues
grep -i "audio\|focus\|interrupt" console.log
```

**Note**: Audio issues likely unrelated to metadata polling unless errors coincide exactly with fetch events.

## Test Results Template

```
=== iOS State Transition Integration Test Results ===

Test Date: _______________
Tester Name: _______________
Device Model: _______________ (e.g., iPhone 12)
iOS Version: _______________ (e.g., iOS 16.3)
App Version: _______________

=== Timing Log ===
Test Start Time: ___:___:___
Phase 1 Duration: 0-15 seconds
Phase 2 Lock Time: ___:___:___ (T=15s)
Phase 2 Duration: 15-75 seconds
Phase 3 Wake Time: ___:___:___ (T=75s)
Test End Time: ___:___:___

=== Phase 1: Initial Active State (0-15s) ===
[ ] "Starting polling with 5000ms interval (appState: active)": YES / NO
[ ] Number of fetches in 15 seconds: _____ (expected: 3-4)
[ ] Average interval: _____ seconds (expected: ~5s)
[ ] Playback smooth: YES / NO

=== Phase 2: Background State (15-75s) ===
Device locked at: ___:___:___ (T=15s)
[ ] "App state transition: active → background": YES / NO
[ ] "Starting polling with 120000ms interval (appState: background)": YES / NO
[ ] Transition delay: _____ ms (expected: <500ms)
[ ] Fetches during 60s background: _____ (expected: 0-1)
[ ] Audio continuous: YES / NO

=== Phase 3: Wake Transition (T=75s) ===
Device unlocked at: ___:___:___ (T=75s)
[ ] "App state transition: background → active": YES / NO
[ ] "App became active - fetching metadata immediately": YES / NO
[ ] Immediate fetch occurred: YES / NO
[ ] Fresh metadata displayed: YES / NO

**Latency Measurements:**
Unlock → State transition log: _____ ms (expected: <500ms)
State transition → Immediate fetch: _____ ms (expected: <100ms)
Unlock → Metadata visible: _____ ms (expected: <1000ms)

[ ] Metadata visible within 1 second: YES / NO

Post-wake polling:
[ ] "Starting polling with 5000ms interval (appState: active)": YES / NO
[ ] Subsequent fetches at 5s intervals: YES / NO
[ ] Fetches in 15s after wake: _____ (expected: 3-4)

=== Log Sequence Verification ===
[ ] All expected logs present in correct order: YES / NO
[ ] No unexpected errors or warnings: YES / NO
[ ] State transitions automatic (no manual trigger): YES / NO

=== Performance ===
[ ] Audio continuous through all transitions: YES / NO
[ ] No glitches or stuttering: YES / NO
[ ] App responsive immediately after wake: YES / NO
[ ] No crashes or freezes: YES / NO

=== Overall Result ===
[ ] PASS - All criteria met
[ ] FAIL - See notes below

Critical Pass/Fail Criteria:
[ ] State transitions detected correctly: YES / NO
[ ] Intervals switch correctly: YES / NO
[ ] Immediate fetch on wake: YES / NO
[ ] Metadata within 1s of wake: YES / NO

Notes and Observations:
_________________________________
_________________________________
_________________________________

Issues Encountered:
_________________________________
_________________________________
_________________________________

Console Log Excerpt (attach full log file):
_________________________________
_________________________________
_________________________________
```

## Advanced Verification

### Optional Extended Test
Repeat the state transition cycle **3 times** to verify consistency:
```
Cycle 1: Active 15s → Background 60s → Active 15s
Cycle 2: Active 15s → Background 60s → Active 15s
Cycle 3: Active 15s → Background 60s → Active 15s
```

Each cycle should produce identical behavior and logs.

### Performance Profiling (Optional)
If you have Instruments available:
1. Profile with "Time Profiler" during state transitions
2. Verify no CPU spikes during interval switches
3. Check for memory leaks (stable memory usage)
4. Verify timer cleanup (no zombie timers)

## Related Files
- `/Users/cemalkurt/Projects/trendankara/mobile/hooks/useNowPlaying.ts`
  - Lines 117-122: `getPollingInterval()` - Dynamic interval calculation
  - Lines 308-318: `startPolling()` - Restart polling with new interval
  - Lines 344-356: AppState event listener - State transition handling
  - Lines 348-352: Immediate fetch on wake optimization
- `/Users/cemalkurt/Projects/trendankara/mobile/services/audio/TrackPlayerService.ts`
  - Background playback configuration

## Requirements Mapping
- **Requirement 2.3**: Dynamic interval switching based on app state
- **Requirement 2.4**: Immediate metadata fetch on wake (within 1 second)
- **Requirement 4.2**: AppState-aware polling adjustment
- **Goal**: Seamless UX with power efficiency (balance real-time + battery)
