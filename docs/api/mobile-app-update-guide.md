# Mobile App Update Guide: API Changes & New Features

**Version**: 2.0
**Last Updated**: 2025-10-16
**Target Platform**: React Native (Android/iOS)
**Priority**: 🟡 **MEDIUM** - Recommended update for new features

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What Changed](#what-changed)
3. [API Changes Detail](#api-changes-detail)
4. [Migration Guide](#migration-guide)
5. [Error Handling](#error-handling)
6. [Usage Scenarios](#usage-scenarios)
7. [Testing Guide](#testing-guide)
8. [Backward Compatibility](#backward-compatibility)
9. [FAQs](#faqs)

---

## Executive Summary

### TL;DR

**What Happened:**
- ✅ **Polls API Fixed** - No more 500 errors, now returns 200 OK
- ✅ **News Deep Linking** - New `redirectUrl` field enables web article linking
- ✅ **News Detail Pages** - Dedicated web pages for each article
- ✅ **Database Updates** - New fields available for enhanced features

**Impact on Mobile App:**
- 🟢 **Low Risk** - All changes are backward compatible
- 🟢 **Optional Update** - Old apps continue to work without changes
- 🟡 **Recommended** - Update to use new features and improved UX

**Action Required:**
1. Update app to use `redirectUrl` for news deep linking (optional but recommended)
2. Remove error handling for Polls 500 errors (no longer needed)
3. Test polls loading (should work now, was broken before)
4. Update app version and release

---

### Migration Priority

| Feature | Priority | Reason |
|---------|----------|--------|
| Polls API fix | **HIGH** | Users can now see polls (was broken) |
| News redirectUrl | **MEDIUM** | Enables better UX with web articles |
| Error handling cleanup | **LOW** | Remove unnecessary error states |

---

## What Changed

### 1. Polls API - Critical Fix ✅

**Before (Broken)**:
```http
GET /api/mobile/v1/polls
```

**Response**:
```json
{
  "success": false,
  "error": "Internal Server Error"
}
HTTP Status: 500
```

**After (Fixed)**:
```http
GET /api/mobile/v1/polls
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 11,
    "title": "TREND ANKARA TOP 10",
    "description": "SEVDİĞİNİZ SANATÇI VE ŞARKILARINI OYLAYIN",
    "items": [
      {
        "id": 21,
        "title": "LVBEL C5",
        "imageUrl": "/api/media/uploads/...",
        "voteCount": 4,
        "percentage": 67
      }
    ]
  }
}
HTTP Status: 200
```

**Impact**: Polls now load successfully! 🎉

---

### 2. News API - New redirectUrl Field ✅

**Before**:
```json
{
  "id": 13,
  "title": "Article Title",
  "slug": "article-slug",
  "summary": "Article summary",
  "featuredImage": "/api/media/uploads/image.jpg",
  "category": "MAGAZINE"
  // No redirectUrl field
}
```

**After**:
```json
{
  "id": 13,
  "title": "Article Title",
  "slug": "article-slug",
  "summary": "Article summary",
  "featuredImage": "/api/media/uploads/image.jpg",
  "redirectUrl": "https://trendankara.com/news/article-slug",  // ← NEW!
  "category": "MAGAZINE"
}
```

**Impact**: Apps can now link to full web articles!

---

### 3. News Detail Pages - New Feature ✅

**New Web Pages Available**:
- URL Format: `https://trendankara.com/news/{slug}`
- Example: `https://trendankara.com/news/article-slug`
- Full article content with SEO optimization
- Mobile-responsive design

**Use Case**:
When user taps news item in app → open `redirectUrl` in WebView or external browser

---

### 4. Vote API - No Changes ✅

**Status**: Unchanged - works exactly as before

**Note**: Vote API may timeout when using proxy (see proxy documentation). Use direct connection for voting if needed.

---

## API Changes Detail

### News API Endpoint

**Endpoint**: `GET /api/mobile/v1/news`

**Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| limit | integer | No | 10 | Items per page (max 50) |
| category_id | integer | No | - | Filter by category ID |

**Request Example**:
```http
GET https://www.trendankara.com/api/mobile/v1/news?page=1&limit=10
```

Or via proxy:
```http
GET https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/news?page=1&limit=10
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 13,
        "title": "Breaking News Title",
        "slug": "breaking-news-title",
        "summary": "News summary text...",
        "featuredImage": "/api/media/uploads/1760270078266-image.jpg",
        "redirectUrl": "https://trendankara.com/news/breaking-news-title",
        "category": "MAGAZINE",
        "categoryId": 1,
        "isFeatured": false,
        "isBreaking": true,
        "isHot": false,
        "publishedAt": "2025-10-15T13:33:53.000Z",
        "views": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "hasNext": true,
    "hasPrev": false
  },
  "cache": {
    "etag": "\"74d9527feb99ea91c84a373cabf9a5d2\"",
    "maxAge": 120
  }
}
```

**New Field Details**:

#### `redirectUrl` (NEW)
- **Type**: `string | undefined`
- **Format**: `https://trendankara.com/news/{slug}`
- **When Present**: Always (auto-generated from slug)
- **When Absent**: Only if news item has no slug (rare)
- **Purpose**: Deep link to web article page

**Usage**:
```javascript
// Conceptual example (not actual code)
if (newsItem.redirectUrl) {
  // Open in WebView or external browser
  openURL(newsItem.redirectUrl);
} else {
  // Fallback: show in-app modal
  showNewsModal(newsItem);
}
```

---

### Polls API Endpoint

**Endpoint**: `GET /api/mobile/v1/polls`

**Parameters**: None

**Request Example**:
```http
GET https://www.trendankara.com/api/mobile/v1/polls
```

Or via proxy:
```http
GET https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/polls
```

**Response Structure** (FIXED - was 500 before):
```json
{
  "success": true,
  "data": {
    "id": 11,
    "title": "TREND ANKARA TOP 10",
    "description": "SEVDİĞİNİZ SANATÇI VE ŞARKILARINI OYLAYIN",
    "pollType": "monthly",
    "startDate": "2025-10-12T15:31:00.000Z",
    "endDate": "2025-11-11T15:31:00.000Z",
    "isActive": 1,
    "items": [
      {
        "id": 21,
        "title": "LVBEL C5",
        "description": "ÇOOOK PARDON",
        "imageUrl": "/api/media/uploads/1760270051503-LVBELC5.jpg",
        "voteCount": 4,
        "percentage": 67,
        "displayOrder": 0
      },
      {
        "id": 22,
        "title": "BLOCK3",
        "description": "GİT",
        "imageUrl": "/api/media/uploads/1760270027845-BLOCK3.webp",
        "voteCount": 1,
        "percentage": 17,
        "displayOrder": 1
      }
    ]
  },
  "cache": {
    "etag": "27126ffbba093e99106ff4edc37a817a",
    "maxAge": 60
  }
}
```

**Key Changes**:
- ✅ **Status**: 200 OK (was 500 Internal Server Error)
- ✅ **Data**: Complete poll with items (was error message)
- ✅ **Images**: All imageUrl fields present and valid

**No Active Poll Response**:
```json
{
  "success": true,
  "data": null
}
```

**App Should**:
- ✅ Remove error handling for 500 errors on polls endpoint
- ✅ Handle `data: null` case (no active poll)
- ✅ Display poll items with images
- ✅ Show vote counts and percentages

---

### Vote API Endpoint

**Endpoint**: `POST /api/mobile/v1/polls/{pollId}/vote`

**Status**: **UNCHANGED** - Works exactly as before

**Request Example**:
```http
POST https://www.trendankara.com/api/mobile/v1/polls/11/vote
Content-Type: application/json

{
  "itemId": 21,
  "deviceInfo": {
    "deviceId": "unique-device-id-12345",
    "platform": "android",
    "appVersion": "1.0.0",
    "userAgent": "TrendAnkara-Android/1.0.0"
  }
}
```

**Required Headers**:
```http
Content-Type: application/json
X-Platform: android|ios
X-App-Version: 1.0.0
X-Device-ID: unique-device-id-12345
```

**Response - Success**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Oyunuz başarıyla kaydedildi",
    "updatedCounts": [
      {
        "itemId": 21,
        "voteCount": 5,
        "percentage": 71
      },
      {
        "itemId": 22,
        "voteCount": 1,
        "percentage": 14
      }
      // ... all poll items
    ]
  }
}
```

**Response - Duplicate Vote**:
```json
{
  "success": false,
  "data": {
    "success": false,
    "message": "Bu cihazdan zaten oy kullanıldı"
  },
  "error": "Bu cihazdan zaten oy kullanıldı"
}
```

**Important Notes**:
- ⚠️ **Proxy Timeout**: Vote may timeout through proxy (use direct connection)
- ✅ **IP Tracking**: Device IP captured for fraud prevention
- ✅ **Device Tracking**: deviceId prevents duplicate votes
- ✅ **Real-time Updates**: Response includes updated vote counts

---

## Migration Guide

### Step 1: Update News Item Handling

**What to Change**: Handle new `redirectUrl` field

**Current App Behavior** (assumed):
```
User taps news item → Shows in-app modal/webview with summary
```

**New Recommended Behavior**:
```
User taps news item → Opens full article in browser/webview using redirectUrl
```

**Implementation Concept**:

```javascript
// Conceptual flow (not actual code)

// When user taps news item:
function handleNewsItemTap(newsItem) {
  if (newsItem.redirectUrl) {
    // Option A: Open in in-app WebView
    navigation.navigate('WebView', {
      url: newsItem.redirectUrl,
      title: newsItem.title
    });

    // Option B: Open in external browser
    Linking.openURL(newsItem.redirectUrl);

    // Option C: Give user choice
    showActionSheet([
      'Open in App',
      'Open in Browser',
      'Cancel'
    ]);
  } else {
    // Fallback for items without redirectUrl
    showNewsModal(newsItem);
  }
}
```

**Benefits**:
- ✅ Full article content (not just summary)
- ✅ SEO-optimized pages
- ✅ Better reading experience
- ✅ Social sharing enabled

---

### Step 2: Update Polls Error Handling

**What to Change**: Remove 500 error handling for polls

**Old Code Pattern** (assumed):
```javascript
// Conceptual - what app might have had before

try {
  const response = await fetch('/api/mobile/v1/polls');

  if (response.status === 500) {
    // This was common before the fix
    showError('Polls are temporarily unavailable');
    return;
  }

  const data = await response.json();
  // ... handle poll data
} catch (error) {
  showError('Failed to load polls');
}
```

**New Code Pattern**:
```javascript
// Conceptual - recommended approach now

try {
  const response = await fetch('/api/mobile/v1/polls');

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const { success, data } = await response.json();

  if (!success) {
    showError('Failed to load polls');
    return;
  }

  if (!data) {
    // No active poll
    showNoPollsMessage();
    return;
  }

  // Display poll
  displayPoll(data);

} catch (error) {
  showError('Network error occurred');
}
```

**Key Changes**:
- ❌ Remove specific handling for 500 errors
- ✅ Handle `data: null` case (no active poll)
- ✅ Trust that API will return 200 OK

---

### Step 3: Add Cache Headers Support (Optional)

**What to Change**: Use ETag headers for efficient caching

**Benefits**:
- Reduced bandwidth
- Faster loading
- 304 Not Modified responses

**Implementation Concept**:
```javascript
// Conceptual caching logic

let cachedETag = null;

async function fetchNews() {
  const headers = {};

  if (cachedETag) {
    headers['If-None-Match'] = cachedETag;
  }

  const response = await fetch('/api/mobile/v1/news', { headers });

  if (response.status === 304) {
    // Not modified - use cached data
    return getCachedNews();
  }

  cachedETag = response.headers.get('etag');
  const data = await response.json();

  // Cache data and return
  cacheNews(data);
  return data;
}
```

---

### Step 4: Test Everything

See [Testing Guide](#testing-guide) section below.

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | When It Happens | App Should |
|--------|---------|----------------|------------|
| 200 | Success | Request successful | Process response data |
| 304 | Not Modified | Cached data still valid | Use cached data |
| 400 | Bad Request | Invalid parameters | Show error, check request |
| 404 | Not Found | Resource doesn't exist | Show "not found" message |
| 500 | Server Error | Backend issue | Show generic error, retry |
| 504 | Gateway Timeout | Proxy timeout | Retry with direct connection |

---

### Error Response Format

**Standard Error Response**:
```json
{
  "success": false,
  "data": null,
  "error": "Error message in Turkish"
}
```

**Examples**:

**Invalid Poll ID**:
```json
{
  "success": false,
  "data": null,
  "error": "Geçersiz anket ID"
}
```

**Missing Required Field**:
```json
{
  "success": false,
  "data": null,
  "error": "Eksik bilgi: itemId ve deviceInfo gerekli"
}
```

**Duplicate Vote**:
```json
{
  "success": false,
  "data": {
    "success": false,
    "message": "Bu cihazdan zaten oy kullanıldı"
  },
  "error": "Bu cihazdan zaten oy kullanıldı"
}
```

---

### Error Handling Scenarios

#### Scenario 1: Network Timeout

**When**: Request takes too long

**Response**: No response (timeout exception)

**App Should**:
```javascript
// Conceptual approach
try {
  const response = await fetchWithTimeout('/api/mobile/v1/polls', 10000);
  // ... handle response
} catch (error) {
  if (error.name === 'TimeoutError') {
    showError('Request timed out. Please check your connection.');
    // Offer retry option
  }
}
```

---

#### Scenario 2: Proxy Timeout (Vote API)

**When**: Voting through proxy takes > 30 seconds

**Response**:
```json
{
  "error": "Gateway Timeout",
  "message": "The backend server took too long to respond",
  "code": "TIMEOUT_ERROR",
  "timestamp": "2025-10-16T06:15:02.867Z"
}
```

**App Should**:
```javascript
// Conceptual retry logic
try {
  // First attempt: via proxy
  const response = await fetch(proxyUrl + '/polls/11/vote', options);

  if (response.status === 504) {
    // Proxy timeout - retry with direct connection
    const directResponse = await fetch(directUrl + '/polls/11/vote', options);
    return directResponse;
  }

  return response;
} catch (error) {
  showError('Vote failed. Please try again.');
}
```

---

#### Scenario 3: No Active Poll

**When**: No polls are currently active

**Response**:
```json
{
  "success": true,
  "data": null
}
```

**App Should**:
```javascript
// Conceptual handling
if (response.data === null) {
  // Show "no active polls" state
  showEmptyState({
    icon: 'poll',
    title: 'No Active Polls',
    message: 'Check back later for new polls!'
  });
  return;
}

// Display poll
displayPoll(response.data);
```

---

#### Scenario 4: Invalid Vote (Already Voted)

**When**: User tries to vote twice from same device

**Response**:
```json
{
  "success": false,
  "error": "Bu cihazdan zaten oy kullanıldı"
}
```

**App Should**:
```javascript
// Conceptual handling
if (!response.success && response.error.includes('zaten oy kullanıldı')) {
  // User already voted
  showAlert({
    title: 'Already Voted',
    message: 'You have already voted in this poll.',
    buttons: ['View Results', 'OK']
  });

  // Update UI to show results only (disable voting)
  setHasVoted(true);
}
```

---

## Usage Scenarios

### Scenario 1: Loading and Displaying News

**Flow**:
```
1. App launches
2. Fetch news: GET /api/mobile/v1/news?limit=10
3. Display news cards with images
4. User taps news item
5. Open redirectUrl in WebView/Browser
```

**Request**:
```http
GET /api/mobile/v1/news?page=1&limit=10
```

**Handle Response**:
```javascript
// Conceptual logic
const { success, data } = await response.json();

if (!success) {
  showError('Failed to load news');
  return;
}

// Map to app's news model
const newsItems = data.items.map(item => ({
  id: item.id,
  title: item.title,
  summary: item.summary,
  image: getFullImageUrl(item.featuredImage),
  webUrl: item.redirectUrl,  // ← NEW: Store for deep linking
  category: item.category,
  isBreaking: item.isBreaking,
  isHot: item.isHot,
  publishedAt: new Date(item.publishedAt)
}));

displayNewsList(newsItems);
```

**On Tap**:
```javascript
// Conceptual tap handler
function onNewsTap(newsItem) {
  if (newsItem.webUrl) {
    // Open full article
    openWebView(newsItem.webUrl, newsItem.title);
  } else {
    // Fallback: show summary modal
    showNewsModal(newsItem);
  }
}
```

---

### Scenario 2: Loading and Displaying Polls

**Flow**:
```
1. App navigates to polls screen
2. Fetch poll: GET /api/mobile/v1/polls
3. Check if user has voted (localStorage/AsyncStorage)
4. Display poll or results
```

**Request**:
```http
GET /api/mobile/v1/polls
```

**Handle Response**:
```javascript
// Conceptual logic
const { success, data } = await response.json();

if (!success) {
  showError('Failed to load poll');
  return;
}

if (!data) {
  // No active poll
  showNoPollState();
  return;
}

// Check if user has voted
const hasVoted = await checkHasVoted(data.id);

// Map to app's poll model
const poll = {
  id: data.id,
  title: data.title,
  description: data.description,
  endDate: new Date(data.endDate),
  options: data.items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    image: getFullImageUrl(item.imageUrl),
    voteCount: item.voteCount,
    percentage: item.percentage
  })),
  hasVoted: hasVoted
};

if (hasVoted) {
  displayPollResults(poll);
} else {
  displayVotingInterface(poll);
}
```

---

### Scenario 3: Submitting a Vote

**Flow**:
```
1. User selects poll option
2. Submit vote: POST /api/mobile/v1/polls/{pollId}/vote
3. Handle response (success or error)
4. Update UI to show results
5. Mark as voted in localStorage
```

**Request**:
```http
POST /api/mobile/v1/polls/11/vote
Content-Type: application/json

{
  "itemId": 21,
  "deviceInfo": {
    "deviceId": "generated-unique-id",
    "platform": "android",
    "appVersion": "1.0.0"
  }
}
```

**Generate Device ID** (one-time):
```javascript
// Conceptual device ID generation
import { getUniqueId } from 'react-native-device-info';

const deviceId = await getUniqueId(); // Persistent device identifier
```

**Submit Vote**:
```javascript
// Conceptual vote submission
async function submitVote(pollId, optionId) {
  try {
    const response = await fetch(`/api/mobile/v1/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': Platform.OS, // 'android' or 'ios'
        'X-App-Version': '1.0.0',
        'X-Device-ID': deviceId
      },
      body: JSON.stringify({
        itemId: optionId,
        deviceInfo: {
          deviceId: deviceId,
          platform: Platform.OS,
          appVersion: '1.0.0',
          userAgent: `TrendAnkara-${Platform.OS}/1.0.0`
        }
      })
    });

    const { success, data, error } = await response.json();

    if (!success) {
      if (error.includes('zaten oy kullanıldı')) {
        // Already voted
        showAlert('Already Voted', 'You have already voted in this poll.');
      } else {
        // Other error
        showAlert('Error', error);
      }
      return false;
    }

    // Vote successful!
    // Save to localStorage
    await saveVoteRecord(pollId, optionId);

    // Update UI with new counts
    updatePollResults(data.updatedCounts);

    showSuccess('Vote submitted successfully!');
    return true;

  } catch (error) {
    if (error.message.includes('timeout')) {
      // Retry with direct connection
      return retryVoteDirect(pollId, optionId);
    }

    showError('Network error. Please try again.');
    return false;
  }
}
```

---

### Scenario 4: Pagination (Load More News)

**Flow**:
```
1. User scrolls to bottom of news list
2. Fetch next page: GET /api/mobile/v1/news?page=2
3. Append to existing list
4. Continue until hasNext = false
```

**Pagination Logic**:
```javascript
// Conceptual pagination
let currentPage = 1;
let hasMore = true;
let newsItems = [];

async function loadMoreNews() {
  if (!hasMore) return;

  const response = await fetch(`/api/mobile/v1/news?page=${currentPage}&limit=10`);
  const { success, data } = await response.json();

  if (!success) return;

  // Append new items
  newsItems = [...newsItems, ...data.items];

  // Update pagination state
  currentPage = data.pagination.page + 1;
  hasMore = data.pagination.hasNext;

  // Update UI
  updateNewsList(newsItems);
}
```

---

### Scenario 5: Offline Handling

**Flow**:
```
1. Detect offline state
2. Load cached data
3. Show offline indicator
4. Queue writes (votes) for retry
```

**Offline Detection**:
```javascript
// Conceptual offline handling
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  if (!state.isConnected) {
    // Offline - use cached data
    const cachedNews = await loadCachedNews();
    displayNewsList(cachedNews);
    showOfflineIndicator();
  } else {
    // Online - fetch fresh data
    fetchNews();
    hideOfflineIndicator();
    retryQueuedVotes();
  }
});
```

---

## Testing Guide

### Test Checklist

#### News API Testing

- [ ] **Fetch news list**
  - Endpoint works via proxy
  - Returns 200 OK
  - Contains `redirectUrl` field
  - Images load correctly

- [ ] **Pagination**
  - Page 1 loads
  - Page 2 loads different items
  - hasNext/hasPrev correct

- [ ] **Open news article**
  - Tap news item
  - redirectUrl opens in WebView
  - Full article displays
  - Back button works

- [ ] **Category filtering**
  - Filter by category works
  - Returns correct items

#### Polls API Testing

- [ ] **Fetch active poll**
  - Endpoint works via proxy
  - Returns 200 OK (NOT 500!)
  - Poll data complete
  - Images load correctly

- [ ] **No active poll**
  - Handle data: null correctly
  - Show appropriate empty state

- [ ] **Vote submission**
  - First vote succeeds
  - Vote counts update
  - UI shows results

- [ ] **Duplicate vote prevention**
  - Second vote from same device fails
  - Error message shown
  - UI switches to results-only mode

#### Error Handling Testing

- [ ] **Network errors**
  - Airplane mode - show appropriate error
  - Timeout - show timeout message
  - Retry option works

- [ ] **Invalid data**
  - Missing deviceInfo - shows error
  - Invalid poll ID - shows error

### Test Data

**Test Endpoints**:
- **Direct**: `https://www.trendankara.com/api/mobile/v1/...`
- **Proxy**: `https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1/...`

**Test Poll ID**: 11
**Test Vote Option ID**: 21 or 22

**Test Device Info**:
```json
{
  "deviceId": "test-device-12345",
  "platform": "android",
  "appVersion": "1.0.0",
  "userAgent": "TrendAnkara-Test/1.0.0"
}
```

---

### Device Testing

Test on:
- [ ] Android (API 29+)
- [ ] iOS (iOS 13+)
- [ ] Different network conditions:
  - [ ] WiFi
  - [ ] 4G
  - [ ] 3G (slow connection)
  - [ ] Offline mode

---

## Backward Compatibility

### Old App Versions Will Still Work ✅

**Good News**: All changes are backward compatible!

**What This Means**:
- Old apps that don't know about `redirectUrl` will ignore it
- Old apps will now see polls (was broken, now fixed)
- No breaking changes to existing API contracts

**Field Handling**:
```javascript
// Old app code (before update)
const newsItem = {
  id: response.id,
  title: response.title,
  summary: response.summary
  // Ignores redirectUrl - still works!
};
```

**Graceful Degradation**:
- ✅ If `redirectUrl` missing: App can fall back to modal view
- ✅ If poll images missing: App can show placeholder
- ✅ If cache headers not used: App still gets data

---

### Recommended Approach

**Version Strategy**:
1. **v1.0**: Current app (no updates needed, continues to work)
2. **v1.1**: Add redirectUrl support (recommended)
3. **v1.2**: Improve caching, error handling

**Feature Flags**:
```javascript
// Conceptual feature flag approach
const FEATURES = {
  NEWS_WEB_VIEW: true,    // Enable redirectUrl handling
  POLL_IMPROVEMENTS: true, // Updated poll UI
  CACHE_OPTIMIZATION: false // Not ready yet
};

if (FEATURES.NEWS_WEB_VIEW && newsItem.redirectUrl) {
  openWebView(newsItem.redirectUrl);
} else {
  showNewsModal(newsItem);
}
```

---

## FAQs

### Q1: Do I need to update my app immediately?

**A**: No, but it's recommended. Old apps continue to work. Update to enable:
- News deep linking (better UX)
- Polls now working (was broken)
- Improved error handling

---

### Q2: What if a news item doesn't have redirectUrl?

**A**: Very rare, but handle gracefully:
```javascript
const url = newsItem.redirectUrl || `https://trendankara.com/news/${newsItem.slug}`;
```

Or fall back to in-app view:
```javascript
if (newsItem.redirectUrl) {
  openWebView(newsItem.redirectUrl);
} else {
  showInAppNewsView(newsItem);
}
```

---

### Q3: Will polls always have images?

**A**: Yes, all poll items now include `imageUrl`. But for safety:
```javascript
const imageUrl = pollItem.imageUrl || placeholderImage;
```

---

### Q4: Should I use proxy or direct connection?

**A**: For most endpoints, use proxy (solves SSL issues). Exception:
- **Vote API**: May timeout via proxy, consider direct connection

**Strategy**:
```javascript
// Conceptual endpoint selection
const endpoints = {
  news: PROXY_URL,      // Use proxy
  polls: PROXY_URL,     // Use proxy
  vote: DIRECT_URL      // Use direct (to avoid timeout)
};
```

---

### Q5: How do I handle vote timeouts through proxy?

**A**: Implement retry with direct connection:
```javascript
async function submitVote(pollId, optionId) {
  try {
    // Try proxy first
    return await voteViaProxy(pollId, optionId);
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      // Retry direct
      return await voteViaDirect(pollId, optionId);
    }
    throw error;
  }
}
```

---

### Q6: What changed in error responses?

**A**: Polls endpoint no longer returns 500 errors. Remove this error handling:
```javascript
// OLD - Remove this
if (response.status === 500) {
  showError('Polls unavailable');
}

// NEW - Use this
if (!response.ok || !data.success) {
  showError('Failed to load');
}
```

---

### Q7: How long are responses cached?

**A**:
- News: 2 minutes (120 seconds)
- Polls: 1 minute (60 seconds)
- Use ETag headers for efficient caching

---

### Q8: Can I test without updating production app?

**A**: Yes! Use development/staging build:
1. Point to production API
2. Test new features
3. Verify everything works
4. Release to production

---

## Summary

### What Changed
✅ Polls API now returns 200 OK (was 500)
✅ News items include `redirectUrl` for deep linking
✅ News detail pages available on web
✅ Database updated with new fields

### What You Should Do
1. **Update app** to use redirectUrl (recommended)
2. **Remove** 500 error handling for polls
3. **Test** polls loading (now works!)
4. **Release** updated app version

### What You Don't Need to Do
- ❌ No breaking changes
- ❌ No urgent fixes required
- ❌ Old apps continue to work

### Priority
🟡 **MEDIUM** - Update recommended for better UX, not critical

### Support
For questions or issues, contact backend team or refer to:
- [Test Results](../.claude/bugs/mobile-api-endpoints-update/TEST_RESULTS.md)
- [Proxy Update Guide](./gcloud-proxy-todo.md)
- [Implementation Details](../.claude/bugs/mobile-api-endpoints-update/IMPLEMENTATION_SUMMARY.md)

---

**Document Version**: 2.0
**Last Updated**: 2025-10-16
**Maintained By**: Backend Team
