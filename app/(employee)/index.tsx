// app/(employee)/index.tsx

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, MessageCircle, FileText } from 'lucide-react-native';

import { Overline } from '@/src/components/atoms';
import { MenuButton } from '@/src/components/molecules';
import { ScreenHeader, StatsGrid, ShiftCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { useTimeStore } from '@/src/store/timeStore';
import { useAuthStore } from '@/src/store/authStore';
import { spacing } from '@/src/constants/spacing';

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isWorking, todayHours } = useTimeStore();
  const { user } = useAuthStore();

  const greeting = `Guten Tag, ${user?.firstName || 'Max'}`;

  const stats = [
    { value: todayHours.toFixed(1), label: 'Stunden heute' },
    { value: '38.5', label: 'Diese Woche' },
  ];

  const actions = [
    { icon: Calendar, label: 'Dienstplan', route: '/(employee)/schedule' },
    { icon: MessageCircle, label: 'Team-Chat', route: '/(employee)/chat' },
    { icon: FileText, label: 'Antrag stellen', route: '/(employee)/vacation' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="DASHBOARD" title={greeting} />

        {/* Shift Card */}
        <ShiftCard
          timeRange="08:00 - 16:00"
          location="Standort Musterstraße 123"
          isActive={isWorking}
          statusLabel={isWorking ? 'Aktiv' : 'Nicht eingestempelt'}
          accentColor="#3b82f6"
        />

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
              onPress={() => router.push(action.route as any)}
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
  statsGrid: {
    marginTop: spacing.base,
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