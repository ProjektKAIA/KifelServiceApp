// src/components/molecules/MenuButton.tsx

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { borderRadius, spacing } from '@/constants/spacing';

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'accent';
  accentColor?: string;
  style?: ViewStyle;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  icon: Icon,
  label,
  onPress,
  variant = 'default',
  accentColor,
  style,
}) => {
  const { theme } = useTheme();

  const getStyles = (): { bg: string; border: string; text: string } => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.primary,
          border: theme.primary,
          text: '#fff',
        };
      case 'accent':
        return {
          bg: accentColor || theme.primary,
          border: accentColor || theme.primary,
          text: '#fff',
        };
      default:
        return {
          bg: theme.surface,
          border: theme.border,
          text: theme.textSecondary,
        };
    }
  };

  const variantStyles = getStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon size={16} color={variantStyles.text} />
      <Text style={[styles.text, { color: variantStyles.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.button,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});