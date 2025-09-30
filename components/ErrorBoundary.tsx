import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  fallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => ReactNode;
  showErrorDetails?: boolean;
  level?: 'app' | 'screen' | 'component';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error details
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platformApiLevel: Device.platformApiLevel,
      },
      appInfo: {
        version: Constants.expoConfig?.version,
        buildVersion: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
        releaseChannel: Constants.expoConfig?.releaseChannel,
      },
      level: this.props.level || 'component',
    };

    // Call custom error handler
    this.props.onError?.(error, errorInfo, this.state.errorId);

    // Log to console in development
    if (__DEV__) {
      console.group(`🚨 Error Boundary (${this.props.level || 'component'})`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Report:', errorReport);
      console.groupEnd();
    }

    // Here you would typically send the error to a crash reporting service
    // Example: Sentry.captureException(error, { extra: errorReport });
  }

  handleRetry = () => {
    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error) return;

    // Here you would typically open a bug report or email
    // For now, we'll just copy error details to clipboard or show them
    const errorDetails = `
Error ID: ${errorId}
Error: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
    `.trim();

    // You could use expo-clipboard or expo-mail-composer here
    console.log('Error Details for Reporting:', errorDetails);
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;

      // Use custom fallback if provided
      if (this.props.fallback && error && errorInfo) {
        return this.props.fallback(error, errorInfo, this.handleRetry);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={64} color="#FF6B6B" />
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.description}>
              We're sorry, but something unexpected happened. Don't worry, we've been notified about this issue.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleRetry}
                accessibilityLabel="Try again"
                accessibilityHint="Attempts to reload the component"
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleReportError}
                accessibilityLabel="Report this error"
                accessibilityHint="Opens error reporting options"
              >
                <Ionicons name="bug" size={20} color="#666" />
                <Text style={styles.secondaryButtonText}>Report Error</Text>
              </TouchableOpacity>
            </View>

            {(__DEV__ || this.props.showErrorDetails) && error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Development)</Text>
                <ScrollView style={styles.errorScroll} showsVerticalScrollIndicator={true}>
                  <Text style={styles.errorText}>
                    <Text style={styles.errorLabel}>Error ID: </Text>
                    {this.state.errorId}
                  </Text>
                  <Text style={styles.errorText}>
                    <Text style={styles.errorLabel}>Message: </Text>
                    {error.message}
                  </Text>
                  {error.stack && (
                    <Text style={styles.errorText}>
                      <Text style={styles.errorLabel}>Stack: </Text>
                      {error.stack}
                    </Text>
                  )}
                  {errorInfo?.componentStack && (
                    <Text style={styles.errorText}>
                      <Text style={styles.errorLabel}>Component Stack: </Text>
                      {errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    maxHeight: 200,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorScroll: {
    maxHeight: 150,
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  errorLabel: {
    fontWeight: '600',
    color: '#333',
  },
});

export default ErrorBoundary;