# Test Session Guide - Baseline Power Consumption

## Pre-Test Setup ✅

- [x] Device connected: 28051FDH3005RT
- [x] App installed: com.trendankara.mobile v1.0.0
- [x] Battery stats reset
- [x] Initial battery level: 32%
- [x] Device charging: Yes (AC powered)
- [x] Initial temperature: 32.6°C

## Test Session Steps

### Step 1: Prepare the Device
```bash
# Battery stats are already reset
# Current battery: 32%
# Device is AC powered (you may want to disconnect for accurate battery measurement)
```

**Decision**: Should we disconnect AC power for accurate battery drain measurement?
- **With AC**: Won't see battery % drop, but can still measure CPU/network activity
- **Without AC**: Will see actual battery drain, more realistic test

### Step 2: Start Real-Time Monitoring (Optional)

Open a **second terminal** and run:
```bash
chmod +x .claude/bugs/power-consumption-investigation/monitor-realtime.sh
./claude/bugs/power-consumption-investigation/monitor-realtime.sh
```

This will log network and CPU activity every 5 seconds.

### Step 3: Start the Test

1. **Launch the TrendAnkara app** on the device
2. **Start playing music**
3. **Lock the device screen**
4. **Start timer**: Let it run for **10 minutes**

**Test start time**: ___________ (note the time)

### Step 4: During the Test (Manual Observations)

Every 2-3 minutes, note the following:

**Minute 2**:
- Device temperature: ___________
- Any noticeable heat: ___________

**Minute 5**:
- Device temperature: ___________
- Unlock and switch to another app briefly
- Does it feel sluggish? ___________
- Return to locked playback

**Minute 8**:
- Device temperature: ___________
- Still playing smoothly? ___________

**Minute 10**:
- Test complete!
- Final temperature: ___________

### Step 5: Collect Data

After 10 minutes, run these commands:

```bash
# Create timestamp for this test session
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Collect battery stats
adb shell dumpsys batterystats com.trendankara.mobile > .claude/bugs/power-consumption-investigation/profiling-results/battery-stats-baseline-$TIMESTAMP.txt

# Collect network stats
adb shell dumpsys netstats | grep trendankara > .claude/bugs/power-consumption-investigation/profiling-results/network-stats-baseline-$TIMESTAMP.txt

# Collect wake locks
adb shell dumpsys power | grep -A 20 "Wake Locks" > .claude/bugs/power-consumption-investigation/profiling-results/wake-locks-baseline-$TIMESTAMP.txt

# Collect CPU usage snapshot
adb shell top -n 1 | grep trendankara > .claude/bugs/power-consumption-investigation/profiling-results/cpu-usage-baseline-$TIMESTAMP.txt

# Battery history
adb shell dumpsys batterystats --checkin > .claude/bugs/power-consumption-investigation/profiling-results/battery-history-baseline-$TIMESTAMP.txt

# Current battery level
adb shell dumpsys battery > .claude/bugs/power-consumption-investigation/profiling-results/battery-level-final-$TIMESTAMP.txt

echo "✅ Data collection complete! Files saved with timestamp: $TIMESTAMP"
```

### Step 6: Analyze the Data

Let's look at the key metrics:

```bash
# Check latest battery stats
ls -lt .claude/bugs/power-consumption-investigation/profiling-results/battery-stats-* | head -1

# Quick analysis - look for:
# 1. Wake locks (search for "WakeLock" in battery-stats file)
# 2. Network activity (check network-stats file)
# 3. CPU time (search for "cpu" in battery-stats file)
```

## Quick Analysis Checklist

After collecting data, check:

- [ ] **Network Stats**: Are there ~120 requests in 10 minutes? (12 per minute = 5s interval)
- [ ] **Wake Locks**: Is there a persistent wake lock during playback?
- [ ] **CPU Time**: How much CPU time did the app use?
- [ ] **Temperature**: Did device get noticeably warmer?
- [ ] **Battery Drain**: How much battery % dropped? (if unplugged)

## Expected vs. Actual

### Expected (Based on Analysis):
- Network requests: ~120 in 10 minutes (every 5 seconds)
- CPU wake pattern: Regular spikes every 5 seconds
- Temperature increase: Noticeable warmth
- Battery drain: ~5-10% in 10 minutes (if unplugged)

### Actual Results:
- Network requests: ___________
- CPU pattern: ___________
- Temperature: ___________
- Battery drain: ___________%

## Interpretation Guide

### Hypothesis CONFIRMED if:
✅ Network requests ≈ 120 (±10)
✅ Regular CPU activity every ~5 seconds
✅ Device becomes warm
✅ Battery drain higher than expected

### Hypothesis PARTIAL if:
⚠️ Some indicators present but not all
⚠️ Other issues also contributing

### Hypothesis REJECTED if:
❌ No 5-second pattern detected
❌ Network requests minimal
❌ No correlation with analysis

## Next Steps

### If Confirmed:
1. Document findings in verification.md
2. Optionally test with modified polling (30s or 60s)
3. Compare with YouTube Music
4. Prepare recommendations

### If Partial/Rejected:
1. Investigate other potential causes
2. Check logcat for clues
3. Profile with Android Studio for detailed trace
4. Update analysis.md with new findings

## Optional: Logcat Monitoring

To see app logs during the test:

```bash
# In another terminal
adb logcat | grep -E "(TrendAnkara|TrackPlayer|useNowPlaying)" > .claude/bugs/power-consumption-investigation/profiling-results/logcat-baseline.txt
```

This will capture app-specific logs to see polling activity.

---

**Ready to start the test?**

1. Decide: AC connected or disconnected?
2. Optional: Start real-time monitor in second terminal
3. Launch app, start music, lock screen
4. Wait 10 minutes
5. Collect data with commands above
6. Analyze results

**Test status**: READY TO BEGIN 🚀
