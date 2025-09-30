# TrendAnkara Mobile App - Issues and Fixes

## 🔍 Current Issues Identified

### 1. ❌ News API Endpoint Error
**Problem**: News endpoint still has `[object Object]/news` malformation in some places
- **Error**: `API Error: 404 [object Object]/news`
- **Location**: Initial API initialization
- **Impact**: News won't load on first app launch

### 2. ⚠️ React State Update Warning
**Problem**: Components trying to update state before mounting
- **Error**: `Can't perform a React state update on a component that hasn't mounted yet`
- **Impact**: Potential memory leaks and performance issues

### 3. ❌ Network Test Failures
**Problem**: Test connection still trying to reach direct IPs that fail
- **Impact**: Confusing test results showing failures for working proxy

### 4. ⚠️ Background Refresh Error
**Problem**: Background refresh failing with undefined radioService
- **Error**: `Cannot read property 'getRadioConfig' of undefined`
- **Location**: `ApiInitializationService#refreshCriticalData`

### 5. ⚠️ Dual Audio System Conflict
**Problem**: App has both expo-av and expo-video audio systems running
- **Impact**: Potential conflicts and deprecated warnings

### 6. 📊 Empty Data from API
**Problem**: Some API endpoints return empty data
- **Cards**: Returns 0 cards
- **Polls**: May return empty
- **News**: May return empty

## 📝 Fixes Required

### Fix 1: Complete News Endpoint URL Fix
```typescript
// File: /services/api/initialization.ts
// Find all instances where news is being fetched and ensure they use buildApiUrl

// Check lines around 76, 179, and 250
// Replace any buildUrl with buildApiUrl for news endpoints
```

### Fix 2: Fix React State Updates
```typescript
// Add proper cleanup and mounting checks in components
// Example fix for components:

useEffect(() => {
  let mounted = true;

  const fetchData = async () => {
    const data = await api.getData();
    if (mounted) {
      setState(data);
    }
  };

  fetchData();

  return () => {
    mounted = false;
  };
}, []);
```

### Fix 3: Remove Old Test Endpoints
```typescript
// File: /services/api/testConnection.ts
// Already fixed - removed direct IP tests
// Verify the changes are saved and hot-reloaded
```

### Fix 4: Fix Background Refresh Service
```typescript
// File: /services/api/initialization.ts
// Around line 174, fix the import and ensure radioService is properly imported

import { radioApi } from './radio';

// Replace radioService with radioApi
await radioApi.getRadioConfig(true);
```

### Fix 5: Remove Deprecated expo-av
```bash
# Steps to migrate from expo-av to expo-video completely:

1. Remove expo-av dependency:
   npm uninstall expo-av

2. Update all imports from 'expo-av' to use expo-video or remove

3. Update the following files:
   - /components/radio/RadioPlayerControls.tsx (already using expo-av directly)
   - /services/audio/WorkingAudioService.ts
   - /services/audio/AudioService.ts
   - /services/audio/StreamController.ts
   - /services/audio/MediaSessionManager.ts
   - /services/audio/NativeMediaControls.ts
   - /services/audio/MediaNotificationService.ts
```

### Fix 6: Backend Data Issues
```markdown
These require backend fixes or proper mock data:
- Cards endpoint returns 0 cards - needs backend data
- Consider adding mock data for development
- Ensure proper error handling when data is empty
```

## 🚀 Quick Fixes to Apply Now

### 1. Fix buildUrl to buildApiUrl in all remaining places
```bash
# Find and replace in initialization service
grep -r "buildUrl" services/api/initialization.ts
```

### 2. Fix the background refresh
```typescript
// File: services/api/initialization.ts, line ~174
// Change from:
await radioService.getRadioConfig(true);
// To:
await radioApi.getRadioConfig(true);
```

### 3. Add loading states for all pages
```typescript
// Already done for polls page
// News and sponsors pages need similar updates if not showing data
```

## 📱 Testing Checklist After Fixes

- [ ] Radio plays Trend Ankara stream (not BBC)
- [ ] News page loads articles
- [ ] Polls page shows polls or "no polls" message
- [ ] Sponsors/Cards page shows cards or "no cards" message
- [ ] No React state update warnings in console
- [ ] Test connection shows only proxy endpoints
- [ ] Background refresh works without errors

## 🎯 Priority Order

1. **High**: Fix news endpoint `[object Object]` issue
2. **High**: Fix background refresh undefined error
3. **Medium**: Remove deprecated expo-av
4. **Medium**: Fix React state update warnings
5. **Low**: Add proper empty state handling for all pages

## 📊 Current Status

✅ **Working**:
- GCP Proxy is functioning
- Radio stream loads from API
- Basic navigation works
- API authentication bypassed via proxy

⚠️ **Partially Working**:
- News (has initial load issue)
- Polls (implemented but may show empty)
- Cards/Sponsors (implemented but shows 0 cards)

❌ **Not Working**:
- Background refresh
- Some initial API calls

## 🔧 Development Commands

```bash
# Check logs
npx expo start --android

# Clear cache and restart
npx expo start --clear

# Run on emulator
npx expo run:android

# Test proxy directly
curl https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/radio
```

## 📝 Notes

- The app successfully bypasses SSL issues using GCP proxy
- All main endpoints work through the proxy
- Most issues are minor and can be fixed quickly
- Backend needs to provide actual data for cards/polls