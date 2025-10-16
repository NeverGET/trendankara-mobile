# TrackPlayer Migration Rollback Procedure

This document describes how to quickly roll back from `react-native-track-player` to `expo-video` if issues are discovered in production.

## Quick Rollback (No Code Changes Required)

The TrackPlayer migration was designed with instant rollback capability via feature flag.

### Step 1: Toggle Feature Flag

Edit `constants/config.ts` and change:

```typescript
USE_TRACK_PLAYER: false,  // Change from true to false
```

### Step 2: Rebuild and Deploy

**For OTA Update (Fastest - Recommended):**
```bash
eas update --branch production
```

**For Full Native Build (If OTA Doesn't Work):**
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

### Step 3: Verify Rollback

1. Open the app
2. Start playing radio stream
3. Check logs - should see: `[RadioPlayerControls] VideoPlayerService initialized`
4. Check for `📹 VideoPlayer` badge in development mode
5. Verify no audio cutoffs when song changes

## What Happens During Rollback?

When `USE_TRACK_PLAYER` is set to `false`:

- **Service Selection**: `RadioPlayerControls` automatically uses `videoPlayerService` instead of `trackPlayerService`
- **Metadata Updates**: Static metadata ("Trend Ankara" / "Canlı Yayın") is used instead of dynamic updates
- **Audio Interruption**: 200-500ms cutoffs return (known behavior)
- **Native Controls**: Continue to work via expo-video's notification system

## Rollback Validation Checklist

After rollback, verify these features still work:

- [ ] Radio stream starts playing
- [ ] Play/Pause controls work
- [ ] Stop button works
- [ ] Volume/Mute controls work
- [ ] Lock screen controls appear
- [ ] Background playback continues
- [ ] App doesn't crash on play/pause
- [ ] Bluetooth controls work (if available)

## Common Rollback Scenarios

### Scenario 1: Audio Doesn't Play After Update

**Symptoms:**
- Play button pressed but no audio
- Console shows `[TrackPlayerService] Failed to initialize`

**Solution:**
```typescript
// constants/config.ts
USE_TRACK_PLAYER: false,
```

Then rebuild or OTA update.

### Scenario 2: Metadata Updates Cause Crashes

**Symptoms:**
- App crashes when song changes
- Console shows `[TrackPlayerService] Failed to update metadata`

**Solution:**
Same as Scenario 1 - toggle feature flag and redeploy.

### Scenario 3: Background Playback Stops Working

**Symptoms:**
- Audio stops when app goes to background
- Lock screen controls don't appear

**Solution:**
```typescript
// constants/config.ts
USE_TRACK_PLAYER: false,
```

expo-video's background playback is more stable in this case.

## Gradual Rollout Strategy

To minimize risk, use this gradual rollout approach:

### Phase 1: Development Testing (Current State)
```typescript
USE_TRACK_PLAYER: false,  // Keep disabled initially
```

### Phase 2: Internal Testing
```typescript
USE_TRACK_PLAYER: true,   // Enable for internal builds only
```

Test with team members for 2-3 days.

### Phase 3: Beta Testing (10% of users)
```typescript
USE_TRACK_PLAYER: true,   // Enable for beta channel
```

Deploy via `eas update --branch beta` and monitor for 1 week.

### Phase 4: Production Rollout (100% of users)
```typescript
USE_TRACK_PLAYER: true,   // Enable for production
```

Deploy via `eas update --branch production`.

### Phase 5: Monitoring Period

Monitor for 2 weeks:
- Crash rates
- Audio playback errors
- User complaints about audio issues

## Permanent Removal (Optional - After 30 Days Success)

If TrackPlayer works perfectly for 30+ days, consider removing expo-video dependencies:

**DO NOT DO THIS UNLESS ABSOLUTELY CERTAIN!**

1. Remove expo-video from `package.json`
2. Remove expo-video plugin from `app.json`
3. Delete `VideoPlayerService.ts`
4. Remove `USE_TRACK_PLAYER` feature flag (always use TrackPlayer)

## Emergency Contact

If rollback doesn't work or issues persist:

1. Check `__tests__/services/audio/` for test failures
2. Review logs in Expo Application Services
3. Check GitHub Issues: https://github.com/doublesymmetry/react-native-track-player/issues
4. Review expo-video documentation: https://docs.expo.dev/versions/latest/sdk/video/

## Key Files for Rollback

**Configuration:**
- `constants/config.ts` - Feature flags
- `app.json` - Native plugins

**Service Files:**
- `services/audio/VideoPlayerService.ts` - Fallback service (KEEP THIS!)
- `services/audio/TrackPlayerService.ts` - New service
- `services/audio/PlaybackService.ts` - Background service
- `index.js` - Service registration

**Component Integration:**
- `components/radio/RadioPlayerControls.tsx` - Service selection logic

**Tests:**
- `__tests__/services/audio/TrackPlayerService.test.ts`
- `__tests__/services/audio/PlaybackService.test.ts`
- `__tests__/components/radio/RadioPlayerControls.test.tsx`

## Rollback Success Criteria

Rollback is successful when:

1. ✅ App builds without errors
2. ✅ Radio stream plays audio
3. ✅ No increase in crash rate
4. ✅ Background playback works
5. ✅ Lock screen controls work
6. ✅ All unit tests pass

## Post-Rollback Analysis

If rollback was necessary, investigate:

1. **What went wrong?**
   - Check error logs
   - Review user reports
   - Analyze crash reports

2. **Was it a bug or limitation?**
   - Bug: Can be fixed and redeployed
   - Limitation: May need alternative solution

3. **Can we fix and retry?**
   - Yes: Fix issue, test thoroughly, redeploy
   - No: Keep expo-video, document why

## Version History

| Date | Action | Version | Result |
|------|--------|---------|--------|
| 2025-10-01 | Initial implementation | v1.0.0 | Feature flag disabled |
| TBD | Beta testing | v1.1.0 | TBD |
| TBD | Production rollout | v1.2.0 | TBD |

---

**Last Updated:** October 1, 2025
**Document Version:** 1.0
**Status:** Ready for use
