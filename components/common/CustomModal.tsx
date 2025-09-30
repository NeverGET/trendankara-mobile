/**
 * CustomModal Component
 * Reusable modal dialog with Trend Ankara design system
 */

import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows, ZIndex } from '@/constants/themes';
import { Image } from 'expo-image';
import { getImageSource, getPlaceholderImage } from '@/utils/imageProxy';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
}

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  imageUrl?: string | null;
  actions?: ModalAction[];
  children?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  description,
  imageUrl,
  actions = [],
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const getActionButtonStyle = (variant: ModalAction['variant'] = 'primary') => {
    const baseStyle = [styles.actionButton];

    switch (variant) {
      case 'primary':
        baseStyle.push({
          backgroundColor: Colors.primary,
        });
        break;
      case 'secondary':
        baseStyle.push({
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        });
        break;
      case 'outline':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.primary,
        });
        break;
      case 'danger':
        baseStyle.push({
          backgroundColor: colors.error,
        });
        break;
    }

    return baseStyle;
  };

  const getActionTextStyle = (variant: ModalAction['variant'] = 'primary') => {
    const baseStyle = [styles.actionText];

    switch (variant) {
      case 'primary':
        baseStyle.push({ color: Colors.white });
        break;
      case 'secondary':
        baseStyle.push({ color: colors.text });
        break;
      case 'outline':
        baseStyle.push({ color: Colors.primary });
        break;
      case 'danger':
        baseStyle.push({ color: Colors.white });
        break;
    }

    return baseStyle;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            backgroundColor: colors.overlay,
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={handleBackdropPress}>
          <SafeAreaView style={styles.container}>
            <Animated.View
              style={[
                styles.modal,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transform: [{ translateY: slideAnim }],
                  ...Shadows[colorScheme ?? 'light'].xl,
                },
              ]}
            >
              {/* Content - Everything in ScrollView */}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Spacing.lg }}
              >
                {/* Image Section - Full width, no padding */}
                {imageUrl && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={getImageSource(imageUrl)}
                      style={styles.image}
                      contentFit="cover"
                      transition={300}
                      placeholder={{ uri: getPlaceholderImage() }}
                    />
                    {/* Close button overlay on image */}
                    {showCloseButton && (
                      <TouchableOpacity
                        style={[
                          styles.closeButtonOverlay,
                          {
                            top: Math.max(12, insets.top + 12),
                            right: Math.max(12, insets.right + 12)
                          }
                        ]}
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name="close"
                          size={20}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Content Section - With padding */}
                <View style={styles.contentPadded}>
                  {/* Title */}
                  <Text
                    style={[
                      styles.title,
                      {
                        color: colors.text,
                        fontSize: Typography.fontSize.xl,
                        fontWeight: Typography.fontWeight.bold,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>

                  {/* Description */}
                  {description ? (
                    <Text
                      style={[
                        styles.description,
                        {
                          color: colors.text,
                          fontSize: 14,
                          lineHeight: 20,
                        },
                      ]}
                    >
                      {description}
                    </Text>
                  ) : (
                    <Text style={{ color: colors.text }}>No description available</Text>
                  )}

                  {/* Custom Content */}
                  {children && <View style={styles.customContent}>{children}</View>}
                </View>
              </ScrollView>

              {/* Actions */}
              {actions.length > 0 && (
                <View style={[styles.actions, { borderTopColor: colors.border }]}>
                  {actions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        getActionButtonStyle(action.variant),
                        { flex: actions.length === 1 ? 1 : 0, minWidth: actions.length > 1 ? 120 : undefined },
                        action.disabled && styles.disabledButton,
                      ]}
                      onPress={action.onPress}
                      disabled={action.disabled || action.loading}
                      activeOpacity={0.8}
                    >
                      <View style={styles.actionContent}>
                        {action.loading ? (
                          <ActivityIndicator
                            size="small"
                            color={action.variant === 'primary' || action.variant === 'danger' ? Colors.white : colors.text}
                            style={styles.actionLoader}
                          />
                        ) : (
                          action.icon && (
                            <Ionicons
                              name={action.icon}
                              size={18}
                              color={action.variant === 'primary' || action.variant === 'danger' ? Colors.white : colors.text}
                              style={styles.actionIcon}
                            />
                          )
                        )}
                        <Text style={getActionTextStyle(action.variant)}>
                          {action.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Animated.View>
          </SafeAreaView>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: ZIndex.modal,
  },
  backdropPressable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modal: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    maxHeight: SCREEN_HEIGHT * 0.8,
    height: SCREEN_HEIGHT * 0.8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    flex: 1,
    marginRight: Spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  content: {
    flex: 1,
    minHeight: 100,
  },
  scrollContent: {
    minHeight: 100,
  },
  contentPadded: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButtonOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    marginBottom: Spacing.lg,
  },
  customContent: {
    marginTop: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    marginRight: Spacing.sm,
  },
  actionLoader: {
    marginRight: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});