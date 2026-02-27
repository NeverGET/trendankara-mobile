# Build & Deploy Notes

## Mobile iOS Build
1. `npx expo prebuild --clean` (regenerate native projects)
2. Build archive: `xcodebuild -workspace ios/TrendAnkara.xcworkspace -scheme TrendAnkara -configuration Release -archivePath /tmp/TrendAnkara.xcarchive archive DEVELOPMENT_TEAM=YN2RSJCUDX CODE_SIGN_STYLE=Automatic`
3. Export IPA: `xcodebuild -exportArchive -archivePath /tmp/TrendAnkara.xcarchive -exportPath /tmp/TrendAnkaraExport -exportOptionsPlist /tmp/ExportOptions.plist`
4. Upload via Xcode Organizer (Distribute App > App Store Connect)

## Mobile Android Build
1. `npx expo prebuild --clean`
2. APK: `cd android && ./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release.apk`
3. AAB: `cd android && ./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`

## Webapp Deploy
- Push to `main` triggers GitHub Actions → Docker build → SSH deploy to VPS
- Manual: SSH to root@82.29.169.180, `cd /opt/app`, `git pull`, `docker build`, restart container
- Container runs on `radio_network_alt` network

## Store Submission

### iOS (App Store)
1. Build archive via Xcode or `xcodebuild archive`
2. Export IPA via Xcode Organizer
3. Upload to App Store Connect via Xcode Organizer (Distribute App > App Store Connect)
4. Fill metadata, screenshots, and submit for review
5. Review typically 1-3 days

### Android (Google Play)
1. Build AAB: `cd android && ./gradlew bundleRelease` (APK not accepted by Play Store)
2. Upload AAB to Google Play Console > Testing > Closed testing (or Production)
3. Fill store listing, content rating, data safety form
4. For new apps: Must complete 14-day closed testing period first
   - 12+ active testers required
   - Push 2-3 updates during testing
   - Set feedback URL for testers
   - Answer production access questionnaire (see `docs/GOOGLE_PLAY_PRODUCTION_ACCESS.md`)
5. After closed testing: Promote to Production track
6. Review typically 1-7 days

### Google Play Gotchas
- **Metadata policy**: Avoid promotional/superlative words in descriptions ("trend", "best", "new", "free", "top", "#1", "en popüler", "en son", "en iyi", "yeni", "ücretsiz")
- **Brand name workaround**: Use "TrendAnkara" as single word (brand name), never "trend" as adjective
- **Privacy policy**: Must be a live, accessible URL (404 = instant rejection)
- **Permissions**: `RECEIVE_BOOT_COMPLETED` needs explicit justification for foreground service
- **Deprecated permissions**: Remove `READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE` (deprecated in API 33+)
- **Unused permissions**: Remove camera/microphone if not actually used (iOS and Android)
- **Build format**: Only AAB accepted, not APK

## Common Gotchas
- Shell has `cp='cp -i'` alias - always use `/bin/cp -f` for file overwrites
- `npx expo prebuild --clean` wipes Xcode signing config - always set DEVELOPMENT_TEAM
- Metro bundler cache can serve stale images - kill Metro and clear caches for image changes
- Next.js `<Image>` optimizer can't handle SVGs with embedded base64 `<image>` tags - use PNG instead
- Gradle `clean` can break CMake/codegen - run prebuild --clean first instead
