// src/hooks/useTheme.ts

import { useColorScheme } from 'react-native';
import { colors, ColorTheme } from '@/src/theme/colors';

interface UseThemeReturn {
  theme: ColorTheme;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useTheme = (): UseThemeReturn => {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const theme = colors[colorScheme];

  // Toggle würde normalerweise einen State ändern
  // Für jetzt folgt es dem System
  const toggleTheme = () => {
    // TODO: Implement theme persistence with AsyncStorage
    console.log('Theme toggle - would switch to:', isDark ? 'light' : 'dark');
  };

  return {
    theme,
    isDark,
    colorScheme,
    toggleTheme,
  };
};