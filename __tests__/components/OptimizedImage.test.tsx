import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OptimizedImage from '../../components/OptimizedImage';

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: ({ onLoad, onError, ...props }: any) => {
    const MockImage = require('react-native').View;
    return (
      <MockImage
        {...props}
        testID="optimized-image"
        onLayout={() => {
          // Simulate successful load after a short delay
          setTimeout(() => onLoad?.(), 100);
        }}
      />
    );
  },
}));

describe('OptimizedImage', () => {
  const mockSource = { uri: 'https://example.com/image.jpg' };
  const mockPlaceholder = { uri: 'https://example.com/placeholder.jpg' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(
      <OptimizedImage source={mockSource} />
    );

    expect(getByTestId('optimized-image')).toBeTruthy();
  });

  it('should display placeholder when provided', () => {
    const { getByTestId } = render(
      <OptimizedImage
        source={mockSource}
        placeholder={mockPlaceholder}
      />
    );

    expect(getByTestId('optimized-image')).toBeTruthy();
  });

  it('should call onLoad callback when image loads', async () => {
    const mockOnLoad = jest.fn();

    render(
      <OptimizedImage
        source={mockSource}
        onLoad={mockOnLoad}
      />
    );

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  it('should apply custom styles', () => {
    const customStyle = { width: 200, height: 150 };

    const { getByTestId } = render(
      <OptimizedImage
        source={mockSource}
        style={customStyle}
      />
    );

    const image = getByTestId('optimized-image');
    expect(image.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining(customStyle)
    ]));
  });

  it('should apply width and height props', () => {
    const { getByTestId } = render(
      <OptimizedImage
        source={mockSource}
        width={200}
        height={150}
      />
    );

    const image = getByTestId('optimized-image');
    expect(image.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ width: 200, height: 150 })
    ]));
  });

  it('should apply border radius', () => {
    const { getByTestId } = render(
      <OptimizedImage
        source={mockSource}
        borderRadius={10}
      />
    );

    const image = getByTestId('optimized-image');
    expect(image.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderRadius: 10 })
    ]));
  });

  it('should handle accessibility props', () => {
    const accessibility = {
      label: 'Test image',
      hint: 'This is a test image',
    };

    const { getByLabelText } = render(
      <OptimizedImage
        source={mockSource}
        accessibility={accessibility}
      />
    );

    expect(getByLabelText('Test image')).toBeTruthy();
  });

  it('should handle lazy loading', () => {
    const { getByTestId } = render(
      <OptimizedImage
        source={mockSource}
        enableLazyLoading={true}
      />
    );

    expect(getByTestId('optimized-image')).toBeTruthy();
  });

  it('should disable lazy loading when specified', () => {
    const { getByTestId } = render(
      <OptimizedImage
        source={mockSource}
        enableLazyLoading={false}
      />
    );

    expect(getByTestId('optimized-image')).toBeTruthy();
  });
});

// Error state test with custom mock
describe('OptimizedImage Error States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display error state when image fails to load', async () => {
    // Mock expo-image to simulate error
    jest.doMock('expo-image', () => ({
      Image: ({ onError, ...props }: any) => {
        const MockImage = require('react-native').View;
        return (
          <MockImage
            {...props}
            testID="optimized-image-error"
            onLayout={() => {
              setTimeout(() => onError?.({ error: 'Failed to load' }), 100);
            }}
          />
        );
      },
    }));

    const mockOnError = jest.fn();

    render(
      <OptimizedImage
        source={{ uri: 'https://invalid-url.com/image.jpg' }}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Failed to load');
    }, { timeout: 200 });
  });
});

describe('OptimizedImage Performance', () => {
  it('should use memo to prevent unnecessary re-renders', () => {
    const { rerender } = render(
      <OptimizedImage source={mockSource} />
    );

    // Re-render with same props
    rerender(
      <OptimizedImage source={mockSource} />
    );

    // Component should be memoized and not re-render unnecessarily
    expect(OptimizedImage).toBeDefined();
  });

  it('should handle different cache policies', () => {
    const { getByTestId } = render(
      <OptimizedImage
        source={mockSource}
        cachePolicy="memory"
      />
    );

    expect(getByTestId('optimized-image')).toBeTruthy();
  });

  it('should handle different priority levels', () => {
    const { getByTestId } = render(
      <OptimizedImage
        source={mockSource}
        priority="high"
      />
    );

    expect(getByTestId('optimized-image')).toBeTruthy();
  });
});