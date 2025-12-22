// src/components/atoms/LoadingSpinner.tsx

import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/theme/spacing';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  fullScreen = false,
  style,
}) => {
  const { theme } = useTheme();
  const spinnerColor = color || theme.primary;

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.background }, style]}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {text && (
          <Typography variant="caption" color="muted" style={styles.text}>
            {text}
          </Typography>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Typography variant="caption" color="muted" style={styles.text}>
          {text}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: spacing.md,
  },
});