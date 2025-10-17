# Product Steering Document - Trend Ankara

## Product Vision
Trend Ankara is a simple, elegant radio station mobile app that delivers continuous audio streaming entertainment while respecting users' device resources and data usage. The app focuses on providing a seamless listening experience with minimal friction.

## Core Principles
- **Simple is better** - Both in UI and code implementation
- **No overengineering** - Keep solutions straightforward and maintainable
- **Test everything** - Ensure all features work as intended before release
- **Respect user resources** - Minimal data usage, efficient caching, battery-conscious

## Target Users
- Turkish radio listeners who want to enjoy Trend Ankara content
- Users who value simple, distraction-free experiences
- People who listen to radio while multitasking on their phones
- Both iOS and Android users

## Key Features

### 1. Radio Player (Main Feature)
- Shoutcast streaming playback (https://radyo.yayin.com.tr:5132/)
- Background playback capability
- Giant play/pause button for easy interaction
- Mute functionality
- Station logo display
- WhatsApp message button
- Instagram message button

### 2. Polls Page
- Weekly top 10 selections
- Interactive voting mechanisms
- Results display
- Dynamic poll content from backend

### 3. News Page
- Media industry news
- Article listings
- Badge indicators for new content
- Cached content for offline reading

### 4. Sponsorship/Advertisement Page
- Fully dynamic content from backend
- Campaign displays
- Sponsor advertisements
- Flexible layout system

### 5. Settings Page
- Background play toggle
- Dark/light mode selection
- App preferences
- Cache management

## User Experience Goals
- **Instant playback** - Minimize time to start listening
- **Uninterrupted streaming** - Handle network changes gracefully
- **Background listening** - Allow multitasking while enjoying content
- **Offline resilience** - Show cached content when network unavailable
- **Simple navigation** - Clear, intuitive interface structure

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
- **Name**: Trend Ankara
- **Primary Colors**: Red, Black, White
- **Secondary Colors**: Dark grays for shading
- **Forbidden Colors**: Blue (except for badges in news)
- **Design Philosophy**: Clean, minimalist, professional

## Data Philosophy
- Cache everything possible for offline access
- Update cache whenever network available (WiFi or cellular)
- Minimize data transfer sizes
- Progressive content loading
- Graceful degradation when offline