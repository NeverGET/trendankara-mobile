# Android App Release Guide - TrendAnkara

**Version**: 1.0.0 (versionCode: 3)
**Build Date**: October 19, 2025
**Status**: ✅ Ready for Google Play Store Submission

---

## 📋 Pre-Submission Checklist

### ✅ Build Artifacts (COMPLETED)
- [x] Signed AAB created: `app-release.aab` (77 MB)
- [x] Location: `/Users/cemalkurt/Projects/trendankara/mobile/android/app/build/outputs/bundle/release/app-release.aab`
- [x] Signature verified: JAR VERIFIED ✅
- [x] Keystore backed up: `trendankara-upload-key.keystore`

### ✅ App Requirements (COMPLETED)
- [x] Package ID: `com.trendankara.mobile`
- [x] Version: 1.0.0 (versionCode: 3)
- [x] Privacy Policy: https://trendankara.com/gizlilik-politikasi
- [x] Permissions: Only necessary permissions declared
- [x] Target SDK: Up to date

**📝 Note: Bundle ID Difference**
- **Android**: `com.trendankara.mobile`
- **iOS**: `com.trendankara.neverget`

This is intentional - iOS and Android apps use different bundle identifiers. Both are valid and will work correctly on their respective platforms.

### ⏳ Pending (Waiting for Identity Verification)
- [ ] Google Play Developer account verified
- [ ] Developer registration fee paid ($25 USD one-time)
- [ ] App created in Google Play Console

---

## 🚀 Step-by-Step Release Process

### Step 1: Google Play Console Setup

#### 1.1 Access Google Play Console
1. Go to: https://play.google.com/console
2. Sign in with your Google account
3. **Wait for identity verification** to complete (can take 1-3 days)
4. Pay the one-time $25 registration fee if not done already

#### 1.2 Create Your App
1. Click **"Create app"** button
2. Fill in the app details:

```
App name: TrendAnkara
Default language: Turkish (Türkçe)
App or game: App
Free or paid: Free
```

3. Accept the declarations:
   - [ ] I confirm this app complies with Google Play policies
   - [ ] I confirm this app complies with US export laws
4. Click **"Create app"**

---

### Step 2: Set Up Store Listing

Navigate to: **Dashboard → Store presence → Main store listing**

#### 2.1 App Details

**App name** (30 characters max):
```
TrendAnkara
```

**Short description** (80 characters max):
```
İstanbul'un en trend radyosu - Canlı yayın, haberler ve daha fazlası
```

**Full description** (4000 characters max):
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
• Haftalık müzik anketleri
• Güncel medya haberleri
• Çevrimdışı haber okuma
• Koyu/Açık tema desteği
• WhatsApp ve Instagram entegrasyonu
• Kullanıcı dostu arayüz

📱 NEDEN TREPdANKARA?
TrendAnkara ile İstanbul'un nabzını tutun, en popüler müzikleri keşfedin ve medya dünyasından haberdar olun.

🔒 GİZLİLİK
Verilerinizin gizliliği bizim için önemli. Detaylı bilgi için gizlilik politikamızı ziyaret edin: https://trendankara.com/gizlilik-politikasi

📧 İLETİŞİM
Sorularınız ve önerileriniz için: info@trendankara.com
```

**App icon** (512 x 512 PNG):
- Upload your high-resolution app icon
- Location: `/Users/cemalkurt/Projects/trendankara/mobile/assets/icons/android/icon-512.png`

#### 2.2 Graphics Assets Required

**📱 Screenshots** (JPEG or PNG, 16:9 aspect ratio recommended):

You need **at least 2 screenshots**, maximum 8, for each device type:

**Phone Screenshots** (Required):
- Minimum dimension: 320px
- Maximum dimension: 3840px
- Recommended: 1080 x 1920 (portrait) or 1920 x 1080 (landscape)

**Screenshots to Capture**:
1. Radio player with station logo (main screen)
2. News feed showing articles
3. Polls page with active voting
4. Settings page
5. Dark mode view (optional)

**Feature Graphic** (Required):
- Dimensions: 1024 x 500 (JPG or 24-bit PNG, no transparency)
- This appears at the top of your store listing

**Promotional Video** (Optional):
- YouTube URL showcasing your app

#### 2.3 Categorization

**App category**:
```
Music & Audio
```

**Tags** (up to 5):
```
radyo, müzik, haber, canlı yayın, trend
```

**Contact details**:
```
Email: info@trendankara.com
Website: https://trendankara.com
Phone: [Your phone number - optional]
```

**Privacy Policy URL** (Required):
```
https://trendankara.com/gizlilik-politikasi
```

---

### Step 3: Content Rating

Navigate to: **Dashboard → App content → Content rating**

1. Click **"Start questionnaire"**
2. Enter your email address
3. Select app category: **Music, radio & podcasts**
4. Answer the questionnaire (all questions):
   - Does your app contain violence? → No
   - Does your app contain sexual content? → No
   - Does your app contain profanity? → No
   - Does your app contain drugs/alcohol? → No
   - Does your app contain hate speech? → No
   - Does your app allow user interaction? → No (or Yes if you add comments/chat)
   - Does your app allow users to share info? → No
   - Does your app allow sharing location? → No
5. Submit and get your content rating

**Expected Rating**: PEGI 3 / Everyone

---

### Step 4: App Access

Navigate to: **Dashboard → App content → App access**

**Is your app restricted to users with special access?**
```
No, your app is available to all users
```

**Sign-in required?**
```
No, anyone can use all features without signing in
```

Click **Save** and then **Submit**

---

### Step 5: Ads Declaration

Navigate to: **Dashboard → App content → Ads**

**Does your app contain ads?**
```
No (unless you plan to add ads)
```

Click **Save** → **Submit**

---

### Step 6: Target Audience and Content

Navigate to: **Dashboard → App content → Target audience and content**

**Target age groups**:
```
✓ 18 and over
```

**Store listing age rating**:
- Will be auto-set based on your selections

**Does your app appeal to children?**
```
No
```

Click **Save** → **Next** → **Submit**

---

### Step 7: Data Safety

Navigate to: **Dashboard → App content → Data safety**

This is **CRITICAL** - be accurate about what data you collect.

#### Data Collection

**Does your app collect or share any of the required user data types?**

Based on TrendAnkara's current implementation:

**Personal Information**:
- [ ] No personal info collected

**Files and docs**:
- [ ] No files collected

**App activity**:
- [x] App interactions
  - Purpose: Analytics
  - Collected: Yes
  - Shared: No
  - Optional: Yes
  - Ephemeral: No

**Device or other identifiers**:
- [x] Device ID
  - Purpose: App functionality, Analytics
  - Collected: Yes
  - Shared: No
  - Optional: No
  - Ephemeral: No

**Security Practices**:
- [x] Data is encrypted in transit
- [ ] Users can request data deletion (if you don't store user accounts)
- [x] Data follows Google Play Families Policy (if targeting kids)

Click **Save** → **Next** → **Submit**

---

### Step 8: Government Apps Declaration

Navigate to: **Dashboard → App content → Government apps**

**Is your app an official government application?**
```
No
```

---

### Step 9: Financial Features

Navigate to: **Dashboard → App content → Financial features**

**Does your app facilitate financial transactions?**
```
No
```

---

### Step 10: Health & Fitness

Navigate to: **Dashboard → App content → Health**

**Does your app provide health or fitness features?**
```
No
```

---

### Step 11: COVID-19 Contact Tracing

Navigate to: **Dashboard → App content → COVID-19 contact tracing and status apps**

**Is your app a COVID-19 contact tracing or status app?**
```
No
```

---

### Step 12: Upload Your App Bundle

Navigate to: **Dashboard → Release → Production → Create new release**

#### 12.1 App Integrity
- Google Play will show app signing status
- You're using **Google Play App Signing** (recommended)

#### 12.2 Upload AAB
1. Click **"Upload"** button
2. Select your AAB file:
   ```
   /Users/cemalkurt/Projects/trendankara/mobile/android/app/build/outputs/bundle/release/app-release.aab
   ```
3. Wait for upload and processing (1-5 minutes)
4. Google Play will analyze your app bundle

#### 12.3 Release Details

**Release name** (internal, users won't see this):
```
1.0.0 - Initial Release
```

**Release notes** (What's new in this release) - **IN TURKISH**:
```
🎉 TrendAnkara'nın ilk sürümü!

✨ Özellikler:
• 📻 Canlı radyo yayını - 7/24 kesintisiz müzik
• 🎵 Arka planda çalma desteği
• 📰 Güncel medya haberleri
• 🗳️ Haftalık müzik anketleri
• 🌙 Koyu/Açık tema desteği
• 📱 Modern ve kullanıcı dostu arayüz

İstanbul'un en trend radyosunu mobil cihazınızda deneyimleyin!
```

#### 12.4 Rollout Percentage (Optional)
```
100% - Full rollout (recommended for initial release)
```

Or start with staged rollout:
- 1% → Monitor for issues
- 10% → Check crash reports
- 50% → Expand if stable
- 100% → Full release

---

### Step 13: Review and Publish

1. Review all sections - ensure all have ✅ green checkmarks
2. Check the pre-launch report (Google tests your app automatically)
3. Click **"Review release"**
4. Review all details one final time
5. Click **"Start rollout to Production"**

---

## ⏱️ Review Timeline

**Expected Review Time**: 1-7 days (usually 1-3 days)

**What Google Reviews**:
- App complies with policies
- Metadata is accurate
- App functions as described
- No malware or security issues
- Privacy policy is accessible
- Content rating is appropriate

---

## 📧 After Submission

### You'll Receive Emails:

1. **"Your app is under review"** - Immediately
2. **"Your app is approved"** - 1-7 days
   - OR **"Your app was not approved"** - with reasons

### If Approved:
- Your app goes live within a few hours
- Users can download from Play Store
- You'll get the Play Store link: `https://play.google.com/store/apps/details?id=com.trendankara.mobile`

### If Rejected:
- Read the rejection reason carefully
- Fix the issues mentioned
- Submit an update
- Usually faster review for re-submissions

---

## 📊 Post-Launch Monitoring

### Week 1 After Launch:

**Daily Checks**:
- [ ] Check crash reports in Play Console
- [ ] Monitor user reviews and ratings
- [ ] Check installation statistics
- [ ] Verify app works on different devices (via Play Console stats)

**Weekly Checks**:
- [ ] Analyze user acquisition sources
- [ ] Review user retention rates
- [ ] Check ANR (App Not Responding) rates
- [ ] Monitor app performance metrics

### Respond to User Reviews:
- Respond to negative reviews within 24-48 hours
- Thank users for positive reviews
- Fix bugs mentioned in reviews
- Update app based on feedback

---

## 🔄 Future Updates

When you need to release an update:

### 1. Update Version Numbers

Edit `/Users/cemalkurt/Projects/trendankara/mobile/android/app/build.gradle`:

```gradle
versionCode 4  // Increment this (was 3)
versionName "1.0.1"  // Update version name
```

### 2. Build New AAB

```bash
cd /Users/cemalkurt/Projects/trendankara/mobile/android
./gradlew bundleRelease
```

### 3. Upload to Play Console

1. Go to: **Production → Create new release**
2. Upload new AAB
3. Add release notes (in Turkish) describing what's new
4. Submit for review

**Important**: Each update goes through review again!

---

## 📱 App Store Presence

### Your Play Store URL (after approval):
```
https://play.google.com/store/apps/details?id=com.trendankara.mobile
```

### Deep Link to Your App:
```
market://details?id=com.trendankara.mobile
```

### Share Link for Marketing:
```
https://play.app.goo.gl/?link=https://play.google.com/store/apps/details?id=com.trendankara.mobile
```

---

## 🎯 Marketing Checklist (Optional)

After your app is live:

- [ ] Add Play Store badge to your website
- [ ] Share on social media (Instagram, Twitter, Facebook)
- [ ] Send to your radio listeners via WhatsApp/email
- [ ] Create a press release for media outlets
- [ ] Add QR code for easy download (at radio station, events, etc.)
- [ ] Reach out to Turkish tech blogs/websites

**Play Store Badge**:
Download from: https://play.google.com/intl/en_us/badges/

---

## ⚠️ Important Reminders

### Security
- ✅ **Keystore backup**: Keep `trendankara-upload-key.keystore` VERY safe
- ✅ **Password backup**: Store password securely (password manager)
- ⚠️ **NEVER commit to git**: `keystore.properties` is in `.gitignore`
- ⚠️ **NEVER share**: Your keystore or password with anyone

### Store Listing
- Use high-quality screenshots (professional looking)
- Feature graphic should be eye-catching
- Description should highlight unique features
- Use Turkish language throughout (your target audience)
- Respond to ALL user reviews professionally

### Compliance
- Privacy policy must always be accessible
- Keep KVKK compliance up to date
- Update data safety info if you change data collection
- Declare ads if you add them later

---

## 📞 Support & Resources

### Google Play Help
- **Developer Support**: https://support.google.com/googleplay/android-developer
- **Policy Center**: https://play.google.com/console/about/guides/policycenter/
- **Launch Checklist**: https://developer.android.com/distribute/best-practices/launch/launch-checklist

### TrendAnkara App Info
- **Package ID**: `com.trendankara.mobile`
- **Version**: 1.0.0 (versionCode: 3)
- **Keystore**: `trendankara-upload-key.keystore`
- **Alias**: `trendankara-upload`

### Contact
- **Email**: info@trendankara.com
- **Website**: https://trendankara.com
- **Privacy Policy**: https://trendankara.com/gizlilik-politikasi

---

## ✅ Quick Checklist Before Submission

Print this and check off as you complete:

- [ ] Google Play Developer account verified and paid
- [ ] App created in Play Console
- [ ] Store listing completed (name, description, icon)
- [ ] Screenshots uploaded (minimum 2, phone)
- [ ] Feature graphic uploaded (1024x500)
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] Privacy policy URL added
- [ ] AAB file uploaded
- [ ] Release notes written (in Turkish)
- [ ] All policy sections completed (green checkmarks)
- [ ] Pre-launch report reviewed
- [ ] App tested on real device
- [ ] Keystore backed up safely
- [ ] Ready to click "Start rollout to Production"!

---

**Good luck with your first app release! 🚀**

**Remember**: The first release is always the hardest. Once you're through it, updates are much easier!

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Author**: TrendAnkara Development Team
