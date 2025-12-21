// src/theme/typography.ts

import { Platform } from 'react-native';

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 32,
  '4xl': 42,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

export const typography = {
  headerLg: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
  },
  headerMd: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
  headerSm: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  bodyLg: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },
  bodyMd: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  bodySm: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  bodyXs: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  button: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
  },
  timeDisplay: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: -2,
  },
  logo: {
    fontSize: 24,
    fontWeight: fontWeights.extrabold,
    letterSpacing: -0.5,
  },
};