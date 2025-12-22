// src/components/atoms/Divider.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';

interface DividerProps {
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  spacing: spacingProp = 'md',
  style,
}) => {
  const { theme } = useTheme();

  const getSpacing = (): number => {
    switch (spacingProp) {
      case 'none': return 0;
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      default: return spacing.md;
    }
  };

  const marginValue = getSpacing();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: theme.borderLight,
          marginVertical: marginValue,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
});