// src/theme/index.ts

import { colors, ColorTheme, ThemeMode } from './colors';
import { typography, fontSizes, fontWeights, fontFamily } from './typography';
import { spacing, borderRadius, iconSizes, avatarSizes, layout } from './spacing';
import { shadows } from './shadows';

export const getTheme = (mode: ThemeMode) => ({
  mode,
  colors: colors[mode],
  typography,
  fontSizes,
  fontWeights,
  fontFamily,
  spacing,
  borderRadius,
  iconSizes,
  avatarSizes,
  layout,
  shadows,
});

export type Theme = ReturnType<typeof getTheme>;

export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');

export {
  colors,
  typography,
  fontSizes,
  fontWeights,
  fontFamily,
  spacing,
  borderRadius,
  iconSizes,
  avatarSizes,
  layout,
  shadows,
};

export type { ColorTheme, ThemeMode };