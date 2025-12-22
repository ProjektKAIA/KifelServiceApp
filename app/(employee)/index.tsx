// app/(employee)/index.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, Calendar, Sun, MessageCircle, MapPin } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTimeStore } from '@/src/store/timeStore';

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { user } = useAuthStore();
  const { isTracking } = useTimeStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const quickActions = [
    { icon: Clock, label: 'Zeit', route: '/(employee)/time' as const, color: '#22c55e' },
    { icon: Calendar, label: 'Plan', route: '/(employee)/schedule' as const, color: null },
    { icon: Sun, label: 'Urlaub', route: '/(employee)/vacation' as const, color: null },
    { icon: MessageCircle, label: 'Chat', route: '/(employee)/chat' as const, color: null },
  ];

  const currentShift = { time: '08:00 – 16:00', location: 'Standort Forst' };
  const stats = { hoursThisMonth: 142, remainingVacation: 18 };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>{getGreeting()}</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>

        <View style={[styles.shiftCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}>
          <View style={styles.shiftHeader}>
            <View>
              <Text style={[styles.shiftLabel, { color: theme.textSecondary }]}>Aktuelle Schicht</Text>
              <Text style={[styles.shiftTime, { color: theme.text }]}>{currentShift.time}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: theme.pillSuccess }]}>
              <View style={[styles.statusDot, { backgroundColor: theme.pillSuccessText }]} />
              <Text style={[styles.statusText, { color: theme.pillSuccessText }]}>
                {isTracking ? 'Aktiv' : 'Geplant'}
              </Text>
            </View>
          </View>
          <View style={[styles.shiftDivider, { borderTopColor: 'rgba(255,255,255,0.1)' }]} />
          <View style={styles.shiftLocation}>
            <MapPin size={14} color={theme.textSecondary} />
            <Text style={[styles.shiftLocationText, { color: theme.textSecondary }]}>{currentShift.location}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.hoursThisMonth}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Stunden / Monat</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.remainingVacation}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Resturlaub</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SCHNELLZUGRIFF</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, {
                backgroundColor: action.color || theme.surface,
                borderColor: action.color || theme.border,
              }]}
              onPress={() => router.push(action.route)}
              activeOpacity={0.7}
            >
              <action.icon size={16} color={action.color ? '#fff' : theme.textSecondary} />
              <Text style={[styles.actionText, { color: action.color ? '#fff' : theme.textSecondary }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base },
  header: { marginBottom: spacing.xl },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  shiftCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.base },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftLabel: { fontSize: 12, marginBottom: 4 },
  shiftTime: { fontSize: 18, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  shiftDivider: { borderTopWidth: 1, marginVertical: spacing.md },
  shiftLocation: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shiftLocationText: { fontSize: 12 },
  statsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 16, borderRadius: borderRadius.button, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '600' },
});