// app/(admin)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Users, Check, X } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

const liveStatus = { activeWorking: 8, offDuty: 4, onSickLeave: 1, onVacation: 2 };
const pendingRequests = [
  { id: '1', employeeName: 'Max M.', type: 'Urlaub', dateRange: '15.01. – 17.01.2025' },
  { id: '2', employeeName: 'Sandra K.', type: 'Urlaub', dateRange: '20.01. – 22.01.2025' },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const statusItems = [
    { label: 'Aktiv arbeitend', value: liveStatus.activeWorking, color: theme.pillSuccessText },
    { label: 'Nicht im Dienst', value: liveStatus.offDuty, color: theme.text },
    { label: 'Krank gemeldet', value: liveStatus.onSickLeave, color: theme.pillWarningText },
    { label: 'Im Urlaub', value: liveStatus.onVacation, color: theme.pillInfoText },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { backgroundColor: 'rgba(139,92,246,0.08)' }]}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Übersicht</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Admin Dashboard</Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.2)' }]}>
          <Text style={[styles.statusTitle, { color: theme.textMuted }]}>Live-Status</Text>
          {statusItems.map((item, i) => (
            <View key={i} style={[styles.statusRow, i < statusItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight }]}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.statusValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>VERWALTUNG</Text>
        <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/(admin)/schedules')} activeOpacity={0.7}>
          <Calendar size={16} color={theme.textSecondary} /><Text style={[styles.menuButtonText, { color: theme.textSecondary }]}>Dienstplan bearbeiten</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/(admin)/team')} activeOpacity={0.7}>
          <Users size={16} color={theme.textSecondary} /><Text style={[styles.menuButtonText, { color: theme.textSecondary }]}>Mitarbeiter verwalten</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>OFFENE ANTRÄGE</Text>
        {pendingRequests.map((request) => (
          <View key={request.id} style={[styles.requestCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.requestInfo}>
              <Text style={[styles.requestTitle, { color: theme.text }]}>{request.employeeName} – {request.type}</Text>
              <Text style={[styles.requestDate, { color: theme.textMuted }]}>{request.dateRange}</Text>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity style={[styles.actionButton, styles.approveButton]}><Check size={16} color="#4ade80" /></TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.rejectButton]}><X size={16} color="#f87171" /></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base },
  header: { marginHorizontal: -spacing.base, marginTop: -spacing.base, padding: spacing.base, paddingTop: spacing.lg, marginBottom: spacing.lg },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statusCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.xl },
  statusTitle: { fontSize: 12, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  statusLabel: { fontSize: 14 },
  statusValue: { fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md },
  menuButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 14, borderRadius: borderRadius.button, borderWidth: 1, marginBottom: spacing.sm },
  menuButtonText: { fontSize: 13, fontWeight: '600' },
  requestCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  requestInfo: { flex: 1 },
  requestTitle: { fontSize: 14, fontWeight: '600' },
  requestDate: { fontSize: 12, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  approveButton: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)' },
  rejectButton: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
});