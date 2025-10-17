# Power Consumption Investigation - Android Phase

## Overview

This bug investigation focuses on identifying the root cause of excessive power consumption and heat generation during background audio playback on Android devices.

## Status

✅ **Analysis Complete** - Ready for Profiling Data Collection

**Key Finding**: Continuous metadata polling (every 5 seconds) is causing excessive CPU and network activity, preventing the device from entering low-power states during background playback.

## Quick Summary

### The Problem
- App becomes warm during extended background playback
- Device gets hot when switching to other apps while music plays
- Power consumption is significantly higher than YouTube Music or Spotify

### Root Cause Identified
**Primary Issue**: `hooks/useNowPlaying.ts` line 140
```typescript
intervalRef.current = setInterval(fetchMetadata, 5000);
```

This creates 720 network requests per hour, continuous CPU activity, and frequent React re-renders - even when the app is in the background.

**Platform-Specific Discovery**: On Android, this polling is **completely unnecessary** because `react-native-track-player` already provides native, event-driven metadata updates through `Event.AudioCommonMetadataReceived`.

### Estimated Impact
- **60-80% reduction** in background power consumption when fixed
- **15-30% additional battery drain per hour** currently
- **720 network requests/hour** that could be eliminated

## Investigation Documents

### 1. Bug Report (`report.md`)
Contains the initial bug description, reproduction steps, and investigation plan.

### 2. Analysis Document (`analysis.md`)
**Complete technical analysis** including:
- Root cause identification with specific file/line references
- Data flow diagrams (current inefficient vs. efficient native flow)
- Impact assessment (battery, CPU, network)
- Solution strategies (platform-specific approach)
- Risk analysis and trade-offs

### 3. Profiling Script (`profiling-android.sh`)
Automated script to collect profiling data from Android device.

## How to Use This Investigation

### For Immediate Action

Run the profiling script to collect baseline data:

```bash
# Make sure Android device is connected
adb devices

# Run the profiling script
./claude/bugs/power-consumption-investigation/profiling-android.sh
```

The script will:
1. Reset battery stats for clean data
2. Guide you through a test session
3. Collect battery stats, CPU usage, network activity
4. Save results to `profiling-results/` directory

### For Understanding the Issue

1. **Read `analysis.md`** for the complete technical breakdown
2. **Review the code locations** listed in the analysis
3. **Understand the data flow** diagrams showing current vs. efficient implementation

### For Android Studio Profiling

After running the script, use Android Studio for detailed analysis:

1. Open Android Studio
2. Go to **View > Tool Windows > Profiler**
3. Click **+** and select your connected device
4. Select the **Trend Ankara** app process
5. Profile **CPU**, **Memory**, and **Energy**
6. Look for:
   - Regular 5-second CPU spikes
   - Network activity pattern
   - Wake lock duration
   - Compare with YouTube Music or Spotify

## Key Files Analyzed

### Critical Issues
- `hooks/useNowPlaying.ts` (lines 24-157) - Aggressive polling mechanism
- `components/radio/RadioPlayerControls.tsx` (lines 48, 51-69) - Consumes polling updates

### Efficient Alternatives (Already Implemented!)
- `services/audio/PlaybackService.ts` (lines 97-124) - Native Android metadata events

### Secondary Issues
- `services/audio/TrackPlayerService.ts` (lines 227-249) - Short-term state polling

## Solution Approach

### Phase 1: Android (Current Platform)

**Immediate Fix**:
1. Detect Android platform in `useNowPlaying.ts`
2. Skip `setInterval` on Android
3. Rely solely on native `Event.AudioCommonMetadataReceived`

**Expected Result**:
- No network requests for metadata
- Event-driven updates only when song changes
- CPU can enter deep sleep during playback
- Massive battery improvement

### Phase 2: iOS (Future)

**Optimization**:
1. Implement `AppState` detection
2. Stop polling when app goes to background
3. Resume when app returns to foreground
4. Or increase interval to 15-30 seconds minimum

## Profiling Results Directory

After running `profiling-android.sh`, results will be saved in:

```
profiling-results/
├── battery-stats-YYYYMMDD-HHMMSS.txt
├── battery-history-YYYYMMDD-HHMMSS.txt
├── wake-locks-YYYYMMDD-HHMMSS.txt
├── cpu-usage-YYYYMMDD-HHMMSS.txt
└── network-stats-YYYYMMDD-HHMMSS.txt
```

### What to Look For

**Battery Stats**: Search for:
- `Uid 10XXX` (your app's UID)
- Wake locks duration
- CPU time used
- Network bytes transferred

**Expected Findings**:
- Regular wake patterns every 5 seconds
- High "Awake time" compared to screen time
- Network requests matching polling interval

**Network Stats**:
- Should show small but frequent data transfers
- Pattern should align with 5-second intervals

## Next Steps

### 1. Data Collection Phase
- [ ] Run profiling script on Android device
- [ ] Let app play for at least 30 minutes in background
- [ ] Collect baseline measurements
- [ ] Compare with YouTube Music using same script

### 2. Verification Phase
- [ ] Review collected data
- [ ] Confirm 5-second polling pattern in profiler
- [ ] Document CPU usage metrics
- [ ] Take screenshots from Android Studio Profiler

### 3. Reporting Phase
- [ ] Update `report.md` with profiling data
- [ ] Add screenshots to investigation
- [ ] Create comparison table (TrendAnkara vs YouTube Music)
- [ ] Mark investigation complete

### 4. Future Fix Phase (Not in Scope)
This investigation **does not include implementing the fix**. That will be a separate task based on these findings.

## Commands Reference

### ADB Commands for Manual Profiling

```bash
# Check connected devices
adb devices

# Reset battery stats
adb shell dumpsys batterystats --reset

# Collect battery stats for specific app
adb shell dumpsys batterystats com.trendankara.mobile

# Check wake locks
adb shell dumpsys power | grep "Wake Locks"

# Monitor CPU usage in real-time
adb shell top | grep trendankara

# Get network stats
adb shell dumpsys netstats | grep trendankara

# Generate full bug report (includes battery historian data)
adb bugreport > bugreport-$(date +%Y%m%d-%H%M%S).zip
```

### Android Studio Profiler

1. **Energy Profiler**:
   - Shows real-time energy consumption
   - Categorizes usage (CPU, Network, Location)
   - Displays wake locks visually

2. **CPU Profiler**:
   - Trace method calls
   - Identify hot paths
   - See React Native bridge overhead

3. **Network Profiler**:
   - Timeline of network requests
   - Request frequency visualization
   - Data transfer amounts

## Investigation Timeline

- **2025-10-17**: Investigation started
- **2025-10-17**: Code analysis completed
- **2025-10-17**: Root cause identified
- **2025-10-17**: Profiling setup created
- **Pending**: Profiling data collection
- **Pending**: iOS investigation (when device available)

## Contacts & Resources

### Documentation
- React Native Track Player: https://react-native-track-player.js.org/
- Android Battery Optimization: https://developer.android.com/topic/performance/power
- React Native Performance: https://reactnative.dev/docs/performance

### Investigation Artifacts
- Bug Report: `.claude/bugs/power-consumption-investigation/report.md`
- Analysis: `.claude/bugs/power-consumption-investigation/analysis.md`
- Profiling Script: `.claude/bugs/power-consumption-investigation/profiling-android.sh`
- This README: `.claude/bugs/power-consumption-investigation/README.md`

---

**Investigation Lead**: Claude Code
**Platform**: Android (Phase 1)
**Severity**: High
**Status**: Analysis Complete - Ready for Profiling
