# Mobile Player Social Features - Quick Reference

**Last Updated**: 2025-10-19 | **API Version**: v1 | **Status**: ✅ Production

---

## API Endpoint

```
GET https://www.trendankara.com/api/mobile/v1/config
```

**Cache**: 10 minutes | **Auth**: None required

---

## Response Fields

```typescript
interface PlayerConfig {
  // Social Features
  playerWhatsappNumber?: string;      // "905551234567"
  playerInstagramUrl?: string;        // "https://instagram.com/trendankara"
  playerFacebookUrl?: string;         // "https://facebook.com/trendankara"
  liveCallPhoneNumber?: string;       // "0312 555 12 34"

  // Display Options
  playerLogoUrl?: string;             // "/api/media/uploads/..."
  enableLiveInfo?: boolean;           // true | false
}
```

---

## Quick Implementation

### 1. Fetch Config

```typescript
const response = await fetch('https://www.trendankara.com/api/mobile/v1/config');
const { success, data } = await response.json();
```

### 2. Check if Enabled

```typescript
const isWhatsAppEnabled = !!data.playerWhatsappNumber;
const isInstagramEnabled = !!data.playerInstagramUrl;
const isPhoneEnabled = !!data.liveCallPhoneNumber;
const isFacebookEnabled = !!data.playerFacebookUrl;
```

### 3. Open Actions

```typescript
// WhatsApp
if (data.playerWhatsappNumber) {
  const url = `whatsapp://send?phone=${data.playerWhatsappNumber}`;
  Linking.openURL(url);
}

// Instagram
if (data.playerInstagramUrl) {
  Linking.openURL(data.playerInstagramUrl);
}

// Phone
if (data.liveCallPhoneNumber) {
  const clean = data.liveCallPhoneNumber.replace(/\s/g, '');
  Linking.openURL(`tel:${clean}`);
}

// Facebook
if (data.playerFacebookUrl) {
  Linking.openURL(data.playerFacebookUrl);
}
```

---

## Deep Links

| Platform | App URL | Fallback |
|----------|---------|----------|
| **WhatsApp** | `whatsapp://send?phone={number}` | Show error if not installed |
| **Instagram** | `instagram://user?username={user}` | Open in browser |
| **Facebook** | `fb://page/{id}` | Open in browser |
| **Phone** | `tel:{number}` | Native dialer |

---

## UI Best Practices

### Show/Hide Logic

```typescript
{config.playerWhatsappNumber && (
  <SocialButton icon="whatsapp" onPress={handleWhatsApp} />
)}

{config.playerInstagramUrl && (
  <SocialButton icon="instagram" onPress={handleInstagram} />
)}

{config.liveCallPhoneNumber && (
  <SocialButton icon="phone" onPress={handlePhone} />
)}

{config.playerFacebookUrl && (
  <SocialButton icon="facebook" onPress={handleFacebook} />
)}
```

### Brand Colors

```typescript
const COLORS = {
  whatsapp: '#25D366',
  instagram: '#E4405F',
  facebook: '#1877F2',
  phone: '#34C759',
};
```

---

## Error Handling

```typescript
const openSocial = async (url: string, appName: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(`${appName} yüklü değil`);
      return;
    }
    await Linking.openURL(url);
  } catch (err) {
    Alert.alert('Hata', `${appName} açılamadı`);
  }
};
```

---

## Phone Call with Confirmation

```typescript
Alert.alert(
  'Canlı Yayın Hattı',
  `${number} numarasını aramak istiyor musunuz?`,
  [
    { text: 'İptal', style: 'cancel' },
    { text: 'Ara', onPress: () => Linking.openURL(`tel:${number}`) }
  ]
);
```

---

## Example Response

```json
{
  "success": true,
  "data": {
    "playerWhatsappNumber": "905551234567",
    "playerInstagramUrl": "https://instagram.com/trendankara",
    "playerFacebookUrl": "https://facebook.com/trendankara",
    "liveCallPhoneNumber": "0312 555 12 34",
    "playerLogoUrl": "/api/media/uploads/1758306383548-Trendankara3.png",
    "enableLiveInfo": true
  }
}
```

---

## Testing Checklist

- [ ] WhatsApp opens with pre-filled message
- [ ] Instagram opens app (or browser if not installed)
- [ ] Facebook opens correct page
- [ ] Phone shows confirmation before calling
- [ ] Buttons hide when fields are undefined
- [ ] Logo displays from custom URL
- [ ] Live info shows/hides based on flag

---

## Common Issues

### WhatsApp not opening?
✅ Check number format: `905551234567` (no spaces, no +)

### Instagram not opening app?
✅ Try deep link: `instagram://user?username={username}`
✅ Fallback to web URL

### Phone number has spaces?
✅ Clean it: `number.replace(/\s/g, '')`

### Config not updating?
✅ Cache is 10 minutes - wait or force refresh

---

## Full Documentation

📖 See [mobile-player-social-features.md](./mobile-player-social-features.md) for complete guide with:
- Detailed implementation examples
- React Native code samples
- TypeScript types
- Testing strategies
- Accessibility guidelines

---

**Need Help?** Check API response or contact backend team
