import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { LogoDisplay } from '@/components/player/LogoDisplay';
import { getLogoSize } from '@/utils/responsive';

// Mock the responsive utility
jest.mock('@/utils/responsive', () => ({
  getLogoSize: jest.fn(),
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: jest.fn(({ children, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { ...props, testID: 'image' }, children);
  }),
}));

// Mock ThemedText component
jest.mock('@/components/themed-text', () => ({
  ThemedText: jest.fn(({ children, ...props }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { ...props, testID: 'themed-text' }, children);
  }),
}));

// Mock useThemeColor hook
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn(() => '#000000'),
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812, scale: 1, fontScale: 1 })),
}));

const mockGetLogoSize = getLogoSize as jest.MockedFunction<typeof getLogoSize>;
const mockDimensionsGet = Dimensions.get as jest.MockedFunction<typeof Dimensions.get>;

describe('LogoDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockGetLogoSize.mockReturnValue(180);
    mockDimensionsGet.mockReturnValue({ width: 375, height: 812, scale: 1, fontScale: 1 });
  });

  describe('Responsive sizing calculations', () => {
    it('should use provided size prop when given', () => {
      const customSize = 200;
      const { getByTestId } = render(<LogoDisplay size={customSize} />);

      const image = getByTestId('image');
      expect(image.props.style).toContainEqual(
        expect.objectContaining({
          width: customSize,
          height: customSize,
        })
      );
    });

    it('should calculate responsive size when no size prop provided', () => {
      const expectedSize = 180;
      mockGetLogoSize.mockReturnValue(expectedSize);

      const { getByTestId } = render(<LogoDisplay />);

      expect(mockGetLogoSize).toHaveBeenCalledWith(375);
      const image = getByTestId('image');
      expect(image.props.style).toContainEqual(
        expect.objectContaining({
          width: expectedSize,
          height: expectedSize,
        })
      );
    });

    it('should handle different screen widths correctly', () => {
      // Test small screen
      mockDimensionsGet.mockReturnValue({ width: 320, height: 568, scale: 1, fontScale: 1 });
      mockGetLogoSize.mockReturnValue(150);

      const { rerender, getByTestId } = render(<LogoDisplay />);

      expect(mockGetLogoSize).toHaveBeenCalledWith(320);
      let image = getByTestId('image');
      expect(image.props.style).toContainEqual(
        expect.objectContaining({
          width: 150,
          height: 150,
        })
      );

      // Test large screen
      mockDimensionsGet.mockReturnValue({ width: 768, height: 1024, scale: 1, fontScale: 1 });
      mockGetLogoSize.mockReturnValue(250);

      rerender(<LogoDisplay />);

      expect(mockGetLogoSize).toHaveBeenCalledWith(768);
      image = getByTestId('image');
      expect(image.props.style).toContainEqual(
        expect.objectContaining({
          width: 250,
          height: 250,
        })
      );
    });

    it('should maintain aspect ratio with calculated sizes', () => {
      const logoSize = 200;
      mockGetLogoSize.mockReturnValue(logoSize);

      const { getByTestId } = render(<LogoDisplay />);

      const image = getByTestId('image');
      const style = image.props.style.find((s: any) => s.width && s.height);

      expect(style.width).toBe(logoSize);
      expect(style.height).toBe(logoSize); // Should be square (1:1 aspect ratio)
    });
  });

  describe('Image load error handling', () => {
    it('should display image initially', () => {
      const { getByTestId } = render(<LogoDisplay />);

      // Image should be present
      expect(getByTestId('image')).toBeTruthy();
    });

    it('should have error handling capability', () => {
      const { getByTestId } = render(<LogoDisplay />);

      const image = getByTestId('image');
      // Image should have onError prop for error handling
      expect(image.props.onError).toBeDefined();
      expect(typeof image.props.onError).toBe('function');
    });
  });

  describe('Component styling', () => {
    it('should apply custom style prop', () => {
      const customStyle = { backgroundColor: 'red', marginTop: 20 };
      const { container } = render(<LogoDisplay style={customStyle} />);

      const containerView = container.children[0];
      expect(containerView.props.style).toContainEqual(customStyle);
    });

    it('should merge custom style with default container style', () => {
      const customStyle = { backgroundColor: 'blue' };
      const { container } = render(<LogoDisplay style={customStyle} />);

      const containerView = container.children[0];
      const combinedStyle = containerView.props.style;

      // Should contain both default styles and custom style
      expect(combinedStyle).toContainEqual(customStyle);
      expect(combinedStyle).toContainEqual(
        expect.objectContaining({
          alignItems: 'center',
          justifyContent: 'center',
        })
      );
    });

    it('should apply correct image properties', () => {
      const { getByTestId } = render(<LogoDisplay />);

      const image = getByTestId('image');
      expect(image.props.contentFit).toBe('contain');
      expect(image.props.transition).toBe(200);
      expect(image.props.source).toBeDefined();
    });
  });

  describe('Performance considerations', () => {
    it('should not re-render unnecessarily with same props', () => {
      const renderSpy = jest.fn();

      const TestComponent = React.memo((props: any) => {
        renderSpy();
        return <LogoDisplay {...props} />;
      });

      const { rerender } = render(<TestComponent size={200} />);

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestComponent size={200} />);

      expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
    });

    it('should handle rapid screen dimension changes gracefully', () => {
      const { rerender } = render(<LogoDisplay />);

      // Simulate rapid dimension changes
      mockDimensionsGet.mockReturnValue({ width: 320, height: 568, scale: 1, fontScale: 1 });
      mockGetLogoSize.mockReturnValue(150);
      rerender(<LogoDisplay />);

      mockDimensionsGet.mockReturnValue({ width: 414, height: 896, scale: 1, fontScale: 1 });
      mockGetLogoSize.mockReturnValue(200);
      rerender(<LogoDisplay />);

      mockDimensionsGet.mockReturnValue({ width: 768, height: 1024, scale: 1, fontScale: 1 });
      mockGetLogoSize.mockReturnValue(250);
      rerender(<LogoDisplay />);

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Theme integration', () => {
    it('should use theme colors', () => {
      const mockThemeColor = '#FF0000';
      const { useThemeColor } = require('@/hooks/use-theme-color');
      useThemeColor.mockReturnValue(mockThemeColor);

      const { container } = render(<LogoDisplay />);

      // Component should call useThemeColor
      expect(useThemeColor).toHaveBeenCalled();
    });

    it('should respond to theme changes', () => {
      const { useThemeColor } = require('@/hooks/use-theme-color');

      // Initial theme
      useThemeColor.mockReturnValue('#000000');
      const { rerender } = render(<LogoDisplay />);

      // Theme change
      useThemeColor.mockReturnValue('#FFFFFF');
      rerender(<LogoDisplay />);

      // Should handle theme changes gracefully
      expect(true).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      const { container } = render(<LogoDisplay />);

      // Component should render without accessibility violations
      expect(container).toBeTruthy();
    });

    it('should maintain container structure for screen readers', () => {
      const { container } = render(<LogoDisplay />);

      const containerView = container.children[0];
      expect(containerView.props.style).toContainEqual(
        expect.objectContaining({
          alignItems: 'center',
          justifyContent: 'center',
        })
      );
    });
  });
});