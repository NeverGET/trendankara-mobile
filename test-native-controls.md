# Native Media Controls Test Guide

## Test Procedure for Bug Fix Verification

### Prerequisites
1. Physical iOS or Android device (simulators may not show all controls)
2. Expo Go app or development build installed
3. Development server running (`npx expo start`)

### Test Steps

#### 1. Initial App Launch
- [ ] Open the app on your device
- [ ] Navigate to the Radio tab (main screen)
- [ ] Verify the play button is visible

#### 2. Start Playback
- [ ] Tap the play button
- [ ] Wait for stream to load and start playing
- [ ] Verify audio is playing from the device

#### 3. Lock Screen Controls (Primary Test)
- [ ] While audio is playing, lock your device
- [ ] Wake the device (don't unlock)
- [ ] **EXPECTED**: Media controls should appear on lock screen showing:
  - "TrendAnkara Radyo" as title
  - "Canlı Yayın" as artist
  - Play/Pause button
  - TrendAnkara logo (if supported by OS)
- [ ] Test pause button on lock screen
- [ ] Test play button to resume
- [ ] Verify controls respond correctly

#### 4. Control Center/Notification Shade
**iOS:**
- [ ] Swipe down from top-right (or swipe up from bottom on older devices)
- [ ] Check Control Center media widget
- [ ] Verify TrendAnkara info is displayed
- [ ] Test play/pause from Control Center

**Android:**
- [ ] Swipe down notification shade
- [ ] Look for media notification
- [ ] Verify playback controls are present
- [ ] Test play/pause from notification

#### 5. Background Playback Control
- [ ] Start playback in app
- [ ] Switch to another app
- [ ] Access lock screen or control center
- [ ] Pause playback from outside the app
- [ ] Return to app
- [ ] Verify app UI reflects paused state

#### 6. App Termination Test
- [ ] Start playback
- [ ] Force close the app
- [ ] Check if media controls disappear (they should)

#### 7. Network Interruption
- [ ] Start playback
- [ ] Turn on airplane mode
- [ ] Verify controls still appear (even if playback stops)
- [ ] Turn off airplane mode
- [ ] Resume playback from lock screen

### Expected Results
✅ Lock screen shows media controls with station info
✅ Control center/notification shade shows playback controls
✅ Can control playback without opening app
✅ Station name and logo visible in media controls
✅ Controls disappear when playback stops

### Known Issues/Limitations
- Using expo-video for audio (workaround solution)
- Some Android devices may show generic icon instead of logo
- iOS may cache old metadata briefly

### Troubleshooting

**Controls don't appear:**
1. Ensure you're testing on a physical device
2. Check device media control settings
3. Try restarting the app
4. Check console for errors

**Controls appear but don't work:**
1. Check if audio focus was lost to another app
2. Restart the stream
3. Check network connectivity

**Wrong metadata displayed:**
1. This may be cached from a previous session
2. Force stop and restart the app
3. Clear app data if necessary

## Bug Fix Confirmation
If all test steps pass, especially steps 3-5, the bug fix is confirmed successful.
The native media controls are now working as expected.