// src/components/atoms/LoadingSpinner.tsx

import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color || theme.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
