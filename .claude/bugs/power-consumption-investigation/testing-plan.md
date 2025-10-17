# Real Device Testing Plan - Power Consumption Investigation

## Objective

Validate the analysis findings by collecting **real profiling data** from the Android device to:
1. Confirm the 5-second metadata polling is the root cause
2. Measure actual power consumption impact
3. Identify any additional issues not found in code analysis
4. Optionally test the impact of increasing polling interval (30s or 60s)

## Device Information

- **Device**: Connected via ADB (28051FDH3005RT)
- **Package**: com.trendankara.mobile
- **Version**: (To be determined)

## Testing Phases

### Phase 1: Baseline Measurement (Current Code - 5s Polling)

**Goal**: Collect power consumption data with current implementation

**Steps**:
1. Reset battery stats: `adb shell dumpsys batterystats --reset`
2. Start the app and begin audio playback
3. Lock the device screen
4. Let music play for **10 minutes** in background
5. Collect profiling data
6. Analyze results

**Expected Findings**:
- Regular network activity every 5 seconds
- CPU wake events matching polling interval
- Elevated power consumption compared to baseline

### Phase 2: Network Activity Monitoring

**Goal**: Confirm the polling pattern in real-time

**Steps**:
1. Monitor network activity during playback
2. Count requests to metadata endpoint
3. Verify 5-second interval pattern
4. Calculate actual network overhead

**Tools**:
- `adb shell dumpsys netstats`
- Chrome DevTools (if applicable)
- Network profiler

### Phase 3: CPU & Wake Lock Analysis

**Goal**: Identify CPU wake patterns and wake locks

**Steps**:
1. Use Android Studio Profiler to visualize CPU usage
2. Check wake locks: `adb shell dumpsys power | grep "Wake Locks"`
3. Identify correlation between polling and CPU spikes
4. Document wake lock duration

### Phase 4 (Optional): Modified Polling Test

**Goal**: Test impact of increased polling interval

**Options**:
- **Option A**: Change to 30 seconds
- **Option B**: Change to 60 seconds
- **Option C**: Disable polling entirely (Android native events only)

**Process**:
1. Modify `hooks/useNowPlaying.ts` line 140
2. Build and install debug version
3. Repeat Phase 1 measurements
4. Compare results

## Data Collection Checklist

### Battery Stats
- [ ] Battery drain percentage over 10 minutes
- [ ] Wake lock statistics
- [ ] CPU time used by app
- [ ] Network bytes transferred

### Network Activity
- [ ] Number of requests during test period
- [ ] Request interval pattern
- [ ] Data transferred per request
- [ ] Total network overhead

### CPU Usage
- [ ] Average CPU usage during playback
- [ ] CPU spike frequency
- [ ] CPU spike correlation with polling
- [ ] Comparison with YouTube Music

### Device Temperature
- [ ] Initial temperature (before test)
- [ ] Temperature after 10 minutes
- [ ] Heat distribution (where is it warmest)

## Test Scenarios

### Scenario 1: Background Playback Only
- Start music, lock screen
- No user interaction for 10 minutes
- Pure background playback measurement

### Scenario 2: App Switching
- Start music, lock screen
- After 5 minutes, unlock and switch to another app
- Observe temperature spike (as reported in bug)

### Scenario 3: Extended Session
- Start music, lock screen
- Let play for 30-60 minutes
- Measure cumulative impact

## Comparison Benchmarks

### YouTube Music (Control)
- [ ] Run same test with YouTube Music
- [ ] Collect comparable metrics
- [ ] Document differences

### Spotify (Optional)
- [ ] Run same test with Spotify
- [ ] Compare with TrendAnkara results

## Success Criteria

### Hypothesis Validation
The analysis will be **confirmed** if:
- ✅ Network requests occur every ~5 seconds (±1s)
- ✅ CPU wake events correlate with polling interval
- ✅ Battery drain is 15-30% higher than expected
- ✅ Temperature increases during extended playback

The analysis will be **partially confirmed** if:
- ⚠️ Polling is present but other issues also contribute
- ⚠️ Power consumption is high but not solely due to polling

The analysis will be **invalidated** if:
- ❌ No correlation between polling and power consumption
- ❌ Other issues are the primary cause

## Data Collection Commands

### Before Testing
```bash
# Reset battery stats
adb shell dumpsys batterystats --reset

# Verify app is running
adb shell ps | grep trendankara
```

### During Testing
```bash
# Monitor in real-time (run in separate terminal)
watch -n 5 'adb shell dumpsys netstats | grep trendankara'

# Check current battery level
adb shell dumpsys battery
```

### After Testing
```bash
# Collect comprehensive battery stats
adb shell dumpsys batterystats com.trendankara.mobile > profiling-results/battery-stats-baseline.txt

# Collect network stats
adb shell dumpsys netstats | grep trendankara > profiling-results/network-stats-baseline.txt

# Check wake locks
adb shell dumpsys power | grep -A 20 "Wake Locks" > profiling-results/wake-locks-baseline.txt

# Get CPU usage
adb shell top -n 1 | grep trendankara > profiling-results/cpu-usage-baseline.txt

# Battery history
adb shell dumpsys batterystats --checkin > profiling-results/battery-history-baseline.txt
```

## Expected Timeline

- **Phase 1 (Baseline)**: 15 minutes (10 min test + 5 min data collection)
- **Phase 2 (Network)**: 10 minutes
- **Phase 3 (CPU/Wake)**: 10 minutes
- **Phase 4 (Optional)**: 30 minutes (if testing modified polling)

**Total**: 45-75 minutes

## Output Files

All results will be saved to:
```
.claude/bugs/power-consumption-investigation/profiling-results/
├── battery-stats-baseline.txt
├── network-stats-baseline.txt
├── wake-locks-baseline.txt
├── cpu-usage-baseline.txt
├── battery-history-baseline.txt
├── test-log.md (manual observations)
└── screenshots/ (Android Studio Profiler captures)
```

## Next Steps After Data Collection

1. **Analyze Results**: Compare actual data with predictions
2. **Update Analysis**: Confirm or adjust findings in analysis.md
3. **Document Verification**: Write detailed report in verification.md
4. **Decision Point**: Determine if fix should proceed based on findings
5. **Optional Test**: If needed, test with modified polling interval

---

**Status**: Ready to Begin Testing
**Device**: Connected and Ready
**App**: Installed
**Duration**: ~45-75 minutes total
