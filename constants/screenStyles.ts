/**
 * Unified Screen Styles
 * Consistent design system for all tab screens
 */

import { StyleSheet } from 'react-native';
import { Typography, Spacing, Colors } from './themes';

export const ScreenStyles = {
  // Page title styles - consistent across all tabs
  pageTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  pageSubtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    opacity: 0.7,
    marginBottom: Spacing.md,
  },

  // Section title styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },

  // Container styles
  screenContainer: {
    flex: 1,
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  // Header styles
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },

  // List styles
  listContainer: {
    paddingHorizontal: Spacing.lg,
  },

  // Card/Item spacing
  itemSpacing: {
    marginBottom: Spacing.md,
  },

  // Empty state
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Common spacing values
  spacing: {
    xs: Spacing.xs,
    sm: Spacing.sm,
    md: Spacing.md,
    lg: Spacing.lg,
    xl: Spacing.xl,
    xxl: Spacing.xxl,
  },
};

export const createScreenStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: {
      ...ScreenStyles.screenContainer,
      backgroundColor: colors.background,
    },

    contentContainer: {
      ...ScreenStyles.contentContainer,
    },

    scrollView: {
      ...ScreenStyles.scrollContainer,
    },

    scrollContent: {
      ...ScreenStyles.scrollContent,
    },

    pageTitle: {
      ...ScreenStyles.pageTitle,
      color: colors.text,
    },

    pageSubtitle: {
      ...ScreenStyles.pageSubtitle,
      color: colors.text,
    },

    sectionTitle: {
      ...ScreenStyles.sectionTitle,
      color: colors.text,
    },

    headerContainer: {
      ...ScreenStyles.headerContainer,
      borderBottomColor: colors.border,
    },

    emptyContainer: {
      ...ScreenStyles.emptyStateContainer,
    },

    loadingContainer: {
      ...ScreenStyles.loadingContainer,
    },
  });
};