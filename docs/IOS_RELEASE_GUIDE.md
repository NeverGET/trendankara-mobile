# iOS App Release Guide - TrendAnkara

**Version**: 1.0.0 (Build: 1)
**Build Date**: October 19, 2025
**Status**: ✅ Ready for App Store Submission

---

## 📋 Pre-Submission Checklist

### ✅ Build Configuration (COMPLETED)
- [x] Bundle Identifier: `com.trendankara.neverget`
- [x] Version: 1.0.0 (Build: 1)
- [x] Xcode project configured: `TrendAnkara.xcworkspace`
- [x] Privacy Policy: https://trendankara.com/gizlilik-politikasi
- [x] Signing certificates detected (5 valid identities)

**📝 Note: Bundle ID Difference**
- **iOS**: `com.trendankara.neverget`
- **Android**: `com.trendankara.mobile`

This is intentional - iOS and Android apps use different bundle identifiers. Both are valid and will work correctly on their respective platforms.

### ✅ App Requirements (COMPLETED)
- [x] App icons prepared (all iOS sizes including 1024x1024)
- [x] Splash screen configured
- [x] Background audio capability enabled
- [x] Info.plist permissions configured
- [x] Export compliance: No encryption (ITSAppUsesNonExemptEncryption: false)

### 🎯 What You Need (READY TO START)
- [x] Apple Developer account ($99/year) - Active
- [x] Mac with Xcode 26.0.1 installed
- [x] Valid signing certificates
- [ ] Screenshots prepared (6.9" iPhone + 13" iPad)
- [ ] App Store Connect app created
- [ ] Privacy Nutrition Label filled

---

## 🚀 Step-by-Step Release Process

### Step 0: Important Difference from Android

**🎉 GOOD NEWS: No Identity Verification Wait!**

Unlike Google Play Console which requires 1-3 days identity verification:
- ✅ **Apple Developer enrollment is immediate** after paying $99/year
- ✅ **No government ID verification required** for standard App Store submission
- ✅ **You can start uploading RIGHT NOW** if your account is active

**Check Your Account Status:**
1. Go to: https://developer.apple.com/account/
2. Sign in with your Apple ID
3. Verify "Membership" shows "Active" status
4. If not enrolled yet: https://developer.apple.com/programs/enroll/

---

## Part 1: Build & Archive in Xcode

### Step 1: Prepare Your Project

#### 1.1 Open Project in Xcode
```bash
cd /Users/cemalkurt/Projects/trendankara/mobile
open ios/TrendAnkara.xcworkspace
```

**⚠️ IMPORTANT: Always open `.xcworkspace`, NOT `.xcodeproj`!**

#### 1.2 Verify Build Settings

In Xcode:

1. **Select Project** → TrendAnkara (top of left sidebar)
2. **Select Target** → TrendAnkara
3. **General Tab**:
   - Display Name: `TrendAnkara`
   - Bundle Identifier: `com.trendankara.neverget`
   - Version: `1.0.0`
   - Build: `1`

4. **Signing & Capabilities Tab**:
   - ✅ **Automatically manage signing** (recommended)
   - Team: Select your Apple Developer team
   - Signing Certificate: Should auto-select
   - Provisioning Profile: Xcode Managed

**If you want manual signing:**
- Uncheck "Automatically manage signing"
- You'll need to create provisioning profiles manually in Apple Developer Portal

#### 1.3 Select Build Scheme

At the top of Xcode:
1. Select **TrendAnkara** scheme (next to play/stop buttons)
2. Select **Any iOS Device (arm64)** as destination
   - **DO NOT** select a simulator
   - If you don't see "Any iOS Device", connect a physical device first

#### 1.4 Verify Info.plist

Your Info.plist is already configured, but verify these keys:
- ✅ `CFBundleShortVersionString`: `1.0.0`
- ✅ `CFBundleVersion`: `1`
- ✅ `UIBackgroundModes`: Contains `audio` (for radio playback)
- ✅ `ITSAppUsesNonExemptEncryption`: `false` (no export compliance needed)

---

### Step 2: Archive Your App

#### 2.1 Clean Build Folder (Recommended)
```
Product → Clean Build Folder (⇧⌘K)
```

Or from terminal:
```bash
cd ios
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

#### 2.2 Create Archive
```
Product → Archive (⌘ + Shift + R)
```

This will:
- Build your app in Release mode
- Create an archive package
- Open the Organizer window when complete

**Expected time:** 5-15 minutes depending on Mac speed

**If build fails:**
- Check signing certificates are valid
- Ensure "Any iOS Device" is selected (not simulator)
- Review the error messages in the Issue Navigator (⌘ + 4)
- See troubleshooting section at the end of this guide

#### 2.3 Organizer Window

When archive succeeds, the **Organizer** window opens showing:
- Your app name: TrendAnkara
- Version: 1.0.0
- Build: 1
- Date created
- Archive size

---

### Step 3: Distribute to App Store Connect

#### 3.1 Click "Distribute App"

In the Organizer window, click the **"Distribute App"** button on the right.

#### 3.2 Select Distribution Method

Choose: **App Store Connect**

Options explained:
- **App Store Connect**: Upload to TestFlight and App Store (✅ Choose this)
- **Ad Hoc**: Install on specific devices (for testing)
- **Enterprise**: For internal distribution (requires Enterprise program)
- **Development**: For development testing
- **Copy App**: Save the .ipa file locally

#### 3.3 Distribution Options

**App Store Connect destination:**
- ✅ Select **Upload** (recommended)
  - Sends directly to App Store Connect
  - Available for TestFlight immediately
- ⭕ **Export**: Creates .ipa file for manual upload later

#### 3.4 App Store Connect Distribution Options

Check these options:

✅ **Upload your app's symbols** (Recommended)
- Provides crash reports with readable stack traces
- File size: ~50-100MB larger
- Essential for debugging production issues

✅ **Manage version and build number** (Recommended)
- Xcode auto-increments build numbers
- Prevents build number conflicts

#### 3.5 Re-sign Options (Usually Default)

- **Automatically manage signing**: ✅ (Let Xcode handle it)
- **Distribution Certificate**: Auto-selected by Xcode
- **Provisioning Profile**: Xcode Managed Profile

Click **Next**.

#### 3.6 Review and Upload

Xcode will show:
- App name
- Version and build
- Bundle identifier
- Team
- Distribution certificate
- Provisioning profile

**Review carefully**, then click **Upload**.

#### 3.7 Upload Progress

You'll see:
- ⚙️ Preparing archive for upload...
- 📤 Uploading to App Store Connect...
- ✅ Upload successful!

**Expected time:** 5-15 minutes depending on internet speed

**Archive size:** ~150-250MB (includes symbols, bitcode, etc.)

#### 3.8 Processing on App Store Connect

After upload completes:
- Your app is sent to App Store Connect
- Processing takes 5-60 minutes
- You'll receive email: "App Store Connect: Build Processing Complete"
- Until processing completes, build won't appear in App Store Connect

---

## Part 2: App Store Connect Setup

### Step 4: Create Your App in App Store Connect

#### 4.1 Access App Store Connect

Go to: https://appstoreconnect.apple.com

Sign in with your Apple Developer account.

#### 4.2 Create New App

1. Click **"My Apps"** (on home page)
2. Click **"+"** button → **"New App"**
3. Fill in the form:

**Platform:**
```
✓ iOS
```

**Name:**
```
TrendAnkara
```
(This is the public name users see on App Store)

**Primary Language:**
```
Turkish (Türkçe)
```

**Bundle ID:**
```
Select: com.trendankara.neverget
```
(Should appear in dropdown if your archive uploaded successfully)

**SKU:**
```
trendankara-mobile-001
```
(Internal identifier, users never see this. Can be anything unique.)

**User Access:**
```
Full Access
```

4. Click **"Create"**

---

### Step 5: Fill in App Information

Navigate through the tabs in App Store Connect:

#### 5.1 App Information Tab

**Name** (30 characters max):
```
TrendAnkara
```

**Subtitle** (30 characters max):
```
İstanbul'un En Trend Radyosu
```

**Category:**
```
Primary: Music
Secondary: News (optional)
```

**Content Rights:**
```
✓ Contains third-party content
```
(Since you stream radio content and news)

---

#### 5.2 Pricing and Availability

**Price:**
```
Free
```

**Availability:**
```
✓ All countries and regions
```

Or select specific regions:
```
✓ Turkey
✓ United States
✓ European Union
✓ United Kingdom
(Select based on your audience)
```

**Pre-orders:**
```
No (leave unchecked for first release)
```

---

### Step 6: Prepare Your App Store Assets

#### 6.1 App Icon (REQUIRED)

**Size:** 1024 x 1024 pixels (no transparency, no alpha channel)

**Format:** PNG or JPEG

**Your icon location:**
```
/Users/cemalkurt/Projects/trendankara/mobile/assets/icons/ios/icon-1024.png
```

**Requirements:**
- No rounded corners (Apple adds them automatically)
- No transparency
- RGB color space (not CMYK)
- Must represent the app accurately

---

#### 6.2 Screenshots (REQUIRED)

**NEW 2025 REQUIREMENTS:**

You only need **TWO** screenshot sets:
1. **6.9" iPhone** (mandatory for iPhone)
2. **13" iPad** (mandatory if supporting iPad)

Apple will automatically scale down for smaller devices!

**6.9" iPhone Screenshots (REQUIRED):**
- Size: **1320 x 2868 pixels** (portrait) or **2868 x 1320** (landscape)
- Format: JPEG or PNG (no transparency)
- Quantity: **2-10 screenshots** (minimum 2, maximum 10)
- All must be same orientation (portrait OR landscape, no mixing)

**13" iPad Screenshots (If Supporting iPad):**
- Size: **2064 x 2752 pixels** (portrait) or **2752 x 2064** (landscape)
- Format: JPEG or PNG (no transparency)
- Quantity: **2-10 screenshots**

**What to Capture:**

Screenshot ideas for TrendAnkara:
1. **Radio Player** - Main screen with play button, station logo, controls
2. **News Feed** - Article listings with images
3. **Poll Page** - Interactive voting interface with results
4. **Dark Mode** - Show dark theme support
5. **Settings** - Theme selection, preferences

**How to Capture iPhone Screenshots:**

From simulator (then scale to exact size):
```bash
# Run app on iPhone 16 Pro Max simulator (closest to 6.9")
npx expo run:ios --device "iPhone 16 Pro Max"

# Take screenshots: Cmd + S in simulator
# Screenshots saved to: ~/Desktop/
```

**Resize to exact dimensions:**

Use online tool or command:
```bash
# Install ImageMagick if needed
brew install imagemagick

# Resize to 1320x2868 (portrait)
magick convert screenshot.png -resize 1320x2868! screenshot-resized.png
```

**Professional Options:**
- Use Figma or Sketch to add marketing overlay text
- Hire designer on Fiverr ($20-50 for App Store screenshots)
- Use screenshot tools like AppLaunchpad, Previewed, or Screenshots.pro

---

#### 6.3 App Preview Video (OPTIONAL)

**Format:** M4V, MP4, or MOV
**Duration:** 15-30 seconds
**Orientation:** Portrait or landscape (match screenshots)
**Sizes:**
- 6.9" iPhone: **1320 x 2868** (portrait) or **2868 x 1320** (landscape)

Not required for first submission, can add later.

---

### Step 7: Write App Store Description

#### 7.1 Description (4000 characters max)

**Turkish description:**

```
TrendAnkara - İstanbul'un En Trend Radyosu

📻 CANLI RADYO YAYINI
7/24 kesintisiz canlı radyo yayını ile en sevdiğiniz müzikleri dinleyin. Arka planda çalma desteği ile telefonunuzu kullanırken müziğiniz devam eder.

📰 GÜNCEL HABERLER
Medya dünyasından en güncel haberler ve gelişmeler anında elinizde. Çevrimdışı okuma desteği ile internet bağlantınız olmadan bile haberlere ulaşabilirsiniz.

🗳️ İNTERAKTİF ANKETLER
Haftalık top 10 listelerine katılın, favori şarkılarınıza oy verin ve sonuçları anında görün.

✨ ÖZELLİKLER
• Kesintisiz canlı radyo yayını
• Arka planda müzik çalma
• Müzik kontrolü bildirim merkezinden
• Haftalık müzik anketleri
• Güncel medya haberleri
• Çevrimdışı haber okuma
• Koyu/Açık tema desteği
• WhatsApp ve Instagram entegrasyonu
• Kullanıcı dostu ve modern arayüz
• iPhone ve iPad desteği

📱 NEDEN TRENDANKARA?
TrendAnkara ile İstanbul'un nabzını tutun, en popüler müzikleri keşfedin ve medya dünyasından haberdar olun. Uygulamayı indirip radyo dinlemenin keyfini çıkarın!

🔒 GİZLİLİK
Verilerinizin gizliliği bizim için önemli. Detaylı bilgi için gizlilik politikamızı ziyaret edin: https://trendankara.com/gizlilik-politikasi

📧 İLETİŞİM
Sorularınız ve önerileriniz için:
Email: info@trendankara.com
Web: https://trendankara.com
Instagram: @trendankara
WhatsApp: [Your WhatsApp number]

İstanbul'un en trend radyosunu mobil cihazınızda deneyimleyin!
```

#### 7.2 Keywords (100 characters max, comma-separated)

```
radyo,müzik,canlı yayın,haber,anket,trend,istanbul,medya,akış,streaming
```

Tips:
- No spaces after commas
- Use most searchable terms
- Avoid app name (already indexed)
- Research competitors' keywords

#### 7.3 Promotional Text (170 characters max) (OPTIONAL)

This can be updated WITHOUT app review:

```
🎵 Canlı radyo yayını, güncel haberler ve haftalık anketler! TrendAnkara ile İstanbul'un nabzını tutun. Hemen indir, dinlemeye başla! 📻
```

#### 7.4 Support URL (REQUIRED)

```
https://trendankara.com
```

#### 7.5 Marketing URL (OPTIONAL)

```
https://trendankara.com
```

---

### Step 8: Version Information

#### 8.1 What's New in This Version (4000 characters max)

**For version 1.0.0 (initial release):**

```
🎉 TrendAnkara'nın ilk sürümü!

✨ Özellikler:
• 📻 Canlı radyo yayını - 7/24 kesintisiz müzik
• 🎵 Arka planda çalma desteği
• 🔔 Bildirim merkezinden müzik kontrolü
• 📰 Güncel medya haberleri
• 🗳️ Haftalık müzik anketleri
• 🌙 Koyu/Açık tema desteği
• 📱 Modern ve kullanıcı dostu arayüz
• 💬 WhatsApp ve Instagram entegrasyonu

İstanbul'un en trend radyosunu mobil cihazınızda deneyimleyin!

Geri bildirimleriniz için: info@trendankara.com
```

---

### Step 9: Privacy & Compliance

#### 9.1 Privacy Policy URL (REQUIRED)

```
https://trendankara.com/gizlilik-politikasi
```

**⚠️ CRITICAL:** This URL must be accessible and must contain:
- What data you collect
- How you use it
- Third-party integrations (if any)
- User rights
- Contact information

#### 9.2 App Privacy (REQUIRED)

Click **"Edit"** next to "App Privacy" and answer questions:

**Does your app collect data?**

Based on your app:

**App Usage:**
- [ ] Browsing History: No
- [x] **Product Interaction**: Yes (listening, voting, reading)
  - **Usage:** Analytics
  - **Linked to User:** No
  - **Used for Tracking:** No

**Device ID:**
- [x] **Device ID**: Yes (for app functionality)
  - **Usage:** App functionality
  - **Linked to User:** No
  - **Used for Tracking:** No

**Location:** (If you don't collect)
- [ ] No location data collected

**User Content:** (If users can't create content)
- [ ] No user content collected

**Contact Info:** (If you don't require registration)
- [ ] No contact info collected

**Privacy Practices:**
- [x] Data is encrypted in transit
- [ ] Users can request data deletion (if you have accounts)
- [x] No data linked to user identity

Click **"Save"** → **"Publish"**

---

#### 9.3 Export Compliance (REQUIRED)

**Does your app use encryption?**

✅ **No** (Already set in Info.plist: `ITSAppUsesNonExemptEncryption: false`)

Your app uses HTTPS (standard encryption) which is exempt.

**If App Store Connect asks:**
- Select: **"No, my app doesn't use encryption"**

---

#### 9.4 Content Rights

**Do you have the rights to all content?**

Based on TrendAnkara:
- ✅ Radio streaming: You own or have license
- ✅ News content: You own or have rights
- ✅ Poll content: User-generated or licensed

Select:
```
✓ Yes, I have the rights to use all content in my app
```

#### 9.5 Advertising Identifier (IDFA)

**Does your app use the Advertising Identifier?**

If you don't use ads or third-party analytics with IDFA:
```
✗ No
```

If you use analytics (Firebase, Facebook SDK, etc.):
```
✓ Yes
- [ ] Serve ads
- [x] Attribute app installs to ads
- [x] Measure ad effectiveness
- [ ] Other
```

---

### Step 10: Age Rating

#### 10.1 Complete Age Rating Questionnaire

Click **"Edit"** next to "Age Rating"

Answer all questions truthfully:

**Unrestricted Web Access:**
```
No (unless you have a web browser)
```

**Simulated Gambling:**
```
No
```

**Contests:**
```
No
```

**Alcohol, Tobacco, or Drug Use:**
```
None/Infrequent
```

**Sexual Content or Nudity:**
```
None
```

**Profanity or Crude Humor:**
```
None/Infrequent (depends on news content)
```

**Horror/Fear Themes:**
```
None
```

**Violence:**
```
None
```

**Medical/Treatment Information:**
```
No
```

**Unrestricted Social Networking:**
```
No
```

**Mature/Suggestive Themes:**
```
None/Infrequent
```

#### 10.2 Expected Rating

Based on above answers:
```
4+ (Ages 4 and up)
```

Or if news contains mature topics:
```
12+ (Ages 12 and up)
```

---

### Step 11: Build Selection

#### 11.1 Select Your Build

1. Go to **"App Store"** tab
2. Under **"Build"** section, click **"+"** or **"Select a build"**
3. Choose your uploaded build:
   - Version: 1.0.0
   - Build: 1
   - Upload date

**If build doesn't appear:**
- Wait 5-60 minutes for processing
- Check email for "Build Processing Complete"
- Refresh the page

#### 11.2 Export Compliance

When selecting build, you'll be asked:

**"Is your app designed to use cryptography or does it contain or incorporate cryptography?"**

✅ **No** (HTTPS is exempt)

This matches your Info.plist setting.

---

### Step 12: Final Review

#### 12.1 Checklist Before Submission

Go through each section and ensure ✅:

- [x] **App Information**: Name, category, keywords filled
- [x] **Pricing**: Free or price selected
- [x] **Prepare for Submission**:
  - [x] Screenshots (6.9" iPhone minimum)
  - [x] App icon (1024x1024)
  - [x] Description written
  - [x] Keywords entered
  - [x] Support URL provided
  - [x] Build selected
  - [x] What's New filled
  - [x] Privacy policy URL added
  - [x] App Privacy completed
  - [x] Export compliance answered
  - [x] Age rating completed

#### 12.2 Review Information (REQUIRED)

Provide info for App Review team:

**First Name:**
```
[Your first name]
```

**Last Name:**
```
[Your last name]
```

**Phone Number:**
```
+90 [Your phone number]
```

**Email:**
```
info@trendankara.com
```

**Sign-in required:**
```
✗ No
```
(Since your app doesn't require login)

**Demo Account** (if login required):
- Username: [demo username]
- Password: [demo password]

**Notes:**
```
TrendAnkara canlı radyo uygulamasıdır. Uygulama giriş gerektirmez, tüm özellikler herkese açıktır.

Test için:
1. Ana sayfada büyük Play butonuna basarak radyo dinleyebilirsiniz
2. "Haberler" sekmesinden güncel medya haberlerini okuyabilirsiniz
3. "Anketler" sekmesinden haftalık müzik anketlerine oy verebilirsiniz
4. "Ayarlar" bölümünden koyu/açık tema değiştirebilirsiniz

İnternet bağlantısı gereklidir.

For testing:
1. Tap the large Play button on home screen to start radio streaming
2. Browse news articles in "Haberler" tab
3. Vote in polls in "Anketler" tab
4. Change theme in "Ayarlar" (Settings)

Internet connection required.
```

**Attachment** (OPTIONAL):
- Screenshots or videos showing how to use app
- Documents explaining features

---

### Step 13: Submit for Review

#### 13.1 Final Checks

Before clicking submit, verify:

✅ All sections show green checkmarks (complete)
✅ No yellow warnings
✅ Build is selected and processed
✅ Screenshots look professional
✅ Description is compelling and error-free
✅ Privacy policy URL is accessible

#### 13.2 Click "Submit for Review"

1. Click **"Add for Review"** button (top right)
2. Review the summary page showing all your info
3. Check the box: **"I have read and agree to the Apple Developer Program License Agreement"**
4. Click **"Submit"**

#### 13.3 Submission Confirmation

You'll see:
✅ **"Waiting for Review"** status

You'll receive emails:
1. **Immediate**: "App Store: Your submission was successful"
2. **When review starts**: "App Store: Your app is now In Review"
3. **When reviewed**: "App Store: Your app status is Ready for Sale" OR "Your app has issues"

---

## ⏱️ Review Timeline

**Expected Review Time:**
- 90% of apps reviewed within **24 hours**
- Can take up to **7 days** in rare cases
- Resubmissions are usually faster (24-48 hours)

**What Apple Reviews:**
- App functionality matches description
- No crashes or major bugs
- Follows App Store Review Guidelines
- Privacy policy is accurate
- Content is appropriate for age rating
- No prohibited content
- Metadata is accurate

**Status Progression:**
```
Waiting for Review → In Review → Processing for App Store → Ready for Sale
```

---

## 📧 After Submission

### If Approved ✅

**You'll receive email:**
```
Subject: App Store: Your app status is Ready for Sale
```

**Your app will:**
- Go live within 1-2 hours
- Be searchable on App Store
- Show up in your developer profile

**App Store URL:**
```
https://apps.apple.com/app/trendankara/id[APP_ID]
```

You can find APP_ID in App Store Connect → App Information

**Share your app:**
- Direct link: `https://apps.apple.com/app/id[APP_ID]`
- Short link: Create in App Store Connect → App Information
- QR code: Generate from short link

---

### If Rejected ❌

**You'll receive email:**
```
Subject: App Store: Your app has one or more issues
```

**Common rejection reasons:**

1. **App Crashes**
   - Fix the crash
   - Test thoroughly
   - Resubmit

2. **Misleading Metadata**
   - Description doesn't match functionality
   - Screenshots show features not in app
   - Update description/screenshots

3. **Privacy Policy Issues**
   - URL not accessible
   - Doesn't describe data collection
   - Update privacy policy

4. **Broken Functionality**
   - Features don't work as described
   - Links don't work
   - Fix and resubmit

5. **Guideline Violations**
   - Review Apple's feedback
   - Fix specific issues
   - Respond to reviewer notes

**To Resubmit:**
1. Read rejection reason carefully in Resolution Center
2. Fix the issues mentioned
3. Update version/build if needed (or use same build)
4. Respond to reviewer in Resolution Center
5. Click "Submit for Review" again

Resubmissions are usually reviewed within 24-48 hours.

---

## 🔄 Updating Your App

### When to Release an Update

- Bug fixes
- New features
- Performance improvements
- Compatibility updates
- UI changes

### Update Process

#### 1. Increment Version/Build

Edit `ios/TrendAnkara/Info.plist`:
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.1</string>  <!-- Increment version -->
<key>CFBundleVersion</key>
<string>2</string>  <!-- Increment build number -->
```

Or update in Xcode:
- Project → TrendAnkara → General
- Version: `1.0.1`
- Build: `2`

#### 2. Archive and Upload

Repeat steps from "Step 2: Archive Your App"

#### 3. Create New Version in App Store Connect

1. Go to App Store Connect → My Apps → TrendAnkara
2. Click **"+"** next to "iOS App" in left sidebar
3. Select **"Create New Version"**
4. Enter version number: `1.0.1`
5. Update **"What's New in This Version"**
6. Select new build
7. Submit for review

**What's New example:**
```
🔧 Versiyon 1.0.1 Güncellemesi

✨ Yenilikler:
• Hata düzeltmeleri ve performans iyileştirmeleri
• Radyo akışı daha stabil
• Karanlık tema geliştirmeleri

Bizi tercih ettiğiniz için teşekkürler! 🎵
```

---

## 📱 TestFlight Beta Testing (OPTIONAL)

Before submitting to App Store, you can test with TestFlight.

### Why Use TestFlight?

- Test with real users before public release
- Get feedback on functionality
- Catch bugs before App Store review
- Test on various devices and iOS versions

### Setting Up TestFlight

#### 1. Upload Build (Already Done)

Your uploaded build is automatically available for TestFlight.

#### 2. Internal Testing (Automatic)

**Who:** Up to 100 users with App Store Connect access

**Setup:**
1. Go to TestFlight tab in App Store Connect
2. Your build appears under "iOS"
3. Click on the build
4. Add internal testers:
   - Users & Access → Users → Add users
   - Grant "App Manager" or "Developer" role
5. They'll receive email invitation

**No review required** - available immediately!

#### 3. External Testing (Requires Review)

**Who:** Up to 10,000 external testers

**Setup:**
1. TestFlight tab → External Testing
2. Click **"+"** to create new group
3. Name: "Public Beta Testers"
4. Add build
5. Fill out **"Test Information"**:
   - Beta App Description
   - Feedback Email
   - What to Test
6. Submit for Beta App Review (1-2 days)

**Once approved:**
- Share public link: `https://testflight.apple.com/join/[CODE]`
- Anyone with link can install
- 90-day testing period per build

#### 4. TestFlight App Metadata

**Beta App Description:**
```
TrendAnkara radyo uygulamasının beta sürümünü test ediyorsunuz!

Lütfen test edin:
• Canlı radyo yayını
• Haber okuma
• Anket oy verme
• Tema değiştirme
• Arka plan çalma

Geri bildirimleriniz için: info@trendankara.com
```

**What to Test:**
```
Please test:
1. Radio streaming quality
2. Background playback
3. News loading and reading
4. Poll voting
5. Theme switching
6. App performance and crashes

Report issues to: info@trendankara.com
```

---

## 📊 Post-Launch Monitoring

### Week 1 After Launch

**Daily Checks:**
- [ ] Check crash reports in App Store Connect → Analytics → Crashes
- [ ] Monitor user reviews and ratings
- [ ] Check download statistics
- [ ] Verify app appears in search results
- [ ] Test app on different devices/iOS versions

**Crash Reports:**
- App Store Connect → Crashes
- View crash logs with symbols (if you uploaded symbols)
- Identify most common crashes
- Prioritize fixes

**User Reviews:**
- App Store Connect → Ratings and Reviews
- Read all reviews
- Respond to negative reviews (can't respond to positive ones)
- Note common complaints or feature requests

### Responding to Reviews

**You CAN respond to reviews** (unlike in the past):

1. Go to App Store Connect → Ratings and Reviews
2. Click on a review
3. Click **"Respond"**
4. Write professional response (max 3000 characters)

**Response tips:**
- Thank users for feedback
- Acknowledge issues
- Explain fixes in updates
- Be professional and courteous
- Provide support email if needed

**Example response to negative review:**
```
Merhaba! Geri bildiriminiz için teşekkürler. [Issue] sorununu biliyoruz ve bir sonraki güncellemede düzelteceğiz. Daha fazla destek için info@trendankara.com adresinden bize ulaşabilirsiniz. TrendAnkara ekibi olarak en iyi deneyimi sunmak için çalışıyoruz! 🎵
```

### Analytics & Metrics

**App Store Connect Analytics:**
- Downloads (impressions, downloads, updates)
- Engagement (sessions, active devices, retention)
- Conversion rate (impressions → downloads)
- Crashes and bugs

**External Analytics:**
- Firebase Analytics
- Mixpanel
- Amplitude
- Custom analytics

---

## ⚠️ Important Reminders

### Account & Access

- 💰 **$99/year subscription**: Renew annually or app will be removed from App Store
- 🔐 **Two-factor authentication**: Keep enabled for security
- 📧 **Email notifications**: Monitor closely for updates and issues
- 🔄 **Apple ID**: Don't change or remove associated Apple ID

### App Store Guidelines

**Critical Guidelines:**
- No misleading descriptions
- No fake ratings/reviews
- No prohibited content (violence, hate speech, etc.)
- Privacy policy required and accurate
- Age rating matches content
- All features functional
- No crashes or major bugs

**Full guidelines:** https://developer.apple.com/app-store/review/guidelines/

### App Maintenance

- **Respond quickly** to critical bugs
- **Update for new iOS versions** (usually September)
- **Monitor crash reports** weekly
- **Keep dependencies updated** (React Native, Expo, etc.)
- **Test before releasing** updates

### Marketing & ASO (App Store Optimization)

**Improve discoverability:**
- Research and update keywords regularly
- A/B test screenshots (via alternative versions)
- Encourage satisfied users to leave reviews
- Update promotional text monthly (no review needed!)
- Create compelling icon and screenshots
- Optimize description with searchable terms

**Marketing channels:**
- Add App Store badge to website: https://developer.apple.com/app-store/marketing/guidelines/#badges
- Social media posts (Instagram, Twitter, Facebook)
- WhatsApp status/stories
- Email newsletter to radio listeners
- Press release to media outlets
- Turkish tech blogs and websites

---

## 🆚 iOS vs Android Comparison

| Aspect | iOS (Apple) | Android (Google Play) |
|--------|-------------|----------------------|
| **Developer Fee** | $99/year | $25 one-time |
| **Identity Verification** | ❌ Not required | ✅ Required (1-3 days) |
| **Review Time** | 24 hours (90%) | 1-7 days |
| **App Signing** | Manual (Xcode) | Manual (Gradle) |
| **Build Process** | Xcode Archive | Gradle bundleRelease |
| **File Format** | .ipa (via Xcode) | .aab or .apk |
| **Beta Testing** | TestFlight | Internal testing track |
| **Update Speed** | Must wait for review | Staged rollout available |
| **Review Strictness** | Very strict | Moderate |
| **Revenue Share** | 15-30% | 15-30% |
| **Geographic Reach** | 175 countries | 170+ countries |

**Key Differences:**

✅ **iOS Advantage:**
- No identity verification wait
- Faster review (usually 24h)
- Higher user spending
- Better fraud protection

⚠️ **iOS Disadvantage:**
- Higher annual cost ($99 vs $25)
- Stricter review process
- Must use Mac and Xcode
- Can't respond to positive reviews

---

## 🐛 Troubleshooting

### Build Fails in Xcode

**Error: Signing certificate issue**
```
Solution:
1. Xcode → Preferences → Accounts
2. Select your Apple ID
3. Click "Download Manual Profiles"
4. Try again
```

**Error: Provisioning profile issue**
```
Solution:
1. Enable "Automatically manage signing"
2. Or create provisioning profile manually:
   - developer.apple.com → Certificates, IDs & Profiles
   - Create new provisioning profile
   - Download and double-click to install
```

**Error: Code signing identity not found**
```
Solution:
1. Check you have valid Developer certificate:
   security find-identity -v -p codesigning

2. If none found, create new certificate:
   - developer.apple.com → Certificates
   - Create new "iOS Distribution" certificate
```

**Error: Build input file cannot be found**
```
Solution:
1. Clean build folder: Product → Clean Build Folder
2. Delete derived data: rm -rf ~/Library/Developer/Xcode/DerivedData/*
3. Pod install: cd ios && pod install
4. Close and reopen Xcode
5. Try archiving again
```

### Upload Fails

**Error: Invalid binary**
```
Solution:
- Ensure you selected "Any iOS Device (arm64)", not simulator
- Check Info.plist has correct bundle ID
- Verify version and build numbers are incremented
```

**Error: Missing compliance**
```
Solution:
- Add ITSAppUsesNonExemptEncryption: false to Info.plist
- Or answer export compliance questions in App Store Connect
```

### Build Processing Takes Too Long

**Processing > 2 hours**
```
Solution:
1. Check you uploaded correct binary (not simulator build)
2. Wait 24 hours
3. If still processing, contact Apple Support
4. Try uploading new build
```

### Build Doesn't Appear in App Store Connect

**After uploading successfully:**
```
Solution:
1. Wait 5-60 minutes for processing
2. Check email for "Processing Complete" or errors
3. Refresh App Store Connect page
4. Check "Activity" tab for upload status
5. If failed, check error message and reupload
```

### App Rejected

**See "If Rejected" section above**

Common solutions:
- Read rejection carefully
- Fix specific issues mentioned
- Update metadata if needed
- Respond to reviewer with explanation
- Resubmit

### Can't Find App on App Store After Approval

**App is "Ready for Sale" but not searchable:**
```
Solution:
1. Wait 1-2 hours for indexing
2. Search by exact app name: "TrendAnkara"
3. Use direct link: https://apps.apple.com/app/id[APP_ID]
4. Check app is available in your region
5. App Store sometimes takes 24h to show in search
```

---

## 📞 Support & Resources

### Apple Developer Resources

- **Developer Portal**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **Support**: https://developer.apple.com/support/
- **Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Documentation**: https://developer.apple.com/documentation/
- **Forums**: https://developer.apple.com/forums/
- **WWDC Videos**: https://developer.apple.com/videos/

### TrendAnkara App Info

- **Bundle ID**: `com.trendankara.neverget`
- **Version**: 1.0.0 (Build: 1)
- **Primary Language**: Turkish (Türkçe)
- **Category**: Music
- **Privacy Policy**: https://trendankara.com/gizlilik-politikasi

### Contact

- **Email**: info@trendankara.com
- **Website**: https://trendankara.com
- **Support**: info@trendankara.com

---

## ✅ Quick Submission Checklist

Print this and check off as you complete:

### Before Building
- [ ] Apple Developer account active ($99/year paid)
- [ ] Xcode installed and updated (26.0.1+)
- [ ] Signing certificates valid
- [ ] App tested on real device
- [ ] Version and build numbers set
- [ ] Info.plist configured correctly
- [ ] Privacy policy accessible online

### Building & Uploading
- [ ] Opened `.xcworkspace` (not `.xcodeproj`)
- [ ] Selected "Any iOS Device (arm64)"
- [ ] Created archive successfully
- [ ] Uploaded to App Store Connect
- [ ] Received "Upload Successful" confirmation
- [ ] Received "Build Processing Complete" email

### App Store Connect
- [ ] App created in App Store Connect
- [ ] App information filled (name, category, keywords)
- [ ] Pricing set (Free)
- [ ] Screenshots uploaded (6.9" iPhone minimum)
- [ ] App icon uploaded (1024x1024)
- [ ] Description written in Turkish
- [ ] Support URL added
- [ ] Privacy policy URL added
- [ ] App Privacy questionnaire completed
- [ ] Export compliance answered
- [ ] Age rating completed
- [ ] Build selected
- [ ] "What's New" filled
- [ ] Review information provided
- [ ] All sections show green checkmarks

### Final Steps
- [ ] Reviewed all information for accuracy
- [ ] Read App Store Review Guidelines
- [ ] Tested app thoroughly
- [ ] Ready to click "Submit for Review"!

---

## 🎯 Expected Timeline

**From Start to App Store:**

| Step | Duration |
|------|----------|
| Apple Developer enrollment | Immediate (after $99 payment) |
| Xcode archive creation | 5-15 minutes |
| Upload to App Store Connect | 5-15 minutes |
| Build processing | 5-60 minutes |
| App Store Connect setup | 1-3 hours |
| Screenshot preparation | 2-4 hours |
| App review | 24 hours (90% of apps) |
| **Total** | **1-2 days** |

---

## 🚀 You're Ready!

Your TrendAnkara app is production-ready and configured for App Store submission!

**Key Advantages:**
- ✅ **No identity verification wait** (unlike Android)
- ✅ **Fast review process** (24 hours typically)
- ✅ **Professional app configuration** complete
- ✅ **All technical requirements** met

**Next Steps:**
1. Prepare your screenshots (2-10 images, 1320x2868px)
2. Follow this guide step-by-step
3. Submit to App Store Connect
4. Monitor review status
5. Celebrate when approved! 🎉

**Good luck with your first iOS release!**

Remember: The first release is the hardest. Updates are much easier once you're through the initial process.

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Author**: TrendAnkara Development Team
**Xcode Version**: 26.0.1
**iOS Target**: 12.0+
