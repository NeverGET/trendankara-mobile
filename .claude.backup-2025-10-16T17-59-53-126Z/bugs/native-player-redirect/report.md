# Bug Report: Native Player Notification Click Redirect

## Bug Summary
When users tap on the native media control notification (lock screen or notification shade), the app attempts to open the deep link `trendankara://notification.click` but shows an "Unmatched Route" error. The notification click should redirect users to the player page (home tab) instead.

## Bug Details

### Expected Behavior
When a user taps the native media player notification (lock screen, notification center, or Bluetooth controls), the app should:
1. Open/bring to foreground the Trend Ankara app
2. Navigate to the player page (home tab at `/`)
3. Show the currently playing stream with controls

### Actual Behavior
When a user taps the native media player notification, the app:
1. Attempts to open the deep link `trendankara://notification.click`
2. Shows an "Unmatched Route" error message
3. Fails to navigate to any page
4. Leaves the user confused about what happened

### Steps to Reproduce
1. Open the Trend Ankara mobile app
2. Start playing the radio stream
3. Put the app in background (press home button)
4. Tap on the native media player notification shown in:
   - Lock screen media controls
   - Notification center/shade
   - Control center (iOS)
   - Bluetooth/car audio controls
5. Observe the "Unmatched Route" error for `trendankara://notification.click`

### Environment
- **Version**: 1.0.0
- **Platform**: iOS and Android
- **Configuration**:
  - React Native Track Player v4.1.2
  - Expo SDK 54
  - App scheme: `trendankara://`
  - Deep linking configured in app.json

## Impact Assessment

### Severity
- [x] Medium - Feature impaired but workaround exists

Users can still manually open the app and use the player, but the notification tap doesn't work as expected. This creates a poor user experience as tapping notifications is a common interaction pattern.

### Affected Users
All users who:
- Use background playback
- Try to return to the app via notification tap
- Use lock screen media controls
- Connect to Bluetooth devices or car audio systems

### Affected Features
- Native media control notification interaction
- Deep linking from notification clicks
- User experience when returning to app from background
- Seamless playback experience

## Additional Context

### Error Messages
```
Unmatched Route
trendankara://notification.click
```

### Screenshots/Media
User reports seeing this error when tapping the native media notification.

### Related Issues
- Related to react-native-track-player implementation
- Connected to app.json linking configuration
- Involves DeepLinkHelper in utils/navigation.ts

### Code Locations
1. **app.json** (lines 118-142): Deep linking configuration
2. **utils/navigation.ts** (lines 308-330): Deep link handler with trackplayer:// handling
3. **services/audio/TrackPlayerService.ts** (lines 68-79): TrackPlayer options configuration
4. **hooks/useDeepLinking.ts**: Deep link processing logic

## Initial Analysis

### Suspected Root Cause
The react-native-track-player library is configured to use a notification click intent with the URL `trendankara://notification.click`, but:
1. This route is not registered in the app's linking configuration (app.json)
2. The DeepLinkHelper.handleDeepLink() function doesn't handle this specific URL pattern
3. The existing handler for `trackplayer://` URLs (line 310-313) doesn't catch `trendankara://notification.click`

### Contributing Factors
1. **Missing route configuration**: The `notification.click` path is not defined in app.json's linking.config.screens
2. **Deep link handler gap**: The DeepLinkHelper only handles `trackplayer://` scheme, not `trendankara://notification.click`
3. **No fallback logic**: When a deep link doesn't match any route, there's no fallback to navigate to home

### Affected Components
- **TrackPlayerService.ts**: Where notification options are configured
- **utils/navigation.ts**: DeepLinkHelper.handleDeepLink() and parseUrl()
- **hooks/useDeepLinking.ts**: Deep link processing and routing
- **app.json**: Linking configuration schema

## Solution Requirements

The fix should:
1. ✅ Handle `trendankara://notification.click` deep link
2. ✅ Navigate to the player page (home tab at `/`)
3. ✅ Work on both iOS and Android
4. ✅ Not break existing deep link functionality
5. ✅ Be consistent with react-native-track-player behavior
6. ✅ Provide good user experience (smooth navigation)

## Next Steps
Proceed to `/bug-analyze` phase to investigate the root cause and design a solution.
