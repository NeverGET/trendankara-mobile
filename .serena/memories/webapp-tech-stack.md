# Webapp - Tech Stack

## Core
- Next.js 15.5.7 (App Router, Server Components, Turbopack)
- React 19.1.0, TypeScript
- Tailwind CSS v4
- Docker deployment on VPS

## Key Dependencies
- `next-auth` ^5.0.0-beta.30 for admin authentication
- `mysql2` ^3.6.0 for database
- `minio` ^7.1.0 for object storage
- `axios` ^1.12.2 for HTTP
- Radix UI primitives for accessible components
- `framer-motion` / `motion` for animations
- `react-hook-form` for forms
- `date-fns` for dates
- `sharp` for image processing
- `leaflet` / `react-leaflet` for maps

## Structure
- `src/app/(public)/` - Public pages (home, polls, news)
- `src/app/admin/` - Admin panel (protected)
- `src/app/api/` - API routes (auth, polls, news, media, radio, mobile/v1/)
- `src/components/` - Components (common, radio, polls, news, media, content, ui)
- `src/lib/` - Utilities (auth, db, storage, utils)
- `src/hooks/` - Custom hooks
- `public/` - Static assets (TrendAnkara-Logo.png, favicons, manifest)

## Infrastructure
- Docker container `radioapp` on port 3000
- MySQL container `radio_mysql_alt` on port 3306
- MinIO container `minio` on port 9000
- GitHub Actions CI/CD deploys to VPS via SSH

## Important Notes
- Logo files use PNG format (not SVG) in components - Next.js image optimizer can't handle SVGs with embedded base64 images
- Header.tsx, Footer.tsx, EnhancedRadioPlayer.tsx reference `/TrendAnkara-Logo.png`
- Always-on dark theme
- All UI text in Turkish, code in English
