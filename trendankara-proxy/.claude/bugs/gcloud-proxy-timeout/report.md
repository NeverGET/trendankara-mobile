# Bug Report: GCloud Proxy Vote API Timeout

## Bug Summary
The GCloud proxy function times out when processing POST requests to the Vote API endpoint, while all GET requests (News API, Polls API) work correctly. Direct access to the backend Vote API works fine (~2 seconds), but accessing through the proxy results in a Gateway Timeout after ~30 seconds.

## Bug Details

### Expected Behavior
- Vote API POST requests through the proxy should complete successfully within 5 seconds
- Users should be able to vote on polls through the mobile app
- Response should include updated vote counts and percentages
- Success rate should be >99%

### Actual Behavior
- Vote API POST requests through the proxy timeout after ~30 seconds
- Returns Gateway Timeout error (504)
- Mobile users cannot vote on polls through the app
- Success rate for Vote API is 0% through proxy

**Error Response**:
```json
{
    "error": "Gateway Timeout",
    "message": "The backend server took too long to respond",
    "code": "TIMEOUT_ERROR",
    "timestamp": "2025-10-16T06:15:02.867Z"
}
```

### Steps to Reproduce
1. Send POST request to proxy vote endpoint:
   ```bash
   curl -X POST \
     "https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/polls/11/vote" \
     -H "Content-Type: application/json" \
     -H "X-Forwarded-For: 203.0.113.100" \
     -d '{
       "itemId": 21,
       "deviceInfo": {
         "deviceId": "test-vote-proxy-12345",
         "platform": "android",
         "appVersion": "1.0.0",
         "userAgent": "TrendAnkara-Test/1.0.0"
       }
     }'
   ```
2. Wait for response
3. Observe Gateway Timeout error after ~30 seconds

### Environment
- **GCloud Function**: `trendankara-proxy`
- **Region**: europe-west3
- **Project**: kapitel-h
- **Runtime**: Node.js 18
- **Current Timeout**: ~30 seconds (default)
- **Backend**: https://www.trendankara.com
- **Test Date**: 2025-10-16

## Impact Assessment

### Severity
- [x] Critical - Major functionality broken
- [ ] High - Major functionality broken
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
- All mobile app users (Android and iOS)
- Users attempting to vote on polls through the mobile application
- Affects user engagement and poll participation metrics

### Affected Features
- **Vote API (POST)**: Completely non-functional through proxy
- **Mobile Poll Voting**: Users cannot cast votes
- **User Engagement**: Poll participation blocked

**Working Features**:
- News API (GET) - ✅ Working
- Polls API (GET) - ✅ Working (recently fixed)
- Poll Images - ✅ Accessible
- CORS Headers - ✅ Configured correctly
- IP Forwarding - ✅ Headers present

## Additional Context

### Performance Comparison

| Endpoint | Direct Access | Proxy Access | Status |
|----------|---------------|--------------|--------|
| News API (GET) | ~800ms | ~1.8s | ✅ PASS |
| Polls API (GET) | ~700ms | ~1.9s | ✅ PASS |
| Vote API (POST) | ~1.8s | Timeout (30s+) | ❌ FAIL |

### Direct Access Works Correctly
```bash
# Direct backend access succeeds in ~2 seconds
curl -X POST "https://www.trendankara.com/api/mobile/v1/polls/11/vote" \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 203.0.113.100" \
  -d '{...}'

# Response:
{
    "success": true,
    "data": {
        "success": true,
        "message": "Oyunuz başarıyla kaydedildi",
        "updatedCounts": [...]
    }
}
```

### Proxy Context
The proxy exists to resolve SSL certificate issues preventing mobile devices from connecting directly to `https://www.trendankara.com`. The proxy provides:
- Valid, trusted SSL certificates (GCloud)
- CORS header handling for mobile apps
- Request forwarding with IP preservation

**Request Flow**:
```
Mobile App → [SSL] → GCloud Proxy → Backend API → Response → Proxy → Mobile App
```

### Error Messages
```json
{
    "error": "Gateway Timeout",
    "message": "The backend server took too long to respond",
    "code": "TIMEOUT_ERROR",
    "timestamp": "2025-10-16T06:15:02.867Z"
}
```

### Related Issues
- Backend Polls API was returning 500 errors - **FIXED** (now returns 200 OK)
- Vote endpoint works correctly when accessed directly
- Only proxy timeout configuration is the remaining blocker

## Initial Analysis

### Suspected Root Cause
**GCloud Function timeout configuration is too short for POST requests**

The default GCloud Function timeout (assumed to be 30 seconds) is insufficient for vote processing requests which can occasionally exceed this threshold when accounting for:
- Database write operations (~1-2s)
- Transaction processing
- Network latency (proxy → backend → proxy) (~1s)
- Database connection overhead
- Potential database locks during concurrent votes

**Evidence**:
- Direct backend response: ~1.8 seconds ✅
- Expected proxy overhead: ~1 second
- Expected total time: ~2.8 seconds
- Actual timeout threshold: ~30 seconds
- **Issue**: Proxy times out before backend completes response

### Affected Components
- **GCloud Function Configuration**: `trendankara-proxy` timeout settings
- **Proxy Code**: HTTP client timeout configuration (if using axios/fetch)
- **Deployment Config**: `index.js` or Firebase Functions configuration

**Files likely involved**:
- `/index.js` - Main proxy entry point
- `/package.json` - Function configuration
- GCloud Function deployment settings

### Backend Status
✅ **Backend is working correctly**
- All direct API calls succeed
- Vote processing completes in ~2 seconds
- Database operations are performant
- No backend code changes needed

---

**Priority**: 🔴 **CRITICAL** - Blocks core mobile functionality (voting)

**Estimated Fix Time**: 15 minutes deployment + 30 minutes testing

**Solution**: Increase GCloud Function timeout from 30s to 60s
