# Privacy Policy Implementation - Quick Checklist

## For Webapp Team

### Step 1: Create the Page
- [ ] Create route at `/privacy-policy` (or `/gizlilik-politikasi`)
- [ ] Use the content template from PRIVACY_POLICY_REQUIREMENTS.md
- [ ] Replace placeholders with actual company information:
  - [ ] Company legal name
  - [ ] Physical address in Turkey
  - [ ] Contact email (e.g., privacy@trendankara.com)
  - [ ] Contact phone number

### Step 2: Technical Requirements
- [ ] Page loads in < 3 seconds on mobile
- [ ] Mobile-responsive design (test on phone)
- [ ] Font size minimum 14px
- [ ] Line height 1.6 for readability
- [ ] No login/authentication required
- [ ] HTTPS enabled
- [ ] Works on all major browsers

### Step 3: Content Requirements
- [ ] Last updated date at top
- [ ] Table of contents for easy navigation
- [ ] All KVKK Article 11 rights listed
- [ ] Contact information for data requests
- [ ] Clear explanation of what data is collected
- [ ] Data retention periods specified
- [ ] Third-party services disclosed (GCP, etc.)

### Step 4: Testing
- [ ] Test on mobile phone (iOS and Android)
- [ ] Test page load speed
- [ ] Verify links work
- [ ] Check spelling and grammar
- [ ] Print test (should be print-friendly)

### Step 5: Legal Review
- [ ] Have Turkish lawyer review content
- [ ] Verify KVKK compliance
- [ ] Get approval to publish

### Step 6: Deployment
- [ ] Deploy to production at exact URL
- [ ] Verify publicly accessible (no auth)
- [ ] Provide final URL to mobile team

---

## For Mobile Team (After Privacy Policy is Live)

### Step 1: Update Configuration
- [ ] Update `app.json`:
  ```json
  "privacyPolicyUrl": "https://trendankara.com/privacy-policy"
  ```
- [ ] Remove invalid `"privacy": "public"` field
- [ ] Remove `"keywords"` array from app.json
- [ ] Remove `"linking"` if causing validation errors

### Step 2: Add In-App Link
- [ ] Add privacy policy link in Settings screen
- [ ] Test link opens browser/webview correctly
- [ ] Verify page loads and is readable in-app

### Step 3: Store Submission
- [ ] Enter URL in App Store Connect metadata
- [ ] Enter URL in Google Play Console metadata
- [ ] Verify URL is accessible from store reviewers' perspective

### Step 4: Validation
- [ ] Run `npx expo-doctor` - should pass without privacy errors
- [ ] Test deep linking to privacy policy
- [ ] Build production app and test privacy policy access

---

## Language Decision

✅ **Turkish Only**: Sufficient for store approval (recommended for fast launch)
⏩ **Turkish + English**: Better for future, but not required

**Decision**: __________

---

## Important URLs

**Privacy Policy URL**: ______________________________________
**Terms of Service URL** (optional): ______________________________________

---

## Timeline

| Task | Owner | Duration | Status |
|------|-------|----------|--------|
| Create privacy policy content | Legal/Webapp | 2 days | ⬜ |
| Implement webpage | Webapp | 1-2 days | ⬜ |
| Legal review | Legal | 1 day | ⬜ |
| Deploy to production | Webapp | 1 day | ⬜ |
| Update mobile app config | Mobile | 1 day | ⬜ |
| Test and verify | Both teams | 1 day | ⬜ |
| **Total** | | **~1 week** | |

---

## Contacts

**Webapp Team Lead**: __________
**Legal Contact**: __________
**Mobile Team**: claude-code

---

## VERBIS Registration (Turkey Specific)

⚠️ **Action Required**: TrendAnkara must register with VERBIS before processing data.

- [ ] Go to https://verbis.kvkk.gov.tr/
- [ ] Create account
- [ ] Register as Data Controller
- [ ] Submit required information
- [ ] **This is FREE and MANDATORY**

**Person Responsible**: __________
**Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Completed

---

**Quick Questions? Check the main document**: `PRIVACY_POLICY_REQUIREMENTS.md`
