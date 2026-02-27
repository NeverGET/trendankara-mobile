# Trend Ankara - Project Overview

## What Is This
Trend Ankara is a Turkish radio station digital presence consisting of:
1. **Mobile App** (`/Users/cemalkurt/Projects/trendankara/mobile`) - React Native/Expo app for iOS and Android
2. **Webapp** (`/Users/cemalkurt/Projects/trendankara/webapp`) - Next.js CMS platform with public site and admin panel

## Brand Identity
- **Name**: Trend Ankara (no frequency number - "103.8" branding was dropped in Feb 2026)
- **Logo**: Red microphone + white equalizer bars + "TREND ANKARA" text on black background
- **Colors**: Red (#DC2626), Black (#000000), White (#FFFFFF)
- **No blue** except news badges

## Live URLs
- **Website**: https://www.trendankara.com/
- **Admin**: https://www.trendankara.com/admin
- **Radio Stream**: https://radyo.yayin.com.tr:5132/
- **Mobile API**: https://www.trendankara.com/api/mobile/v1/

## Deployment
- **VPS**: 82.29.169.180 (Ubuntu, SSH as root)
- **Docker**: Container `radioapp` on `radio_network_alt`, port 3000
- **CI/CD**: GitHub Actions deploys to VPS on push to `main`
- **Database**: MySQL 8.0 (container `radio_mysql_alt`, port 3306 internal / 3307 external)
- **Storage**: MinIO (container `minio`, port 9000 internal / 9002 external)

## Mobile App Status
- **iOS**: Released on App Store (v1.0.2, bundle: com.trendankara.neverget, team: YN2RSJCUDX)
- **Android**: Released on Google Play (v1.0.1, versionCode 4, package: com.trendankara.mobile)
- **EAS Project**: 55f2a9e8-b926-416c-9eaf-213c127638dc
- **Both stores live** as of Feb 2026

## Store Compliance Notes
- Google Play metadata policy is very strict about promotional/superlative language in descriptions
- Words like "trend" (as adjective), "best", "new", "free", "top", "en popüler" are banned
- The brand name "TrendAnkara" (single word) is allowed, but "trend" as a descriptive adjective is not
- Google Play required 14-day closed testing with 12+ testers and 2-3 updates before granting production access
- See `docs/GOOGLE_PLAY_LESSONS_LEARNED.md` for full lessons learned
