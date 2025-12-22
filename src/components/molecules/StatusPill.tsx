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

// ============================================================
// src/components/molecules/MenuButton.tsx

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { borderRadius, spacing } from '@/constants/spacing';

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'accent';
  accentColor?: string;
  style?: ViewStyle;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  icon: Icon,
  label,
  onPress,
  variant = 'default',
  accentColor,
  style,
}) => {
  const { theme } = useTheme();

  const getStyles = (): { bg: string; border: string; text: string } => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.primary,
          border: theme.primary,
          text: '#fff',
        };
      case 'accent':
        return {
          bg: accentColor || theme.primary,
          border: accentColor || theme.primary,
          text: '#fff',
        };
      default:
        return {
          bg: theme.surface,
          border: theme.border,
          text: theme.textSecondary,
        };
    }
  };

  const variantStyles = getStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon size={16} color={variantStyles.text} />
      <Text style={[styles.text, { color: variantStyles.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.button,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});