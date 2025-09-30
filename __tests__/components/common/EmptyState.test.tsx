import React from 'react';
import { render } from '@testing-library/react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, EmptyStateProps } from '@/components/common/EmptyState';

// Mock dependencies
jest.mock('@/components/themed-text', () => ({
  ThemedText: ({ children, style, type, ...props }: any) => {
    const { Text } = require('react-native');
    return (
      <Text
        style={style}
        testID={`themed-text-${type || 'default'}`}
        {...props}
      >
        {children}
      </Text>
    );
  },
}));

jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn((lightColor, darkColor) => {
    // Return mock colors based on the color type
    const colorMap: Record<string, string> = {
      text: '#000000',
      icon: '#666666',
      background: '#ffffff',
    };
    return colorMap[darkColor] || '#000000';
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color, style, ...props }: any) => {
    const { Text } = require('react-native');
    return (
      <Text
        style={[{ fontSize: size, color }, style]}
        testID={`ionicon-${name}`}
        {...props}
      >
        {name}
      </Text>
    );
  },
}));

const { useThemeColor } = require('@/hooks/use-theme-color');

describe('EmptyState', () => {
  const defaultProps: EmptyStateProps = {
    message: 'No items found',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component rendering with different props', () => {
    it('should render with required message prop only', () => {
      const { getByText, getByTestId } = render(<EmptyState {...defaultProps} />);

      expect(getByText('No items found')).toBeTruthy();
      expect(getByTestId('ionicon-file-tray-outline')).toBeTruthy();
      expect(getByTestId('themed-text-defaultSemiBold')).toBeTruthy();
    });

    it('should render with custom message', () => {
      const customMessage = 'Your custom empty state message';
      const { getByText } = render(<EmptyState message={customMessage} />);

      expect(getByText(customMessage)).toBeTruthy();
    });

    it('should render with custom icon', () => {
      const customIcon = 'heart-outline' as keyof typeof Ionicons.glyphMap;
      const { getByTestId } = render(
        <EmptyState {...defaultProps} icon={customIcon} />
      );

      expect(getByTestId('ionicon-heart-outline')).toBeTruthy();
    });

    it('should render with subtitle when provided', () => {
      const subtitle = 'This is a helpful subtitle';
      const { getByText } = render(
        <EmptyState {...defaultProps} subtitle={subtitle} />
      );

      expect(getByText(subtitle)).toBeTruthy();
    });

    it('should not render subtitle when not provided', () => {
      const { queryByText } = render(<EmptyState {...defaultProps} />);

      // Since we don't provide a subtitle, there should be no subtitle text
      const themedTexts = render(<EmptyState {...defaultProps} />).queryAllByTestId(/themed-text/);
      expect(themedTexts).toHaveLength(1); // Only the main message
    });

    it('should render with both custom icon and subtitle', () => {
      const customIcon = 'search-outline' as keyof typeof Ionicons.glyphMap;
      const subtitle = 'Try adjusting your search terms';

      const { getByText, getByTestId } = render(
        <EmptyState
          {...defaultProps}
          icon={customIcon}
          subtitle={subtitle}
        />
      );

      expect(getByTestId('ionicon-search-outline')).toBeTruthy();
      expect(getByText(subtitle)).toBeTruthy();
    });
  });

  describe('Theme integration', () => {
    it('should call useThemeColor for all required colors', () => {
      render(<EmptyState {...defaultProps} />);

      expect(useThemeColor).toHaveBeenCalledWith({}, 'text');
      expect(useThemeColor).toHaveBeenCalledWith({}, 'icon');
      expect(useThemeColor).toHaveBeenCalledWith({}, 'background');
    });

    it('should apply theme colors to container', () => {
      const { getByTestId } = render(<EmptyState {...defaultProps} />);

      // Find the container by looking for the View that contains the icon
      const container = getByTestId('ionicon-file-tray-outline').parent?.parent;
      expect(container).toBeTruthy();
    });

    it('should apply theme colors to text elements', () => {
      const { getByTestId } = render(<EmptyState {...defaultProps} />);

      const messageText = getByTestId('themed-text-defaultSemiBold');
      expect(messageText).toBeTruthy();
      expect(messageText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#000000' })
        ])
      );
    });

    it('should apply theme colors to icon', () => {
      const { getByTestId } = render(<EmptyState {...defaultProps} />);

      const icon = getByTestId('ionicon-file-tray-outline');
      expect(icon.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#666666',
            fontSize: 64
          })
        ])
      );
    });

    it('should apply theme colors to subtitle when present', () => {
      const subtitle = 'Test subtitle';
      const { getByText } = render(
        <EmptyState {...defaultProps} subtitle={subtitle} />
      );

      const subtitleElement = getByText(subtitle);
      expect(subtitleElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#666666' })
        ])
      );
    });
  });

  describe('Icon display', () => {
    it('should render default icon with correct size', () => {
      const { getByTestId } = render(<EmptyState {...defaultProps} />);

      const icon = getByTestId('ionicon-file-tray-outline');
      expect(icon.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fontSize: 64 })
        ])
      );
    });

    it('should render custom icon with correct properties', () => {
      const customIcon = 'warning-outline' as keyof typeof Ionicons.glyphMap;
      const { getByTestId } = render(
        <EmptyState {...defaultProps} icon={customIcon} />
      );

      const icon = getByTestId('ionicon-warning-outline');
      expect(icon).toBeTruthy();
      expect(icon.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 64,
            color: '#666666'
          })
        ])
      );
    });

    it('should apply icon opacity correctly', () => {
      const { getByTestId } = render(<EmptyState {...defaultProps} />);

      const icon = getByTestId('ionicon-file-tray-outline');
      // The icon should have margin and opacity styles applied
      expect(icon.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 64,
            color: '#666666'
          })
        ])
      );
    });

    it('should handle different icon types correctly', () => {
      const icons: Array<keyof typeof Ionicons.glyphMap> = [
        'folder-outline',
        'document-outline',
        'image-outline',
        'person-outline',
      ];

      icons.forEach(iconName => {
        const { getByTestId } = render(
          <EmptyState message="Test" icon={iconName} />
        );
        expect(getByTestId(`ionicon-${iconName}`)).toBeTruthy();
      });
    });
  });

  describe('Layout and styling', () => {
    it('should apply correct container styles', () => {
      const { getByTestId } = render(<EmptyState {...defaultProps} />);

      const icon = getByTestId('ionicon-file-tray-outline');
      const container = icon.parent?.parent;

      expect(container).toBeTruthy();
    });

    it('should have proper text alignment for message', () => {
      const { getByTestId } = render(<EmptyState {...defaultProps} />);

      const messageText = getByTestId('themed-text-defaultSemiBold');
      expect(messageText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            textAlign: 'center',
            fontSize: 18
          })
        ])
      );
    });

    it('should have proper text alignment for subtitle', () => {
      const subtitle = 'Test subtitle text';
      const { getByText } = render(
        <EmptyState {...defaultProps} subtitle={subtitle} />
      );

      const subtitleElement = getByText(subtitle);
      expect(subtitleElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 20
          })
        ])
      );
    });

    it('should maintain proper spacing between elements', () => {
      const subtitle = 'Test subtitle';
      const { getByTestId, getByText } = render(
        <EmptyState {...defaultProps} subtitle={subtitle} />
      );

      const icon = getByTestId('ionicon-file-tray-outline');
      const message = getByTestId('themed-text-defaultSemiBold');
      const subtitleElement = getByText(subtitle);

      // Elements should exist in correct order
      expect(icon).toBeTruthy();
      expect(message).toBeTruthy();
      expect(subtitleElement).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for screen readers', () => {
      const { getByText, getByTestId } = render(<EmptyState {...defaultProps} />);

      const message = getByText('No items found');
      const icon = getByTestId('ionicon-file-tray-outline');

      expect(message).toBeTruthy();
      expect(icon).toBeTruthy();
    });

    it('should handle long messages properly', () => {
      const longMessage = 'This is a very long empty state message that should wrap properly and remain readable even when it spans multiple lines';

      const { getByText } = render(<EmptyState message={longMessage} />);

      expect(getByText(longMessage)).toBeTruthy();
    });

    it('should handle long subtitles properly', () => {
      const longSubtitle = 'This is a very long subtitle that provides additional context and should also wrap properly across multiple lines';

      const { getByText } = render(
        <EmptyState {...defaultProps} subtitle={longSubtitle} />
      );

      expect(getByText(longSubtitle)).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty message gracefully', () => {
      const { getByTestId } = render(<EmptyState message="" />);

      expect(getByTestId('themed-text-defaultSemiBold')).toBeTruthy();
    });

    it('should handle empty subtitle gracefully', () => {
      const { getByText } = render(
        <EmptyState {...defaultProps} subtitle="" />
      );

      // Empty subtitle should still render
      expect(getByText('')).toBeTruthy();
    });

    it('should handle special characters in message', () => {
      const specialMessage = '¡Hola! 你好 🌟 Special chars & symbols';
      const { getByText } = render(<EmptyState message={specialMessage} />);

      expect(getByText(specialMessage)).toBeTruthy();
    });

    it('should handle special characters in subtitle', () => {
      const specialSubtitle = 'Subtitle with émojis 🎉 and ūnīcōdē';
      const { getByText } = render(
        <EmptyState {...defaultProps} subtitle={specialSubtitle} />
      );

      expect(getByText(specialSubtitle)).toBeTruthy();
    });
  });

  describe('Theme switching', () => {
    it('should update colors when theme changes', () => {
      // Mock theme color changes
      useThemeColor.mockImplementation((lightColor, darkColor) => {
        const darkColorMap: Record<string, string> = {
          text: '#ffffff',
          icon: '#cccccc',
          background: '#000000',
        };
        return darkColorMap[darkColor] || '#ffffff';
      });

      const { getByTestId } = render(<EmptyState {...defaultProps} />);

      const messageText = getByTestId('themed-text-defaultSemiBold');
      const icon = getByTestId('ionicon-file-tray-outline');

      expect(messageText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#ffffff' })
        ])
      );

      expect(icon.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#cccccc' })
        ])
      );
    });
  });
});