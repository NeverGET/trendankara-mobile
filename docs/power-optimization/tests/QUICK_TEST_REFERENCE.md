# Quick Test Reference Card

**One-page reference for integration testing metadata polling power optimization**

## Test Commands

### Android (Task 14) - 20 minutes
```bash
# Automated test (recommended)
cd docs/power-optimization/tests
./android-monitor.sh  # Select option 6

# Manual monitoring
adb logcat | grep -E "(useNowPlaying|PlaybackService)"

# Quick verification
adb logcat -d | grep "Android detected"
adb logcat -d | grep -c "Fetching metadata from:"  # Should be 0
```

### iOS (Tasks 15-17) - 35 minutes total
```bash
# Open Console
Xcode > Window > Devices and Simulators > [Device] > Open Console
# Filter: "useNowPlaying"

# After test, count requests
grep -c "Fetching metadata from:" console-output.log
```

## Expected Results Cheat Sheet

| Test | Platform | Duration | Requests | Interval | Battery | Status |
|------|----------|----------|----------|----------|---------|--------|
| T14  | Android  | 20 min   | 0        | N/A      | <12%/hr | PASS if 0 requests |
| T15  | iOS      | 10 min   | ~120     | 5s       | N/A     | PASS if 115-125 |
| T16  | iOS      | 20 min   | ~10      | 120s     | <24%/20min | PASS if 8-12 |
| T17  | iOS      | 5 min    | Dynamic  | 5s ↔ 120s | N/A   | PASS if transitions work |

## Critical Log Patterns

### Task 14 (Android) - MUST HAVE
```
✓ [useNowPlaying] Android detected - skipping HTTP metadata polling
✓ [PlaybackService] Metadata received from stream (Android)
✗ [useNowPlaying] Fetching metadata from:  ← If this appears = FAIL
```

### Task 15 (iOS Foreground) - MUST HAVE
```
✓ [useNowPlaying] Starting polling with 5000ms interval (appState: active)
✓ [useNowPlaying] Fetching metadata from:  ← Every ~5 seconds
```

### Task 16 (iOS Background) - MUST HAVE
```
✓ [useNowPlaying] App state transition: active → background
✓ [useNowPlaying] Starting polling with 120000ms interval (appState: background)
✓ [useNowPlaying] Fetching metadata from:  ← Every ~2 minutes
```

### Task 17 (iOS Transitions) - MUST HAVE (in order)
```
✓ Starting polling with 5000ms interval (appState: active)
✓ App state transition: active → background
✓ Starting polling with 120000ms interval (appState: background)
✓ App state transition: background → active
✓ App became active - fetching metadata immediately
✓ Starting polling with 5000ms interval (appState: active)
```

## Pass/Fail Quick Check

### Task 14 (Android)
```
✓ HTTP requests = 0? YES → PASS | NO → FAIL
✓ "Android detected" log? YES → PASS | NO → FAIL
✓ Native metadata events? YES → PASS | NO → Check stream
```

### Task 15 (iOS Foreground)
```
✓ Requests 115-125? YES → PASS | NO → FAIL
✓ Interval ~5s? YES → PASS | NO → FAIL
✓ Latency <1s? YES → PASS | NO → FAIL
```

### Task 16 (iOS Background)
```
✓ Requests 8-12? YES → PASS | NO → FAIL
✓ Interval ~120s? YES → PASS | NO → FAIL
✓ Battery <8% in 20min? YES → PASS | NO → FAIL
```

### Task 17 (iOS Transitions)
```
✓ State transitions logged? YES → PASS | NO → FAIL
✓ Intervals switch 5s ↔ 120s? YES → PASS | NO → FAIL
✓ Immediate fetch on wake? YES → PASS | NO → FAIL
✓ Wake latency <1s? YES → PASS | NO → FAIL
```

## Quick Analysis Commands

### Count Requests
```bash
# Android (should be 0)
adb logcat -d | grep -c "Fetching metadata from:"

# iOS (from saved console output)
grep -c "Fetching metadata from:" console.log
```

### Verify Platform Detection
```bash
# Android
adb logcat -d | grep "Android detected"

# iOS
grep "iOS" console.log  # or check for absence of "Android detected"
```

### Check Intervals
```bash
# Extract all interval logs
grep "Starting polling with.*interval" console.log
```

### Find State Transitions
```bash
# iOS only
grep "App state transition" console.log
```

## Troubleshooting Quick Fixes

### No Logs
- **Android**: `adb logcat -c` then restart app
- **iOS**: Clear Console filter, restart Console app

### Wrong Count
- **Too many**: Device woke up, check for transitions
- **Too few**: Network issue, check for errors: `grep -i error console.log`

### High Battery
- **Android**: Verify `grep "Android detected" logcat.log`
- **iOS**: Verify `grep "120000ms interval (appState: background)" console.log`

## Test Timeline Cheat Sheet

### Task 17 (iOS State Transition) Timeline
```
T=0s:   Play + stay in foreground
T=15s:  Lock device (→ background)
T=75s:  Unlock device (→ active)
T=90s:  Test complete

Key logs at:
- T=0s:  "5000ms interval (appState: active)"
- T=15s: "active → background" + "120000ms interval"
- T=75s: "background → active" + "fetching immediately" + "5000ms interval"
```

## One-Line Test Verification

### After Running Each Test
```bash
# Task 14 (Android)
[[ $(adb logcat -d | grep -c "Fetching metadata from:") -eq 0 ]] && echo "✓ PASS" || echo "✗ FAIL"

# Task 15 (iOS Foreground) - assuming console.log file
COUNT=$(grep -c "Fetching metadata from:" console.log); [[ $COUNT -ge 115 && $COUNT -le 125 ]] && echo "✓ PASS ($COUNT)" || echo "✗ FAIL ($COUNT)"

# Task 16 (iOS Background) - assuming console.log file
COUNT=$(grep -c "Fetching metadata from:" console.log); [[ $COUNT -ge 8 && $COUNT -le 12 ]] && echo "✓ PASS ($COUNT)" || echo "✗ FAIL ($COUNT)"

# Task 17 (iOS Transitions) - check for critical logs
grep -q "App became active - fetching metadata immediately" console.log && echo "✓ PASS" || echo "✗ FAIL"
```

## Battery Drain Quick Calc

### iOS Background Test (20 minutes)
```
Drain% = Start% - End%
Hourly rate = (Drain% / 20) × 60

Example:
Start: 100%, End: 93%
Drain: 7%
Hourly: (7 / 20) × 60 = 21%/hour

PASS if <24%/hour (i.e., <8% in 20min)
```

## File Locations

```
Tests:
├── 01-android-integration-test.md          (Task 14 - 20min)
├── 02-ios-foreground-integration-test.md   (Task 15 - 10min)
├── 03-ios-background-integration-test.md   (Task 16 - 20min)
├── 04-ios-state-transition-integration-test.md  (Task 17 - 5min)
├── TEST_EXECUTION_GUIDE.md                 (Master guide)
├── android-monitor.sh                      (Helper script)
└── QUICK_TEST_REFERENCE.md                 (This file)

Implementation:
├── hooks/useNowPlaying.ts                  (Polling logic)
├── services/audio/PlaybackService.ts       (Android events)
└── services/audio/TrackPlayerService.ts    (Metadata updates)
```

## Prerequisites Checklist

```
Android (Task 14):
[ ] Physical Android device (≥8.0)
[ ] ADB installed and device connected
[ ] USB debugging enabled
[ ] App installed (latest build)

iOS (Tasks 15-17):
[ ] Physical iOS device (iPhone 8+, ≥iOS 14)
[ ] Mac with Xcode
[ ] Device connected and trusted
[ ] Console app ready
[ ] App installed (latest build)

Both:
[ ] Stable Wi-Fi
[ ] Full battery (or charger)
[ ] Quiet environment (to hear audio)
[ ] Time allocated (5-20min per test)
```

## Power Savings Target

```
Android:     240 requests/20min → 0 requests = 100% reduction
iOS BG:      240 requests/20min → 10 requests = 95.8% reduction
iOS FG:      No change (UX priority)

Target achieved:
- Android: 95% power reduction
- iOS: 85-95% power reduction in background
- CPU: <10% in background for both
```

---

**Quick Tip**: Start with Task 14 (Android) using `./android-monitor.sh` option 6 for automated testing. It's the easiest to verify (zero requests = PASS).

**Document**: metadata-polling-power-optimization integration tests
**Version**: 1.0
