# Bug Report

## Bug Summary
Mobile app exhibits excessive power consumption during background audio playback, causing device to become hot when switching to other apps. This does not occur in comparable apps like YouTube Music.

## Bug Details

### Expected Behavior
- App should play audio in background with minimal power consumption
- Device should remain cool during extended playback sessions
- Switching to other apps should not cause excessive heat generation
- Power usage should be comparable to other streaming apps (YouTube Music, Spotify, etc.)

### Actual Behavior
- After several hours of background audio playback, device becomes slightly warm
- When switching to other apps while audio continues playing, device becomes hot
- Power consumption appears significantly higher than comparable streaming apps
- Issue occurs on both iOS and Android platforms in release builds

### Steps to Reproduce
1. Install the released version of Trend Ankara mobile app
2. Start playing audio/music
3. Lock the phone screen
4. Listen to music continuously for several hours (in locked state)
5. Unlock phone and switch to another application while music continues
6. Observe device temperature increase significantly

### Environment
- **Version**: Release build (latest)
- **Platform**: iOS and Android (both affected)
- **Configuration**: Background audio playback enabled
- **Test Conditions**: Extended playback session (several hours), locked screen, background audio playing

### Investigation Phases
- **Phase 1**: Android investigation (physical device available)
- **Phase 2**: iOS investigation (pending physical device availability - simulator available for initial checks)

## Impact Assessment

### Severity
- [x] High - Major functionality broken
- [ ] Critical - System unusable
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

**Justification**: While the app remains functional, excessive power consumption and heat generation can:
- Drain battery significantly faster than expected
- Reduce device lifespan due to thermal stress
- Negatively impact user experience
- Discourage long-term usage of the app

### Affected Users
- All users who use background audio playback feature
- Users who listen to radio for extended periods
- Particularly impacts users who multitask while listening

### Affected Features
- Background audio playback
- Overall app performance and resource usage
- Battery efficiency
- Device thermal management

## Additional Context

### Error Messages
```
No specific error messages observed. Issue manifests as thermal and power consumption problem.
```

### Screenshots/Media
None currently. Temperature and power consumption are physical observations.

**Recommended monitoring data to collect:**
- Battery usage statistics from device settings
- CPU profiling data during playback
- Memory usage patterns over time
- Network activity logs
- Audio service background tasks

### Related Issues
- Background playback implementation (TrackPlayerService)
- Audio streaming service integration
- Potential wake locks or background processes
- Network polling or unnecessary background tasks

## Initial Analysis

### Suspected Root Cause
Potential causes to investigate:

1. **Excessive Background Processing**
   - Unnecessary timers or intervals running
   - Polling mechanisms that should be event-driven
   - Redundant state updates or re-renders

2. **Audio Service Configuration**
   - TrackPlayerService configuration issues
   - Improper wake lock management
   - Audio focus handling problems

3. **Network Activity**
   - Continuous metadata polling
   - Inefficient stream buffering
   - Unnecessary API calls in background

4. **State Management Issues**
   - React Native bridge overhead
   - Frequent state synchronization
   - Memory leaks causing garbage collection pressure

5. **Native Module Issues**
   - Improper lifecycle management
   - Background task not properly optimized
   - Platform-specific resource management problems

### Affected Components
Suspected files and modules to investigate:

- `services/audio/TrackPlayerService.ts` - Audio playback service
- `services/audio/player.ts` - Player logic
- `services/audio/background.ts` - Background playback handling
- `hooks/usePlayer.ts` - Player state management hook
- `store/player.ts` - Player state store
- Any background task registrations
- Native modules for audio playback
- Expo configuration for background tasks

### Investigation Approach
**Note**: This bug workflow focuses on **investigation and documentation only**, not fixing the issue.

**Goals**:
1. Set up performance profiling tools for both iOS and Android
2. Identify specific code sections causing high power consumption
3. Document findings with concrete metrics and evidence
4. Create detailed report for future optimization work

**Investigation Plan**:

**Phase 1 - Android (Current Focus)**:
1. **Profiling Setup**
   - Configure Android Studio Profiler (CPU, Memory, Energy)
   - Set up React Native Performance Monitor for Android
   - Enable debug logging for audio service
   - Configure ADB for battery stats collection

2. **Data Collection**
   - Profile app during normal playback on Android device
   - Profile app during background playback
   - Profile app when switching between apps
   - Collect comparative data from YouTube Music or similar apps
   - Monitor CPU usage, memory, network, wake locks
   - Use `adb shell dumpsys batterystats` for detailed battery analysis

3. **Analysis**
   - Identify hot paths in code execution
   - Find unnecessary background tasks or timers
   - Check for memory leaks or excessive allocations
   - Analyze network request patterns
   - Review audio service configuration
   - Check Android wake locks and background services

4. **Documentation**
   - Document all Android-specific findings with file/line references
   - Include profiling screenshots and metrics
   - Create recommendations for Android optimization
   - Prioritize issues by impact

**Phase 2 - iOS (Future)**:
1. Will be conducted after physical iOS device becomes available
2. iOS Simulator can be used for initial non-performance checks
3. Will follow similar profiling approach using Xcode Instruments

## Success Criteria
This investigation is complete when:
- [ ] Profiling tools are set up for both platforms
- [ ] Root cause(s) of power consumption identified
- [ ] Specific code locations documented with evidence
- [ ] Quantitative metrics collected (CPU %, memory usage, etc.)
- [ ] Comparison with similar apps documented
- [ ] Detailed findings report created
- [ ] Recommendations for fixes documented (but not implemented)
