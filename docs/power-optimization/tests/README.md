# Metadata Polling Power Optimization - Integration Tests

This directory contains comprehensive integration test procedures for verifying the metadata polling power optimization feature.

## Feature Overview

Platform-specific, context-aware metadata polling optimization that reduces power consumption during background audio playback by 85-95%.

**Expected Results:**
- **Android**: 95% power reduction (zero HTTP polling, native metadata events)
- **iOS Background**: 85-95% power reduction (2-minute polling interval)
- **iOS Foreground**: Real-time updates (5-second polling interval)

## Quick Navigation

### Start Here
- **[TEST_EXECUTION_GUIDE.md](./TEST_EXECUTION_GUIDE.md)** - Master guide with overview, setup, and execution order

### Individual Test Procedures
1. **[01-android-integration-test.md](./01-android-integration-test.md)** - Task 14: Android device test (20 min)
2. **[02-ios-foreground-integration-test.md](./02-ios-foreground-integration-test.md)** - Task 15: iOS foreground test (10 min)
3. **[03-ios-background-integration-test.md](./03-ios-background-integration-test.md)** - Task 16: iOS background test (20 min)
4. **[04-ios-state-transition-integration-test.md](./04-ios-state-transition-integration-test.md)** - Task 17: iOS state transition test (5 min)

### Helper Scripts
- **[android-monitor.sh](./android-monitor.sh)** - Automated Android test monitoring and analysis

## Test Requirements

### Hardware
- Physical Android device (Android 8.0+) for Task 14
- Physical iOS device (iPhone 8+, iOS 14+) for Tasks 15-17
- USB cables for device connection
- Mac computer (for iOS tests)

### Software
- **Android**: ADB (Android Debug Bridge)
- **iOS**: Xcode with Console app
- Latest debug build of Trend Ankara app

### Time Required
- **All tests**: ~55 minutes sequential, ~25-30 minutes parallel
- **Per test**: 5-20 minutes each

## Quick Start

### Android Test (Automated)
```bash
cd docs/power-optimization/tests
./android-monitor.sh
# Select option 6 for full automated test
```

### iOS Tests (Manual)
1. Connect iPhone to Mac
2. Open Xcode > Window > Devices and Simulators > Open Console
3. Follow procedures in individual test documents

## Test Suite Summary

| Task | Platform | Duration | Key Verification | Expected Result |
|------|----------|----------|-----------------|-----------------|
| 14 | Android | 20 min | HTTP requests = 0 | Native metadata events only |
| 15 | iOS | 10 min | Requests ≈ 120 | 5-second interval polling |
| 16 | iOS | 20 min | Requests ≈ 10 | 2-minute interval polling |
| 17 | iOS | 5 min | State transitions | Dynamic interval switching |

## Success Criteria

### Task 14 (Android)
- ✓ Zero HTTP metadata requests
- ✓ Native Event.AudioCommonMetadataReceived events present
- ✓ CPU usage <10% in background
- ✓ Battery drain <12%/hour

### Task 15 (iOS Foreground)
- ✓ 120 ± 5 HTTP requests in 10 minutes
- ✓ 5-second intervals consistent
- ✓ Metadata display latency <1 second
- ✓ Responsive UI, no degradation

### Task 16 (iOS Background)
- ✓ 8-12 HTTP requests in 20 minutes
- ✓ 2-minute intervals consistent
- ✓ CPU usage <10% in background
- ✓ Battery drain <8% in 20 minutes

### Task 17 (iOS State Transition)
- ✓ State transitions detected (active ↔ background)
- ✓ Polling interval switches correctly (5s ↔ 2min)
- ✓ Immediate metadata fetch on wake (<1 second)
- ✓ Fresh metadata visible within 1 second

## Power Savings Verification

### Android
- **Before**: 240 HTTP requests / 20 min
- **After**: 0 HTTP requests / 20 min
- **Reduction**: 100% (95% power savings)

### iOS Background
- **Before**: 240 HTTP requests / 20 min
- **After**: 10 HTTP requests / 20 min
- **Reduction**: 95.8% (85-95% power savings)

### iOS Foreground
- **No change**: 5s interval maintained for UX
- **Trade-off**: Real-time updates prioritized

## Log Patterns to Verify

### Android (Must Have)
```
[useNowPlaying] Android detected - skipping HTTP metadata polling
[PlaybackService] Metadata received from stream (Android)
```

### Android (Must NOT Have)
```
[useNowPlaying] Fetching metadata from:  ← This = FAIL
```

### iOS Foreground
```
[useNowPlaying] Starting polling with 5000ms interval (appState: active)
[useNowPlaying] Fetching metadata from:  ← Every 5 seconds
```

### iOS Background
```
[useNowPlaying] App state transition: active → background
[useNowPlaying] Starting polling with 120000ms interval (appState: background)
[useNowPlaying] Fetching metadata from:  ← Every 2 minutes
```

### iOS State Transition
```
[useNowPlaying] App state transition: active → background
[useNowPlaying] Starting polling with 120000ms interval (appState: background)
[useNowPlaying] App state transition: background → active
[useNowPlaying] App became active - fetching metadata immediately
[useNowPlaying] Fetching metadata from:
[useNowPlaying] Starting polling with 5000ms interval (appState: active)
```

## Common Issues

### No Logs Appearing
- **Android**: Verify ADB connected, app running, logcat not filtered
- **iOS**: Verify device selected in Console, process filter correct

### Wrong Request Count
- **Too many**: Check for state transitions, app waking
- **Too few**: Check network, look for errors, verify app didn't crash

### High Battery Drain
- **Android**: Verify HTTP polling disabled ("Android detected" log)
- **iOS**: Verify correct interval (120s in background, not 5s)

### Audio Interruptions
- Verify TrackPlayer setup
- Check for errors during metadata updates
- Test with metadata polling disabled to isolate

## Related Documentation

### Feature Documentation
- [../METADATA_POLLING_SOLUTION.md](../METADATA_POLLING_SOLUTION.md) - Technical implementation details
- [../QUICK_REFERENCE.md](../QUICK_REFERENCE.md) - Quick reference for developers
- [../README.md](../README.md) - Power optimization overview

### Specification Files
- `/.claude/specs/metadata-polling-power-optimization/requirements.md`
- `/.claude/specs/metadata-polling-power-optimization/design.md`
- `/.claude/specs/metadata-polling-power-optimization/tasks.md`

### Implementation Files
- `/hooks/useNowPlaying.ts` - Adaptive polling logic
- `/services/audio/PlaybackService.ts` - Android native metadata events
- `/services/audio/TrackPlayerService.ts` - Metadata updates without interruption

## Test Execution Flow

```
┌─────────────────────────────────────────────┐
│  Start: Read TEST_EXECUTION_GUIDE.md       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Setup: Verify prerequisites                │
│  - Devices connected                        │
│  - Software installed (ADB/Xcode)          │
│  - App installed and updated                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Task 14: Android Test (20 min)            │
│  - Run android-monitor.sh (option 6)       │
│  - Or follow manual procedure               │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Task 15: iOS Foreground (10 min)          │
│  - Follow 02-ios-foreground-test.md        │
│  - Monitor Console logs                     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Task 16: iOS Background (20 min)          │
│  - Follow 03-ios-background-test.md        │
│  - Lock device for 20 minutes               │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Task 17: iOS State Transition (5 min)     │
│  - Follow 04-ios-state-transition-test.md  │
│  - Test active ↔ background transitions     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Results: Compile test report               │
│  - Fill out templates in each test doc     │
│  - Verify all pass criteria met            │
│  - Document any issues                      │
└─────────────────────────────────────────────┘
```

## Getting Help

If tests fail or issues arise:

1. **Check troubleshooting section** in specific test document
2. **Review implementation files** (hooks/useNowPlaying.ts, etc.)
3. **Verify prerequisites** (device, OS version, network, etc.)
4. **Run single test in isolation** to identify specific issue
5. **Check for app updates** or configuration changes

## Contact

For questions or issues related to these tests:
- Review specification documents in `.claude/specs/metadata-polling-power-optimization/`
- Check implementation comments in source files
- Verify against design document for expected behavior

---

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Specification**: metadata-polling-power-optimization
**Tasks**: 14, 15, 16, 17 (Integration Tests)
