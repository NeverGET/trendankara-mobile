import React from 'react';
import { getOptimizedFlatListProps, createMemoizedRenderItem, useViewabilityConfig } from '../../utils/listOptimizations';
import { renderHook } from '@testing-library/react-native';

describe('List Optimizations', () => {
  describe('getOptimizedFlatListProps', () => {
    it('should return basic optimization props', () => {
      const props = getOptimizedFlatListProps();

      expect(props.removeClippedSubviews).toBe(true);
      expect(props.maxToRenderPerBatch).toBe(10);
      expect(props.updateCellsBatchingPeriod).toBe(50);
      expect(props.initialNumToRender).toBe(10);
      expect(props.windowSize).toBe(10);
      expect(props.legacyImplementation).toBe(false);
      expect(typeof props.keyExtractor).toBe('function');
    });

    it('should include getItemLayout when itemHeight is provided', () => {
      const itemHeight = 50;
      const props = getOptimizedFlatListProps(itemHeight);

      expect(props.getItemLayout).toBeDefined();

      const layout = props.getItemLayout!(null, 2);
      expect(layout).toEqual({
        length: 50,
        offset: 100, // 50 * 2
        index: 2,
      });
    });

    it('should extract keys correctly', () => {
      const props = getOptimizedFlatListProps();

      // Test with item having id
      expect(props.keyExtractor({ id: 123 }, 0)).toBe('123');

      // Test with item having key
      expect(props.keyExtractor({ key: 'abc' }, 0)).toBe('abc');

      // Test with fallback to index
      expect(props.keyExtractor({}, 5)).toBe('5');
    });
  });

  describe('useViewabilityConfig', () => {
    it('should return viewability configuration', () => {
      const { result } = renderHook(() => useViewabilityConfig());

      expect(result.current.viewabilityConfig).toEqual({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 300,
      });
      expect(typeof result.current.onViewableItemsChanged).toBe('function');
    });

    it('should use custom threshold', () => {
      const { result } = renderHook(() => useViewabilityConfig(undefined, 75));

      expect(result.current.viewabilityConfig.itemVisiblePercentThreshold).toBe(75);
    });

    it('should call onViewableItemsChanged callback', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useViewabilityConfig(mockCallback));

      const mockInfo = {
        viewableItems: [],
        changed: [],
      };

      result.current.onViewableItemsChanged(mockInfo);
      expect(mockCallback).toHaveBeenCalledWith(mockInfo);
    });

    it('should handle undefined callback', () => {
      const { result } = renderHook(() => useViewabilityConfig());

      const mockInfo = {
        viewableItems: [],
        changed: [],
      };

      // Should not throw
      expect(() => result.current.onViewableItemsChanged(mockInfo)).not.toThrow();
    });
  });

  describe('createMemoizedRenderItem', () => {
    it('should create a memoized render function', () => {
      const mockRenderComponent = jest.fn((item, index) => React.createElement('div', { key: index }));

      const { result } = renderHook(() =>
        createMemoizedRenderItem(mockRenderComponent, [])
      );

      const renderItem = result.current;
      expect(typeof renderItem).toBe('function');

      // Call the render function
      const mockItem = { id: 1, title: 'Test' };
      renderItem({ item: mockItem, index: 0 });

      expect(mockRenderComponent).toHaveBeenCalledWith(mockItem, 0);
    });

    it('should handle dependencies correctly', () => {
      const mockRenderComponent = jest.fn();
      let dependency = 'initial';

      const { result, rerender } = renderHook(() =>
        createMemoizedRenderItem(mockRenderComponent, [dependency])
      );

      const firstRender = result.current;

      // Change dependency
      dependency = 'changed';
      rerender();

      const secondRender = result.current;

      // Should be different functions due to dependency change
      expect(firstRender).not.toBe(secondRender);
    });
  });
});