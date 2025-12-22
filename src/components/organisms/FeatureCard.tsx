// src/components/organisms/FeatureCard.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Card } from '@/src/components/molecules/Card';
import { IconBox } from '@/src/components/atoms/IconBox';
import { Typography } from '@/src/components/atoms/Typography';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  iconColor,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <Card onPress={onPress} style={[styles.card, style]}>
      <View style={styles.content}>
        <IconBox
          icon={icon}
          color={iconColor || theme.primary}
          backgroundColor={theme.surface}
        />
        <View style={styles.textContent}>
          <Typography variant="label">{title}</Typography>
          <Typography variant="caption" color="muted" style={styles.description}>
            {description}
          </Typography>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  description: {
    marginTop: 2,
    lineHeight: 18,
  },
});