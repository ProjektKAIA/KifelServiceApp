// src/components/atoms/Typography.tsx

import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'overline';

type TypographyColor = 'default' | 'primary' | 'secondary' | 'muted' | 'error' | 'success';

interface TypographyProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: TypographyColor;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'default',
  style,
  numberOfLines,
}) => {
  const { theme } = useTheme();

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return theme.primary;
      case 'secondary':
        return theme.textSecondary;
      case 'muted':
        return theme.textMuted;
      case 'error':
        return '#ef4444';
      case 'success':
        return '#22c55e';
      default:
        return theme.text;
    }
  };

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'bodySmall':
        return styles.bodySmall;
      case 'caption':
        return styles.caption;
      case 'label':
        return styles.label;
      case 'overline':
        return styles.overline;
      default:
        return styles.body;
    }
  };

  return (
    <Text
      style={[getVariantStyle(), { color: getColor() }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

// Shortcut Components
export const H1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const H2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const H3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Label: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="label" {...props} />
);

export const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="overline" {...props} />
);

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  overline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});