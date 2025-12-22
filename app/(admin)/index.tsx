// app/(admin)/index.tsx

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Calendar, FileText } from 'lucide-react-native';

import { Typography } from '@/src/components/atoms';
import { Card, MenuButton } from '@/src/components/molecules';
import { ScreenHeader, StatsGrid } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const stats = [
    { value: 12, label: 'Mitarbeiter', icon: Users },
    { value: 3, label: 'Offene Anträge', icon: FileText, accentColor: '#f59e0b' },
  ];

  const statusItems = [
    { label: 'Anwesend', value: '8', color: '#22c55e' },
    { label: 'Im Urlaub', value: '2', color: '#3b82f6' },
    { label: 'Krank', value: '1', color: '#ef4444' },
    { label: 'Abwesend', value: '1', color: '#9ca3af' },
  ];

  const menuItems = [
    { icon: Calendar, label: 'Dienstplan bearbeiten', route: '/(admin)/schedules' },
    { icon: Users, label: 'Mitarbeiter verwalten', route: '/(admin)/team' },
    { icon: FileText, label: 'Anträge bearbeiten', route: '/(admin)/requests' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="ADMINISTRATION" title="Dashboard" />

        {/* Stats */}
        <StatsGrid stats={stats} style={styles.statsGrid} />

        {/* Live Status */}
        <Card variant="accent" accentColor="#8b5cf6" style={styles.statusCard}>
          <Typography variant="overline" color="muted" style={styles.statusTitle}>
            LIVE-STATUS
          </Typography>
          {statusItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.statusRow,
                index < statusItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.borderLight,
                },
              ]}
            >
              <Typography variant="body" color="secondary">{item.label}</Typography>
              <Typography variant="label" style={{ color: item.color }}>{item.value}</Typography>
            </View>
          ))}
        </Card>

        {/* Management Buttons */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          VERWALTUNG
        </Typography>

        {menuItems.map((item, index) => (
          <MenuButton
            key={index}
            icon={item.icon}
            label={item.label}
            onPress={() => router.push(item.route as any)}
            style={styles.menuButton}
          />
        ))}
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
  statsGrid: {
    marginBottom: spacing.base,
  },
  statusCard: {
    marginBottom: spacing.xl,
  },
  statusTitle: {
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  menuButton: {
    marginBottom: spacing.sm,
  },
});