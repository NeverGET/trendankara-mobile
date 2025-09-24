import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { LogoDisplay } from './LogoDisplay';

interface AnimationErrorBoundaryProps {
  /**
   * The children components to render inside the error boundary
   */
  children: ReactNode;
  /**
   * Optional fallback component to render instead of the default fallback UI
   */
  fallback?: ReactNode;
  /**
   * Size of the logo to display in fallback UI
   */
  logoSize?: number;
  /**
   * Custom style to apply to the fallback container
   */
  fallbackStyle?: any;
}

interface AnimationErrorBoundaryState {
  /**
   * Whether an error has occurred in the animation components
   */
  hasError: boolean;
  /**
   * The error that occurred, for debugging purposes
   */
  error?: Error;
}

/**
 * Error boundary component specifically designed to catch and handle
 * animation-related errors in the player components. This prevents
 * animation crashes from breaking the entire player experience.
 *
 * When an error occurs, it renders a fallback UI with a static logo
 * to maintain the basic visual structure while preventing app crashes.
 *
 * Features:
 * - Catches JavaScript errors anywhere in the child component tree
 * - Renders static logo fallback UI when animations fail
 * - Maintains consistent theming with the rest of the app
 * - Provides optional custom fallback component
 * - Logs errors for debugging in development
 */
export class AnimationErrorBoundary extends Component<
  AnimationErrorBoundaryProps,
  AnimationErrorBoundaryState
> {
  constructor(props: AnimationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * React lifecycle method called when an error occurs in child components
   * Updates state to trigger fallback UI rendering
   */
  static getDerivedStateFromError(error: Error): AnimationErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  /**
   * React lifecycle method called after an error has been thrown
   * Used for error reporting and logging
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('AnimationErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // In production, you might want to send this to an error reporting service
    if (__DEV__) {
      console.warn(
        'Animation error caught by AnimationErrorBoundary. Falling back to static logo display.'
      );
    }
  }

  /**
   * Resets the error boundary state to retry rendering the children
   * Can be called to attempt recovery after an error
   */
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    const { children, fallback, logoSize, fallbackStyle } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render default fallback UI with static logo
      return (
        <ThemedView style={[styles.fallbackContainer, fallbackStyle]}>
          <LogoDisplay size={logoSize} style={styles.fallbackLogo} />

          {__DEV__ && (
            <View style={styles.errorMessageContainer}>
              <ThemedText type="default" style={styles.errorMessage}>
                Animation error occurred. Using static display.
              </ThemedText>
            </View>
          )}
        </ThemedView>
      );
    }

    // No error occurred, render children normally
    return children;
  }
}

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Match the typical container structure for consistency
    position: 'relative',
    overflow: 'hidden',
  },
  fallbackLogo: {
    // Ensure logo is properly centered and visible
    zIndex: 1,
  },
  errorMessageContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  errorMessage: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});