# React Native Track Player Patch

## Overview
We've applied a patch to `react-native-track-player@4.1.2` to fix Kotlin compatibility issues with React Native 0.81.4 + Kotlin 2.1.20.

## Issues Fixed

### 1. Bridgeless Mode Compatibility
**Problem:** @ReactMethod functions returning `Job` instead of `Unit` cause ParsingException in bridgeless mode.

**Solution:** Added `launchInScope` helper function that wraps coroutine launch:

```kotlin
private fun launchInScope(block: suspend () -> Unit) {
    scope.launch { block() }
}
```

Changed all methods from:
```kotlin
@ReactMethod
fun someMethod(..., promise: Promise) = scope.launch {
    // ...
}
```

To:
```kotlin
@ReactMethod
fun someMethod(..., promise: Promise) = launchInScope {
    // ...
}
```

### 2. Null-Safety Type Mismatches
**Problem:** `Arguments.fromBundle()` expects non-nullable `Bundle` but `originalItem` is nullable (`Bundle?`).

**Solution:** Added null checks before calling `Arguments.fromBundle()`:

```kotlin
// Before
callback.resolve(Arguments.fromBundle(track.originalItem))

// After
val originalItem = track.originalItem
callback.resolve(if (originalItem != null) Arguments.fromBundle(originalItem) else null)
```

## Files Modified
- `node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt`

## Changes Summary
1. Added `launchInScope()` helper method
2. Replaced 35+ `scope.launch` calls with `launchInScope`
3. Fixed null-safety issues in `getTrack()` and `getActiveTrack()`
4. Updated all `return@launch` to `return@launchInScope`

## Patch File
The patch is saved in `patches/react-native-track-player+4.1.2.patch` and automatically applied via `postinstall` script.

## How It Works
1. `patch-package` is run automatically after `npm install` (see `package.json` postinstall script)
2. The patch file modifies `node_modules/react-native-track-player` during installation
3. All team members get the same patched version automatically

## Maintenance

### If Library Updates
When react-native-track-player releases a new version:

1. **Check if fixes are included:**
   ```bash
   npm info react-native-track-player versions
   ```

2. **Test without patch:**
   - Remove or rename the patch file temporarily
   - Try building
   - If it works, the patch is no longer needed!

3. **If patch still needed:**
   - Update to new version
   - Reapply patch manually
   - Regenerate patch file:
     ```bash
     npx patch-package react-native-track-player
     ```

### Verifying Patch Applied
Check if patch was applied successfully:
```bash
grep -n "launchInScope" node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt
```

Should show the helper function and multiple usages.

## Credit
Solution based on community feedback from:
https://github.com/doublesymmetry/react-native-track-player/issues

## Testing
After patch is applied:
1. ✅ Android builds successfully
2. ✅ TrackPlayer initializes without errors
3. ✅ Playback works correctly
4. ✅ Metadata updates work seamlessly
5. ✅ No ParsingException in bridgeless mode

## Rollback Plan
If patch causes issues:

1. **Disable TrackPlayer:**
   ```typescript
   // constants/config.ts
   USE_TRACK_PLAYER: false
   ```

2. **Remove patch (optional):**
   ```bash
   rm patches/react-native-track-player+4.1.2.patch
   npm install
   ```

3. **Rebuild:**
   ```bash
   npx expo prebuild --clean --platform android
   npx expo run:android
   ```

---

**Created:** October 1, 2025
**Library Version:** react-native-track-player@4.1.2
**Status:** ✅ Working
**Next Review:** When library updates to 4.1.3+
