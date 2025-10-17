# Bug Report

## Bug Summary
New logo has been added to the codebase and icons were regenerated, but the old logo still appears in builds (debug/release) and Expo on both iOS and Android platforms. Additionally, the splash screen has not been updated to use the new logo.

## Bug Details

### Expected Behavior
- When building the app (debug, release, or via Expo), the new TrendAnkara logo should appear as the app icon on both iOS and Android devices
- The splash screen should display the new logo during app launch
- Icons should be generated from the new logo source file: `assets/logo/TrendAnkara_Logo.svg`

### Actual Behavior
- Despite regenerating icons (timestamp: 2025-10-16T18:56:03.203Z), the old logo continues to appear in all builds
- Icons appear to have been generated (24 icons created across iOS, Android, and web platforms)
- The generation report shows `validationPassed: false`, indicating potential issues with the generation process
- Splash screen still uses the old splash-icon.png file located at `assets/images/splash-icon.png`

### Steps to Reproduce
1. Check the new logo files in `assets/logo/`:
   - TrendAnkaraLogo.png
   - TrendAnkaraLogoMonochrome.png
   - TrendAnkara_Logo.svg
2. Generate icons using the icon generation script (appears to have been run)
3. Build the app using any method:
   - `npx expo run:ios`
   - `npx expo run:android`
   - `eas build`
   - Development build via Expo Go
4. Observe that the old logo still appears as the app icon
5. Launch the app and observe that the splash screen still shows the old logo

### Environment
- **Version**: 1.0.0 (iOS buildNumber: 1, Android versionCode: 3)
- **Platform**: iOS and Android
- **Framework**: Expo SDK 54, React Native 0.81.4
- **Build Method**: All build methods affected (debug, release, EAS, Expo development)
- **Configuration**:
  - Icon generation from: `assets/logo/TrendAnkara_Logo.svg`
  - iOS icon paths configured in app.json:7-39
  - Android icon paths configured in app.json:45-52
  - Splash screen configured in app.json:78-86

## Impact Assessment

### Severity
- [x] Medium - Feature impaired but workaround exists

### Affected Users
All users on both iOS and Android platforms. This affects the visual branding of the app but does not impact core functionality.

### Affected Features
- **App Icon Display**: Wrong logo shown on device home screen
- **Splash Screen**: Old logo displayed during app launch
- **Brand Identity**: Users see outdated branding
- **App Store Listings**: If published, would show incorrect logo in store listings

## Additional Context

### Error Messages
```
Generation report shows: "validationPassed": false
```

This indicates the icon generation process may have encountered validation issues.

### Icon Configuration in app.json
```json
// Root level (line 7)
"icon": "./assets/icons/ios/icon.png",

// iOS specific (lines 35-38)
"icon": {
  "light": "assets/icons/ios/icon-light.png",
  "dark": "assets/icons/ios/icon-dark.png",
  "tinted": "assets/icons/ios/icon-tinted.png"
},

// Android specific (lines 46-51)
"icon": "./assets/icons/android/icon-legacy-0.png",
"adaptiveIcon": {
  "foregroundImage": "assets/icons/android/adaptive/foreground.png",
  "backgroundImage": "assets/icons/android/adaptive/background.png",
  "monochromeImage": "assets/icons/android/adaptive/monochrome.png",
  "backgroundColor": "#000000"
}
```

### Splash Screen Configuration (lines 78-86)
```json
{
  "image": "./assets/images/splash-icon.png",
  "imageWidth": 200,
  "resizeMode": "contain",
  "backgroundColor": "#ffffff",
  "dark": {
    "backgroundColor": "#000000"
  }
}
```

### Generated Icons Status
- **Total Icons Generated**: 24
- **Platforms**: iOS (17 icons), Android (5 icons), Web (2 icons)
- **Source File**: `/Users/cemalkurt/Projects/trendankara/mobile/assets/logo/TrendAnkara_Logo.svg`
- **Generation Time**: 2025-10-16T18:56:03.203Z
- **Validation**: FAILED

### Related Files
- `assets/logo/TrendAnkara_Logo.svg` - New logo source
- `assets/logo/TrendAnkaraLogo.png` - PNG version of new logo
- `assets/logo/TrendAnkaraLogoMonochrome.png` - Monochrome version
- `assets/images/splash-icon.png` - Current splash screen icon (OLD)
- `scripts/generate-icons.ts` - Icon generation script
- `app.json` - Expo configuration with icon paths

## Initial Analysis

### Suspected Root Cause
Multiple potential issues:

1. **Build Cache Issue**: Expo/React Native may be caching the old icons even after regeneration
2. **Icon Generation Validation Failed**: The generation report shows `validationPassed: false`, suggesting the generated icons may not meet required specifications
3. **Splash Screen Not Updated**: The splash screen configuration still points to the old `splash-icon.png` file
4. **Native Build Cache**: iOS/Android native build systems may have cached assets that need to be cleared
5. **Icon Path Inconsistencies**: Some paths in app.json use `./` prefix while others don't (inconsistent path format)

### Affected Components
- `app.json` - Icon and splash screen configuration
- `assets/icons/*` - Generated icon files (may contain old logo despite new checksums)
- `assets/images/splash-icon.png` - Splash screen image (needs update)
- `scripts/generate-icons.ts` - Icon generation script (validation may be failing)
- iOS/Android native build artifacts (may need clearing)

### Immediate Investigation Needed
1. Why did icon generation validation fail?
2. Are the generated icon files actually using the new logo? (checksums changed, but visual verification needed)
3. What caches need to be cleared for icons to update?
4. How to update the splash screen to use the new logo?
5. Do we need to increment build numbers for native platforms to force icon refresh?
