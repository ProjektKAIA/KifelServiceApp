// src/components/organisms/StatCard.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Card } from '@/src/components/molecules/Card';
import { Typography } from '@/src/components/atoms/Typography';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
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
            { backgroundColor: accentColor ? `${accentColor}20` : theme.surface },
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