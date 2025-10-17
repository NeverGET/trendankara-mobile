# Quick Start - Power Consumption Testing

## ✅ Setup Complete

- **Device**: Connected (28051FDH3005RT)
- **App**: Installed (v1.0.0)
- **Battery**: Reset and ready (currently 32%, AC powered)
- **Scripts**: Ready to run

## 🚀 Run the Test Now

### Option 1: Simple 10-Minute Test (Recommended)

```bash
# 1. Launch the app on your device manually
# 2. Start playing music
# 3. Lock the screen
# 4. Wait 10 minutes
# 5. Then run this:

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
adb shell dumpsys batterystats com.trendankara.mobile > .claude/bugs/power-consumption-investigation/profiling-results/battery-stats-$TIMESTAMP.txt
adb shell dumpsys netstats | grep trendankara > .claude/bugs/power-consumption-investigation/profiling-results/network-stats-$TIMESTAMP.txt
adb shell dumpsys power | grep -A 20 "Wake Locks" > .claude/bugs/power-consumption-investigation/profiling-results/wake-locks-$TIMESTAMP.txt
adb shell top -n 1 | grep trendankara > .claude/bugs/power-consumption-investigation/profiling-results/cpu-usage-$TIMESTAMP.txt
adb shell dumpsys battery > .claude/bugs/power-consumption-investigation/profiling-results/battery-level-$TIMESTAMP.txt

echo "✅ Data collected! Timestamp: $TIMESTAMP"
```

### Option 2: With Real-Time Monitoring

**Terminal 1** (monitoring):
```bash
./.claude/bugs/power-consumption-investigation/monitor-realtime.sh
```

**Terminal 2** (your main terminal): Just wait 10 minutes, then collect data as above

### Option 3: Use the Automated Script

```bash
# This was created earlier
./.claude/bugs/power-consumption-investigation/profiling-android.sh
```

## 📊 What We're Looking For

After the test, we'll analyze:

1. **Network Stats**: Should show ~120 requests in 10 minutes (one every 5 seconds)
2. **Battery Stats**: Will show wake locks and CPU time
3. **Wake Locks**: Should show persistent wake lock during playback
4. **CPU Usage**: Should show regular activity spikes

## 🎯 Quick Decision Tree

**After collecting data:**

```
Is there ~120 network requests in 10 minutes?
  ├─ YES → Analysis CONFIRMED, polling is the issue
  │         Next: Consider testing with 30s or 60s interval
  │
  └─ NO  → Analysis NEEDS REVISION
            └─ Check: Are there OTHER patterns?
               ├─ Different interval? → Note the actual interval
               ├─ No network activity? → Check if metadata feature is enabled
               └─ Other wake sources? → Investigate further
```

## 🔧 Optional: Test Modified Polling

If you want to test with 30s or 60s polling interval:

### Change to 30 seconds:
```typescript
// In hooks/useNowPlaying.ts line 140
// BEFORE: intervalRef.current = setInterval(fetchMetadata, 5000);
// AFTER:
intervalRef.current = setInterval(fetchMetadata, 30000);
```

### Change to 60 seconds:
```typescript
intervalRef.current = setInterval(fetchMetadata, 60000);
```

Then rebuild and install:
```bash
REACT_DEVTOOLS_PORT=0 npx expo run:android --device 28051FDH3005RT
```

## 📝 Manual Observations

During the 10-minute test, note:

- **Start time**: _____________
- **Initial temp**: Feel the device back - is it cool/warm?
- **Minute 5**: Unlock, switch to another app, then lock again
  - Does it feel sluggish? _____________
  - Device warmer? _____________
- **Minute 10**:
  - Final temp feel: _____________
  - Music still playing smoothly? _____________
- **End time**: _____________

## 🎬 Ready?

**Current Status**:
- Battery stats: ✅ Reset
- Device: ✅ Connected
- App: ✅ Installed (v1.0.0)
- Scripts: ✅ Ready

**You can now**:
1. Open the TrendAnkara app on your device
2. Start playing music
3. Lock the screen
4. Wait 10 minutes (set a timer!)
5. Run the data collection commands above

**Or let me know if you want me to**:
- Start a specific test scenario
- Modify the polling interval first
- Set up Android Studio Profiler instead
- Something else

---

**All files and scripts are ready in**:
`.claude/bugs/power-consumption-investigation/`

**What would you like to do next?**
