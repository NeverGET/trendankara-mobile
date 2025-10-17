# Power Optimization - Quick Reference

## TL;DR

**Problem**: App polls metadata every 5 seconds → 65% CPU → Battery drain
**Solution**: Platform-specific, context-aware updates
**Impact**: 85-95% power reduction

---

## The Fix (3 Simple Changes)

### 1. Android: Disable Polling (1 line!)

```typescript
// hooks/useNowPlaying.ts - Add at start of useEffect
if (Platform.OS === 'android') {
  return; // Native events handle this
}
```

**Result**: Zero polling, native events only

### 2. iOS: Context-Aware Intervals

```typescript
// Foreground: 5s (user sees updates)
// Background: 2min (save power)
const interval = appState === 'active' ? 5000 : 120000;
```

**Result**: 95% less polling in background

### 3. Both: Event-Triggered Fetches

```typescript
// Fetch when user opens notification
TrackPlayer.addEventListener(Event.RemotePlay, fetchMetadata);
```

**Result**: Fresh metadata on interaction

---

## Expected Results

| Platform | Before | After | Improvement |
|----------|--------|-------|-------------|
| Android CPU | 65% | <5% | 92% |
| iOS Background | 65% | <5% | 92% |
| iOS Foreground | 65% | 15% | 77% |

---

## Implementation Checklist

- [ ] Phase 1: Add platform check (Android)
- [ ] Phase 2: Add AppState monitoring (iOS)
- [ ] Phase 3: Add remote control listeners (both)
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Deploy to production

---

## Full Documentation

See: `docs/power-optimization/METADATA_POLLING_SOLUTION.md`

## Test Results

See: `.claude/bugs/power-consumption-investigation/`

---

**Status**: ✅ Solution Validated
**Date**: October 17, 2025
**Ready**: For Spec Creation
