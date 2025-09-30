import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Linking,
  Share,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/themes';
import { createScreenStyles } from '@/constants/screenStyles';
import { NewsCard } from '@/components/news/NewsCard';
import { EmptyState } from '@/components/common/EmptyState';
import { CustomModal, type ModalAction } from '@/components/common/CustomModal';
import { newsService } from '@/services/api/news';
import type { NewsArticle } from '@/types/models';
import * as Haptics from 'expo-haptics';

export default function NewsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenStyles = createScreenStyles(colorScheme ?? 'light');
  const router = useRouter();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('list');
  const [searchText, setSearchText] = useState('');

  // Load news articles
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const response = await newsService.getLatestNews({}, !isRefreshing);
      setArticles(response.data || []);
    } catch (error) {
      console.error('Error loading news:', error);
      setArticles([]);
    } finally {
      if (!isRefreshing) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews(true);
    setRefreshing(false);
  };

  // Filter articles based on search text
  const filteredArticles = useMemo(() => {
    if (!searchText.trim()) return articles;

    const searchLower = searchText.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(searchLower) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(searchLower)) ||
      (article.content && article.content.toLowerCase().includes(searchLower))
    );
  }, [articles, searchText]);

  const handleArticlePress = (article: NewsArticle) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedArticle(article);
      setModalVisible(true);
    } catch (error) {
      console.error('Error handling article press:', error);
      Alert.alert('Hata', 'Haber açılırken bir hata oluştu');
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedArticle(null);
  };

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const handleShareArticle = async (article: NewsArticle) => {
    try {
      const message = `${article.title}\n\n${article.excerpt}\n\n#TrendAnkara`;
      await Share.share({
        message,
        title: article.title,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sharing article:', error);
      Alert.alert('Hata', 'Haber paylaşılırken bir hata oluştu');
    }
  };

  const getModalActions = (article: NewsArticle): ModalAction[] => {
    return [
      {
        label: 'Paylaş',
        icon: 'share',
        variant: 'primary',
        onPress: () => handleShareArticle(article),
      },
      {
        label: 'Kapat',
        icon: 'close',
        variant: 'secondary',
        onPress: handleCloseModal,
      },
    ];
  };

  const renderNewsItem = ({ item }: { item: NewsArticle }) => {
    if (displayMode === 'grid') {
      return (
        <View style={styles.gridItemWrapper}>
          <NewsCard
            article={item}
            onPress={() => handleArticlePress(item)}
            variant="compact"
          />
        </View>
      );
    }
    return (
      <NewsCard
        article={item}
        onPress={() => handleArticlePress(item)}
        variant="default"
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
        <View style={screenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Haberler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[screenStyles.container]} edges={['top', 'left', 'right']}>
      {/* Header with title and toggle */}
      <View style={[screenStyles.headerContainer, styles.headerWithControls]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={screenStyles.pageTitle}>Haberler</Text>
            <Text style={screenStyles.pageSubtitle}>Güncel haberler ve duyurular</Text>
          </View>
          <TouchableOpacity onPress={toggleDisplayMode} style={styles.toggleButton}>
            <Ionicons
              name={displayMode === 'grid' ? 'list' : 'grid'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Haberlerde ara..."
            placeholderTextColor={colors.icon}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* News List */}
      {filteredArticles.length === 0 ? (
        <View style={screenStyles.emptyContainer}>
          <EmptyState
            message={searchText ? "Aramanızla eşleşen haber bulunamadı" : "Henüz haber bulunmamaktadır"}
            icon="newspaper-outline"
            subtitle={searchText ? "Farklı anahtar kelimeler deneyin" : "Yeni haberler yakında eklenecek"}
          />
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={displayMode === 'grid' ? 2 : 1}
          key={displayMode} // Force re-render when switching modes
          columnWrapperStyle={displayMode === 'grid' ? styles.gridColumnWrapper : undefined}
          ItemSeparatorComponent={displayMode === 'list' ? () => <View style={styles.listSeparator} /> : undefined}
          contentContainerStyle={[
            styles.listContent,
            displayMode === 'grid' && styles.gridContent
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
        />
      )}

      {/* Custom Modal */}
      {selectedArticle && (
        <CustomModal
          visible={modalVisible}
          onClose={handleCloseModal}
          title={selectedArticle.title}
          description={selectedArticle.excerpt || selectedArticle.content}
          imageUrl={selectedArticle.imageUrl}
          actions={getModalActions(selectedArticle)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerWithControls: {
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  toggleButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  gridContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  listSeparator: {
    height: Spacing.md,
  },
  gridItemWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  loadingText: {
    marginTop: 10,
    opacity: 0.6,
    fontSize: 14,
  },
});