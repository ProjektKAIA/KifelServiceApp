// src/components/atoms/Badge.tsx

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'sm',
  style,
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' };
      case 'warning':
        return { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' };
      case 'error':
        return { bg: 'rgba(239,68,68,0.15)', text: '#f87171' };
      case 'info':
        return { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' };
      case 'purple':
        return { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' };
      default:
        return { bg: theme.surface, text: theme.textMuted };
    }
  };

  const variantStyles = getVariantStyles();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: variantStyles.bg },
        isSmall ? styles.sm : styles.md,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: variantStyles.text },
          isSmall ? styles.textSm : styles.textMd,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 9,
  },
  textMd: {
    fontSize: 11,
  },
});