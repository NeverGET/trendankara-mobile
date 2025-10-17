# Android Device Integration Test (Task 14)

## Test ID
Task 14: Android Device Integration Test - Native Metadata Events

## Objective
Verify that on Android devices, the application completely eliminates HTTP metadata polling and relies exclusively on native ExoPlayer ICY/ID3 metadata events, achieving 95% power reduction.

## Prerequisites

### Required Hardware
- Physical Android device (Android 8.0 or higher recommended)
- USB cable for ADB connection
- Computer with ADB installed

### Required Software
- Android Debug Bridge (ADB) installed
- Latest build of Trend Ankara app installed on device
- Full battery or charger connected

### ADB Setup Verification
```bash
# Verify ADB is installed
adb version

# List connected devices
adb devices

# Should show your device:
# List of devices attached
# ABC123XYZ    device
```

## Test Environment Setup

### 1. Prepare Device
1. Ensure device is fully charged (or connected to charger)
2. Close all other apps
3. Enable Developer Options on device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Return to Settings > Developer Options
4. Enable USB Debugging:
   - Settings > Developer Options > USB Debugging (ON)
5. Connect device to computer via USB
6. Authorize ADB connection when prompted on device

### 2. Clear Logs
```bash
# Clear existing logcat to start fresh
adb logcat -c
```

### 3. Start Log Monitoring
Open a terminal window and start monitoring logs:
```bash
# Monitor all Trend Ankara logs
adb logcat | grep -E "(useNowPlaying|PlaybackService|TrackPlayerService)"
```

Keep this terminal window open throughout the test.

## Test Procedure

### Phase 1: Initial Playback (0-2 minutes)

**Step 1.1: Launch App**
1. Launch Trend Ankara app on device
2. Navigate to the radio player screen
3. Tap the play button

**Step 1.2: Verify Initial Logs**
Look for these log entries in your logcat terminal:
```
[useNowPlaying] Android detected - skipping HTTP metadata polling
[useNowPlaying] Native ExoPlayer will handle metadata updates via ICY/ID3 tags
[useNowPlaying] This eliminates 240 requests/20min and reduces CPU usage by 95%
```

**Success Criteria (Phase 1):**
- [ ] "Android detected - skipping HTTP metadata polling" log appears
- [ ] "Native ExoPlayer will handle metadata updates via ICY/ID3 tags" log appears
- [ ] NO "Fetching metadata from:" logs appear
- [ ] Audio playback starts successfully

### Phase 2: Foreground Playback (2-5 minutes)

**Step 2.1: Keep App in Foreground**
- Keep app visible and playing
- Monitor logcat for any HTTP requests

**Step 2.2: Monitor for HTTP Polling**
Search logs for HTTP metadata requests:
```bash
# In a new terminal, check for any HTTP polling
adb logcat | grep "Fetching metadata from"
```

**Success Criteria (Phase 2):**
- [ ] Zero "Fetching metadata from:" logs
- [ ] Audio continues playing smoothly
- [ ] App remains responsive

### Phase 3: Background Playback (5-25 minutes)

**Step 3.1: Lock Screen**
1. Press device power button to lock screen
2. Continue monitoring logcat from your computer
3. Let playback continue for 20 minutes

**Step 3.2: Monitor Native Metadata Events**
Watch for these events in logcat:
```
[PlaybackService] Metadata received from stream (Android): {...}
[PlaybackService] Metadata updated successfully: {title: "...", artist: "..."}
```

**Step 3.3: Verify Zero HTTP Requests**
Throughout the 20-minute period, continuously verify:
```bash
# This should return NO results
adb logcat | grep "Fetching metadata from"
```

**Success Criteria (Phase 3):**
- [ ] Zero "Fetching metadata from:" logs during entire 20 minutes
- [ ] Native "Metadata received from stream (Android)" events appear
- [ ] Native "Metadata updated successfully" events appear
- [ ] Lock screen shows updated song information
- [ ] Audio plays continuously without interruption

### Phase 4: Metadata Update Verification (Throughout Test)

**Step 4.1: Check Lock Screen**
1. Wake device (don't unlock)
2. Observe lock screen media controls
3. Verify metadata is displayed and updates

**Step 4.2: Verify Update Source**
Each metadata update should come from Event.AudioCommonMetadataReceived:
```
[PlaybackService] Metadata received from stream (Android)
```

NOT from HTTP polling (this log should NEVER appear):
```
[useNowPlaying] Fetching metadata from: <url>
```

**Success Criteria (Phase 4):**
- [ ] Lock screen displays current song information
- [ ] Metadata updates appear from native events only
- [ ] No HTTP polling logs appear

## Battery and Performance Monitoring

### Collect Battery Stats (Before Test)
```bash
# Reset battery stats
adb shell dumpsys batterystats --reset

# Start collecting stats
adb shell dumpsys batterystats --enable full-wake-history
```

### Collect Battery Stats (After Test)
```bash
# Dump battery statistics
adb shell dumpsys batterystats > battery-stats-android.txt

# View battery info
adb shell dumpsys battery

# Check CPU usage for the app
adb shell top -n 1 | grep -i "trend"
```

### Network Request Monitoring
```bash
# Monitor network requests (during the 20-minute test)
adb shell tcpdump -i any -s 0 port 80 or port 443 -w /sdcard/network-capture.pcap

# After test, pull the capture
adb pull /sdcard/network-capture.pcap
```

## Success Criteria Summary

### Critical Requirements (Must Pass)
- [ ] "Android detected - skipping HTTP metadata polling" log present at startup
- [ ] Zero "Fetching metadata from:" logs during entire 20-minute test
- [ ] Native "Metadata received from stream" events present
- [ ] Metadata visible on lock screen and updates correctly
- [ ] Audio plays continuously without interruption

### Performance Requirements
- [ ] CPU usage <10% in background (check with `adb shell top`)
- [ ] Zero HTTP requests to metadata endpoint (verify with tcpdump or logcat)
- [ ] Battery drain <12%/hour (calculate from battery stats)

### Functional Requirements
- [ ] App responds to media controls on lock screen
- [ ] Metadata updates within 5 seconds of song change (via native events)
- [ ] No audio glitches or interruptions during metadata updates

## Expected Results

### Power Consumption
- **HTTP Requests**: 0 (eliminated entirely)
- **CPU Wake Events**: ~95% reduction compared to iOS
- **Battery Drain**: <10%/hour in background
- **Network Activity**: Only audio stream, no metadata polling

### Comparison to iOS
- iOS (background): 30 HTTP requests/hour
- Android: 0 HTTP requests/hour
- **Power Savings**: 95% reduction

## Troubleshooting

### Issue: No Native Metadata Events
**Symptoms**: No "Metadata received from stream" logs appear

**Possible Causes**:
1. Stream doesn't include ICY/ID3 metadata
2. ExoPlayer not configured correctly

**Debug Steps**:
```bash
# Check ExoPlayer configuration
adb logcat | grep -i "exoplayer"

# Verify stream format
adb logcat | grep -i "metadata"
```

### Issue: HTTP Polling Still Occurring
**Symptoms**: "Fetching metadata from:" logs appear

**Possible Causes**:
1. Platform detection failed
2. Feature flag disabled
3. Old version of app

**Debug Steps**:
```bash
# Verify Platform.OS detection
adb logcat | grep "Platform:"

# Check app version
adb shell dumpsys package com.trendankara | grep versionName
```

### Issue: High CPU Usage
**Symptoms**: CPU >10% in background

**Debug Steps**:
```bash
# Monitor CPU usage continuously
adb shell top -d 1 | grep -i "trend"

# Check for background processes
adb shell ps | grep -i "trend"
```

## Test Results Template

```
=== Android Integration Test Results ===

Test Date: _______________
Tester Name: _______________
Device Model: _______________
Android Version: _______________
App Version: _______________

=== Phase 1: Initial Playback ===
[ ] Android detection log present: YES / NO
[ ] HTTP polling disabled log present: YES / NO
[ ] Zero "Fetching metadata from" logs: YES / NO
[ ] Playback started successfully: YES / NO

=== Phase 2: Foreground Playback (2-5 min) ===
[ ] Zero HTTP requests: YES / NO
[ ] Audio smooth and responsive: YES / NO

=== Phase 3: Background Playback (20 min) ===
[ ] Zero HTTP requests throughout: YES / NO
[ ] Native metadata events present: YES / NO
[ ] Lock screen shows metadata: YES / NO
[ ] Audio continuous, no glitches: YES / NO

=== Phase 4: Metadata Updates ===
[ ] Updates from native events only: YES / NO
[ ] Lock screen displays updates: YES / NO
[ ] Update latency <5 seconds: YES / NO

=== Performance Metrics ===
CPU Usage (background): _____ %
HTTP Requests (20 min): _____
Battery Drain (%/hour): _____ %
Network Data (metadata): _____ MB

=== Overall Result ===
[ ] PASS - All criteria met
[ ] FAIL - See notes below

Notes:
_________________________________
_________________________________
_________________________________
```

## Related Files
- `/Users/cemalkurt/Projects/trendankara/mobile/hooks/useNowPlaying.ts` (lines 142-146: Android platform detection)
- `/Users/cemalkurt/Projects/trendankara/mobile/services/audio/PlaybackService.ts` (lines 97-124: Native event handler)
- `/Users/cemalkurt/Projects/trendankara/mobile/services/audio/TrackPlayerService.ts` (ExoPlayer configuration)

## Requirements Mapping
- **Requirement 3.2**: Platform-specific optimization (Android disables HTTP polling)
- **Requirement 3.3**: Native event-driven updates (Event.AudioCommonMetadataReceived)
- **Requirement 3.4**: Zero HTTP requests on Android
- **Requirement 6.1**: <10% CPU usage in background
