# iOS Foreground Integration Test (Task 15)

## Test ID
Task 15: iOS Foreground Integration Test - 5-Second Polling

## Objective
Verify that on iOS devices in foreground/active state, the application polls metadata every 5 seconds to provide real-time updates with minimal latency, maintaining responsive UX while achieving acceptable power consumption.

## Prerequisites

### Required Hardware
- Physical iOS device (iPhone 8 or newer, iOS 14+)
- Lightning/USB-C cable for connection
- Mac computer with Xcode installed

### Required Software
- Xcode installed with iOS development tools
- iOS Console app (or Xcode Devices window)
- Latest build of Trend Ankara app installed on device
- Full battery or charger connected

### Development Setup
If running from Xcode:
1. Open project in Xcode
2. Select your physical device as target
3. Build and run in Debug mode for console access

## Test Environment Setup

### 1. Prepare Device
1. Ensure device is fully charged (or connected to charger)
2. Close all other apps (swipe up from home, swipe away all apps)
3. Disable Low Power Mode:
   - Settings > Battery > Low Power Mode (OFF)
4. Enable optimal test conditions:
   - Keep screen brightness at 50%
   - Disable Auto-Lock temporarily: Settings > Display & Brightness > Auto-Lock > Never
   - Connect to stable Wi-Fi network

### 2. Start Console Monitoring

**Option A: Using Xcode Devices Window**
1. Connect device to Mac
2. Open Xcode
3. Go to Window > Devices and Simulators
4. Select your device
5. Click "Open Console" button
6. Filter for "useNowPlaying" or "TrackPlayerService"

**Option B: Using macOS Console App**
1. Connect device to Mac
2. Open Console.app (Applications > Utilities > Console)
3. Select your device from sidebar
4. Filter by process: "Trend" or "TrendAnkara"
5. Search for "useNowPlaying" in filter box

### 3. Prepare Log Capture
Create a text file to capture timestamps:
```bash
# On your Mac, create a log capture script
cat > ~/capture-ios-logs.sh << 'EOF'
#!/bin/bash
echo "=== iOS Foreground Test Log Capture ==="
echo "Started at: $(date)"
echo "Device: $(system_profiler SPUSBDataType | grep iPhone)"
echo ""
echo "Watching for useNowPlaying logs..."
echo "Press Ctrl+C to stop"
echo ""
EOF

chmod +x ~/capture-ios-logs.sh
```

## Test Procedure

### Phase 1: Test Initialization (0-1 minute)

**Step 1.1: Start Monitoring**
1. Open Console app and start filtering logs
2. Clear existing logs
3. Take note of start time

**Step 1.2: Launch App and Start Playback**
1. Launch Trend Ankara app on device
2. Navigate to radio player screen
3. Note the exact time (to the second)
4. Tap play button
5. Keep app in foreground (visible on screen)

**Step 1.3: Verify Initial Logs**
Look for these critical log entries:
```
[useNowPlaying] Starting with URL: <metadata-url>
[useNowPlaying] Starting polling with 5000ms interval (appState: active)
[useNowPlaying] Fetching metadata from: <url>
```

**Success Criteria (Phase 1):**
- [ ] "Starting polling with 5000ms interval (appState: active)" appears
- [ ] First "Fetching metadata from:" appears within 1 second
- [ ] NO "Android detected" logs (confirms iOS platform)
- [ ] Playback starts successfully

### Phase 2: Foreground Polling Verification (1-11 minutes)

**Step 2.1: Monitor Polling Frequency**
1. Keep app in foreground (visible)
2. Keep screen on (don't lock device)
3. Monitor console logs for 10 minutes
4. Record timestamp of each "Fetching metadata from:" log

**Step 2.2: Count HTTP Requests**
Expected behavior:
- 1 request every 5 seconds
- 12 requests per minute
- 120 requests in 10 minutes

Acceptable variance: ±5 requests (115-125 total)

**Step 2.3: Create Request Log**
Record each request with timestamp:
```
Example log capture:
10:00:00 - [useNowPlaying] Fetching metadata from: https://...
10:00:05 - [useNowPlaying] Fetching metadata from: https://...
10:00:10 - [useNowPlaying] Fetching metadata from: https://...
...
```

**Helper: Automated Request Counter**
If running from Xcode, you can count requests:
```bash
# Count occurrences of metadata fetch logs (run after test)
# This assumes you saved console output to a file
grep -c "Fetching metadata from:" ios-console-output.log
```

**Success Criteria (Phase 2):**
- [ ] Requests occur every 5 seconds (±1 second variance acceptable)
- [ ] Total requests in 10 minutes: 120 ± 5
- [ ] No missed intervals (no gaps >6 seconds)
- [ ] Consistent interval maintained throughout

### Phase 3: Metadata Display Verification (Throughout Test)

**Step 3.1: Observe UI Updates**
1. Watch the player UI for metadata changes
2. Note when song information updates on screen
3. Measure latency between log and UI update

**Step 3.2: Verify Log Sequence**
For each metadata update, verify this sequence:
```
[useNowPlaying] Fetching metadata from: <url>
[useNowPlaying] Response status: 200
[useNowPlaying] Received text: {"nowPlaying":"SONG - ARTIST"}
[useNowPlaying] Setting now playing (TrendAnkara format): {song: "...", artist: "...", title: "..."}
[TrackPlayerService] Updating metadata: {title: "...", artist: "..."}
[TrackPlayerService] Metadata updated successfully
```

**Step 3.3: Measure Display Latency**
1. Note timestamp when "Fetching metadata from:" appears
2. Note when UI displays the new song information
3. Calculate latency: UI_update_time - Fetch_start_time

**Success Criteria (Phase 3):**
- [ ] Metadata displays in app UI
- [ ] Display latency <1 second from fetch start
- [ ] All fetch requests complete with status 200
- [ ] UI updates smoothly without lag or freezing

### Phase 4: Performance and UX Verification (Throughout Test)

**Step 4.1: Monitor App Responsiveness**
During the 10-minute test:
1. Scroll in the app (if applicable)
2. Interact with UI elements
3. Verify smooth animations
4. Check for any lag or stuttering

**Step 4.2: Audio Quality Check**
1. Listen for any audio interruptions
2. Verify continuous playback
3. Check for any glitches during metadata updates

**Step 4.3: Battery and CPU Monitoring**
```bash
# View iOS battery info (after test)
# You can use Xcode's Instruments or battery settings

# Or check in Settings during test:
# Settings > Battery > Battery Usage by App
```

**Success Criteria (Phase 4):**
- [ ] App remains responsive throughout
- [ ] No UI lag or stuttering
- [ ] Audio plays continuously, no glitches
- [ ] No memory warnings or crashes
- [ ] No significant battery drain (foreground polling expected)

## Request Count Calculation

### Expected Counts
```
5-second interval = 12 requests/minute
10-minute test = 120 requests

Acceptable range: 115-125 requests
(±4% variance for timing precision)
```

### Manual Count Method
1. Save console output to file
2. Count all "Fetching metadata from:" entries
3. Verify count is 120 ± 5

### Automated Count Method
```bash
# If you captured console to file
cat ios-console-output.log | grep "Fetching metadata from:" | wc -l

# Should output: ~120
```

## Latency Measurement

### How to Measure
1. Pick 5 random fetch events from your log
2. For each, measure time from fetch start to UI update:

Example:
```
10:05:23.450 - Fetch started
10:05:23.890 - UI updated
Latency: 440ms ✓ (under 1 second)
```

3. Calculate average latency
4. Verify all samples <1 second

### Expected Latency
- **Average**: 300-600ms
- **Maximum**: <1000ms (1 second)
- **Typical breakdown**:
  - Network request: 100-300ms
  - Response parsing: 10-50ms
  - State update: 10-100ms
  - UI render: 50-200ms

## Success Criteria Summary

### Critical Requirements (Must Pass)
- [ ] "Starting polling with 5000ms interval (appState: active)" log present
- [ ] Request count 120 ± 5 in 10 minutes (115-125 requests)
- [ ] Interval between requests: 5 seconds ± 1 second
- [ ] Metadata display latency <1 second
- [ ] Audio continuous, no interruptions

### Performance Requirements
- [ ] App responsive throughout test
- [ ] No UI freezing or stuttering
- [ ] No memory warnings or crashes
- [ ] Smooth animations and interactions

### Functional Requirements
- [ ] Metadata displays correctly in UI
- [ ] All HTTP requests succeed (status 200)
- [ ] Metadata parsing works for all formats
- [ ] App state remains "active" throughout

## Expected Results

### Polling Behavior
- **Interval**: 5 seconds (5000ms)
- **Requests/minute**: 12
- **Requests/hour**: 720
- **10-minute total**: ~120 requests

### Performance Metrics
- **Latency**: <1 second (avg 300-600ms)
- **CPU Usage**: 5-15% (foreground acceptable)
- **Memory**: Stable, no leaks
- **Battery**: Moderate usage (foreground expected)

### User Experience
- **Responsiveness**: Excellent
- **Real-time updates**: Yes (5s max staleness)
- **Audio quality**: Perfect, no interruptions
- **UI smoothness**: 60fps maintained

## Troubleshooting

### Issue: Wrong Interval (Not 5 Seconds)
**Symptoms**: Requests not every 5 seconds

**Debug Steps**:
1. Check app state in logs: Should be "active"
2. Verify log says "5000ms interval (appState: active)"
3. Check for state transitions in logs

**Possible Causes**:
- App went to background (check for state change logs)
- Device locked (screen off)
- Low power mode enabled

### Issue: Request Count Too Low
**Symptoms**: <115 requests in 10 minutes

**Debug Steps**:
```bash
# Check for errors in logs
grep -i "error" ios-console-output.log

# Check for network issues
grep -i "network\|timeout\|failed" ios-console-output.log
```

**Possible Causes**:
- Network connectivity issues
- App paused/suspended
- Timer interrupted

### Issue: High Latency (>1 second)
**Symptoms**: Metadata takes >1s to appear

**Debug Steps**:
1. Check network speed (Wi-Fi signal)
2. Look for "Response status" in logs
3. Check for UI thread blocking

**Possible Causes**:
- Slow network connection
- Server response delay
- Main thread blocked

### Issue: Audio Interruptions
**Symptoms**: Audio cuts out or glitches

**Debug Steps**:
1. Check for error logs
2. Verify TrackPlayer state
3. Look for memory warnings

**Note**: This shouldn't happen in foreground with 5s interval

## Test Results Template

```
=== iOS Foreground Integration Test Results ===

Test Date: _______________
Tester Name: _______________
Device Model: _______________ (e.g., iPhone 12 Pro)
iOS Version: _______________ (e.g., iOS 16.2)
App Version: _______________
Test Duration: 10 minutes

=== Phase 1: Initialization ===
Start Time: ___:___:___
[ ] "Starting polling with 5000ms interval (appState: active)": YES / NO
[ ] First fetch within 1 second: YES / NO
[ ] Platform confirmed iOS (no Android logs): YES / NO

=== Phase 2: Polling Frequency ===
End Time: ___:___:___
Total Requests: _____ (expected: 120 ± 5)
Average Interval: _____ seconds (expected: 5 ± 1)
[ ] Request count in range (115-125): YES / NO
[ ] Consistent 5-second intervals: YES / NO
[ ] No missed intervals >6 seconds: YES / NO

Sample Request Timestamps (first 5):
1. ___:___:___
2. ___:___:___
3. ___:___:___
4. ___:___:___
5. ___:___:___

=== Phase 3: Metadata Display ===
Latency Samples (5 measurements):
1. _____ ms
2. _____ ms
3. _____ ms
4. _____ ms
5. _____ ms
Average: _____ ms (expected: <1000ms)

[ ] All latencies <1 second: YES / NO
[ ] Metadata displays correctly: YES / NO
[ ] All requests status 200: YES / NO

=== Phase 4: Performance ===
[ ] App responsive throughout: YES / NO
[ ] No UI lag or stuttering: YES / NO
[ ] Audio continuous, no glitches: YES / NO
[ ] No memory warnings: YES / NO
[ ] Smooth interactions: YES / NO

=== Overall Result ===
[ ] PASS - All criteria met
[ ] FAIL - See notes below

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
- `/Users/cemalkurt/Projects/trendankara/mobile/hooks/useNowPlaying.ts` (lines 117-122: Polling interval calculation)
- `/Users/cemalkurt/Projects/trendankara/mobile/hooks/useNowPlaying.ts` (lines 164-288: Metadata fetch implementation)
- `/Users/cemalkurt/Projects/trendankara/mobile/services/audio/TrackPlayerService.ts` (lines 298-356: Metadata update)

## Requirements Mapping
- **Requirement 2.1**: iOS foreground polling at 5-second intervals
- **Requirement 6.3**: Metadata display latency <1 second
- **Goal**: Real-time metadata updates for optimal foreground UX
