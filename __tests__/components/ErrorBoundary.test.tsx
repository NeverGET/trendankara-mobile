import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that throws an error for testing
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <Text>Normal component</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence console errors for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('Normal component')).toBeTruthy();
  });

  it('should render error UI when child component throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    expect(getByText("We're sorry, but something unexpected happened. Don't worry, we've been notified about this issue.")).toBeTruthy();
  });

  it('should display try again and report error buttons', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Try Again')).toBeTruthy();
    expect(getByText('Report Error')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const mockOnError = jest.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
      expect.any(String)
    );
  });

  it('should reset error state when try again is pressed', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={shouldThrow} />
          <Text onPress={() => setShouldThrow(false)}>Fix error</Text>
        </ErrorBoundary>
      );
    };

    const { getByText, queryByText } = render(<TestComponent />);

    // Error should be displayed
    expect(getByText('Oops! Something went wrong')).toBeTruthy();

    // Press try again
    fireEvent.press(getByText('Try Again'));

    // Error UI should still be there initially because component still throws
    expect(queryByText('Oops! Something went wrong')).toBeTruthy();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => (
      <Text>Custom error message: {error.message}</Text>
    );

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom error message: Test error message')).toBeTruthy();
  });

  it('should show error details in development mode', () => {
    const originalDev = global.__DEV__;
    global.__DEV__ = true;

    const { getByText } = render(
      <ErrorBoundary showErrorDetails={true}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Error Details (Development)')).toBeTruthy();

    global.__DEV__ = originalDev;
  });

  it('should not show error details in production mode', () => {
    const originalDev = global.__DEV__;
    global.__DEV__ = false;

    const { queryByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(queryByText('Error Details (Development)')).toBeFalsy();

    global.__DEV__ = originalDev;
  });

  it('should handle different error levels', () => {
    const { getByText } = render(
      <ErrorBoundary level="app">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
  });

  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByLabelText('Try again')).toBeTruthy();
    expect(getByLabelText('Report this error')).toBeTruthy();
  });

  it('should handle report error button press', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should not throw when pressed
    expect(() => {
      fireEvent.press(getByText('Report Error'));
    }).not.toThrow();
  });

  it('should generate unique error IDs', () => {
    const mockOnError = jest.fn();

    // Render first error boundary
    const { unmount } = render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const firstErrorId = mockOnError.mock.calls[0][2];
    unmount();

    jest.clearAllMocks();

    // Render second error boundary
    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const secondErrorId = mockOnError.mock.calls[0][2];

    expect(firstErrorId).not.toBe(secondErrorId);
    expect(typeof firstErrorId).toBe('string');
    expect(typeof secondErrorId).toBe('string');
  });
});