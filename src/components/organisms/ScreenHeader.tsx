// src/components/organisms/ScreenHeader.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '@/src/components/atoms/Typography';
import { spacing } from '@/src/constants/spacing';

interface ScreenHeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  overline,
  title,
  subtitle,
  rightContent,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        {overline && (
          <Typography variant="overline" color="muted" style={styles.overline}>
            {overline}
          </Typography>
        )}
        <Typography variant="h2">{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="secondary" style={styles.subtitle}>
            {subtitle}
          </Typography>
        )}
      </View>
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  overline: {
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
  },
  rightContent: {
    marginLeft: spacing.md,
  },
});