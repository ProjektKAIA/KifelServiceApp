// app/(employee)/vacation.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, AlertCircle } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';

interface Request {
  id: string;
  type: 'vacation' | 'sick';
  startDate: string;
  endDate: string;
  days: number;
  status: 'approved' | 'pending' | 'confirmed';
  label: string;
}

const mockRequests: Request[] = [
  { id: '1', type: 'vacation', startDate: '23.12.', endDate: '27.12.2024', days: 5, status: 'approved', label: 'Urlaub' },
  { id: '2', type: 'sick', startDate: '05.11.2024', endDate: '', days: 1, status: 'confirmed', label: 'Krankmeldung' },
  { id: '3', type: 'vacation', startDate: '15.01.', endDate: '17.01.2025', days: 3, status: 'pending', label: 'Urlaub' },
];

export default function VacationScreen() {
  const { theme } = useTheme();

  const getStatusStyle = (status: Request['status']) => {
    switch (status) {
      case 'approved':
        return { bg: theme.pillSuccess, text: theme.pillSuccessText, label: 'Genehmigt' };
      case 'confirmed':
        return { bg: theme.pillInfo, text: theme.pillInfoText, label: 'Bestätigt' };
      case 'pending':
        return { bg: theme.pillWarning, text: theme.pillWarningText, label: 'Ausstehend' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>ABWESENHEIT</Text>
        </View>

        {/* Header */}
        <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Verwalten</Text>
        <Text style={[styles.headerLarge, { color: theme.text }]}>Urlaub & Krankheit</Text>

        {/* Vacation Balance Card */}
        <View style={[styles.balanceCard, { 
          backgroundColor: 'rgba(59,130,246,0.1)', 
          borderColor: 'rgba(99,102,241,0.2)' 
        }]}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>Resturlaub 2024</Text>
              <Text style={[styles.balanceValue, { color: theme.primary }]}>18 Tage</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>Genommen</Text>
              <Text style={[styles.balanceValue, { color: theme.text }]}>12</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Sun size={18} color="#fff" />
            <Text style={styles.actionButtonTextWhite}>Urlaub</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}
            activeOpacity={0.7}
          >
            <AlertCircle size={18} color="#ef4444" />
            <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Krank</Text>
          </TouchableOpacity>
        </View>

        {/* Requests */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>MEINE ANTRÄGE</Text>

        {mockRequests.map((request) => {
          const statusStyle = getStatusStyle(request.status);

          return (
            <View
              key={request.id}
              style={[styles.requestCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            >
              <View style={styles.requestInfo}>
                <Text style={[styles.requestDate, { color: theme.text }]}>
                  {request.endDate ? `${request.startDate} – ${request.endDate}` : request.startDate}
                </Text>
                <Text style={[styles.requestType, { color: theme.textMuted }]}>
                  {request.label} · {request.days} {request.days === 1 ? 'Tag' : 'Tage'}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
              </View>
            </View>
          );
        })}
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
  balanceCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  balanceRow: {
    flexDirection: 'row',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: borderRadius.card,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonTextWhite: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
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
  requestDate: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestType: {
    fontSize: 13,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});