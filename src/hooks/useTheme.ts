// src/hooks/useTheme.ts

import { useColorScheme } from 'react-native';
import { colors, ColorTheme } from '@/src/theme/colors';
import { useThemeStore, ThemePreference } from '@/src/store/themeStore';

interface UseThemeReturn {
  theme: ColorTheme;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

export const useTheme = (): UseThemeReturn => {
  const systemColorScheme = useColorScheme() ?? 'light';
  const { themePreference, setThemePreference } = useThemeStore();

  // Bestimme das aktive Color Scheme basierend auf Präferenz
  const colorScheme: 'light' | 'dark' =
    themePreference === 'system' ? systemColorScheme : themePreference;

  const isDark = colorScheme === 'dark';
  const theme = colors[colorScheme];

  return {
    theme,
    isDark,
    colorScheme,
    themePreference,
    setThemePreference,
  };
};