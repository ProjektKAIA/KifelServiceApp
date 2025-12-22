// src/components/organisms/ShiftCard.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Card } from '@/components/molecules/Card';
import { StatusPill } from '@/components/molecules/StatusPill';
import { Typography } from '@/components/atoms/Typography';
import { Divider } from '@/components/atoms/Divider';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';

interface ShiftCardProps {
  label?: string;
  timeRange: string;
  location?: string;
  isActive?: boolean;
  statusLabel?: string;
  accentColor?: string;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  label = 'Heutige Schicht',
  timeRange,
  location,
  isActive = false,
  statusLabel,
  accentColor = '#3b82f6',
}) => {
  const { theme } = useTheme();

  return (
    <Card variant="accent" accentColor={accentColor}>
      <View style={styles.header}>
        <View>
          <Typography variant="caption" color="muted">{label}</Typography>
          <Typography variant="h3">{timeRange}</Typography>
        </View>
        {statusLabel && (
          <StatusPill
            status={isActive ? 'active' : 'inactive'}
            label={statusLabel}
          />
        )}
      </View>

      {location && (
        <>
          <Divider spacing="md" />
          <View style={styles.locationRow}>
            <MapPin size={14} color={theme.textMuted} />
            <Typography variant="caption" color="muted">{location}</Typography>
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});