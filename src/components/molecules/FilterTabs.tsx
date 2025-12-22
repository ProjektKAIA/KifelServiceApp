// src/components/molecules/FilterTabs.tsx

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface FilterOption {
  key: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  selected: string;
  onSelect: (key: string) => void;
  style?: ViewStyle;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  options,
  selected,
  onSelect,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isActive = selected === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? theme.primary : theme.surface,
                borderColor: isActive ? theme.primary : theme.border,
              },
            ]}
            onPress={() => onSelect(option.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
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
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
});