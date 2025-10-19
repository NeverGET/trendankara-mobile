import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getLogoSize } from '@/utils/responsive';

interface LogoDisplayProps {
  size?: number;
  style?: any;
}

export function LogoDisplay({ size, style }: LogoDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const textColor = useThemeColor({}, 'text');

  // Get screen width for responsive sizing
  const screenWidth = Dimensions.get('window').width;

  // Calculate responsive size using helper function if not provided
  const logoSize = size || getLogoSize(screenWidth);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    // Fallback to text logo
    return (
      <View style={[styles.container, { width: logoSize, height: logoSize }, style]}>
        <ThemedText
          type="title"
          style={[
            styles.fallbackText,
            {
              color: textColor,
              fontSize: logoSize * 0.12 // Scale font size with logo size
            }
          ]}
        >
          TREND ANKARA
        </ThemedText>
        <ThemedText
          type="default"
          style={[
            styles.fallbackSubtext,
            {
              color: textColor,
              fontSize: logoSize * 0.06 // Scale subtitle font size
            }
          ]}
        >
          RADIO
        </ThemedText>
      </View>
    );
  }

  // Crop 30% from top and bottom to remove transparent padding
  // Container is rectangular: full width, 70% height
  const containerHeight = logoSize * 0.7;

  return (
    <View
      style={[
        styles.cropContainer,
        style,
        {
          width: logoSize,
          height: containerHeight,
        }
      ]}
    >
      <Image
        source={require('@/assets/images/Trendankara3.png')}
        style={{
          width: '100%',
          height: '100%',
        }}
        contentFit="cover" // Fills container width, crops top/bottom
        contentPosition="center" // Centers image for equal top/bottom crop
        onError={handleImageError}
        placeholder={null}
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Crop the image top and bottom
  },
  logo: {
    // Ensures the logo maintains aspect ratio
  },
  fallbackText: {
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  fallbackSubtext: {
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 4,
  },
});