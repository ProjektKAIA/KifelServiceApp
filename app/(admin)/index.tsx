// app/(admin)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Users, Check, X } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';

interface OpenRequest {
  id: string;
  employeeName: string;
  type: string;
  dateRange: string;
}

const mockOpenRequests: OpenRequest[] = [
  { id: '1', employeeName: 'Max M.', type: 'Urlaub', dateRange: '15.01. – 17.01.2025' },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
          <Text style={[styles.badgeText, { color: '#a855f7' }]}>ADMIN</Text>
        </View>

        {/* Header */}
        <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Übersicht</Text>
        <Text style={[styles.headerLarge, { color: theme.text }]}>Admin Dashboard</Text>

        {/* Live Status Card */}
        <View style={[styles.statusCard, { 
          backgroundColor: 'rgba(139,92,246,0.1)', 
          borderColor: 'rgba(139,92,246,0.2)' 
        }]}>
          <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Live-Status</Text>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>Aktiv arbeitend</Text>
            <Text style={[styles.statusItemValue, { color: '#4ade80' }]}>8</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>Nicht im Dienst</Text>
            <Text style={[styles.statusItemValue, { color: theme.text }]}>4</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>Krank gemeldet</Text>
            <Text style={[styles.statusItemValue, { color: '#fbbf24' }]}>1</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>Im Urlaub</Text>
            <Text style={[styles.statusItemValue, { color: theme.primary }]}>2</Text>
          </View>
        </View>

        {/* Management Section */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>VERWALTUNG</Text>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(admin)/schedules')}
          activeOpacity={0.7}
        >
          <Calendar size={20} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Dienstplan bearbeiten</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(admin)/employees')}
          activeOpacity={0.7}
        >
          <Users size={20} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Mitarbeiter verwalten</Text>
        </TouchableOpacity>

        {/* Open Requests */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.lg }]}>OFFENE ANTRÄGE</Text>

        {mockOpenRequests.map((request) => (
          <View
            key={request.id}
            style={[styles.requestCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          >
            <View style={styles.requestInfo}>
              <Text style={[styles.requestTitle, { color: theme.text }]}>
                {request.employeeName} – {request.type}
              </Text>
              <Text style={[styles.requestDate, { color: theme.textMuted }]}>{request.dateRange}</Text>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.actionIcon, { backgroundColor: theme.pillSuccess }]}
                activeOpacity={0.7}
              >
                <Check size={16} color={theme.pillSuccessText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}
                activeOpacity={0.7}
              >
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
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
    paddingTop: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerSmall: {
    fontSize: 13,
    marginBottom: 4,
  },
  headerLarge: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  statusCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusItemLabel: {
    fontSize: 14,
  },
  statusItemValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 13,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});