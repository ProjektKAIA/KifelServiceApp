// src/components/organisms/StatCard.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Card } from '@/components/molecules/Card';
import { Typography } from '@/components/atoms/Typography';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  accentColor?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon: Icon,
  accentColor,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <Card style={[styles.card, style]}>
      {Icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accentColor ? `${accentColor}20` : theme.surfaceLight },
          ]}
        >
          <Icon size={18} color={accentColor || theme.primary} />
        </View>
      )}
      <Typography
        variant="h1"
        style={[styles.value, accentColor && { color: accentColor }]}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="muted" style={styles.label}>
        {label}
      </Typography>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 28,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
  },
});

// ============================================================
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