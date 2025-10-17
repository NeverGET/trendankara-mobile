# iOS Background Integration Test (Task 16)

## Test ID
Task 16: iOS Background Integration Test - 2-Minute Polling

## Objective
Verify that on iOS devices in background state (screen locked), the application reduces metadata polling to 2-minute intervals, achieving 95% power reduction compared to foreground polling while maintaining acceptable metadata freshness.

## Prerequisites

### Required Hardware
- Physical iOS device (iPhone 8 or newer, iOS 14+)
- Lightning/USB-C cable for Mac connection
- Mac computer with Xcode installed
- Full battery charge (or external battery pack)

### Required Software
- Xcode installed with iOS development tools
- iOS Console app (or Xcode Devices window)
- Latest build of Trend Ankara app installed
- Fully charged device OR connected to charger

### Test Environment Requirements
1. Stable Wi-Fi connection
2. Quiet environment to verify audio playback
3. 20+ minutes of uninterrupted time
4. Battery monitoring capability

## Test Environment Setup

### 1. Prepare Device for Background Testing

**Initial Setup:**
1. Fully charge device to 100% (or note starting battery level)
2. Close all background apps:
   - Double press home button (or swipe up)
   - Swipe away all apps
3. Disable Low Power Mode:
   - Settings > Battery > Low Power Mode (OFF)
4. Note initial battery level:
   - Settings > Battery (take screenshot for reference)
5. Verify good Wi-Fi signal strength

**Display Settings:**
- Set Auto-Lock to 30 seconds: Settings > Display & Brightness > Auto-Lock
- Set screen brightness to 50%

### 2. Start Console Monitoring on Mac

**Connect Device for Remote Logging:**
1. Connect iPhone to Mac via cable
2. Open Xcode
3. Window > Devices and Simulators
4. Select your device
5. Click "Open Console"
6. Set filter to "useNowPlaying" or "TrackPlayer"

**Important**: The console will continue capturing logs even when device is locked. Keep your Mac awake and Console app open.

### 3. Prepare Log Capture Script

```bash
# Create a timestamped log capture
cat > ~/capture-ios-background-test.sh << 'EOF'
#!/bin/bash
LOGFILE=~/ios-background-test-$(date +%Y%m%d-%H%M%S).log
echo "=== iOS Background Test ===" | tee $LOGFILE
echo "Started at: $(date)" | tee -a $LOGFILE
echo "" | tee -a $LOGFILE
echo "Capturing logs to: $LOGFILE"
echo "Press Ctrl+C when test completes"
echo ""
# Note: Actual log capture happens in Xcode Console
# This script is for metadata tracking
EOF

chmod +x ~/capture-ios-background-test.sh
```

## Test Procedure

### Phase 1: Transition to Background (0-1 minute)

**Step 1.1: Start App in Foreground**
1. Clear Console logs in Xcode
2. Note exact start time: ___:___:___
3. Launch Trend Ankara app
4. Navigate to radio player
5. Tap Play button
6. Verify audio playback starts

**Step 1.2: Verify Foreground Polling Starts**
Watch for these logs:
```
[useNowPlaying] Starting with URL: <metadata-url>
[useNowPlaying] Starting polling with 5000ms interval (appState: active)
[useNowPlaying] Fetching metadata from: <url>
```

**Step 1.3: Immediately Lock Device**
Within 15 seconds of starting playback:
1. Press device power button to lock screen
2. Note lock time: ___:___:___
3. Keep device locked for remainder of test
4. Continue monitoring Console on Mac

**Step 1.4: Verify Background Transition**
Within 5 seconds of locking, watch for these critical logs:
```
[useNowPlaying] App state transition: active → background
[useNowPlaying] Starting polling with 120000ms interval (appState: background)
```

**Success Criteria (Phase 1):**
- [ ] "Starting polling with 5000ms interval (appState: active)" appears initially
- [ ] Device locked within 15 seconds of playback start
- [ ] "App state transition: active → background" log appears
- [ ] "Starting polling with 120000ms interval (appState: background)" appears
- [ ] Audio continues playing after lock

### Phase 2: Background Polling Monitoring (1-21 minutes)

**Step 2.1: Monitor for 20 Minutes**
1. Keep device locked
2. Keep Console app open on Mac
3. Verify audio playing (listen to device speaker)
4. Monitor for metadata fetch logs

**Step 2.2: Record All Fetch Events**
Create a table of all "Fetching metadata from:" logs:

```
Fetch #  | Timestamp  | Interval Since Last | Notes
---------|------------|---------------------|-------
1        | 10:00:00   | N/A (first)         |
2        | 10:02:00   | 2:00                |
3        | 10:04:00   | 2:00                |
4        | 10:06:00   | 2:00                |
...
```

**Step 2.3: Calculate Expected vs Actual**

**Expected requests in 20 minutes:**
- Interval: 2 minutes (120 seconds)
- Requests per hour: 30
- 20 minutes = 20/60 hours = 0.333 hours
- Expected: 30 * 0.333 = **10 requests**
- Acceptable range: **8-12 requests** (±20% variance)

**Compare to foreground:**
- Foreground (5s interval): 240 requests in 20 minutes
- Background (2min interval): 10 requests in 20 minutes
- **Reduction: 95.8%** (230 fewer requests)

**Step 2.4: Verify Interval Consistency**
For each request after the first:
1. Calculate time since previous request
2. Verify interval is ~120 seconds (2 minutes)
3. Acceptable variance: ±10 seconds (110-130 seconds)

**Success Criteria (Phase 2):**
- [ ] Total requests in 20 minutes: 8-12 (expected: 10 ± 2)
- [ ] Interval between requests: ~120 seconds ± 10 seconds
- [ ] "appState: background" maintained throughout
- [ ] Audio plays continuously for full 20 minutes
- [ ] Device remains locked throughout

### Phase 3: Metadata Verification (Throughout Test)

**Step 3.1: Check Lock Screen Periodically**
Every 5 minutes, briefly wake device (don't unlock):
1. Press power button or raise device
2. Observe lock screen media controls
3. Note displayed song information
4. Let screen auto-lock again

**Step 3.2: Verify Metadata Display**
- [ ] Lock screen shows Trend Ankara player
- [ ] Song title visible
- [ ] Artist name visible
- [ ] Album art visible
- [ ] Controls functional (play/pause)

**Step 3.3: Accept Metadata Staleness**
Background metadata may be up to 2 minutes stale. This is expected and acceptable:
- Last fetch: 10:10:00
- Current time: 10:11:30
- Metadata shows song from 10:10:00 (1.5 minutes old)
- **This is acceptable** for background playback

**Success Criteria (Phase 3):**
- [ ] Lock screen displays metadata
- [ ] Metadata updates eventually (within 2 minute window)
- [ ] Controls remain functional
- [ ] No "frozen" or corrupted display

### Phase 4: Power and Performance Monitoring (Throughout Test)

**Step 4.1: Monitor Battery During Test**

**Before Test:**
1. Note battery level: _____% at ___:___:___
2. Take screenshot of Settings > Battery

**After Test (20 minutes later):**
1. Wake device, unlock it
2. Go to Settings > Battery
3. Note battery level: _____% at ___:___:___
4. Take screenshot of battery usage
5. Calculate drain: (Start% - End%) = ____%

**Expected Battery Drain:**
- Background playback (optimized): 3-4%/20min ≈ 9-12%/hour
- If >8% in 20 minutes (>24%/hour): FAIL - too much drain

**Step 4.2: Check CPU Usage**

While connected to Xcode (before locking):
1. Open Instruments (Xcode > Open Developer Tool > Instruments)
2. Select "Time Profiler" template
3. Choose your device and app
4. Record for 1 minute of background playback
5. Check CPU usage: should be <10%

Or after test, check battery usage:
- Settings > Battery > Battery Usage by App
- Find Trend Ankara
- Verify it's not in "high usage" apps

**Step 4.3: Verify Audio Quality**
Throughout the 20 minutes:
- [ ] Audio stream remains stable
- [ ] No stuttering or buffering
- [ ] No audio cutouts
- [ ] Volume level consistent

**Success Criteria (Phase 4):**
- [ ] Battery drain <8% in 20 minutes (<24%/hour)
- [ ] CPU usage <10% (if measurable)
- [ ] Audio quality excellent throughout
- [ ] No app crashes or freezes
- [ ] Device temperature normal (not hot)

## Calculation Sheet

### Request Count Calculation
```
Test duration: 20 minutes = 1200 seconds
Polling interval: 120 seconds (2 minutes)
Expected requests: 1200 / 120 = 10 requests
Acceptable range: 8-12 requests (±20%)

Actual request count: _____ requests

Status: PASS / FAIL
```

### Power Reduction Calculation
```
Foreground polling (5s interval):
- 240 requests in 20 minutes
- ~35%/hour battery drain (estimated)

Background polling (2min interval):
- 10 requests in 20 minutes
- <12%/hour battery drain (target)

Actual reduction:
- Requests: (240 - 10) / 240 = 95.8% reduction ✓
- Battery: (35 - actual) / 35 = ___% reduction

Target: ≥85% power reduction
Status: PASS / FAIL
```

### Battery Drain Calculation
```
Start battery: _____% at ___:___:___
End battery:   _____% at ___:___:___
Duration:      20 minutes

Drain: _____ - _____ = ____%
Hourly rate: (drain / 20) * 60 = ____%/hour

Expected: <12%/hour (optimized background)
Status: PASS / FAIL (if >24%/hour, FAIL)
```

## Success Criteria Summary

### Critical Requirements (Must Pass)
- [ ] "App state transition: active → background" log appears
- [ ] "Starting polling with 120000ms interval (appState: background)" appears
- [ ] Request count 8-12 in 20 minutes (95% reduction from foreground)
- [ ] Interval between requests: ~120 seconds ± 10 seconds
- [ ] Audio plays continuously for full 20 minutes
- [ ] Battery drain <8% in 20 minutes (<24%/hour)

### Performance Requirements
- [ ] CPU usage <10% in background
- [ ] Audio quality excellent, no glitches
- [ ] App doesn't crash or freeze
- [ ] Device temperature remains normal

### Power Optimization Verification
- [ ] 95% reduction in HTTP requests vs foreground (240 → 10)
- [ ] 85-95% reduction in battery drain vs current implementation
- [ ] Zero increase in CPU usage compared to no-polling scenario

### Functional Requirements
- [ ] Lock screen displays metadata
- [ ] Media controls work from lock screen
- [ ] App state remains "background" throughout
- [ ] Metadata eventually updates (within 2-minute window)

## Expected Results

### Polling Behavior
- **Interval**: 2 minutes (120 seconds)
- **Requests/minute**: 0.5
- **Requests/hour**: 30
- **20-minute total**: ~10 requests
- **Reduction**: 95.8% vs foreground (240 → 10)

### Power Consumption
- **Battery Drain**: <12%/hour (optimized)
- **Comparison**: ~35%/hour → ~10%/hour (71% improvement)
- **CPU Usage**: <10% in background
- **Network Wake Events**: 30/hour vs 720/hour (95.8% reduction)

### Trade-offs Accepted
- **Metadata Staleness**: Up to 2 minutes (acceptable for background)
- **Lock Screen Updates**: Delayed but present
- **User Impact**: Minimal (users rarely check background metadata)

## Troubleshooting

### Issue: Foreground Interval Persists
**Symptoms**: Still seeing 5-second intervals after locking

**Debug Steps**:
```
# Check for state transition logs
grep "App state transition" console.log

# Verify background state detected
grep "appState: background" console.log
```

**Possible Causes**:
1. App state listener not registered
2. Device didn't fully enter background
3. Auto-lock disabled

**Solution**: Verify Auto-Lock enabled and device actually locked

### Issue: Too Many Requests
**Symptoms**: >12 requests in 20 minutes

**Debug Steps**:
1. Check for state transitions (active ↔ background)
2. Verify no app wake events
3. Check for notification or call interruptions

**Possible Causes**:
- App briefly waking to foreground
- Multiple state transitions
- Timer not properly updated

### Issue: Too Few Requests
**Symptoms**: <8 requests in 20 minutes

**Debug Steps**:
```
# Check for errors
grep -i "error\|failed\|timeout" console.log

# Check for timer cancellations
grep "clearing interval" console.log
```

**Possible Causes**:
- Network issues
- Timer suspended by iOS
- App crashed/restarted

### Issue: High Battery Drain
**Symptoms**: >8% drain in 20 minutes (>24%/hour)

**Debug Steps**:
1. Check battery usage by app in Settings
2. Verify only 10 requests occurred
3. Check for other background activity
4. Verify audio stream quality (bitrate)

**Possible Causes**:
- Other apps consuming battery
- High audio bitrate
- Poor network signal (reconnects)
- Bug in polling implementation

**Solution**: Test in isolation with only this app running

### Issue: Audio Interruptions
**Symptoms**: Audio stops or glitches during background

**Debug Steps**:
```
# Check for audio-related errors
grep -i "audio\|playback\|buffer" console.log

# Check TrackPlayer state
grep "TrackPlayerService" console.log
```

**Note**: Audio issues are likely unrelated to metadata polling optimization unless errors coincide with fetch events.

## Test Results Template

```
=== iOS Background Integration Test Results ===

Test Date: _______________
Tester Name: _______________
Device Model: _______________ (e.g., iPhone 13)
iOS Version: _______________ (e.g., iOS 16.4)
App Version: _______________
Test Duration: 20 minutes

=== Phase 1: Background Transition ===
Playback Start Time: ___:___:___
Device Lock Time: ___:___:___
[ ] "App state transition: active → background": YES / NO
[ ] "Starting polling with 120000ms interval (appState: background)": YES / NO
[ ] Audio continues after lock: YES / NO
[ ] Transition occurred within 5s of lock: YES / NO

=== Phase 2: Polling Frequency ===
Test End Time: ___:___:___
Total Requests: _____ (expected: 10 ± 2)
Average Interval: _____ seconds (expected: 120 ± 10)
[ ] Request count in range (8-12): YES / NO
[ ] Consistent 2-minute intervals: YES / NO
[ ] Audio continuous for 20 minutes: YES / NO

Request Log (all fetch events):
Fetch #  | Timestamp  | Interval Since Last
---------|------------|---------------------
1        |            |
2        |            |
3        |            |
4        |            |
5        |            |
6        |            |
7        |            |
8        |            |
9        |            |
10       |            |

=== Phase 3: Metadata Display ===
Lock Screen Checks (every 5 min):
5 min:  [ ] Metadata visible: YES / NO
10 min: [ ] Metadata visible: YES / NO
15 min: [ ] Metadata visible: YES / NO
20 min: [ ] Metadata visible: YES / NO
[ ] Controls functional: YES / NO

=== Phase 4: Power and Performance ===
Start Battery: _____% at ___:___:___
End Battery:   _____% at ___:___:___
Battery Drain: _____ % in 20 minutes
Hourly Rate:   _____ %/hour (expected: <12%/hour)

[ ] Battery drain <8% in 20 min: YES / NO
[ ] Hourly drain <24%: YES / NO
[ ] CPU usage <10%: YES / NO (if measurable)
[ ] Audio quality excellent: YES / NO
[ ] Device temperature normal: YES / NO
[ ] No app crashes: YES / NO

=== Power Optimization Metrics ===
Request Reduction: 240 → _____ (expected: 10)
Reduction %: _____ % (expected: 95.8%)
Battery Comparison:
- Foreground estimate: ~35%/hour
- Background actual: _____% /hour
- Improvement: _____ % (expected: >70%)

=== Overall Result ===
[ ] PASS - All criteria met
[ ] FAIL - See notes below

Pass/Fail Reasoning:
_________________________________
_________________________________

Notes and Observations:
_________________________________
_________________________________
_________________________________

Issues Encountered:
_________________________________
_________________________________
_________________________________
```

## Related Files
- `/Users/cemalkurt/Projects/trendankara/mobile/hooks/useNowPlaying.ts` (lines 96-122: Polling interval logic)
- `/Users/cemalkurt/Projects/trendankara/mobile/hooks/useNowPlaying.ts` (lines 326-356: AppState listener)
- `/Users/cemalkurt/Projects/trendankara/mobile/services/audio/TrackPlayerService.ts` (Background playback config)

## Requirements Mapping
- **Requirement 2.2**: iOS background polling at 2-minute intervals
- **Requirement 6.2**: CPU usage <10% in background
- **Requirement 6.4**: Battery drain <12%/hour in background
- **Goal**: 85-95% power reduction in background state
