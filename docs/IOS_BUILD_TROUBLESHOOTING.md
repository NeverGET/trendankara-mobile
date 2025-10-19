# iOS Build Troubleshooting Guide

## Issue: react-native-reanimated registry.cpp Not Found

### Error Message
```
Build input file cannot be found: '.../react-native-reanimated/Common/cpp/reanimated/CSS/configs/interpolators/registry.cpp'
```

### Solution Steps

#### 1. Clean Xcode Build (REQUIRED)
In Xcode:
1. **Product** → **Clean Build Folder** (or ⇧⌘K)
2. Close Xcode completely
3. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   ```

#### 2. Clean iOS Build Directory
```bash
cd /Users/cemalkurt/Projects/trendankara/mobile/ios
rm -rf build/
```

#### 3. Reinstall Pods (ALREADY DONE)
```bash
cd ios
pod deintegrate
pod install --repo-update
```
✅ This was just completed and RNReanimated was updated to 4.1.3

#### 4. Rebuild in Xcode
1. Open `ios/TrendAnkara.xcworkspace` in Xcode (NOT .xcodeproj!)
2. Select your device/simulator
3. Product → Build (⌘B)

---

## If Error Persists

### Option A: Disable New Architecture Temporarily

If the build still fails, temporarily disable New Architecture:

**Edit `app.json`:**
```json
{
  "expo": {
    "newArchEnabled": false  // Change from true to false
  }
}
```

Then:
```bash
cd ios
pod install
```

Rebuild in Xcode.

### Option B: Check react-native-track-player Compatibility

react-native-track-player may have New Architecture issues. If audio doesn't work after disabling New Architecture, you might need to switch to expo-av.

---

## Quick Commands

### Clean Everything (Nuclear Option)
```bash
# From mobile directory
cd ios
rm -rf build/
rm -rf Pods/
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod install --repo-update
```

### Check Pod Versions
```bash
cd ios
pod list | grep -i reanimated
# Should show: RNReanimated 4.1.3
```

### Verify Workspace
Always open the `.xcworkspace` file, NOT `.xcodeproj`:
```bash
open ios/TrendAnkara.xcworkspace
```

---

## Current Status

- ✅ Pods reinstalled
- ✅ RNReanimated updated to 4.1.3 (from 4.1.0)
- ✅ New Architecture enabled
- ✅ iOS build directory cleaned
- ✅ Xcode derived data cleaned
- ⏳ Need to rebuild in Xcode (manual step required)

---

## Prevention

After any package updates:
1. Always run `cd ios && pod install`
2. Clean build folder in Xcode
3. Close and reopen Xcode

---

**Last Updated**: October 19, 2025
