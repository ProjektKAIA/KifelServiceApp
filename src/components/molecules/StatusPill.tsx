// src/components/molecules/StatusPill.tsx

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type StatusType = 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';

interface StatusPillProps {
  status: StatusType;
  label: string;
  showDot?: boolean;
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<StatusType, { bg: string; dot: string; text: string }> = {
  active: { bg: 'rgba(34,197,94,0.15)', dot: '#22c55e', text: '#4ade80' },
  inactive: { bg: 'rgba(156,163,175,0.15)', dot: '#9ca3af', text: '#9ca3af' },
  pending: { bg: 'rgba(251,191,36,0.15)', dot: '#fbbf24', text: '#fbbf24' },
  success: { bg: 'rgba(34,197,94,0.15)', dot: '#22c55e', text: '#4ade80' },
  error: { bg: 'rgba(239,68,68,0.15)', dot: '#ef4444', text: '#f87171' },
  warning: { bg: 'rgba(251,191,36,0.15)', dot: '#fbbf24', text: '#fbbf24' },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  showDot = true,
  style,
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.container, { backgroundColor: config.bg }, style]}>
      {showDot && <View style={[styles.dot, { backgroundColor: config.dot }]} />}
      <Text style={[styles.text, { color: config.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});