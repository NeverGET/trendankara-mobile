# Product Steering Document - Trend Ankara Mobile

## Product Vision
Trend Ankara is a radio station mobile app that delivers continuous audio streaming entertainment while respecting users' device resources and data usage. The app focuses on providing a seamless listening experience with minimal friction.

## Release Status
- **iOS**: Released on App Store (v1.0.2, bundle ID: `com.trendankara.neverget`)
- **Android**: Released on Google Play (v1.0.1, versionCode 4, package: `com.trendankara.mobile`)
- **EAS Project ID**: `55f2a9e8-b926-416c-9eaf-213c127638dc`

## Store Compliance
- **Both stores are live**: iOS App Store and Google Play production
- **Google Play Metadata Policy**: Descriptions must avoid promotional/superlative words:
  - Banned: "trend" (as adjective), "best", "#1", "top", "new"/"yeni", "free"/"ücretsiz", "en popüler", "en son", "en iyi"
  - Safe: Use brand name as single word ("TrendAnkara"), factual feature descriptions only
- **Privacy & Legal**: Privacy policy and terms of service must be live, accessible URLs (not 404)
  - Privacy policy: https://trendankara.com/privacy-policy (Turkish + English)
  - Terms: https://trendankara.com/terms-of-service
- **Content Rating**: IARC questionnaire completed (Music & Audio category)
- **Google Play Closed Testing**: Required 14-day testing with 12+ active testers, 2-3 updates, and feedback URL before production access
- **Lessons Learned**: See `docs/GOOGLE_PLAY_LESSONS_LEARNED.md` for full release journey documentation

## Core Principles
- **Simple is better** - Both in UI and code implementation
- **No overengineering** - Keep solutions straightforward and maintainable
- **Respect user resources** - Minimal data usage, efficient caching, battery-conscious

## Target Users
- Turkish radio listeners who want to enjoy Trend Ankara content
- Users who value simple, distraction-free experiences
- People who listen to radio while multitasking on their phones
- Both iOS and Android users

## Key Features

### 1. Radio Player (Main Feature)
- Shoutcast streaming playback via `react-native-track-player`
- Background playback with native media controls (lock screen, notification)
- Play/pause button with animated visual feedback
- Mute functionality
- Station logo display with now-playing metadata
- WhatsApp message button (istek hatti: 0312 283 06 06)
- Instagram link (@radyotrendankara)
- Social media share button

### 2. Polls Page
- Weekly top selections
- Interactive voting mechanisms
- Results display with vote counts
- Dynamic poll content from backend API

### 3. News Page
- Media industry news
- Article listings with images
- Badge indicators for new content
- Cached content for offline reading

### 4. Sponsorship/Advertisement Page
- Fully dynamic content from backend
- Campaign displays
- Sponsor advertisements
- Flexible layout system

### 5. Settings Page
- Background play toggle
- Dark/light mode selection (auto/light/dark)
- Cache management (clear cache)
- App review prompt

### 6. About Page
- App version display
- Station logo
- Links to privacy policy, terms & conditions
- Contact information

### 7. Onboarding
- First-launch welcome screen
- Feature highlights

## User Experience Goals
- **Instant playback** - Minimize time to start listening
- **Uninterrupted streaming** - Handle network changes gracefully
- **Background listening** - Allow multitasking while enjoying content
- **Offline resilience** - Show cached content when network unavailable
- **Simple navigation** - Clear, intuitive tab-based interface

## Business Objectives
- Build brand loyalty through consistent, quality streaming
- Enable sponsor/advertiser reach through dynamic content
- Engage listeners through interactive polls
- Keep users informed with media industry news
- Maintain professional brand presence on mobile platforms

## Success Metrics
- Stream stability and uptime
- User retention rates
- Poll participation levels
- News engagement metrics
- App store ratings and reviews
- Background playback usage statistics

## Localization
- **Code**: English for all development
- **UI**: Turkish for all user-facing text
- **Content**: Turkish from backend services

## Brand Identity
- **Name**: Trend Ankara (no frequency number - "103.8" branding has been dropped)
- **Logo**: Red microphone + white equalizer bars + "TREND ANKARA" text on black background
- **Primary Colors**: Red (#DC2626), Black (#000000), White (#FFFFFF)
- **Secondary Colors**: Dark grays for surfaces and borders
- **Forbidden Colors**: Blue (except for badges in news)
- **Design Philosophy**: Clean, minimalist, professional

## Data Philosophy
- Cache everything possible for offline access
- Update cache whenever network available (WiFi or cellular)
- Minimize data transfer sizes
- Progressive content loading
- Graceful degradation when offline
