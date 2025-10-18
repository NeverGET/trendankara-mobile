# Privacy Policy Documentation

This directory contains all documentation needed to implement the privacy policy for TrendAnkara mobile app store release.

## Documents

### 1. `PRIVACY_POLICY_REQUIREMENTS.md` (Main Document)
**Comprehensive guide** covering:
- Language requirements (Turkish vs English)
- Store requirements (Apple & Google)
- KVKK (Turkish law) compliance details
- Complete data collection analysis
- Privacy policy content template (ready to use!)
- Technical implementation requirements
- Design specifications
- Mobile app configuration changes needed

**Read this first** for complete understanding.

### 2. `QUICK_CHECKLIST.md` (Action Items)
**Quick reference** with:
- Step-by-step checklist for webapp team
- Step-by-step checklist for mobile team
- Timeline and task ownership
- VERBIS registration reminder
- Status tracking

**Use this** for day-to-day implementation tracking.

## Quick Start

### For Webapp Team
1. Read the main requirements document
2. Use the privacy policy content template (Turkish version provided)
3. Replace placeholders with actual company information
4. Implement at `https://trendankara.com/privacy-policy`
5. Follow technical requirements (mobile-responsive, < 3s load time)
6. Get legal review
7. Deploy and notify mobile team

### For Mobile Team
1. Wait for privacy policy to be deployed
2. Update `app.json` with privacy policy URL
3. Remove invalid schema properties
4. Add link in Settings screen
5. Enter URL in store submission forms
6. Test and submit

## Critical Facts

✅ **Privacy policy is MANDATORY** - app will be rejected without it
✅ **Turkish-only is sufficient** for Turkey-focused app
✅ **VERBIS registration required** (free, Turkey specific)
✅ **Must be publicly accessible** (no login)
✅ **Must load in < 3 seconds** on mobile

## What Data Does the App Collect?

**Minimal data collection** (privacy-friendly):
- Device info (for compatibility)
- App usage stats (for bug fixes)
- Poll votes (user choice)
- Push notification token (if enabled)
- Local preferences (theme, settings)

**No personal identification required** - no name, email, or phone.

## Timeline

Estimated **1 week** from start to completion:
- Webapp implementation: 2-4 days
- Legal review: 1 day
- Mobile app updates: 1 day
- Testing: 1 day

## Questions?

- **Content questions**: Check main requirements document
- **Technical webapp questions**: Review technical implementation section
- **Mobile app questions**: See mobile app configuration section
- **Legal questions**: Consult with Turkish lawyer (recommended!)

---

**Status**: 📋 Documentation Complete - Ready for Implementation
**Priority**: 🔴 CRITICAL (Blocks store submission)
**Created**: October 17, 2025
