# Bug Report: Audio Service Circular Dependency

## Bug Information
**Bug Name:** audio-service-circular-dependency
**Severity:** High
**Component:** Audio Services (BackgroundHandler & AudioService)
**Status:** New

## Description
The audio service initialization is failing due to circular dependencies and incorrect class inheritance, preventing the audio functionality from working on Android devices.

## Error Messages
```
1. Require cycle: services/audio/BackgroundHandler.android.ts -> services/audio/BackgroundHandler.android.ts

2. TypeError: Super expression must either be null or a function
   at AndroidBackgroundHandler (services/audio/BackgroundHandler.android.ts:34:3)

3. TypeError: createBackgroundHandler is not a function (it is undefined)
   at initializeBackground (services/audio/AudioService.ts:82:61)
```

## Steps to Reproduce
1. Start the Expo application with `npx expo start`
2. Run the Android build
3. Observe the console errors during app initialization

## Expected Behavior
- Audio services should initialize without errors
- Background handler should be created successfully
- No circular dependency warnings should appear

## Actual Behavior
- Application throws multiple errors on startup
- Audio functionality is completely broken
- Circular dependency warning appears in console
- Background handler fails to initialize

## Environment
- Platform: Android
- Expo development build
- Running on port 8081

## Impact
- Complete failure of audio functionality
- App may crash or have degraded performance
- Background audio handling non-functional

## Initial Investigation Notes
- Self-referential import in BackgroundHandler.android.ts
- Incorrect export/import structure causing undefined function
- Possible class inheritance issue in AndroidBackgroundHandler

## Files Affected
- `services/audio/BackgroundHandler.android.ts`
- `services/audio/BackgroundHandler.ts`
- `services/audio/AudioService.ts`

## Priority
High - Core functionality broken, affects all Android users