# Patches Directory

This directory contains patches for node_modules packages that fix issues or add functionality.

## react-native-track-player+4.1.2.patch

### What It Does

Fixes media controller play/pause buttons by changing the library's architecture to handle media actions natively instead of routing through JavaScript.

**Key Change**: Sets `interceptPlayerActionsTriggeredExternally = false` in MusicService.kt

### Why It's Needed

**Problem**: Media controller buttons (play/pause) don't work because:
- Library intercepts actions to route through JavaScript
- ReactContext is often null during service startup/backgrounding
- Events can't reach JavaScript, so actions are ignored

**Solution**: Let MediaSession handle actions automatically:
- Works immediately without JavaScript
- No dependency on ReactContext
- Events still emitted to JS when available

### Files Modified

- `android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt`
  - Line 144: `interceptPlayerActionsTriggeredExternally = false`
  - Additional Kotlin 2.1.20 compatibility fixes

### How to Regenerate

If you need to update the patch:

1. Make changes in node_modules:
```bash
# Edit the file
code node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt
```

2. Regenerate the patch:
```bash
npx patch-package react-native-track-player
```

3. Commit the updated patch file

### Testing

After applying or regenerating the patch:

1. **Clean rebuild** (patch doesn't apply to existing builds):
```bash
npx expo run:android
# or
npx expo run:ios
```

2. **Verify the fix**:
- [ ] Play audio
- [ ] Check media controls in notification shade
- [ ] Test play/pause button - should work immediately
- [ ] Background the app and test again
- [ ] Check lock screen controls

3. **Check logs** for errors:
```bash
adb logcat | grep -E "(MusicService|ReactContext|TrackPlayer)"
```

Should NOT see: "ReactContext is null, cannot emit event"

### Automatic Application

The patch is automatically applied after `npm install` via the postinstall script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

### Documentation

For complete technical details, see: [`docs/react-native-track-player-setup.md`](../docs/react-native-track-player-setup.md)

### Troubleshooting

**Patch not applying?**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**Still not working?**
```bash
# Verify patch was applied
cat node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt | grep -A2 "val playerConfig"
```

Should output:
```kotlin
val playerConfig = PlayerConfig(
    interceptPlayerActionsTriggeredExternally = false,
```

**Need to debug?**
```bash
# Check if patch file exists
ls -la patches/react-native-track-player+4.1.2.patch

# Manually apply patch
npx patch-package react-native-track-player --patch-dir patches
```
