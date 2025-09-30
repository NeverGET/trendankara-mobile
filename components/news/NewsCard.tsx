/**
 * NewsCard Component
 * Display news article card with image, title, and metadata
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import type { NewsArticle } from '@/types/models';
import { getImageSource, getPlaceholderImage } from '@/utils/imageProxy';

interface NewsCardProps {
  article: NewsArticle;
  onPress?: () => void;
  variant?: 'default' | 'featured' | 'compact';
  showImage?: boolean;
}

const { width } = Dimensions.get('window');

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  onPress,
  variant = 'default',
  showImage = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`;
    } else if (diffInHours < 48) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
      });
    }
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

  const getContainerStyle = () => {
    const baseStyle = [
      styles.container,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
      }
    ];

    switch (variant) {
      case 'featured':
        baseStyle.push(styles.featuredContainer);
        break;
      case 'compact':
        baseStyle.push(styles.compactContainer);
        break;
      default:
        baseStyle.push(styles.defaultContainer);
    }

    return baseStyle;
  };

  const getImageStyle = () => {
    switch (variant) {
      case 'featured':
        return styles.featuredImage;
      case 'compact':
        return styles.compactImage;
      default:
        return styles.defaultImage;
    }
  };

  const renderImage = () => {
    console.log('🖼️ NewsCard renderImage - showImage:', showImage, 'imageUrl:', article.imageUrl);

    if (!showImage || !article.imageUrl) {
      console.log('🖼️ NewsCard - No image to show');
      return null;
    }

    const imageSource = getImageSource(article.imageUrl);
    console.log('🖼️ NewsCard - imageSource:', imageSource);

    if (!imageSource) {
      console.log('🖼️ NewsCard - No valid image source');
      return null;
    }

    return (
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={getImageStyle()}
          contentFit="cover"
          transition={300}
          placeholder={{ uri: getPlaceholderImage() }}
        />
        {article.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>YENİ</Text>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => (
    <View style={variant === 'compact' ? styles.compactContent : styles.content}>
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
        <View style={styles.dateContainer}>
          <Ionicons
            name="time-outline"
            size={12}
            color={colors.icon}
            style={styles.timeIcon}
          />
          <Text style={[styles.dateText, { color: colors.icon }]}>
            {formatDate(article.publishedAt)}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          { color: colors.text },
          variant === 'featured' && styles.featuredTitle,
          variant === 'compact' && styles.compactTitle,
        ]}
        numberOfLines={variant === 'compact' ? 2 : 3}
      >
        {article.title}
      </Text>

      {/* Excerpt */}
      {variant !== 'compact' && (
        <Text
          style={[styles.excerpt, { color: colors.icon }]}
          numberOfLines={variant === 'featured' ? 3 : 2}
        >
          {article.excerpt}
        </Text>
      )}

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.authorContainer}>
          {article.author && (
            <>
              <Ionicons
                name="person-outline"
                size={14}
                color={colors.icon}
                style={styles.authorIcon}
              />
              <Text style={[styles.authorText, { color: colors.icon }]}>
                {article.author}
              </Text>
            </>
          )}
        </View>
        <View style={styles.readTimeContainer}>
          <Ionicons
            name="book-outline"
            size={14}
            color={colors.icon}
            style={styles.readTimeIcon}
          />
          <Text style={[styles.readTimeText, { color: colors.icon }]}>
            {article.readTime} dk okuma
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {variant === 'compact' ? (
        <View style={styles.compactLayout}>
          {renderContent()}
          {renderImage()}
        </View>
      ) : (
        <>
          {renderImage()}
          {renderContent()}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  defaultContainer: {
    // Let FlatList control the width - no fixed width
  },
  featuredContainer: {
    marginVertical: 12,
  },
  compactContainer: {
    // For grid mode - flexible width
    marginHorizontal: 4,
    marginVertical: 4,
  },
  compactLayout: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  defaultImage: {
    width: '100%',
    height: 200,
  },
  featuredImage: {
    width: '100%',
    height: 250,
  },
  compactImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 12,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: BrandColors.tertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  compactContent: {
    flex: 1,
    paddingRight: 12,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 11,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  compactTitle: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorIcon: {
    marginRight: 4,
  },
  authorText: {
    fontSize: 12,
    flex: 1,
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeIcon: {
    marginRight: 4,
  },
  readTimeText: {
    fontSize: 12,
  },
});