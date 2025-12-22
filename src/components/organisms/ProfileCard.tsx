// src/components/organisms/ProfileCard.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card } from '@/components/molecules/Card';
import { Avatar } from '@/components/atoms/Avatar';
import { Typography } from '@/components/atoms/Typography';
import { spacing } from '@/constants/spacing';

interface ProfileCardProps {
  name: string;
  role: string;
  email?: string;
  style?: ViewStyle;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  role,
  email,
  style,
}) => {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.content}>
        <Avatar name={name} size="xl" />
        <Typography variant="h3" style={styles.name}>{name}</Typography>
        <Typography variant="bodySmall" color="muted">{role}</Typography>
        {email && (
          <Typography variant="caption" color="muted" style={styles.email}>
            {email}
          </Typography>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  name: {
    marginTop: spacing.md,
    marginBottom: 4,
  },
  email: {
    marginTop: 4,
  },
});