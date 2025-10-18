# Privacy Policy Requirements for TrendAnkara Mobile App

## Executive Summary

**CRITICAL**: A privacy policy is **mandatory** for both Google Play Store and Apple App Store submission. Without it, the app will be **immediately rejected**.

This document provides the webapp team with complete requirements to implement the privacy policy at `https://trendankara.com/privacy-policy`.

---

## Language Requirements

### Minimum Requirement: Turkish Only ✅
For an app targeting Turkish users:
- **Turkish language privacy policy is sufficient** for store approval
- Both Apple and Google accept single-language privacy policies if the app is region-specific
- TrendAnkara is clearly a Turkish radio station, so Turkish-only is acceptable

### Recommended: Turkish + English
While not mandatory, having both languages provides:
- Better compliance with international standards (GDPR, KVKK)
- Future-proofing if you expand internationally
- Better store review experience (reviewers may check English version)

**Recommendation**: Start with Turkish only for faster launch, add English later if needed.

---

## Store Requirements

### Apple App Store Requirements
1. **Privacy Policy URL must be publicly accessible** (no login required)
2. **Must be accessible within the app** via Settings screen
3. **Must load within 3 seconds** on mobile devices
4. **Must be mobile-responsive** and readable on small screens
5. **Must be included in App Store Connect metadata** during submission
6. **Clear disclosure** of data collection before user action to purchase/use features

### Google Play Store Requirements
1. **Privacy Policy URL must be publicly accessible**
2. **Must be included in Play Console metadata** during submission
3. **Must clearly describe** what data is collected and how it's used
4. **Must include contact information** for data subject requests
5. **Compliance with local laws** (KVKK for Turkey, GDPR if serving EU users)

---

## Legal Framework: KVKK (Turkey) Compliance

### What is KVKK?
Turkey's **Kişisel Verileri Koruma Kanunu** (Personal Data Protection Law No. 6698) - Turkey's equivalent to GDPR, effective since 2016.

### KVKK Requirements for Privacy Policy (Article 10)

Your privacy policy MUST include:

1. **Identity of Data Controller**
   - Company name: [TrendAnkara company legal name]
   - Address: [Physical address in Turkey]
   - Contact email: [privacy@trendankara.com or similar]

2. **Purpose of Data Processing**
   - Why you collect each piece of data
   - How it will be used

3. **Recipients of Data**
   - Third parties who may receive data (e.g., GCP, analytics providers)
   - International data transfers (if any)

4. **Method of Data Collection**
   - Automatically collected (device info, IP)
   - User-provided (votes, preferences)

5. **Legal Basis for Processing**
   - Explicit consent
   - Contractual necessity
   - Legitimate interest

6. **Data Subject Rights** (MUST include all of these):
   - Right to learn whether personal data is processed
   - Right to request information if data is processed
   - Right to learn the purpose of processing
   - Right to know third parties to whom data is transferred
   - Right to request correction of incomplete or inaccurate data
   - Right to request deletion or destruction of data
   - Right to object to processing
   - Right to request compensation for damages

### VERBIS Registration (Important!)
⚠️ **Action Required**: TrendAnkara must register as a Data Controller with Turkey's **VERBIS** (Data Controllers Registry Information System) before processing Turkish residents' data. This is **mandatory** and **free**.

Website: https://verbis.kvkk.gov.tr/

---

## Data Collection Analysis

Based on the mobile app code analysis, here's what data is collected:

### 1. Automatically Collected Data

| Data Type | Purpose | Storage Location | Legal Basis |
|-----------|---------|------------------|-------------|
| **Device Information** | App functionality, crash reporting | Local device | Legitimate interest |
| **IP Address** | API communication, content delivery | Server logs (temporary) | Legitimate interest |
| **App Usage Statistics** | Improve app performance, fix bugs | Local device | Legitimate interest |
| **Crash Reports** | Identify and fix bugs | Local device | Legitimate interest |
| **Media Session State** | Remember audio playback position | Local device | Legitimate interest |

### 2. User-Provided Data

| Data Type | Purpose | Storage Location | Legal Basis |
|-----------|---------|------------------|-------------|
| **Poll Votes** | Record user participation, display results | Local device + server | Explicit consent |
| **Push Notification Token** | Send news and content updates | Server | Explicit consent |
| **App Preferences** | Remember user settings (theme, notifications) | Local device | Legitimate interest |

### 3. Data NOT Collected
- ✅ No personal identification (name, email, phone) required
- ✅ No location tracking
- ✅ No camera/microphone recording
- ✅ No contact list access
- ✅ No photo/video collection
- ✅ No social media integration
- ✅ No advertising identifiers (IDFA/AAID)

**Privacy-Friendly**: This is a low-risk privacy profile - minimal data collection.

---

## Privacy Policy Structure

### Required Sections

```markdown
# Gizlilik Politikası (Privacy Policy)

**Son Güncelleme: [Date]**

## 1. Veri Sorumlusu Bilgileri (Data Controller Information)
[Company legal name]
[Physical address]
E-posta: [privacy@trendankara.com]
Telefon: [Contact phone]

## 2. Toplanan Kişisel Veriler (Personal Data Collected)

### 2.1 Otomatik Olarak Toplanan Veriler
- Cihaz bilgileri (model, işletim sistemi versiyonu)
- IP adresi (geçici, log kayıtlarında)
- Uygulama kullanım istatistikleri
- Hata raporları

### 2.2 Kullanıcı Tarafından Sağlanan Veriler
- Anket oyları
- Bildirim tercihleri
- Uygulama ayarları (tema, dil)

## 3. Verilerin İşlenme Amacı (Purpose of Processing)
- Radyo yayını hizmeti sunmak
- Haber ve içerik iletmek
- Anket sonuçlarını kaydetmek
- Uygulama performansını iyileştirmek
- Teknik sorunları tespit edip gidermek

## 4. Verilerin Aktarımı (Data Transfer)
- **Google Cloud Platform**: Sunucu altyapısı ve API hizmetleri
- **[Analytics Provider if any]**: Uygulama performans analizi
- Verileriniz üçüncü kişilerle **paylaşılmaz** veya **satılmaz**

## 5. Verilerin Saklanma Süresi (Data Retention)
- Anket oyları: Anket aktif olduğu sürece
- Hata raporları: 90 gün
- Bildirim tokenleri: Uygulama silinene kadar
- Uygulama ayarları: Kullanıcı silene kadar

## 6. Veri Güvenliği (Data Security)
- Tüm veri iletimi HTTPS ile şifrelenir
- Veriler güvenli sunucularda saklanır
- Düzenli güvenlik güncellemeleri yapılır

## 7. Kullanıcı Hakları (Data Subject Rights - KVKK Article 11)

KVKK Madde 11'e göre aşağıdaki haklara sahipsiniz:

- Kişisel verilerinizin işlenip işlenmediğini öğrenme
- İşlenmişse buna ilişkin bilgi talep etme
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
- Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
- Eksik veya yanlış işlenmişse düzeltilmesini isteme
- Verilerin silinmesini veya yok edilmesini isteme
- İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi durumunda çıkan sonuca itiraz etme
- Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme

**Haklarınızı kullanmak için**: [privacy@trendankara.com]

## 8. Çerezler ve İzleme Teknolojileri (Cookies)
TrendAnkara mobil uygulaması çerez kullanmamaktadır. Tüm veriler cihazınızda yerel olarak saklanır.

## 9. Çocukların Gizliliği (Children's Privacy)
Uygulamamız 13 yaş altı çocuklardan bilerek kişisel veri toplamaz.

## 10. Değişiklikler (Changes to Privacy Policy)
Gizlilik politikamızda değişiklik yapabiliriz. Önemli değişiklikler uygulama içi bildirimle duyurulacaktır.

## 11. İletişim (Contact)
Gizlilik ile ilgili sorularınız için:
- E-posta: [privacy@trendankara.com]
- Adres: [Physical address]
- Telefon: [Contact phone]
```

---

## Technical Implementation Requirements

### 1. URL Structure
✅ **Required**: `https://trendankara.com/privacy-policy`
✅ **Alternative**: `https://trendankara.com/gizlilik-politikasi` (Turkish slug)

⚠️ **Important**: Use the same URL you submit to app stores. Don't change it later!

### 2. Page Performance

| Requirement | Target | Why |
|-------------|--------|-----|
| **Page Load Time** | < 3 seconds | Store requirement, user experience |
| **Mobile Responsive** | Yes | Must be readable on small screens |
| **No Login Required** | Yes | Must be publicly accessible |
| **SSL Certificate** | Yes | HTTPS mandatory |
| **Works Offline** | No (acceptable) | But app should cache it |

### 3. Web Page Design Requirements

#### Mobile-First Design
```css
/* Minimum requirements */
- Font size: 14px minimum
- Line height: 1.6 for readability
- Padding: 20px on mobile
- Max width: 800px on desktop
- Touch-friendly links (44px minimum tap target)
```

#### Required Elements
1. **Clear heading**: "Gizlilik Politikası" or "Privacy Policy"
2. **Last updated date**: Prominently displayed at top
3. **Contact email**: Easily visible and clickable
4. **Table of contents**: For sections (recommended for UX)
5. **Print-friendly**: Users may want to save/print
6. **Anchor links**: For deep linking to specific sections

#### Example HTML Structure
```html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow"> <!-- Optional: Don't index privacy policy -->
    <title>Gizlilik Politikası - TrendAnkara</title>
</head>
<body>
    <main class="privacy-policy">
        <h1>Gizlilik Politikası</h1>
        <p class="last-updated">Son Güncelleme: 17 Ekim 2025</p>

        <!-- Table of Contents -->
        <nav class="toc">
            <h2>İçindekiler</h2>
            <ul>
                <li><a href="#data-controller">Veri Sorumlusu</a></li>
                <li><a href="#data-collected">Toplanan Veriler</a></li>
                <!-- etc -->
            </ul>
        </nav>

        <section id="data-controller">
            <h2>1. Veri Sorumlusu Bilgileri</h2>
            <!-- Content -->
        </section>

        <!-- Other sections -->
    </main>
</body>
</html>
```

---

## App Configuration Changes Required

### 1. Update app.json

**Current (INVALID)**:
```json
{
  "privacy": "public"
}
```

**Required (VALID)**:
```json
{
  "privacyPolicyUrl": "https://trendankara.com/privacy-policy"
}
```

### 2. Add Link in App Settings

The app needs to show privacy policy link in Settings screen:

```typescript
// In settings screen
<TouchableOpacity onPress={() => Linking.openURL('https://trendankara.com/privacy-policy')}>
  <Text>Gizlilik Politikası</Text>
</TouchableOpacity>
```

### 3. Store Submission Metadata

#### App Store Connect
- Navigate to: App Information > Privacy Policy URL
- Enter: `https://trendankara.com/privacy-policy`

#### Google Play Console
- Navigate to: Store Presence > Store Listing > Privacy Policy
- Enter: `https://trendankara.com/privacy-policy`

---

## Terms of Service (Optional but Recommended)

While privacy policy is **mandatory**, terms of service is **optional** but **recommended** for:
- Protecting your intellectual property (content, branding)
- Defining acceptable use
- Limiting liability
- Handling disputes

**URL**: `https://trendankara.com/terms` or `https://trendankara.com/kullanim-kosullari`

Basic structure:
1. Acceptance of Terms
2. Use License (what users can/cannot do)
3. Content Ownership (radio stream, news, logos are yours)
4. User Conduct (no abuse, no scraping)
5. Disclaimer of Warranties
6. Limitation of Liability
7. Governing Law (Turkish law)

---

## Compliance Checklist

Before submission, verify:

### Privacy Policy Content
- [ ] Turkish language version complete
- [ ] Company legal information included (name, address, contact)
- [ ] All collected data types listed
- [ ] Purpose of data collection explained
- [ ] Third-party data sharing disclosed (GCP, etc.)
- [ ] Data retention periods specified
- [ ] KVKK Article 11 rights listed in full
- [ ] Contact information for data subject requests
- [ ] Last updated date displayed

### Technical Implementation
- [ ] Privacy policy accessible at `https://trendankara.com/privacy-policy`
- [ ] Page loads in under 3 seconds on mobile
- [ ] Mobile-responsive design
- [ ] No login required to view
- [ ] HTTPS enabled
- [ ] Readable font sizes (14px minimum)

### App Configuration
- [ ] app.json updated with correct `privacyPolicyUrl` field
- [ ] Invalid `privacy: "public"` field removed
- [ ] Settings screen includes privacy policy link
- [ ] Link opens in browser (or in-app webview)

### Store Submission
- [ ] Privacy policy URL entered in App Store Connect
- [ ] Privacy policy URL entered in Google Play Console
- [ ] VERBIS registration completed (for KVKK compliance)

---

## Timeline and Coordination

### Webapp Team Responsibilities
1. **Create privacy policy page** with content from this document
2. **Make it accessible** at the specified URL
3. **Test on mobile devices** for readability and load time
4. **Provide final URL** to mobile team for app.json update

### Mobile Team Responsibilities (After Privacy Policy is Live)
1. **Update app.json** with correct privacy policy URL
2. **Add link in Settings screen**
3. **Test deep linking** to privacy policy works
4. **Submit to stores** with privacy policy URL in metadata

### Estimated Timeline
- **Webapp implementation**: 2-4 days (including legal review)
- **Mobile app updates**: 1 day
- **Testing**: 1 day
- **Total**: ~1 week

---

## Legal Review Recommendation

⚠️ **Strongly Recommended**: Have a Turkish lawyer review the privacy policy before publishing, especially for:
- KVKK compliance verification
- VERBIS registration guidance
- Proper legal language and terminology
- Protection against potential liabilities

---

## Resources and References

### KVKK Resources
- **KVKK Official Site**: https://www.kvkk.gov.tr/
- **VERBIS Registration**: https://verbis.kvkk.gov.tr/
- **KVKK Law Text**: https://www.kvkk.gov.tr/Icerik/6649/6698-Sayili-Kanun

### Privacy Policy Generators (Starting Point Only)
- TermsFeed: https://www.termsfeed.com/privacy-policy-generator/
- FreePrivacyPolicy: https://www.freeprivacypolicy.com/
- iubenda: https://www.iubenda.com/

⚠️ **Note**: Generators provide templates only. You MUST customize for TrendAnkara's specific data practices.

### Store Guidelines
- **Apple Privacy Policy**: https://developer.apple.com/app-store/review/guidelines/#privacy
- **Google Play Privacy**: https://support.google.com/googleplay/android-developer/answer/9859655

---

## Contact for Questions

**For Privacy Policy Content Questions**:
- Legal team or privacy consultant

**For Webapp Implementation Questions**:
- Webapp development team lead

**For Mobile App Integration Questions**:
- Mobile development team (me!)

---

**Document Version**: 1.0
**Created**: October 17, 2025
**For**: TrendAnkara Mobile App Store Release
**Priority**: CRITICAL (Blocks store submission)
