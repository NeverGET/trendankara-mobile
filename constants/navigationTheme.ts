/**
 * Navigation theme configuration for Trend Ankara
 * Provides React Navigation themes using brand colors with support for light and dark modes
 */

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Colors } from './theme';

/**
 * Light navigation theme using Trend Ankara brand colors
 * Extends React Navigation's DefaultTheme with brand-specific colors
 */
export const LightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,           // Red primary color for navigation elements
    background: Colors.light.background,  // White background
    card: Colors.light.card,              // White card background
    text: Colors.light.text,              // Dark gray text
    border: Colors.light.border,          // Light gray border
    notification: Colors.light.notification, // Red notification color
  },
};

/**
 * Dark navigation theme using Trend Ankara brand colors
 * Extends React Navigation's DarkTheme with brand-specific colors
 */
export const DarkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,            // White primary color for dark mode
    background: Colors.dark.background,   // Black background
    card: Colors.dark.card,               // Dark gray card background
    text: Colors.dark.text,               // White text
    border: Colors.dark.border,           // Dark gray border
    notification: Colors.dark.notification, // Red notification color
  },
};