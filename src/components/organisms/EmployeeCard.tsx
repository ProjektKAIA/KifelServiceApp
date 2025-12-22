// src/components/organisms/EmployeeCard.tsx

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/molecules/Card';
import { StatusPill } from '@/components/molecules/StatusPill';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'admin';
  status: 'active' | 'inactive';
  location?: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onPress?: () => void;
  showChevron?: boolean;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onPress,
  showChevron = true,
}) => {
  const { theme } = useTheme();

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        <Avatar name={employee.name} />
        
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Typography variant="label">{employee.name}</Typography>
            {employee.role === 'admin' && (
              <Badge text="ADMIN" variant="purple" />
            )}
          </View>
          
          <Typography variant="caption" color="muted" style={styles.email}>
            {employee.email}
          </Typography>
          
          <View style={styles.metaRow}>
            {employee.location && (
              <View style={styles.location}>
                <MapPin size={10} color={theme.textMuted} />
                <Typography variant="caption" color="muted">
                  {employee.location}
                </Typography>
              </View>
            )}
            <StatusPill
              status={employee.status}
              label={employee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
              style={styles.statusPill}
            />
          </View>
        </View>
        
        {showChevron && (
          <ChevronRight size={18} color={theme.textMuted} />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  email: {
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.sm,
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
});