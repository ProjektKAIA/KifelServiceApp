// src/screens/employee/DashboardScreen.tsx

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Calendar, MessageCircle, FileText } from 'lucide-react-native';

// Atomic Components
import { Typography, Overline } from '@/components/atoms';
import { Card, StatusPill, MenuButton } from '@/components/molecules';
import { ScreenHeader, StatsGrid } from '@/components/organisms';

import { useTheme } from '@/hooks/useTheme';
import { useTimeStore } from '@/store/timeStore';
import { spacing } from '@/constants/spacing';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isWorking, todayHours } = useTimeStore();

  const stats = [
    { value: todayHours.toFixed(1), label: 'Stunden heute' },
    { value: '38.5', label: 'Diese Woche' },
  ];

  const actions = [
    { icon: Calendar, label: 'Dienstplan', screen: 'Schedule' },
    { icon: MessageCircle, label: 'Team-Chat', screen: 'Chat' },
    { icon: FileText, label: 'Antrag stellen', screen: 'Request' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          overline="DASHBOARD"
          title="Guten Tag, Max"
        />

        {/* Shift Card */}
        <Card variant="accent" accentColor="#3b82f6" style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View>
              <Typography variant="caption" color="muted">
                Heutige Schicht
              </Typography>
              <Typography variant="h3">08:00 - 16:00</Typography>
            </View>
            <StatusPill
              status={isWorking ? 'active' : 'inactive'}
              label={isWorking ? 'Aktiv' : 'Nicht eingestempelt'}
            />
          </View>
          
          <View style={[styles.divider, { borderTopColor: theme.borderLight }]} />
          
          <View style={styles.locationRow}>
            <MapPin size={14} color={theme.textMuted} />
            <Typography variant="caption" color="muted">
              Standort Musterstraße 123
            </Typography>
          </View>
        </Card>

        {/* Stats */}
        <StatsGrid stats={stats} style={styles.statsGrid} />

        {/* Actions */}
        <Overline color="muted" style={styles.sectionTitle}>
          SCHNELLZUGRIFF
        </Overline>
        
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <MenuButton
              key={index}
              icon={action.icon}
              label={action.label}
              onPress={() => navigation.navigate(action.screen as never)}
              style={styles.actionButton}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
  },
  shiftCard: {
    marginBottom: spacing.base,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsGrid: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    width: '48%',
  },
});