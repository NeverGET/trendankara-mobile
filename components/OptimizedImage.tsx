import React, { useState, useCallback, memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface OptimizedImageProps {
  source: ImageSource;
  placeholder?: ImageSource;
  style?: any;
  width?: number;
  height?: number;
  borderRadius?: number;
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: (error: string) => void;
  accessibility?: {
    label?: string;
    hint?: string;
  };
  enableLazyLoading?: boolean;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none';
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  source,
  placeholder,
  style,
  width,
  height,
  borderRadius = 0,
  priority = 'normal',
  onLoad,
  onError,
  accessibility,
  enableLazyLoading = true,
  cachePolicy = 'memory-disk',
  resizeMode = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!enableLazyLoading);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    const errorMessage = error?.error || 'Failed to load image';
    onError?.(errorMessage);
  }, [onError]);

  const handleLayout = useCallback(() => {
    if (enableLazyLoading && !isVisible) {
      setIsVisible(true);
    }
  }, [enableLazyLoading, isVisible]);

  const imageStyle = [
    style,
    width && { width },
    height && { height },
    borderRadius && { borderRadius },
  ];

  const containerStyle = [
    styles.container,
    imageStyle,
    { backgroundColor: hasError ? '#f5f5f5' : 'transparent' }
  ];

  if (!isVisible) {
    return (
      <View
        style={containerStyle}
        onLayout={handleLayout}
        accessibilityLabel={accessibility?.label}
        accessibilityHint={accessibility?.hint}
      >
        {placeholder && (
          <Image
            source={placeholder}
            style={[styles.image, imageStyle]}
            priority={priority}
            cachePolicy={cachePolicy}
            contentFit={resizeMode}
          />
        )}
      </View>
    );
  }

  if (hasError) {
    return (
      <View
        style={[containerStyle, styles.errorContainer]}
        accessibilityLabel={accessibility?.label || 'Image failed to load'}
        accessibilityHint={accessibility?.hint}
      >
        <Ionicons
          name="image-outline"
          size={Math.min((width || 50) * 0.4, 48)}
          color="#999"
        />
        <Text style={styles.errorText}>Image not available</Text>
      </View>
    );
  }

  return (
    <View
      style={containerStyle}
      accessibilityLabel={accessibility?.label}
      accessibilityHint={accessibility?.hint}
    >
      {isLoading && (
        <View style={[styles.loadingContainer, imageStyle]}>
          {placeholder && (
            <Image
              source={placeholder}
              style={[styles.image, imageStyle]}
              priority="low"
              cachePolicy={cachePolicy}
              contentFit={resizeMode}
            />
          )}
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        </View>
      )}

      <Image
        source={source}
        style={[styles.image, imageStyle]}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        cachePolicy={cachePolicy}
        transition={200}
        contentFit={resizeMode}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;