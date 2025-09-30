/**
 * NewsDetailScreen
 * Display full news article with content, images, and sharing functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StatusBar,
  Share,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Colors } from '@/constants/theme';
import type { NewsArticle } from '@/types/models';
import { newsService } from '@/services/api/news';

interface NewsDetailScreenProps {
  slug: string;
  onBack?: () => void;
}

const { width } = Dimensions.get('window');

export const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({
  slug,
  onBack,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      const articleData = await newsService.getNewsArticle(slug);
      if (articleData) {
        setArticle(articleData);
      } else {
        setError('Haber bulunamadı');
      }
    } catch (err) {
      console.error('Error loading article:', err);
      setError('Haber yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      const result = await Share.share({
        title: article.title,
        message: `${article.title}\n\n${article.excerpt}\n\nTrend Ankara'da okuyun.`,
        url: `https://trendankara.com/haber/${article.slug}`,
      });

      if (result.action === Share.sharedAction) {
        console.log('Article shared successfully');
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Teknoloji': BrandColors.info,
      'Endüstri': BrandColors.primary,
      'Rehber': BrandColors.success,
      'Sosyal Medya': BrandColors.warning,
    };
    return categoryColors[category] || BrandColors.gray500;
  };

  const renderContent = (content: string) => {
    // Split content by paragraphs and render each one
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paragraph, index) => (
      <Text
        key={index}
        style={[styles.contentText, { color: colors.text }]}
      >
        {paragraph.trim()}
      </Text>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Haber yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.icon} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Haber Bulunamadı
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.icon }]}>
            {error || 'Bu haber mevcut değil veya kaldırılmış olabilir.'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={loadArticle}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        {article.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
            {article.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>YENİ</Text>
              </View>
            )}
          </View>
        )}

        {/* Article Content */}
        <View style={styles.articleContent}>
          {/* Category and Date */}
          <View style={styles.metadata}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(article.category) + '15' },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: getCategoryColor(article.category) },
                ]}
              >
                {article.category.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.dateText, { color: colors.icon }]}>
              {formatDate(article.publishedAt)}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {article.title}
          </Text>

          {/* Author and Read Time */}
          <View style={styles.authorContainer}>
            {article.author && (
              <View style={styles.authorInfo}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.icon}
                  style={styles.authorIcon}
                />
                <Text style={[styles.authorText, { color: colors.icon }]}>
                  {article.author}
                </Text>
              </View>
            )}
            <View style={styles.readTimeInfo}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.icon}
                style={styles.readTimeIcon}
              />
              <Text style={[styles.readTimeText, { color: colors.icon }]}>
                {article.readTime} dakika okuma
              </Text>
            </View>
          </View>

          {/* Excerpt */}
          <Text style={[styles.excerpt, { color: colors.icon }]}>
            {article.excerpt}
          </Text>

          {/* Content */}
          <View style={styles.contentContainer}>
            {renderContent(article.content)}
          </View>

          {/* Tags/Categories */}
          <View style={styles.tagsContainer}>
            <Text style={[styles.tagsLabel, { color: colors.icon }]}>
              Kategori:
            </Text>
            <TouchableOpacity
              style={[
                styles.tag,
                { backgroundColor: getCategoryColor(article.category) + '15' },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: getCategoryColor(article.category) },
                ]}
              >
                {article.category}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Share Section */}
          <View style={styles.shareSection}>
            <Text style={[styles.shareLabel, { color: colors.text }]}>
              Bu haberi paylaş
            </Text>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.tint }]}
              onPress={handleShare}
            >
              <Ionicons name="share" size={20} color={BrandColors.tertiary} />
              <Text style={styles.shareButtonText}>Paylaş</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray200,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  imageContainer: {
    position: 'relative',
  },
  heroImage: {
    width: width,
    height: 250,
  },
  newBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: BrandColors.tertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  articleContent: {
    padding: 20,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray200,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorIcon: {
    marginRight: 6,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  readTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeIcon: {
    marginRight: 6,
  },
  readTimeText: {
    fontSize: 14,
  },
  excerpt: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  contentContainer: {
    marginBottom: 32,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  tagsLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  shareSection: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
  },
  shareLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  shareButtonText: {
    color: BrandColors.tertiary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: BrandColors.tertiary,
    fontSize: 16,
    fontWeight: '600',
  },
});