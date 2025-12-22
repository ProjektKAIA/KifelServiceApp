// src/components/organisms/StatsGrid.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { StatCard } from './StatCard';
import { spacing } from '@/constants/spacing';

interface StatItem {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  accentColor?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  style?: ViewStyle;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = 2,
  style,
}) => {
  return (
    <View style={[styles.grid, style]}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          value={stat.value}
          label={stat.label}
          icon={stat.icon}
          accentColor={stat.accentColor}
          style={{ flex: 1 / columns }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});