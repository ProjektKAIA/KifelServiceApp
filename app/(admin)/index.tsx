// app/(admin)/index.tsx

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
import {
  Users,
  Calendar,
  Clock,
  FileText,
  MapPin,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { user } = useAuthStore();

  // Mock-Daten
  const stats = {
    activeEmployees: 12,
    workingNow: 8,
    pendingRequests: 3,
    hoursThisMonth: 1842,
  };

  const activeWorkers = [
    { id: '1', name: 'Max Müller', location: 'Standort Forst', since: '08:02' },
    { id: '2', name: 'Anna Schmidt', location: 'Standort Mitte', since: '07:55' },
    { id: '3', name: 'Tom Weber', location: 'Standort Nord', since: '08:15' },
  ];

  const quickActions = [
    { icon: Users, label: 'Mitarbeiter', route: '/(admin)/employees', color: '#3b82f6' },
    { icon: Calendar, label: 'Dienstplan', route: '/(admin)/schedule', color: '#8b5cf6' },
    { icon: FileText, label: 'Anträge', route: '/(admin)/requests', color: '#f59e0b' },
    { icon: TrendingUp, label: 'Berichte', route: '/(admin)/reports', color: '#22c55e' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Admin-Bereich</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Dashboard</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Users size={22} color="#3b82f6" />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.activeEmployees}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Mitarbeiter</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Clock size={22} color="#22c55e" />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.workingNow}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Arbeiten jetzt</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <AlertCircle size={22} color="#f59e0b" />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.pendingRequests}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Offene Anträge</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <TrendingUp size={22} color="#8b5cf6" />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.hoursThisMonth}h</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Monatsstunden</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SCHNELLZUGRIFF</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Workers */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>AKTUELL IM DIENST</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: theme.primary }]}>Alle anzeigen</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.workersCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {activeWorkers.map((worker, index) => (
            <View
              key={worker.id}
              style={[
                styles.workerRow,
                index < activeWorkers.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.workerInfo}>
                <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
                <View>
                  <Text style={[styles.workerName, { color: theme.text }]}>{worker.name}</Text>
                  <View style={styles.workerMeta}>
                    <MapPin size={12} color={theme.textMuted} />
                    <Text style={[styles.workerLocation, { color: theme.textMuted }]}>
                      {worker.location}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.workerTime}>
                <Text style={[styles.workerSince, { color: theme.textSecondary }]}>seit {worker.since}</Text>
                <ChevronRight size={16} color={theme.textMuted} />
              </View>
            </View>
          ))}
        </View>

        {/* Pending Requests Alert */}
        {stats.pendingRequests > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' }]}
            onPress={() => router.push('/(admin)/requests' as any)}
          >
            <AlertCircle size={20} color="#f59e0b" />
            <Text style={[styles.alertText, { color: '#fbbf24' }]}>
              {stats.pendingRequests} offene Anträge warten auf Bearbeitung
            </Text>
            <ChevronRight size={18} color="#fbbf24" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base },
  header: { marginBottom: spacing.lg },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { width: '48%', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  seeAll: { fontSize: 13, fontWeight: '500' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  actionCard: { width: '48%', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, alignItems: 'center', gap: spacing.sm },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  workersCard: { borderRadius: borderRadius.card, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.lg },
  workerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base },
  workerInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  workerName: { fontSize: 15, fontWeight: '600' },
  workerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  workerLocation: { fontSize: 12 },
  workerTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  workerSince: { fontSize: 13 },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.base, borderRadius: borderRadius.card, borderWidth: 1 },
  alertText: { flex: 1, fontSize: 13, fontWeight: '500' },
});