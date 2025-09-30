import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '@/components/common/EmptyState';

// Mock dependencies
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: () => '#000000',
}));

jest.mock('@/components/themed-text', () => ({
  ThemedText: ({ children, style, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text style={style} {...props}>{children}</Text>;
  },
}));

describe('EmptyState', () => {
  it('renders message correctly', () => {
    const { getByText } = render(
      <EmptyState message="No data found" />
    );

    expect(getByText('No data found')).toBeTruthy();
  });

  it('renders with custom icon and subtitle', () => {
    const { getByText } = render(
      <EmptyState
        message="No sponsors found"
        icon="business-outline"
        subtitle="No sponsor cards added yet"
      />
    );

    expect(getByText('No sponsors found')).toBeTruthy();
    expect(getByText('No sponsor cards added yet')).toBeTruthy();
  });

  it('renders without subtitle when not provided', () => {
    const { getByText, queryByText } = render(
      <EmptyState message="No data" />
    );

    expect(getByText('No data')).toBeTruthy();
    // Since subtitle is optional, ensure it's not present
    expect(queryByText('')).toBeNull();
  });
});