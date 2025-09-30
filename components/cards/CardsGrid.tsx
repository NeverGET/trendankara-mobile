/**
 * CardsGrid Component
 * Display grid/list of content cards
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ContentCard from './ContentCard';
import { cardsService } from '@/services/api/cards';
import { useCardSettings } from '@/hooks/useSettings';
import type { ContentCard as ContentCardType } from '@/types/models';

interface CardsGridProps {
  featured?: boolean;
  onCardPress?: (card: ContentCardType) => void;
  hideHeader?: boolean;
  displayMode?: 'grid' | 'list';
}

export const CardsGrid: React.FC<CardsGridProps> = ({
  featured = false,
  onCardPress,
  hideHeader = false,
  displayMode: propDisplayMode,
}) => {
  const [cards, setCards] = useState<ContentCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const cardSettings = useCardSettings();

  useEffect(() => {
    // Use prop if provided, otherwise use settings
    if (propDisplayMode) {
      setDisplayMode(propDisplayMode);
    } else {
      setDisplayMode(cardSettings.displayMode as 'grid' | 'list');
    }
  }, [cardSettings.displayMode, propDisplayMode]);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      const allCards = await cardsService.getAllCards(isRefresh);
      const newCards = featured
        ? allCards.filter(card => card.isFeatured).slice(0, cardSettings.maxFeatured || 5)
        : allCards.slice((isRefresh ? 0 : (page - 1) * 20), (isRefresh ? 1 : page) * 20);

      if (isRefresh) {
        setCards(newCards);
      } else {
        setCards(prev => [...prev, ...newCards]);
      }

      if (newCards.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    loadCards(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && !featured) {
      setPage(prev => prev + 1);
      loadCards();
    }
  }, [loading, hasMore, featured, page]);

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const renderCard = ({ item }: { item: ContentCardType }) => (
    <ContentCard
      card={item}
      displayMode={displayMode}
      onPress={() => onCardPress?.(item)}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="albums-outline" size={64} color={isDark ? "#808080" : "#999999"} />
        <Text style={[styles.emptyText, { color: isDark ? "#B3B3B3" : "#666666" }]}>
          {featured ? 'Öne çıkan içerik bulunmuyor' : 'İçerik bulunmuyor'}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Yenile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF0000" />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E0E0E0' }]}>
      <Text style={[styles.headerTitle, { color: isDark ? '#E6E6E6' : '#333333' }]}>
        {featured ? 'Öne Çıkanlar' : 'Sponsorlar'}
      </Text>
      {!featured && (
        <TouchableOpacity onPress={toggleDisplayMode} style={styles.modeButton}>
          <Ionicons
            name={displayMode === 'grid' ? 'list' : 'grid'}
            size={24}
            color={isDark ? "#E6E6E6" : "#333333"}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const numColumns = displayMode === 'grid' ? 2 : 1;
  const key = `${displayMode}-${numColumns}`; // Force re-render when switching modes

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      {!hideHeader && renderHeader()}
      <FlatList
        key={key}
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        columnWrapperStyle={numColumns === 2 ? styles.columnWrapper : undefined}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF0000']}
            tintColor="#FF0000"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={6}
        windowSize={5}
        updateCellsBatchingPeriod={100}
        getItemLayout={(data, index) => ({
          length: displayMode === 'grid' ? 180 : 240,
          offset: (displayMode === 'grid' ? 180 : 240) * index,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeButton: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default CardsGrid;