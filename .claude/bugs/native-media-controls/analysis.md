# Bug Analysis

## Root Cause Analysis

### Investigation Summary
After thorough investigation of the codebase and the research document provided, I've identified that while the application has attempted to implement native media controls through custom services (NativeMediaControls, MediaSessionManager, MediaNotificationService), these implementations are fundamentally limited by expo-av's lack of true native media session integration. The ecosystem is in transition with expo-av deprecated and expo-audio not yet featuring native control support.

### Root Cause
The primary cause is that expo-av doesn't provide the necessary native media session APIs for lock screen controls:
1. **expo-av limitations**: No built-in support for MPNowPlayingInfoCenter (iOS) or MediaSession API (Android)
2. **Current implementation attempts**: The codebase has NativeMediaControls.ts and MediaSessionManager.ts that try to work around this, but they're using notifications as a workaround rather than true media controls
3. **Notification-based approach**: MediaSessionManager uses expo-notifications to simulate media controls, which doesn't integrate with native OS media sessions

### Contributing Factors
1. **Library Deprecation**: expo-av is deprecated in SDK 54 and will be removed in SDK 55
2. **Incomplete Replacement**: expo-audio doesn't yet have native control features
3. **Architecture Changes**: New React Native architecture (Fabric/TurboModules) causing compatibility issues with third-party audio libraries
4. **Managed Workflow Constraints**: Native module integration limited without ejecting to development build

## Technical Details

### Affected Code Locations
After investigating the codebase, I found these specific files attempting to implement media controls:

- **File**: `services/audio/AudioService.ts`
  - **Lines**: 78-120, 282-331
  - **Issue**: Attempts to use NativeMediaControls and MediaSessionManager but these don't provide true native integration

- **File**: `services/audio/NativeMediaControls.ts`
  - **Lines**: 19-38
  - **Issue**: Only sets audio mode for background playback, doesn't actually integrate with native media controls

- **File**: `services/audio/MediaSessionManager.ts`
  - **Lines**: 68-119, 174-237
  - **Issue**: Uses expo-notifications to create media control notifications rather than true lock screen controls

- **File**: `app.json`
  - **Lines**: 58-63
  - **Issue**: Already has expo-video plugin configured with supportsBackgroundPlayback, but not being used for audio

### Data Flow Analysis
Current flow:
1. User presses play → Audio stream starts → No native control registration
2. App goes to background → Audio continues → No control interface available

Required flow:
1. User presses play → Audio stream starts → Register media session
2. Update now playing info → Show lock screen controls
3. Handle remote control events → Update playback state

### Dependencies
Options identified from research:
1. **expo-video** (workaround in managed workflow)
2. **react-native-track-player** (requires development build)
3. **Custom native modules** (requires native development)

## Impact Analysis

### Direct Impact
- Users cannot control playback from lock screen
- Poor user experience compared to standard audio apps
- Increased battery usage as users must keep app in foreground

### Indirect Impact
- Lower user satisfaction and retention
- Negative app store reviews
- Reduced listening time due to control friction

### Risk Assessment
- High risk of user abandonment if not fixed
- Competitive disadvantage vs other radio apps
- Technical debt if workaround chosen over proper solution

## Solution Approach

### Fix Strategy
Based on the research and project constraints, recommend the **expo-video workaround** for immediate implementation:

**Rationale**:
1. Stays within managed workflow (no ejection required)
2. Provides functional lock screen controls immediately
3. Allows future migration when expo-audio adds support
4. Community-proven approach with production deployments

### Alternative Solutions
1. **react-native-track-player** (Development Build)
   - Pros: Professional features, robust streaming
   - Cons: Requires ejection, complex setup, architecture issues

2. **Wait for expo-audio updates**
   - Pros: Official solution, no workarounds
   - Cons: Unknown timeline, blocks feature delivery

### Risks and Trade-offs
- **Architectural debt**: Using video player for audio
- **Performance overhead**: Unnecessary video processing
- **Migration effort**: Will need refactoring when expo-audio ready

## Implementation Plan

### Changes Required

1. **expo-video already installed and configured**:
   - Package already present in package.json (line 39)
   - Plugin already configured in app.json (lines 58-63)
   - Background modes already set for iOS (lines 14-17)

2. **Create new video-based audio service**:
   - File: `services/audio/ExpoVideoAudioService.ts`
   - Implement using useVideoPlayer hook with showNowPlayingNotification
   - Replace current AudioService with video-based implementation

3. **Refactor existing services**:
   - Modify `services/audio/index.ts` to export new video-based service
   - Keep existing AudioService as fallback option
   - Remove MediaSessionManager notification workaround

4. **Update hook integration**:
   - File: `hooks/useAudio.ts`
   - Switch to use new ExpoVideoAudioService
   - Handle video player events for audio streaming

5. **Metadata handling**:
   - Reuse existing StreamController for URL management
   - Add metadata polling for Shoutcast ICY protocol
   - Update now playing info through expo-video API

### Testing Strategy
1. Test lock screen controls on iOS and Android
2. Verify background playback continuity
3. Test control center/notification shade integration
4. Validate metadata display updates
5. Test network interruption handling

### Rollback Plan
Keep existing audio implementation alongside new one, with feature flag to switch between them if issues arise.