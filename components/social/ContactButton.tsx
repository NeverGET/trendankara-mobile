import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

/**
 * Props for ContactButton component
 */
export interface ContactButtonProps {
  /** Icon name from Ionicons library */
  icon: keyof typeof Ionicons.glyphMap;
  /** Text label displayed below the icon */
  label: string;
  /** Callback function when button is pressed */
  onPress: () => void;
  /** Color for the icon (hex or named color) */
  color: string;
  /** Accessibility label for screen readers */
  accessibilityLabel: string;
  /** Optional additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * ContactButton - Reusable icon-only button for social contact actions
 *
 * Displays a compact icon button with haptic feedback on press,
 * and ensures minimum touch target size for accessibility.
 * Optimized for space-constrained layouts.
 *
 * @example
 * <ContactButton
 *   icon="logo-whatsapp"
 *   label="WhatsApp"
 *   color="#25D366"
 *   onPress={handleWhatsApp}
 *   accessibilityLabel="WhatsApp ile şarkı iste"
 * />
 */
export const ContactButton: React.FC<ContactButtonProps> = ({
  icon,
  label,
  onPress,
  color,
  accessibilityLabel,
  style,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={28} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
});
