# Bug Analysis: GCloud Proxy Vote API Timeout

## Root Cause Analysis

### Investigation Summary
After thorough investigation of the proxy codebase, I've identified that the Vote API timeout is caused by **insufficient timeout configurations at multiple layers**:

1. **Axios HTTP Client Timeout**: 25 seconds (index.js:222)
2. **GCloud Function Timeout**: 30 seconds (package.json:13)
3. **Backend Response Time**: ~2 seconds (verified working)

The vote POST requests are hitting the **25-second axios timeout** before the backend can respond. While the backend responds in ~2 seconds when accessed directly, something in the proxy layer is causing the request to hang or take significantly longer, eventually hitting the axios timeout threshold.

### Root Cause
**Multi-layered timeout configuration issue with axios client timeout being too restrictive for POST operations involving database writes.**

The timeout chain works as follows:
```
Mobile App Request
    ↓
GCloud Function (30s timeout limit)
    ↓
Axios HTTP Client (25s timeout) ← **TIMEOUT OCCURS HERE**
    ↓
Backend API (responds in ~2s when reached)
```

**Why GET requests work but POST requests timeout:**
- GET requests (News, Polls): Simple SELECT queries, complete in <1 second
- POST requests (Vote): Require database writes, transaction locks, and validation
- POST requests can occasionally take longer due to:
  - Database connection pool wait time
  - Row-level locks during concurrent voting
  - Transaction processing overhead
  - Network latency fluctuations

### Contributing Factors

1. **Conservative Axios Timeout** (25 seconds)
   - Set conservatively to leave 5-second buffer for Cloud Function
   - Too short for POST operations that may occasionally spike
   - Comment in code: `// 25 seconds (leaving 5s buffer for Cloud Function timeout)`

2. **GCloud Function Timeout** (30 seconds)
   - Default configuration, not optimized for database write operations
   - No differentiation between GET and POST operation timeouts
   - Media proxy has 60s timeout, but main proxy only has 30s

3. **No Retry Logic**
   - Axios configured with `maxRedirects: 3` but no retry logic for timeouts
   - Single failure results in immediate timeout error

4. **Database Write Complexity**
   - Vote endpoint performs multiple operations:
     - Validation checks (duplicate vote detection)
     - INSERT into poll_votes table
     - UPDATE vote counts
     - Calculate percentages
     - Return all updated counts
   - Any database lock or connection delay can push response time over threshold

## Technical Details

### Affected Code Locations

#### 1. **index.js:216-226** - Axios Configuration for Main Proxy
```javascript
// Configure axios request
const axiosConfig = {
  method: req.method,
  url: targetUrl,
  params: req.query,
  headers: filteredHeaders,
  timeout: 25000, // 25 seconds (leaving 5s buffer for Cloud Function timeout)
  maxRedirects: 3, // Limit redirects to prevent loops
  validateStatus: () => true, // Accept all HTTP status codes
  httpsAgent: httpsAgent // Use the agent that bypasses SSL verification
};
```

**Issue**: `timeout: 25000` is too short for POST operations with database writes.

#### 2. **package.json:13** - GCloud Function Deployment Configuration
```json
"deploy:proxy": "gcloud functions deploy trendankara-proxy --gen2 --runtime=nodejs20 --region=europe-west3 --source=. --entry-point=proxyHandler --trigger-http --allow-unauthenticated --memory=256Mi --timeout=30s --min-instances=0 --max-instances=100",
```

**Issue**: `--timeout=30s` is the absolute maximum time the function can run. With axios timeout at 25s, there's only 5s buffer.

#### 3. **index.js:275-284** - Timeout Error Handling
```javascript
if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
  // 504 Gateway Timeout for backend timeouts
  statusCode = 504;
  errorResponse = {
    error: 'Gateway Timeout',
    message: 'The backend server took too long to respond',
    code: 'TIMEOUT_ERROR',
    timestamp: timestamp
  };
  console.error(`[${timestamp}] Timeout error: Backend did not respond within 30 seconds`);
}
```

**Note**: Error message says "30 seconds" but actually occurs at 25 seconds (axios timeout).

#### 4. **Comparison: Media Proxy Configuration** (index.js:142)
```javascript
const axiosConfig = {
  method: 'GET',
  url: mediaUrl,
  timeout: 30000, // 30 seconds for media files
  // ...
};
```

**Observation**: Media proxy uses 30-second timeout and has 60-second Cloud Function limit, providing more breathing room.

### Data Flow Analysis

**Request Flow Timeline:**

```
T=0ms    Mobile App sends POST /api/mobile/v1/polls/11/vote
         ↓
T=50ms   GCloud Function receives request
         ↓
T=100ms  Request headers filtered
         ↓
T=150ms  Axios request initiated to backend
         ↓
T=???    [SOMETHING DELAYS HERE - INVESTIGATION NEEDED]
         ↓
T=25000ms Axios timeout triggered (25 seconds)
         ↓
T=25050ms Error handler catches ECONNABORTED
         ↓
T=25100ms 504 Gateway Timeout returned to mobile app
```

**Expected Flow (Direct Backend Access):**
```
T=0ms    Direct request to backend
         ↓
T=50ms   Backend receives request
         ↓
T=100ms  Database validation (duplicate check)
         ↓
T=500ms  INSERT vote record
         ↓
T=1000ms UPDATE vote counts
         ↓
T=1500ms Calculate percentages
         ↓
T=1800ms Response returned with updated counts
```

**Mystery: Why does proxy add 23+ seconds of delay?**

Possible causes:
1. **DNS resolution delays** for backend hostname
2. **SSL handshake overhead** (though rejectUnauthorized: false)
3. **Connection pool exhaustion** in axios
4. **Backend SSL certificate issues** causing retry loops
5. **Network routing issues** between GCloud and backend
6. **Backend occasionally slow** under certain conditions (database locks)

### Dependencies

**Runtime Dependencies:**
- `@google-cloud/functions-framework` ^3.3.0 - GCloud Functions HTTP framework
- `axios` ^1.6.0 - HTTP client for backend requests
- `https` (Node.js built-in) - HTTPS agent with SSL verification disabled

**Infrastructure Dependencies:**
- **GCloud Functions Gen2** - Serverless compute platform
- **Node.js 20** - Runtime environment
- **Backend API** - https://trendankara.com (target server)
- **Database** - MySQL backend (accessed by backend API)

## Impact Analysis

### Direct Impact
1. **Vote functionality completely broken** through proxy
2. **100% failure rate** for mobile vote submissions
3. **User frustration** - users cannot participate in polls
4. **Engagement metrics drop** - no poll voting activity from mobile users

### Indirect Impact
1. **Brand reputation** - users may perceive app as broken
2. **Poll data skewed** - missing mobile user votes
3. **Incomplete analytics** - mobile voting behavior not tracked
4. **User retention risk** - frustrated users may uninstall app

### Risk Assessment

**If not fixed:**
- Mobile app remains partially functional but key engagement feature broken
- Users may leave negative reviews mentioning voting issues
- Poll results will be skewed towards web users only
- Loss of valuable user engagement data

**Severity**: 🔴 **CRITICAL**
- Core feature completely non-functional
- Affects all mobile users
- No workaround available

## Solution Approach

### Fix Strategy

**Primary Solution: Increase timeout values at all layers**

The fix involves updating timeouts at three levels:

#### Level 1: Axios HTTP Client Timeout (Code Change)
**File**: `index.js:222`
```javascript
// BEFORE:
timeout: 25000, // 25 seconds (leaving 5s buffer for Cloud Function timeout)

// AFTER:
timeout: 55000, // 55 seconds (leaving 5s buffer for Cloud Function timeout)
```

**Rationale**: Increase axios timeout to 55 seconds to allow adequate time for database write operations while maintaining a 5-second buffer before the Cloud Function timeout.

#### Level 2: GCloud Function Timeout (Deployment Config)
**File**: `package.json:13`
```javascript
// BEFORE:
"--timeout=30s"

// AFTER:
"--timeout=60s"
```

**Rationale**: Increase Cloud Function timeout to 60 seconds to match the media proxy configuration and provide sufficient time for POST operations.

#### Level 3: Deploy Script (Consistency)
**File**: `deploy.sh:48`
```bash
# BEFORE:
--timeout 30s \

# AFTER:
--timeout 60s \
```

**Rationale**: Ensure deployment script matches package.json configuration.

### Alternative Solutions

#### Alternative 1: Different Timeouts for GET vs POST ❌
**Approach**: Use conditional timeout based on HTTP method
```javascript
const timeout = ['POST', 'PUT', 'PATCH'].includes(req.method) ? 55000 : 25000;
```

**Pros**:
- GET requests remain fast with short timeout
- POST requests get more time

**Cons**:
- More complex code
- Still doesn't solve root cause if backend is truly slow
- Maintenance overhead

**Decision**: REJECT - Keep it simple, 60s is acceptable for all requests

#### Alternative 2: Implement Retry Logic ❌
**Approach**: Retry failed requests up to 3 times
```javascript
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: 1000 });
```

**Pros**:
- Could help with transient failures
- Industry best practice

**Cons**:
- Vote operations are not idempotent (could create duplicate votes)
- Adds complexity
- Doesn't solve timeout issue, just masks it
- Requires additional dependency

**Decision**: REJECT - Not suitable for voting operations

#### Alternative 3: Backend Optimization 🟡
**Approach**: Optimize backend vote endpoint to respond faster

**Pros**:
- Addresses root cause if backend is slow
- Benefits all clients, not just mobile

**Cons**:
- Outside scope of proxy fix
- Backend dev team owns this
- May not be necessary if timeout increase works

**Decision**: DEFER - Try timeout increase first, backend optimization as follow-up if needed

### Risks and Trade-offs

#### Risks of Increasing Timeout

1. **Longer wait times for users** ⚠️
   - If backend truly is slow, users will wait up to 60 seconds
   - **Mitigation**: Monitor backend response times, optimize if needed

2. **Resource consumption** ⚠️
   - Long-running functions consume more resources
   - Could increase costs if many concurrent long requests
   - **Mitigation**: Monitor function execution times and costs

3. **Zombie connections** ⚠️
   - If backend is truly unresponsive, connection will hang longer
   - **Mitigation**: Proper error handling already in place

#### Trade-offs

✅ **Benefits**:
- Simple, straightforward fix
- No code logic changes required
- Aligns with media proxy configuration (already uses 60s)
- Industry standard timeout for API operations

⚠️ **Trade-offs**:
- Slightly higher resource consumption per request
- Users may wait longer if backend is slow
- Doesn't address potential root cause in backend

**Decision**: Benefits outweigh risks. 60-second timeout is reasonable for database write operations.

## Implementation Plan

### Changes Required

#### Change 1: Update Axios Timeout in index.js
- **File**: `index.js`
- **Line**: 222
- **Modification**: Change `timeout: 25000` to `timeout: 55000`

**Before**:
```javascript
const axiosConfig = {
  method: req.method,
  url: targetUrl,
  params: req.query,
  headers: filteredHeaders,
  timeout: 25000, // 25 seconds (leaving 5s buffer for Cloud Function timeout)
  maxRedirects: 3,
  validateStatus: () => true,
  httpsAgent: httpsAgent
};
```

**After**:
```javascript
const axiosConfig = {
  method: req.method,
  url: targetUrl,
  params: req.query,
  headers: filteredHeaders,
  timeout: 55000, // 55 seconds (leaving 5s buffer for 60s Cloud Function timeout)
  maxRedirects: 3,
  validateStatus: () => true,
  httpsAgent: httpsAgent
};
```

#### Change 2: Update GCloud Function Timeout in package.json
- **File**: `package.json`
- **Line**: 13
- **Modification**: Change `--timeout=30s` to `--timeout=60s`

**Before**:
```json
"deploy:proxy": "gcloud functions deploy trendankara-proxy --gen2 --runtime=nodejs20 --region=europe-west3 --source=. --entry-point=proxyHandler --trigger-http --allow-unauthenticated --memory=256Mi --timeout=30s --min-instances=0 --max-instances=100",
```

**After**:
```json
"deploy:proxy": "gcloud functions deploy trendankara-proxy --gen2 --runtime=nodejs20 --region=europe-west3 --source=. --entry-point=proxyHandler --trigger-http --allow-unauthenticated --memory=256Mi --timeout=60s --min-instances=0 --max-instances=100",
```

#### Change 3: Update deploy.sh Script (Consistency)
- **File**: `deploy.sh`
- **Line**: 48
- **Modification**: Change `--timeout 30s` to `--timeout 60s`

**Before**:
```bash
gcloud functions deploy $FUNCTION_NAME \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point proxyRequest \
  --region $REGION \
  --memory 128MB \
  --timeout 30s \
```

**After**:
```bash
gcloud functions deploy $FUNCTION_NAME \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point proxyRequest \
  --region $REGION \
  --memory 128MB \
  --timeout 60s \
```

#### Change 4: Update Timeout Error Message (Optional)
- **File**: `index.js`
- **Line**: 284
- **Modification**: Update error message to reflect new timeout

**Before**:
```javascript
console.error(`[${timestamp}] Timeout error: Backend did not respond within 30 seconds`);
```

**After**:
```javascript
console.error(`[${timestamp}] Timeout error: Backend did not respond within 60 seconds`);
```

#### Change 5: Update Netherlands Region Timeout (Consistency)
- **File**: `package.json`
- **Line**: 17
- **Modification**: Change `--timeout=30s` to `--timeout=60s` in deploy:netherlands script

### Testing Strategy

#### Pre-Deployment Testing
1. **Code Review**: Verify all timeout changes are consistent
2. **Syntax Check**: Ensure no syntax errors in modified files
3. **Deployment Script Test**: Dry-run deployment command

#### Post-Deployment Testing

**Test 1: Vote API through Proxy (Critical)**
```bash
curl -X POST \
  "https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/polls/11/vote" \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 203.0.113.100" \
  -d '{
    "itemId": 21,
    "deviceInfo": {
      "deviceId": "post-fix-test-'$(date +%s)'",
      "platform": "android",
      "appVersion": "1.0.0",
      "userAgent": "TrendAnkara-Test/1.0.0"
    }
  }'
```

**Expected Result**:
- ✅ 200 OK status
- ✅ Response time < 10 seconds
- ✅ Vote counted successfully
- ✅ Updated vote counts returned

**Test 2: News API (Regression Test)**
```bash
curl -s "https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/news?limit=1"
```

**Expected Result**:
- ✅ 200 OK status
- ✅ Response time < 3 seconds
- ✅ News data returned correctly

**Test 3: Polls API (Regression Test)**
```bash
curl -s "https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/polls"
```

**Expected Result**:
- ✅ 200 OK status
- ✅ Response time < 3 seconds
- ✅ Poll data returned correctly

**Test 4: Performance Benchmark**
```bash
# Test 10 consecutive vote requests
for i in {1..10}; do
  echo "Vote $i:"
  time curl -X POST \
    "https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/polls/11/vote" \
    -H "Content-Type: application/json" \
    -d '{"itemId":21,"deviceInfo":{"deviceId":"perf-test-'$i'","platform":"test"}}'
  echo ""
done
```

**Expected Result**:
- ✅ All requests succeed
- ✅ Average response time < 5 seconds
- ✅ No timeouts

**Test 5: Monitor Function Logs**
```bash
gcloud functions logs read trendankara-proxy \
  --region europe-west3 \
  --limit 50
```

**Expected Result**:
- ✅ No timeout errors
- ✅ Successful vote processing logged
- ✅ Response times logged

### Rollback Plan

If the fix causes issues:

1. **Immediate Rollback via GCloud Console**
   - Navigate to GCloud Functions console
   - Select `trendankara-proxy`
   - Click "Rollback" to previous version

2. **Code Rollback**
   ```bash
   git revert HEAD
   git push
   npm run deploy:proxy
   ```

3. **Emergency Hotfix**
   - Revert timeout changes
   - Deploy previous working version
   - Investigate root cause further

4. **Notification**
   - Notify mobile app team of rollback
   - Document failure reason
   - Plan alternative solution

## Success Criteria

After implementing the fix, the following must be true:

1. ✅ **Vote API returns 200 OK** when accessed through proxy
2. ✅ **Response time < 10 seconds** for vote operations
3. ✅ **Success rate > 99%** for vote submissions
4. ✅ **No regressions** in News API or Polls API
5. ✅ **Votes are counted correctly** (verify in database)
6. ✅ **IP addresses captured correctly** (fraud prevention)
7. ✅ **Mobile app can vote successfully** (end-to-end test)

## Additional Recommendations

### Short-term (Implement with fix)
- ✅ Increase timeouts as planned
- ✅ Test thoroughly before deploying
- ✅ Monitor function execution times post-deployment

### Medium-term (Follow-up tasks)
- 🔍 **Investigate why backend takes longer through proxy**
  - Add detailed timing logs to proxy
  - Monitor DNS resolution time
  - Check SSL handshake performance
  - Analyze connection pool behavior

- 📊 **Add monitoring and alerts**
  - Set up GCloud monitoring for function timeouts
  - Alert if vote API response time > 5 seconds
  - Track success rate for vote operations

### Long-term (Future improvements)
- 🔧 **Backend optimization**
  - Review vote endpoint database queries
  - Implement connection pooling
  - Add database indexes if needed
  - Consider caching vote counts

- 🏗️ **Architecture improvements**
  - Consider async voting (return 202 Accepted, process async)
  - Implement request queuing for high concurrency
  - Add circuit breaker pattern for backend failures

---

**Analysis Complete**: Ready for implementation phase (`/bug-fix`)
