// src/components/molecules/ThemeToggle.tsx

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { ThemePreference } from '@/src/store/themeStore';
import { spacing, borderRadius } from '@/src/theme/spacing';

interface ThemeOption {
  value: ThemePreference;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const options: ThemeOption[] = [
  { value: 'light', label: 'Hell', icon: Sun },
  { value: 'system', label: 'System', icon: Smartphone },
  { value: 'dark', label: 'Dunkel', icon: Moon },
];

export const ThemeToggle: React.FC = () => {
  const { theme, themePreference, setThemePreference } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {options.map((option) => {
        const isActive = themePreference === option.value;
        const Icon = option.icon;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              isActive && { backgroundColor: theme.primary },
            ]}
            onPress={() => setThemePreference(option.value)}
            activeOpacity={0.7}
          >
            <Icon size={16} color={isActive ? '#fff' : theme.textSecondary} />
            <Text
              style={[
                styles.label,
                { color: isActive ? '#fff' : theme.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});