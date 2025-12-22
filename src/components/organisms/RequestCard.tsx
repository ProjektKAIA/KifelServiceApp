// src/components/organisms/RequestCard.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Palmtree, Thermometer, Check, X } from 'lucide-react-native';
import { Card } from '@/components/molecules/Card';
import { StatusPill } from '@/components/molecules/StatusPill';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';

type RequestType = 'vacation' | 'sick';
type RequestStatus = 'pending' | 'approved' | 'rejected';

interface RequestCardProps {
  type: RequestType;
  employeeName: string;
  dateRange: string;
  reason?: string;
  status: RequestStatus;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  type,
  employeeName,
  dateRange,
  reason,
  status,
  showActions = false,
  onApprove,
  onReject,
}) => {
  const { theme } = useTheme();

  const typeConfig = {
    vacation: { icon: Palmtree, label: 'Urlaub', color: '#f59e0b' },
    sick: { icon: Thermometer, label: 'Krank', color: '#ef4444' },
  };

  const statusConfig = {
    pending: { label: 'Ausstehend', type: 'pending' as const },
    approved: { label: 'Genehmigt', type: 'success' as const },
    rejected: { label: 'Abgelehnt', type: 'error' as const },
  };

  const TypeIcon = typeConfig[type].icon;
  const typeInfo = typeConfig[type];
  const statusInfo = statusConfig[status];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.typeRow}>
          <TypeIcon size={14} color={typeInfo.color} />
          <Typography variant="label" style={{ color: typeInfo.color }}>
            {typeInfo.label}
          </Typography>
        </View>
        <StatusPill status={statusInfo.type} label={statusInfo.label} />
      </View>

      <Typography variant="label" style={styles.name}>{employeeName}</Typography>
      <Typography variant="bodySmall" color="secondary">{dateRange}</Typography>
      
      {reason && (
        <Typography variant="caption" color="muted" style={styles.reason}>
          „{reason}"
        </Typography>
      )}

      {showActions && status === 'pending' && (
        <View style={styles.actions}>
          <Button
            title="Ablehnen"
            icon={X}
            variant="danger"
            size="sm"
            onPress={onReject || (() => {})}
            style={styles.actionButton}
          />
          <Button
            title="Genehmigen"
            icon={Check}
            variant="primary"
            size="sm"
            onPress={onApprove || (() => {})}
            style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    marginBottom: 2,
  },
  reason: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});