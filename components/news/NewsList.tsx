/**
 * NewsList Component
 * Display list of news articles with pull-to-refresh and pagination
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMountedState } from '@/hooks/useMountedState';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { BrandColors, Colors } from '@/constants/theme';
import { FEATURES } from '@/constants/config';
import type { NewsArticle, NewsCategory } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';
import { NewsCard } from './NewsCard';
import { newsService } from '@/services/api/news';

interface NewsListProps {
  category?: string;
  onArticlePress?: (article: NewsArticle) => void;
  variant?: 'default' | 'featured' | 'compact';
  limit?: number;
  showHeader?: boolean;
  headerTitle?: string;
}

export const NewsList: React.FC<NewsListProps> = ({
  category,
  onArticlePress,
  variant = 'default',
  limit = 10,
  showHeader = true,
  headerTitle,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { setStateIfMounted, signal } = useMountedState();

  // Feature flag for mounted state - fallback to direct setState when disabled
  const safeSetState = FEATURES.USE_MOUNTED_STATE ? setStateIfMounted : (fn: any) => fn();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Load initial news
  const loadNews = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (page === 1 && !isRefresh) {
        safeSetState(() => setLoading(true));
      }
      safeSetState(() => setError(null));

      const response: PaginatedResponse<NewsArticle> = await newsService.getLatestNews({
        category,
        page,
        limit,
      });

      console.log('📰 NewsList received response - data type:', typeof response.data, 'isArray:', Array.isArray(response.data), 'length:', response.data?.length || 0);

      safeSetState(() => {
        // The response is a PaginatedResponse, so articles are in response.data
        const newArticles = Array.isArray(response.data) ? response.data : [];

        if (page === 1) {
          console.log('📰 Setting articles (page 1):', newArticles.length, 'articles');
          setArticles(newArticles);
        } else {
          setArticles(prev => {
            // Ensure prev is an array and safely spread
            const prevArticles = Array.isArray(prev) ? prev : [];
            const combined = [...prevArticles, ...newArticles];
            console.log('📰 Adding articles (page ' + page + '):', combined.length, 'total articles');
            return combined;
          });
        }

        // Safely access pagination properties
        const pagination = response.pagination || {};
        setHasMoreData(pagination.hasNext || false);
        setCurrentPage(page);
      });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Error loading news:', err);
        safeSetState(() => {
          setError('Haberler yüklenirken bir hata oluştu');
        });
        Alert.alert('Hata', 'Haberler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      safeSetState(() => {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      });
    }
  }, [category, limit, safeSetState]);

  // Initial load
  useEffect(() => {
    loadNews(1);
  }, [loadNews]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    safeSetState(() => {
      setRefreshing(true);
      setCurrentPage(1);
      setHasMoreData(true);
    });
    loadNews(1, true);
  }, [loadNews, safeSetState]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMoreData && !loading) {
      safeSetState(() => setLoadingMore(true));
      loadNews(currentPage + 1);
    }
  }, [loadingMore, hasMoreData, loading, currentPage, loadNews, safeSetState]);

  // Article press handler
  const handleArticlePress = useCallback((article: NewsArticle) => {
    if (onArticlePress) {
      onArticlePress(article);
    }
  }, [onArticlePress]);

  // Render article item
  const renderArticle = useCallback(({ item, index }: { item: NewsArticle; index: number }) => {
    // Show featured variant for first article if variant is default
    const cardVariant = variant === 'default' && index === 0 ? 'featured' : variant;

    return (
      <NewsCard
        article={item}
        onPress={() => handleArticlePress(item)}
        variant={cardVariant}
      />
    );
  }, [variant, handleArticlePress]);

  // Render footer loading indicator
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
        <Text style={[styles.footerText, { color: colors.icon }]}>
          Daha fazla haber yükleniyor...
        </Text>
      </View>
    );
  }, [loadingMore, colors]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Henüz haber yok
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
          {category
            ? `${category} kategorisinde henüz haber bulunmuyor.`
            : 'Henüz yayınlanmış haber bulunmuyor.'
          }
        </Text>
      </View>
    );
  }, [loading, category, colors]);

  // Render header
  const renderHeader = useCallback(() => {
    if (!showHeader) return null;

    const title = headerTitle || (category ? `${category} Haberleri` : 'Son Haberler');

    return (
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {title}
        </Text>
        {articles.length > 0 && (
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            {articles.length} haber
          </Text>
        )}
      </View>
    );
  }, [showHeader, headerTitle, category, articles.length, colors]);

  // Show loading state
  if (loading && articles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>
          Haberler yükleniyor...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error && articles.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Bir hata oluştu
        </Text>
        <Text style={[styles.errorSubtitle, { color: colors.icon }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
            title="Haberler yenileniyor..."
            titleColor={colors.icon}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={limit}
        getItemLayout={(data, index) => ({
          length: variant === 'compact' ? 100 : variant === 'featured' && index === 0 ? 350 : 300,
          offset: (variant === 'compact' ? 100 : variant === 'featured' && index === 0 ? 350 : 300) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray200,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
  },
});