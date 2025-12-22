// app/(admin)/requests.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Thermometer, Check, X, Calendar, Clock, User } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

type RequestType = 'vacation' | 'sick';
type RequestStatus = 'pending' | 'approved' | 'rejected';

interface Request {
  id: string;
  employeeId: string;
  employeeName: string;
  type: RequestType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: RequestStatus;
  createdAt: string;
}

export default function RequestsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [requests, setRequests] = useState<Request[]>([
    { id: '1', employeeId: '1', employeeName: 'Max Müller', type: 'vacation', startDate: '2025-02-10', endDate: '2025-02-14', days: 5, status: 'pending', createdAt: '2025-01-15' },
    { id: '2', employeeId: '2', employeeName: 'Anna Schmidt', type: 'vacation', startDate: '2025-02-20', endDate: '2025-02-21', days: 2, status: 'pending', createdAt: '2025-01-16' },
    { id: '3', employeeId: '3', employeeName: 'Tom Weber', type: 'sick', startDate: '2025-01-18', endDate: '2025-01-19', days: 2, reason: 'Arzttermin', status: 'pending', createdAt: '2025-01-18' },
    { id: '4', employeeId: '4', employeeName: 'Lisa Klein', type: 'vacation', startDate: '2025-01-05', endDate: '2025-01-08', days: 4, status: 'approved', createdAt: '2024-12-20' },
    { id: '5', employeeId: '1', employeeName: 'Max Müller', type: 'sick', startDate: '2025-01-02', endDate: '2025-01-03', days: 2, reason: 'Erkältung', status: 'approved', createdAt: '2025-01-02' },
  ]);

  const filteredRequests = filter === 'pending'
    ? requests.filter(r => r.status === 'pending')
    : requests;

  const handleApprove = (id: string) => {
    Alert.alert('Genehmigen', 'Antrag wirklich genehmigen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Genehmigen',
        onPress: () => {
          setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
        },
      },
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Ablehnen', 'Antrag wirklich ablehnen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Ablehnen',
        style: 'destructive',
        onPress: () => {
          setRequests(requests.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
        },
      },
    ]);
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Verwaltung</Text>
        <Text style={[styles.headerLarge, { color: theme.text }]}>Anträge</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'pending' && { backgroundColor: '#f59e0b' }]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.tabText, { color: filter === 'pending' ? '#fff' : theme.textSecondary }]}>
            Offen ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'all' && { backgroundColor: theme.primary }]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.tabText, { color: filter === 'all' ? '#fff' : theme.textSecondary }]}>Alle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredRequests.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.borderLight }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Keine offenen Anträge</Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <View key={request.id} style={[styles.requestCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <View style={styles.requestHeader}>
                <View style={styles.employeeInfo}>
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>{getInitials(request.employeeName)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.employeeName, { color: theme.text }]}>{request.employeeName}</Text>
                    <View style={styles.requestType}>
                      {request.type === 'vacation' ? (
                        <Sun size={12} color="#f59e0b" />
                      ) : (
                        <Thermometer size={12} color="#ef4444" />
                      )}
                      <Text style={[styles.requestTypeText, { color: theme.textMuted }]}>
                        {request.type === 'vacation' ? 'Urlaubsantrag' : 'Krankmeldung'}
                      </Text>
                    </View>
                  </View>
                </View>

                {request.status === 'pending' ? (
                  <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Offen</Text>
                  </View>
                ) : request.status === 'approved' ? (
                  <View style={[styles.badge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#22c55e' }]}>Genehmigt</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#ef4444' }]}>Abgelehnt</Text>
                  </View>
                )}
              </View>

              <View style={[styles.requestDetails, { borderTopColor: theme.borderLight }]}>
                <View style={styles.detailRow}>
                  <Calendar size={14} color={theme.textMuted} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    {request.startDate} – {request.endDate} ({request.days} Tage)
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={14} color={theme.textMuted} />
                  <Text style={[styles.detailText, { color: theme.textMuted }]}>
                    Beantragt am {request.createdAt}
                  </Text>
                </View>
                {request.reason && (
                  <Text style={[styles.reasonText, { color: theme.textSecondary }]}>
                    "{request.reason}"
                  </Text>
                )}
              </View>

              {request.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(request.id)}
                  >
                    <X size={18} color="#ef4444" />
                    <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Ablehnen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(request.id)}
                  >
                    <Check size={18} color="#fff" />
                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>Genehmigen</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.md, marginBottom: spacing.md },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.button, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  emptyState: { borderWidth: 1, borderStyle: 'dashed', borderRadius: borderRadius.card, padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  requestCard: { borderRadius: borderRadius.card, borderWidth: 1, marginBottom: spacing.md, overflow: 'hidden' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.base },
  employeeInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  employeeName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  requestType: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  requestTypeText: { fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  requestDetails: { padding: spacing.base, borderTopWidth: 1, gap: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: 13 },
  reasonText: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base, paddingTop: 0 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 12, borderRadius: borderRadius.button },
  rejectButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  approveButton: { backgroundColor: '#22c55e' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
});