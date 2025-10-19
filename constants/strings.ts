/**
 * Turkish UI Strings for Trend Ankara Mobile App
 * All user-facing text must use proper Turkish characters (ç, ğ, ı, ö, ş, ü)
 * Strings are organized by feature/screen for maintainability
 */

export const Strings = {
  // Navigation tabs
  tabs: {
    home: 'Radyo',
    polls: 'Anketler',
    news: 'Haberler',
    sponsors: 'Sponsorlar',
    settings: 'Ayarlar',
  },

  // Player screen
  player: {
    title: 'Trend Ankara',
    nowPlaying: 'Şimdi Çalıyor',
    play: 'Oynat',
    pause: 'Duraklat',
    next: 'Sonraki',
    previous: 'Önceki',
    shuffle: 'Karıştır',
    repeat: 'Tekrarla',
    volume: 'Ses',
    playlist: 'Çalma Listesi',
    addToPlaylist: 'Çalma Listesine Ekle',
    share: 'Paylaş',
    download: 'İndir',
    lyrics: 'Şarkı Sözleri',
    noLyricsAvailable: 'Şarkı sözleri mevcut değil',
    loading: 'Yükleniyor...',
    error: 'Bir hata oluştu',
    retryConnection: 'Bağlantıyı Yeniden Dene',
    backgroundMode: 'Arka Plan Modu Aktif',
    audioFocusLost: 'Ses odağı kaybedildi',
    backgroundPlayback: 'Arka planda çalıyor',
  },

  // Settings screen
  settings: {
    title: 'Ayarlar',

    // Section headers
    themeSection: 'TEMA',
    playbackSection: 'OYNATMA',
    legalSection: 'YASAL',

    // Theme setting
    theme: 'Tema',
    themeDescription: 'Uygulamanın görünümünü özelleştirin',
    lightMode: 'Aydınlık Mod',
    darkMode: 'Karanlık Mod',
    systemMode: 'Sistem Ayarı',
    useSystemSettings: 'Sistem Ayarlarını Kullan',

    // Background playback setting
    backgroundPlayback: 'Arka Planda Çal',
    backgroundPlaybackDescription: 'Uygulama kapalıyken müzik çalmaya devam et',

    // Autoplay setting
    autoplay: 'Otomatik Başlat',
    autoplayDescription: 'Uygulama açıldığında otomatik olarak çalmaya başla',

    // Legal section
    privacyPolicy: 'Gizlilik Politikası',
    privacyPolicyDescription: 'Veri koruma ve gizlilik',
    termsOfService: 'Kullanım Koşulları',
    termsOfServiceDescription: 'Hizmet kullanım koşulları',
    imprint: 'Künye',
    imprintDescription: 'Yayın bilgileri ve yasal künye',
    about: 'Hakkında',
    aboutDescription: 'Uygulama bilgileri ve iletişim',

    // Restore defaults
    restoreDefaults: 'Varsayılana Dön',
    restoreDefaultsDescription: 'Tüm ayarları fabrika varsayılanlarına sıfırla',

    // Confirmation dialog
    confirmRestoreTitle: 'Ayarları Sıfırla',
    confirmRestoreMessage: 'Tüm ayarlar varsayılan değerlere sıfırlanacak. Devam etmek istiyor musunuz?',
    confirmRestoreButton: 'Sıfırla',

    // Success message
    defaultsRestored: 'Ayarlar varsayılan değerlere sıfırlandı',

    // Error messages for legal links
    linkError: 'Bağlantı Açılamadı',
    linkErrorMessage: 'Sayfa açılırken bir hata oluştu. Lütfen tekrar deneyiniz.',
  },

  // Common UI elements
  common: {
    ok: 'Tamam',
    cancel: 'İptal',
    save: 'Kaydet',
    delete: 'Sil',
    edit: 'Düzenle',
    add: 'Ekle',
    remove: 'Kaldır',
    search: 'Ara',
    filter: 'Filtrele',
    sort: 'Sırala',
    refresh: 'Yenile',
    load: 'Yükle',
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    warning: 'Uyarı',
    info: 'Bilgi',
    yes: 'Evet',
    no: 'Hayır',
    back: 'Geri',
    next: 'İleri',
    previous: 'Önceki',
    close: 'Kapat',
    open: 'Aç',
    share: 'Paylaş',
    copy: 'Kopyala',
    paste: 'Yapıştır',
    cut: 'Kes',
    undo: 'Geri Al',
    redo: 'Yinele',
    clear: 'Temizle',
    reset: 'Sıfırla',
    apply: 'Uygula',
    submit: 'Gönder',
    download: 'İndir',
    upload: 'Yükle',
    offline: 'Çevrimdışı',
    online: 'Çevrimiçi',
    connecting: 'Bağlanıyor...',
    connected: 'Bağlandı',
    disconnected: 'Bağlantı Kesildi',
    retry: 'Yeniden Dene',
    showMore: 'Daha Fazla Göster',
    showLess: 'Daha Az Göster',
    viewAll: 'Tümünü Görüntüle',
    collapse: 'Daralt',
    expand: 'Genişlet',
    minimize: 'Küçült',
    maximize: 'Büyüt',
    fullscreen: 'Tam Ekran',
    exitFullscreen: 'Tam Ekrandan Çık',
    modal: 'Modal',
  },

  // Home screen
  home: {
    welcome: 'Hoş Geldiniz!',
    recentlyPlayed: 'Son Çalınanlar',
    trending: 'Trend Olan',
    discover: 'Keşfet',
    recommended: 'Önerilen',
    newReleases: 'Yeni Çıkanlar',
    popularThisWeek: 'Bu Hafta Popüler',
    yourLibrary: 'Kütüphaneniz',
    playlists: 'Çalma Listeleri',
    favorites: 'Favoriler',
    history: 'Geçmiş',
    followedArtists: 'Takip Edilen Sanatçılar',
    topCharts: 'Popüler Listeler',
    genres: 'Türler',
    mood: 'Ruh Hali',
    activity: 'Aktivite',
  },

  // Explore screen
  explore: {
    title: 'Keşfet',
    searchPlaceholder: 'Şarkı, sanatçı veya album ara...',
    topResults: 'En İyi Sonuçlar',
    songs: 'Şarkılar',
    artists: 'Sanatçılar',
    albums: 'Albümler',
    playlists: 'Çalma Listeleri',
    noResults: 'Sonuç bulunamadı',
    searchHistory: 'Arama Geçmişi',
    clearHistory: 'Geçmişi Temizle',
    recentSearches: 'Son Aramalar',
    suggestions: 'Öneriler',
    trendingSearches: 'Trend Aramalar',
    popularGenres: 'Popüler Türler',
    browseByCategoryTitle: 'Kategoriye Göre Göz At',
    newMusic: 'Yeni Müzik',
    charts: 'Listeler',
    podcasts: 'Podcast\'ler',
    radio: 'Radyo',
  },

  // Errors and messages
  errors: {
    networkError: 'İnternet bağlantısı hatası',
    serverError: 'Sunucu hatası',
    unauthorized: 'Yetkisiz erişim',
    notFound: 'Bulunamadı',
    timeout: 'Zaman aşımı',
    unknownError: 'Bilinmeyen hata',
    playbackError: 'Oynatma hatası',
    downloadError: 'İndirme hatası',
    uploadError: 'Yükleme hatası',
    invalidInput: 'Geçersiz giriş',
    requiredField: 'Bu alan zorunludur',
    emailInvalid: 'Geçersiz e-posta adresi',
    passwordTooShort: 'Şifre çok kısa',
    passwordMismatch: 'Şifreler eşleşmiyor',
    accountExists: 'Bu hesap zaten mevcut',
    accountNotFound: 'Hesap bulunamadı',
    loginFailed: 'Giriş başarısız',
    sessionExpired: 'Oturum süresi doldu',
    permissionDenied: 'İzin reddedildi',
    storageFullError: 'Depolama alanı dolu',
    formatNotSupported: 'Bu format desteklenmiyor',
  },

  // Success messages
  success: {
    saved: 'Kaydedildi',
    deleted: 'Silindi',
    updated: 'Güncellendi',
    uploaded: 'Yüklendi',
    downloaded: 'İndirildi',
    shared: 'Paylaşıldı',
    copied: 'Kopyalandı',
    addedToPlaylist: 'Çalma listesine eklendi',
    removedFromPlaylist: 'Çalma listesinden kaldırıldı',
    accountCreated: 'Hesap oluşturuldu',
    passwordChanged: 'Şifre değiştirildi',
    profileUpdated: 'Profil güncellendi',
    settingsSaved: 'Ayarlar kaydedildi',
    feedbackSent: 'Geri bildirim gönderildi',
    subscriptionActivated: 'Abonelik etkinleştirildi',
    subscriptionCancelled: 'Abonelik iptal edildi',
  },
} as const;

// Type-safe string access
export type StringKeys = typeof Strings;
export type TabStrings = typeof Strings.tabs;
export type PlayerStrings = typeof Strings.player;
export type SettingsStrings = typeof Strings.settings;
export type CommonStrings = typeof Strings.common;
export type HomeStrings = typeof Strings.home;
export type ExploreStrings = typeof Strings.explore;
export type ErrorStrings = typeof Strings.errors;
export type SuccessStrings = typeof Strings.success;