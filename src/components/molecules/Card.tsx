// src/components/molecules/Card.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { borderRadius, spacing } from '@/src/constants/spacing';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'accent';
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  accentColor,
  onPress,
  style,
  padding = 'md',
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        };
      case 'accent':
        return {
          backgroundColor: accentColor
            ? `${accentColor}15`
            : 'rgba(139, 92, 246, 0.1)',
          borderColor: accentColor
            ? `${accentColor}30`
            : 'rgba(139, 92, 246, 0.2)',
        };
      default:
        return {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        };
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing.sm };
      case 'lg':
        return { padding: spacing.xl };
      default:
        return { padding: spacing.base };
    }
  };

  const cardContent = (
    <View style={[styles.base, getVariantStyles(), getPaddingStyle(), style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
  },
});