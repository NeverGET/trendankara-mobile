/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';
import type { BrandPalette, ThemeColors, FontPalette } from '@/types/theme';

// Brand Colors - Trend Ankara
export const BrandColors: BrandPalette = {
  primary: '#DC2626',    // Vibrant red for actions
  secondary: '#000000',  // Pure black
  tertiary: '#FFFFFF',   // Pure white

  // Gray palette - Pure neutral grays without blue tint
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#333333',
  gray600: '#4D4D4D',
  gray500: '#666666',
  gray400: '#999999',
  gray300: '#B3B3B3',
  gray200: '#E0E0E0',
  gray100: '#F0F0F0',
  gray50: '#FAFAFA',

  // Semantic colors
  error: '#DC2626',     // Using primary red for errors
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',      // Only blue allowed for info badges in news
};

const tintColorLight = BrandColors.primary;
const tintColorDark = BrandColors.tertiary;

export const Colors: ThemeColors = {
  light: {
    text: BrandColors.gray900,
    background: BrandColors.tertiary,
    tint: tintColorLight,
    icon: BrandColors.gray600,
    tabIconDefault: BrandColors.gray600,
    tabIconSelected: tintColorLight,
    border: BrandColors.gray200,
    card: BrandColors.tertiary,
    notification: BrandColors.primary,
    link: BrandColors.primary,
    placeholder: BrandColors.gray400,
    surface: BrandColors.gray50,
  },
  dark: {
    text: BrandColors.tertiary,
    background: BrandColors.secondary,
    tint: tintColorDark,
    icon: BrandColors.gray400,
    tabIconDefault: BrandColors.gray400,
    tabIconSelected: tintColorDark,
    border: BrandColors.gray700,
    card: BrandColors.gray800,
    notification: BrandColors.primary,
    link: BrandColors.primary,
    placeholder: BrandColors.gray500,
    surface: BrandColors.gray900,
  },
};

export const Fonts = Platform.select<FontPalette>({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
