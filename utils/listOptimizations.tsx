import React, { useCallback, useMemo, useState } from 'react';
import { ListRenderItem, ViewToken, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Optimized FlatList configuration for better performance
 */
export const getOptimizedFlatListProps = (itemHeight?: number) => ({
  // Performance optimizations
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 10,
  windowSize: 10,
  legacyImplementation: false,

  // Item height for better performance if known
  ...(itemHeight && { getItemLayout: (data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  })}),

  // Key extractor optimization
  keyExtractor: (item: any, index: number) => {
    if (item?.id) return String(item.id);
    if (item?.key) return String(item.key);
    return String(index);
  },
});

/**
 * Hook for optimized viewability configuration
 */
export const useViewabilityConfig = (
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void,
  itemVisiblePercentThreshold: number = 50
) => {
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold,
    minimumViewTime: 300,
  }), [itemVisiblePercentThreshold]);

  const onViewableItemsChangedRef = useCallback((info: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => {
    onViewableItemsChanged?.(info);
  }, [onViewableItemsChanged]);

  return {
    viewabilityConfig,
    onViewableItemsChanged: onViewableItemsChangedRef,
  };
};

/**
 * Creates a memoized render item function
 * Note: Add trailing comma to generic to avoid JSX ambiguity
 */
export const createMemoizedRenderItem = <T,>(
  renderComponent: (item: T, index: number) => React.ReactElement,
  dependencies: any[] = []
): ListRenderItem<T> => {
  return useCallback(({ item, index }) =>
    renderComponent(item, index),
    dependencies
  );
};

/**
 * Performance-optimized separator component
 */
export const OptimizedItemSeparator = React.memo(() => {
  return <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />;
});

/**
 * Empty list component with optimization
 */
export const OptimizedEmptyComponent: React.FC<{
  message?: string;
  icon?: string;
}> = React.memo(({ message = 'No items to display', icon = 'list' }) => {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    }}>
      <Ionicons name={icon as any} size={48} color="#999" />
      <Text style={{
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
      }}>
        {message}
      </Text>
    </View>
  );
});

/**
 * Loading footer component for infinite scroll
 */
export const OptimizedListFooter: React.FC<{
  isLoading?: boolean;
  hasMore?: boolean;
  loadingText?: string;
  endText?: string;
}> = React.memo(({
  isLoading = false,
  hasMore = true,
  loadingText = 'Loading more...',
  endText = 'No more items'
}) => {
  if (!isLoading && hasMore) return null;

  return (
    <View style={{
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {isLoading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#999" />
          <Text style={{ marginLeft: 8, color: '#666' }}>
            {loadingText}
          </Text>
        </View>
      ) : (
        <Text style={{ color: '#999', fontStyle: 'italic' }}>
          {endText}
        </Text>
      )}
    </View>
  );
});

/**
 * Optimized header component
 */
export const OptimizedListHeader: React.FC<{
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = React.memo(({ title, subtitle, actions }) => {
  return (
    <View style={{
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <View style={{ flex: 1 }}>
          {title && (
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
            }}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={{
              fontSize: 14,
              color: '#666',
              marginTop: 2,
            }}>
              {subtitle}
            </Text>
          )}
        </View>
        {actions && (
          <View style={{ marginLeft: 12 }}>
            {actions}
          </View>
        )}
      </View>
    </View>
  );
});

/**
 * Utility function to implement pull-to-refresh with optimization
 */
export const useOptimizedRefresh = (onRefresh: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
};
