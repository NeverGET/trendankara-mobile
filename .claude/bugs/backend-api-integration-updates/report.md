# Bug Report: Backend API Integration Updates

## Bug Summary
The mobile app needs to integrate new backend API changes that provide enhanced functionality for polls and news features. The backend has been updated to provide additional fields and fixed functionality that requires mobile app integration.

## Bug Details

### Expected Behavior
**Polls Feature:**
- Poll options should display images alongside text
- POST API for voting should work correctly
- Poll items should show visual representations from backend

**News Feature:**
- News articles should have `redirectUrl` field for opening full articles in web view
- News detail popup should display full `content` field (not just summary)
- Support for opening articles in WebView using the provided redirect URL

### Actual Behavior
**Current Implementation:**
1. **Polls:**
   - `PollOption` component (mobile/components/polls/PollOption.tsx) only shows text, no image support
   - Poll data model (mobile/types/models.ts) `PollOption` interface has no `imageUrl` field
   - API service expects `options` array but backend now provides `items` array with images

2. **News:**
   - `NewsArticle` interface (mobile/types/models.ts) has no `redirectUrl` field
   - News service transformation (mobile/services/api/news.ts:465-488) doesn't map `redirectUrl` from API
   - NewsDetailScreen shows `content` but NewsCard popup may not utilize full content effectively

### Steps to Reproduce
1. **For Polls:**
   - Fetch polls from API endpoint `/api/mobile/v1/polls`
   - Observe that backend returns `items` array with `imageUrl` field
   - Current app doesn't display these images

2. **For News:**
   - Fetch news from API endpoint `/api/mobile/v1/news`
   - Backend now provides `redirectUrl` field: `https://trendankara.com/news/{slug}`
   - Current app doesn't use this field for deep linking

### Environment
- **Version**: Current development version
- **Platform**: React Native (iOS/Android) - Expo SDK 54
- **Backend API**: Updated with new fields (see docs/api/mobile-app-update-guide.md)
- **Configuration**: Production API endpoints

## Impact Assessment

### Severity
- [x] High - Major functionality enhancement available but not integrated
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
All users of the mobile application who interact with:
- Polls feature (voting interface)
- News feature (article reading)

### Affected Features
1. **Polls Page** - Missing visual enhancements (poll option images)
2. **News Page** - Missing deep linking capability and full content display
3. **User Experience** - Cannot access full web articles or see poll images

## Additional Context

### Backend API Changes (From Update Guide)

**Polls API Changes:**
```typescript
// Backend now returns this structure:
{
  "success": true,
  "data": {
    "id": 11,
    "title": "TREND ANKARA TOP 10",
    "description": "SEVDİĞİNİZ SANATÇI VE ŞARKILARINI OYLAYIN",
    "items": [  // ← Changed from "options" to "items"
      {
        "id": 21,
        "title": "LVBEL C5",  // ← Was "text"
        "description": "ÇOOOK PARDON",
        "imageUrl": "/api/media/uploads/...",  // ← NEW FIELD
        "voteCount": 4,
        "percentage": 67,
        "displayOrder": 0  // ← NEW FIELD
      }
    ]
  }
}
```

**News API Changes:**
```typescript
// Backend now returns this structure:
{
  "id": 13,
  "title": "Article Title",
  "slug": "article-slug",
  "summary": "Article summary",
  "content": "Full article content...",  // ← Already provided
  "featuredImage": "/api/media/uploads/image.jpg",
  "redirectUrl": "https://trendankara.com/news/article-slug",  // ← NEW FIELD
  "category": "MAGAZINE"
}
```

### Current Code Locations

**Polls:**
- Type Definition: `mobile/types/models.ts:49-54`
- Component: `mobile/components/polls/PollOption.tsx`
- API Service: `mobile/services/api/polls.ts:170-186`
- Store: `mobile/store/slices/pollsSlice.ts`

**News:**
- Type Definition: `mobile/types/models.ts:77-89`
- Component: `mobile/components/news/NewsCard.tsx`
- Detail Screen: `mobile/screens/NewsDetailScreen.tsx`
- API Service: `mobile/services/api/news.ts:465-488`

### Related Issues
- Backend Update Guide: `docs/api/mobile-app-update-guide.md`
- Polls API was returning 500 errors (now fixed in backend)
- News pages now have dedicated web URLs for deep linking

## Initial Analysis

### Suspected Root Cause
The mobile app was developed before these backend enhancements were available. The type definitions and components were built based on the original API structure without these fields.

### Affected Components
**Type Definitions:**
1. `mobile/types/models.ts` - `PollOption` interface needs `imageUrl` field
2. `mobile/types/models.ts` - `NewsArticle` interface needs `redirectUrl` field
3. `mobile/types/models.ts` - Poll structure uses `options` but backend provides `items`

**API Services:**
1. `mobile/services/api/polls.ts` - Data normalization mapping `items` to `options`
2. `mobile/services/api/news.ts` - Transformation function missing `redirectUrl` mapping

**UI Components:**
1. `mobile/components/polls/PollOption.tsx` - No image rendering logic
2. `mobile/components/news/NewsCard.tsx` - No redirectUrl handling on tap
3. `mobile/screens/NewsDetailScreen.tsx` - Already shows content (good!)

### Required Changes

#### 1. Update Type Definitions
```typescript
// PollOption interface needs:
export interface PollOption {
  id: number;
  text: string;        // or map from "title"
  imageUrl?: string;   // NEW: Optional image URL
  description?: string; // NEW: Optional description
  voteCount: number;
  percentage: number;
  displayOrder?: number; // NEW: Optional display order
}

// NewsArticle interface needs:
export interface NewsArticle {
  // ... existing fields
  redirectUrl?: string;  // NEW: Optional redirect URL for web view
}
```

#### 2. Update API Data Transformation
- Polls service: Ensure `items` array properly maps to `options` with imageUrl
- News service: Add `redirectUrl` to transformation function

#### 3. Update UI Components
- PollOption: Add Image component to display poll option images
- NewsCard: Add onPress handling for redirectUrl (open WebView or browser)
- Consider creating WebView screen for news articles

#### 4. Testing Requirements
- Test polls display with images
- Test voting functionality still works
- Test news redirect URL opens correctly
- Test backward compatibility (old cached data without new fields)

---

## Implementation Priority

### High Priority (Must Have)
1. ✅ Poll option images display
2. ✅ News redirectUrl integration
3. ✅ Type definition updates

### Medium Priority (Should Have)
1. WebView screen for news articles
2. Fallback handling for missing images
3. Error handling for redirect failures

### Low Priority (Nice to Have)
1. Image caching for poll options
2. Analytics for redirect URL opens
3. A/B testing redirect vs in-app view

---

**Reported By:** Development Team
**Date:** 2025-10-16
**Status:** Ready for Analysis Phase
**Next Steps:** Run `/bug-analyze` to investigate implementation details
