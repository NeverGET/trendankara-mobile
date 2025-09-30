import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface EmptyStateProps {
  /** The message to display */
  message: string;
  /** The icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional subtitle text */
  subtitle?: string;
}

export function EmptyState({
  message,
  icon = 'file-tray-outline',
  subtitle
}: EmptyStateProps) {
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Ionicons
        name={icon}
        size={64}
        color={iconColor}
        style={styles.icon}
      />
      <ThemedText
        type="defaultSemiBold"
        style={[styles.message, { color: textColor }]}
      >
        {message}
      </ThemedText>
      {subtitle && (
        <ThemedText
          style={[styles.subtitle, { color: iconColor }]}
        >
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  message: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 18,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
});