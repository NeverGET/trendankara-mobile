/**
 * Onboarding Screen
 * First-time user experience and app introduction
 * Trend Ankara Mobile Application
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Import theme and utilities
import { useTheme } from '@/contexts/ThemeContext';
import { useAppDispatch } from '@/store/hooks';
import { setOnboardingCompleted } from '@/store/slices/settingsSlice';
import NotificationService from '@/services/notifications';

// Screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Onboarding slide data
interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  features?: string[];
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Trend Ankara\'ya Hoş Geldiniz',
    subtitle: 'En Sevdiğiniz Radyo',
    description: 'Canlı radyo yayını dinleyin, en son haberleri takip edin ve toplulukla etkileşime geçin.',
    icon: 'radio',
    color: '#FF6B35',
    features: [
      'Kesintisiz canlı yayın',
      'Yüksek ses kalitesi',
      'Arka plan çalma desteği',
    ],
  },
  {
    id: '2',
    title: 'Güncel Haberler',
    subtitle: 'Her An Gündemde',
    description: 'Medya sektöründen son haberler, gelişmeler ve özel içerikler sizlerle.',
    icon: 'newspaper',
    color: '#2E86AB',
    features: [
      'Anlık haber bildirimleri',
      'Kategori bazlı filtreleme',
      'Offline okuma desteği',
    ],
  },
  {
    id: '3',
    title: 'İnteraktif Anketler',
    subtitle: 'Sesinizi Duyurun',
    description: 'Çeşitli konularda düzenlenen anketlere katılın ve topluluğun nabzını tutun.',
    icon: 'bar-chart',
    color: '#F18F01',
    features: [
      'Anlık sonuçlar',
      'Kolay oy verme',
      'Trend analizi',
    ],
  },
  {
    id: '4',
    title: 'Kişiselleştirme',
    subtitle: 'Size Özel Deneyim',
    description: 'Uygulamayı tercihlerinize göre özelleştirin ve en iyi deneyimi yaşayın.',
    icon: 'settings',
    color: '#9B59B6',
    features: [
      'Koyu/Açık tema seçimi',
      'Bildirim ayarları',
      'Ses kalitesi tercihi',
    ],
  },
];

export default function OnboardingScreen() {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  /**
   * Handle next slide
   */
  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  /**
   * Handle previous slide
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  /**
   * Handle slide change
   */
  const handleSlideChange = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  /**
   * Handle onboarding completion
   */
  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Mark onboarding as completed
      dispatch(setOnboardingCompleted(true));

      // Request notification permissions
      await NotificationService.initialize();

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      // Still navigate to main app even if there's an error
      router.replace('/(tabs)');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle skip onboarding
   */
  const handleSkip = () => {
    dispatch(setOnboardingCompleted(true));
    router.replace('/(tabs)');
  };

  /**
   * Render onboarding slide
   */
  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.slideContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon} size={64} color={item.color} />
          </View>

          {/* Title and Subtitle */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.subtitle, { color: item.color }]}>
            {item.subtitle}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>

          {/* Features */}
          {item.features && (
            <View style={styles.featuresContainer}>
              {item.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={item.color}
                    style={styles.featureIcon}
                  />
                  <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render page indicator
   */
  const renderPageIndicator = () => {
    return (
      <View style={styles.pageIndicatorContainer}>
        {onboardingSlides.map((_, index) => {
          const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth,
          ];

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const dotScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          const currentSlide = onboardingSlides[currentIndex];

          return (
            <Animated.View
              key={index}
              style={[
                styles.pageIndicatorDot,
                {
                  opacity: dotOpacity,
                  transform: [{ scale: dotScale }],
                  backgroundColor: index === currentIndex ? currentSlide.color : theme.colors.textMuted,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Geç</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleSlideChange }
        )}
        scrollEventThrottle={16}
      />

      {/* Page Indicators */}
      {renderPageIndicator()}

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.navigationButton,
            styles.previousButton,
            currentIndex === 0 && styles.navigationButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentIndex === 0 ? theme.colors.textMuted : theme.colors.text}
          />
        </TouchableOpacity>

        {/* Progress Text */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {onboardingSlides.length}
          </Text>
        </View>

        {/* Next/Complete Button */}
        <TouchableOpacity
          style={[
            styles.navigationButton,
            styles.nextButton,
            { backgroundColor: onboardingSlides[currentIndex].color },
            isLoading && styles.navigationButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <Ionicons name="hourglass" size={24} color="#FFFFFF" />
          ) : currentIndex === onboardingSlides.length - 1 ? (
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          ) : (
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * Styles Factory
 */
function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    skipButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    skipButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    slide: {
      width: screenWidth,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    slideContent: {
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 300,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 34,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 24,
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    featuresContainer: {
      alignItems: 'flex-start',
      width: '100%',
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureIcon: {
      marginRight: 12,
    },
    featureText: {
      fontSize: 14,
      flex: 1,
    },
    pageIndicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
    },
    pageIndicatorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    navigationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      paddingBottom: 32,
    },
    navigationButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previousButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    nextButton: {
      // Color is set dynamically
    },
    navigationButtonDisabled: {
      opacity: 0.5,
    },
    progressContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
  });
}

/**
 * Usage Examples:
 *
 * Navigation to onboarding:
 * ```tsx
 * // Check if user has completed onboarding
 * const onboardingCompleted = useAppSelector(
 *   state => state.settings.userPreferences.onboardingCompleted
 * );
 *
 * useEffect(() => {
 *   if (!onboardingCompleted) {
 *     router.replace('/onboarding');
 *   }
 * }, [onboardingCompleted]);
 * ```
 *
 * Reset onboarding (for testing):
 * ```tsx
 * const resetOnboarding = () => {
 *   dispatch(setOnboardingCompleted(false));
 *   router.push('/onboarding');
 * };
 * ```
 *
 * Custom onboarding slides:
 * ```tsx
 * const customSlides = [
 *   {
 *     id: 'custom1',
 *     title: 'Custom Feature',
 *     subtitle: 'Amazing Feature',
 *     description: 'This is a custom feature description.',
 *     icon: 'star',
 *     color: '#FF6B35',
 *   },
 * ];
 * ```
 */