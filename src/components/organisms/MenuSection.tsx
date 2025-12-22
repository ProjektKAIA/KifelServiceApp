// src/components/organisms/MenuSection.tsx

import React from 'react';
import { View, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Card } from '@/src/components/molecules/Card';
import { Typography } from '@/src/components/atoms/Typography';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  value?: string | boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  isToggle?: boolean;
}

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({ title, items }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Typography variant="overline" color="muted" style={styles.title}>
        {title}
      </Typography>
      <Card padding="none">
        {items.map((item, index) => {
          const IconComponent = item.icon;
          const isLast = index === items.length - 1;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                !isLast && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
              ]}
              onPress={item.isToggle ? undefined : item.onPress}
              activeOpacity={item.isToggle ? 1 : 0.7}
              disabled={item.isToggle}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                <IconComponent size={16} color={theme.textSecondary} />
              </View>
              <Typography variant="body" style={styles.label}>{item.label}</Typography>
              
              {item.isToggle ? (
                <Switch
                  value={item.value as boolean}
                  onValueChange={item.onToggle}
                  trackColor={{ false: theme.surface, true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              ) : (
                <View style={styles.rightContent}>
                  {typeof item.value === 'string' && (
                    <Typography variant="caption" color="muted">{item.value}</Typography>
                  )}
                  <ChevronRight size={16} color={theme.textMuted} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});