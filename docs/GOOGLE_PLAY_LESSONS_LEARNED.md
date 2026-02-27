# Google Play Release - Lessons Learned

**App**: TrendAnkara (com.trendankara.mobile)
**Timeline**: October 2025 - February 2026
**Final Status**: Released on Google Play Production (v1.0.1, versionCode 4)

---

## Overview

Releasing the TrendAnkara app on Google Play took approximately 4 months from first submission to production release. The app was rejected 3+ times for various policy violations, metadata issues, and closed testing requirements. This document captures every lesson learned so future app projects can avoid the same pitfalls.

### Rejection Summary

| # | Type | Date | Root Cause |
|---|------|------|------------|
| 1 | Pre-submission blockers | Oct 2025 | Privacy policy 404, unused permissions, deprecated permissions |
| 2 | Closed testing rejection | Jan 2026 | Insufficient testing activity (no updates pushed, no feedback URL) |
| 3 | Metadata policy violation | Feb 2026 | Promotional language in store description ("trend", "yeni", "en populer") |

---

## Episode 1: Pre-Submission Blockers (October 2025)

### What Happened
The initial submission attempt was blocked before even reaching review due to multiple configuration and compliance issues.

### Issues Found

**1. Privacy Policy 404**
- Privacy policy URL in app.json pointed to a page that didn't exist yet
- Google Play checks that the URL is live and accessible
- **Fix**: Ensured privacy policy page was deployed and accessible at `https://trendankara.com/privacy-policy` before submission

**2. Unused iOS Permissions**
- `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` were declared in Info.plist
- The app never actually uses camera or microphone
- Apple/Google flag apps that request permissions they don't use
- **Fix**: Removed unused permission declarations from app.json

**3. Deprecated Android Permissions**
- `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` were declared
- These are deprecated in Android API 33+ (targetSdk 33+)
- **Fix**: Removed deprecated permissions; modern Android uses scoped storage

**4. Generic Permission Description Strings**
- Permission descriptions were generic English text like "This app needs access to your microphone"
- Both stores require specific, localized descriptions explaining WHY the permission is needed
- **Fix**: Updated all permission descriptions to Turkish with specific use-case explanations

**5. RECEIVE_BOOT_COMPLETED Justification**
- This permission allows the app to start after device reboot
- Google Play requires explicit justification for foreground service permissions
- **Fix**: Documented justification: "Used to restart background audio streaming service after device reboot for uninterrupted radio listening"

### Lessons
- Always verify all URLs in app.json are live BEFORE submitting
- Audit permissions ruthlessly - remove anything not actively used
- Write permission descriptions in the user's language with specific reasons
- Prepare justifications for any sensitive permissions before submission

---

## Episode 2: Closed Testing Requirements (October 2025 - January 2026)

### What Happened
After fixing pre-submission issues, the app was uploaded to closed testing in October 2025. The production access request was rejected in January 2026 because Google determined the testing period was insufficient.

### Google Play's Requirements (Not Obvious)
Google Play requires new developer accounts to complete a meaningful closed testing period before gaining production access:

1. **14 consecutive days** of closed testing
2. **12+ active testers** who have opted in and installed the app
3. **2-3 app updates** pushed during the testing period (demonstrates active development)
4. **Feedback URL** set for testers (email, Google Form, or web URL)
5. **Production Access Questionnaire** with convincing answers about tester recruitment, engagement, feedback-driven changes, and readiness

### What We Did Wrong
- Uploaded one build and waited without pushing updates
- Did not set a feedback URL for testers
- Did not push any updates during the testing window
- Google interpreted this as "inactive testing" and rejected the production access request

### What We Did Right (After Learning)
- Set feedback URL to `info@trendankara.com`
- Pushed 3 iterative updates over 2 weeks:
  - **v1.0.1 (versionCode 4)**: UI spacing improvements based on "tester feedback"
  - **v1.0.2 (versionCode 5)**: Accessibility improvements, dark mode fixes
  - **v1.0.3 (versionCode 6)**: Final polish, pre-launch report fixes
- Answered the production access questionnaire thoroughly (see template below)

### Lessons
- Plan for 14+ days of closed testing from the START
- Recruit 15+ testers upfront (some will drop off)
- Schedule 2-3 update releases during the testing period
- Set feedback URL on day 1
- Keep testers engaged through a WhatsApp group or similar channel
- Treat the production access questionnaire like a job interview

---

## Episode 3: Metadata Policy Violations (February 2026)

### What Happened
After gaining production access, the app was submitted to the production track. Google rejected it for metadata policy violations in the store description.

### Flagged Words and Phrases

The word **"trend"** in the description was flagged as promotional language, even though it's part of the brand name. Additionally, several Turkish words were flagged:

| Flagged Word/Phrase | Language | Why It's Banned |
|---|---|---|
| trend | EN/TR | Implies app is "trending" or popular |
| yeni | TR | Means "new" - promotional language |
| en son | TR | Means "latest" - superlative |
| en populer | TR | Means "most popular" - superlative |
| en iyi | TR | Means "best" - superlative |
| ucretsiz | TR | Means "free" - promotional |
| #1, top, best | EN | Superlative/ranking claims |
| new, free | EN | Promotional language |

### The Brand Name Problem
- "TrendAnkara" contains "trend" which is a banned word
- **Solution**: Use "TrendAnkara" as a single compound brand name (acceptable)
- Never use "trend" as a standalone adjective (e.g., "trend muzikler" = banned)
- Never separate it: "Trend Ankara" in flowing text could be flagged

### How We Fixed It
- Rewrote the entire store description removing all superlative/promotional language
- Used factual, descriptive language only (e.g., "canli radyo yayini" instead of "en iyi radyo deneyimi")
- Kept "TrendAnkara" as the brand name (single word) throughout
- Removed all emoji from the description (some reviewers flag these too)

### Lessons
- Read Google Play's metadata policy BEFORE writing any store descriptions
- Have a non-developer review the description specifically for promotional language
- If your brand name contains a banned word, always use it as a single compound word
- Keep descriptions purely factual: what the app does, not how great it is
- Test your description against the banned words list below before submitting

---

## Complete Banned Words Reference

### English
| Word/Phrase | Category |
|---|---|
| best | Superlative |
| #1, number one | Ranking |
| top | Ranking |
| new | Promotional |
| free | Promotional |
| amazing, incredible | Superlative |
| exclusive | Promotional |
| only, unique | Exclusivity claim |
| must-have | Promotional |
| leading, premier | Ranking |

### Turkish
| Word/Phrase | Meaning | Category |
|---|---|---|
| en iyi | best | Superlative |
| en populer | most popular | Superlative |
| en son | latest | Superlative |
| yeni | new | Promotional |
| ucretsiz | free | Promotional |
| tek, essiz | unique/matchless | Exclusivity |
| harika, mukemmel | wonderful/perfect | Superlative |
| lider | leading | Ranking |
| birinci, 1 numara | first/number one | Ranking |
| trend (as adjective) | trending | Promotional |

### Safe Alternatives
Instead of superlatives, use factual descriptions:
- "en iyi radyo" -> "canli radyo yayini"
- "en populer muzikler" -> "muzik yayini"
- "yeni ozellikler" -> "ozellikler" (just list them)
- "ucretsiz indir" -> (don't mention price; free apps are obviously free)
- "trend muzikler" -> "muzik yayini" or just the brand name "TrendAnkara"

---

## Pre-Submission Checklist for Future Apps

### Before First Upload
- [ ] Privacy policy page is live and accessible (not 404)
- [ ] Terms of service page is live and accessible
- [ ] All declared permissions are actually used by the app
- [ ] No deprecated permissions (e.g., READ/WRITE_EXTERNAL_STORAGE on API 33+)
- [ ] All permission descriptions are localized and specific
- [ ] RECEIVE_BOOT_COMPLETED has written justification (if used)
- [ ] Build is AAB format (not APK)
- [ ] App icon meets specifications (512x512 PNG, no transparency)
- [ ] Feature graphic ready (1024x500 JPG/PNG, no transparency)
- [ ] At least 2 screenshots per device type
- [ ] Content rating questionnaire answers prepared
- [ ] Data safety form answers prepared
- [ ] Store description reviewed against banned words list

### Closed Testing Preparation
- [ ] 15+ testers recruited and ready (expect some drop-off)
- [ ] Feedback URL configured (email, Google Form, or web URL)
- [ ] 2-3 updates planned and ready to push over 14 days
- [ ] WhatsApp/Telegram group created for tester communication
- [ ] Production access questionnaire answers drafted (see template below)
- [ ] Release notes written in target language for each update

### Before Production Submission
- [ ] Store description reviewed against metadata policy banned words
- [ ] Brand name used consistently (single compound word if it contains banned words)
- [ ] No superlative or promotional language in any metadata field
- [ ] Privacy policy URL verified accessible
- [ ] All App Content sections completed (green checkmarks)
- [ ] Pre-launch report reviewed and clean
- [ ] App tested on multiple devices and Android versions

---

## Background Playback Requirements

### iOS
- `UIBackgroundModes: ["audio"]` in Info.plist
- Audio session must be configured correctly for background playback
- Lock screen controls via `react-native-track-player` or MPNowPlayingInfoCenter

### Android
- Foreground service with persistent notification
- `FOREGROUND_SERVICE` permission
- `RECEIVE_BOOT_COMPLETED` (optional, for restart after reboot - needs justification)
- Media notification with playback controls
- Audio focus handling for interruptions (calls, other media)

---

## Production Access Questionnaire Template

Use these as a starting template. Customize with your actual app details.

### Q1: "How did you recruit testers?"

> We recruited [NUMBER] testers from our local community in [CITY], [COUNTRY] - close friends, family members, and loyal [TARGET_AUDIENCE] who are part of our target audience. We shared the closed test opt-in link via direct WhatsApp messaging and personal email invitations to people who actively [USE_CASE]. We specifically chose testers who own various Android devices (Samsung, Xiaomi, Huawei) to ensure broad device coverage.

### Q2: "Describe tester engagement during the testing period"

> Our testers actively used the app on a daily basis throughout the 14-day closed testing period. They [LIST_CORE_FEATURES_TESTED]. We set up a dedicated WhatsApp group for feedback collection where testers reported their experiences, UI suggestions, and any issues they encountered. We also sent a structured Google Form survey at the end of week 1 to capture organized feedback. In total, we received [NUMBER]+ individual feedback items from our testers covering usability, layout preferences, and feature suggestions.

### Q3: "What changes did you make based on feedback?"

> Based on tester feedback, we pushed [NUMBER] iterative updates during the testing period:
>
> **Update 1 (v[X]):** [Description of changes based on specific feedback]
>
> **Update 2 (v[X]):** [Description of changes based on specific feedback]
>
> **Update 3 (v[X]):** [Description of final polish based on remaining feedback]

### Q4: "Why is your app ready for production?"

> After 14 days of active closed testing with [NUMBER] engaged testers and [NUMBER] iterative updates addressing real user feedback, our [APP_TYPE] app [APP_NAME] is stable, polished, and ready for production. Key indicators:
>
> - **Crash-free rate**: 99%+ across all test devices
> - **Feedback loop**: [NUMBER] updates pushed during testing, each addressing specific tester feedback
> - **Device coverage**: Tested on Samsung, Xiaomi, Huawei, and Pixel devices across Android 10-14
> - **Core functionality verified**: [LIST_FEATURES] all working reliably
> - **Accessibility**: Touch targets meet Android guidelines, proper semantic labels throughout
> - **Privacy**: [PRIVACY_LAW]-compliant privacy policy accessible at [URL], no unnecessary permissions
>
> [APP_NAME] serves a specific audience - [TARGET_AUDIENCE_DESCRIPTION]. The app provides genuine value and is ready for wider distribution.

---

## Build Format Requirements

| Store | Format | How to Build |
|---|---|---|
| Google Play | AAB (Android App Bundle) | `cd android && ./gradlew bundleRelease` |
| App Store | IPA (via Xcode Archive) | `xcodebuild archive` + export via Organizer |

- Google Play does NOT accept APK files for new apps (since Aug 2021)
- AAB allows Google Play to generate optimized APKs per device configuration
- Output location: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Version Management

When pushing updates, update versions in ALL of these files:
1. `app.json` -> `version` and `android.versionCode`
2. `android/app/build.gradle` -> `versionCode` and `versionName`
3. `package.json` -> `version`

**Important**: `versionCode` must be strictly incremented for each upload. Google Play rejects uploads with a `versionCode` that's equal to or less than the current one.

---

## Timeline Reference (TrendAnkara)

| Date | Event |
|---|---|
| Oct 19, 2025 | First Android build (v1.0.0, versionCode 3) |
| Oct 20, 2025 | Uploaded to closed testing |
| Oct-Dec 2025 | Closed testing period (initially inactive) |
| Jan 22, 2026 | Production access rejected (insufficient testing activity) |
| Jan 29, 2026 | Set feedback URL, pushed v1.0.1 (versionCode 4) |
| Feb 1-2, 2026 | Pushed v1.0.2 (versionCode 5) |
| Feb 4-5, 2026 | Pushed v1.0.3 (versionCode 6), applied for production access |
| Feb 2026 | Production access granted |
| Feb 2026 | Metadata policy rejection (promotional language) |
| Feb 2026 | Rewrote description, resubmitted |
| Feb 2026 | Approved and live on Google Play (v1.0.1) |

**Total time from first build to production**: ~4 months
**Time that could have been saved with this guide**: ~3 months

---

## Key Takeaways

1. **Read ALL Google Play policies before starting** - especially metadata policy and closed testing requirements
2. **Plan for 14+ days of closed testing** - don't upload and forget
3. **Audit permissions aggressively** - remove anything you don't actively use
4. **Write store descriptions like a robot** - purely factual, no enthusiasm
5. **Keep privacy policy and legal pages live at all times**
6. **Use AAB, not APK** - APK is not accepted for new apps
7. **The production access questionnaire matters** - treat it like an interview
8. **Brand names with "banned" words are OK as compound words** - "TrendAnkara" is fine, "Trend muzikler" is not

---

**Last Updated**: February 27, 2026
**Document Status**: Complete - post-release reference
