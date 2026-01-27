// src/components/organisms/WelcomeCard.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Card } from '@/src/components/molecules/Card';
import { IconBox } from '@/src/components/atoms/IconBox';
import { Typography } from '@/src/components/atoms/Typography';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface WelcomeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({
  icon,
  title,
  description,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.content}>
        <IconBox icon={icon} size="lg" />
        <Typography variant="label" style={styles.title}>{title}</Typography>
        <Typography variant="caption" color="muted" style={styles.description}>
          {description}
        </Typography>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.base,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    lineHeight: 18,
  },
});