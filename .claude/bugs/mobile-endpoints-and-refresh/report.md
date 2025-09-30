# Bug Report

## Bug Summary
Mobile app endpoints not loading correctly in built version, especially news tab. Need to add scroll-to-refresh feature for news and sponsors tabs (polls tab already has it).

## Bug Details

### Expected Behavior
- News tab should load and display news articles
- All tabs should load their respective data from API endpoints
- News and sponsors tabs should support scroll-to-refresh like polls tab

### Actual Behavior
- News tab shows no news loading (especially in built version)
- Other tabs may be loading some data but status is uncertain
- News and sponsors tabs lack scroll-to-refresh functionality

### Steps to Reproduce
1. Build the mobile app
2. Open the app on Android emulator
3. Navigate to News tab
4. Observe no news articles loading
5. Try to pull-to-refresh on News tab - feature doesn't exist
6. Try to pull-to-refresh on Sponsors tab - feature doesn't exist

### Environment
- **Version**: 1.0.0
- **Platform**: Android (emulator), Mobile app (built version)
- **Configuration**:
  - API Base URL: https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1
  - Expo SDK 54
  - React Native 0.81.4

## Impact Assessment

### Severity
- [x] High - Major functionality broken
- [ ] Critical - System unusable
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
All mobile app users, especially those using the built version (not Expo Go)

### Affected Features
1. News tab - no data loading
2. Potentially other tabs (cards/sponsors, polls)
3. Missing scroll-to-refresh on news tab
4. Missing scroll-to-refresh on sponsors tab

## Additional Context

### Error Messages
```
To be investigated - need to check console logs and network requests
```

### Screenshots/Media
- Android emulator is currently running
- Expo server was previously running (now killed)

### Related Issues
- API endpoints working through GCP proxy
- May be related to API response format handling
- Could be caching issues
- Could be network request configuration in built version

## Initial Analysis

### Suspected Root Cause
1. **API Response Format Mismatch**: The news service expects specific response formats but API may return different structure
2. **Network Configuration**: Built version may have different network behavior than Expo Go
3. **Missing RefreshControl**: News and sponsors tabs don't implement RefreshControl component

### Affected Components
1. `/app/(tabs)/news.tsx` - News tab screen (no refresh control)
2. `/app/(tabs)/sponsors.tsx` - Sponsors tab screen (no refresh control)
3. `/services/api/news.ts` - News API service
4. `/services/api/cards.ts` - Cards API service
5. `/services/api/client.ts` - API client configuration
6. Possibly other API services

### Investigation Needed
1. Test API endpoints directly in built app
2. Check console logs for network errors
3. Verify API response format matches expected interface
4. Test with Expo Go vs built version
5. Add scroll-to-refresh to news and sponsors tabs