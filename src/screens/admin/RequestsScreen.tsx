// src/screens/admin/RequestsScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X, Sun, AlertCircle, Filter } from 'lucide-react-native';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

type RequestStatus = 'pending' | 'approved' | 'rejected';
type RequestType = 'vacation' | 'sick' | 'all';

interface Request {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick';
  startDate: string;
  endDate: string;
  days: number;
  status: RequestStatus;
  reason?: string;
  createdAt: string;
}

const mockRequests: Request[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'Max Mustermann',
    type: 'vacation',
    startDate: '2025-01-15',
    endDate: '2025-01-17',
    days: 3,
    status: 'pending',
    createdAt: '2024-12-10',
  },
  {
    id: '2',
    employeeId: '2',
    employeeName: 'Sandra Koch',
    type: 'vacation',
    startDate: '2025-01-20',
    endDate: '2025-01-22',
    days: 3,
    status: 'pending',
    createdAt: '2024-12-11',
  },
  {
    id: '3',
    employeeId: '3',
    employeeName: 'Thomas Müller',
    type: 'sick',
    startDate: '2024-12-12',
    endDate: '2024-12-12',
    days: 1,
    status: 'pending',
    reason: 'Erkältung',
    createdAt: '2024-12-12',
  },
  {
    id: '4',
    employeeId: '1',
    employeeName: 'Max Mustermann',
    type: 'vacation',
    startDate: '2024-12-23',
    endDate: '2024-12-27',
    days: 5,
    status: 'approved',
    createdAt: '2024-12-01',
  },
];

export default function RequestsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const [filter, setFilter] = useState<RequestType>('all');
  const [requests, setRequests] = useState(mockRequests);

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.type === filter;
  });

  const pendingRequests = filteredRequests.filter((r) => r.status === 'pending');
  const processedRequests = filteredRequests.filter((r) => r.status !== 'pending');

  const handleApprove = (id: string) => {
    Alert.alert(
      'Antrag genehmigen',
      'Möchten Sie diesen Antrag genehmigen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Genehmigen',
          onPress: () => {
            setRequests((prev) =>
              prev.map((r) => (r.id === id ? { ...r, status: 'approved' as RequestStatus } : r))
            );
          },
        },
      ]
    );
  };

  const handleReject = (id: string) => {
    Alert.alert(
      'Antrag ablehnen',
      'Möchten Sie diesen Antrag ablehnen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Ablehnen',
          style: 'destructive',
          onPress: () => {
            setRequests((prev) =>
              prev.map((r) => (r.id === id ? { ...r, status: 'rejected' as RequestStatus } : r))
            );
          },
        },
      ]
    );
  };

  const getStatusPill = (status: RequestStatus) => {
    switch (status) {
      case 'approved':
        return { bg: theme.pillSuccess, text: theme.pillSuccessText, label: 'Genehmigt' };
      case 'rejected':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', label: 'Abgelehnt' };
      default:
        return { bg: theme.pillWarning, text: theme.pillWarningText, label: 'Ausstehend' };
    }
  };

  const renderRequest = (request: Request, showActions: boolean) => {
    const status = getStatusPill(request.status);
    const isSingleDay = request.startDate === request.endDate;

    return (
      <View
        key={request.id}
        style={[styles.requestCard, {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        }]}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestType}>
            {request.type === 'vacation' ? (
              <Sun size={16} color={theme.primary} />
            ) : (
              <AlertCircle size={16} color="#f87171" />
            )}
            <Text style={[styles.requestTypeName, { color: theme.text }]}>
              {request.type === 'vacation' ? 'Urlaub' : 'Krankmeldung'}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.text }]} />
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        <Text style={[styles.employeeName, { color: theme.text }]}>
          {request.employeeName}
        </Text>
        <Text style={[styles.requestDate, { color: theme.textMuted }]}>
          {isSingleDay
            ? format(new Date(request.startDate), 'dd.MM.yyyy')
            : `${format(new Date(request.startDate), 'dd.MM.')} – ${format(new Date(request.endDate), 'dd.MM.yyyy')}`}
          {' · '}{request.days} {request.days === 1 ? 'Tag' : 'Tage'}
        </Text>
        {request.reason && (
          <Text style={[styles.requestReason, { color: theme.textMuted }]}>
            Grund: {request.reason}
          </Text>
        )}

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(request.id)}
            >
              <Check size={16} color="#4ade80" />
              <Text style={styles.approveText}>Genehmigen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(request.id)}
            >
              <X size={16} color="#f87171" />
              <Text style={styles.rejectText}>Ablehnen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Verwaltung</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Anträge</Text>
        </View>

        {/* Filter */}
        <View style={styles.filterRow}>
          {(['all', 'vacation', 'sick'] as RequestType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === type ? theme.primary : theme.surface,
                  borderColor: filter === type ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setFilter(type)}
            >
              <Text style={[styles.filterText, { color: filter === type ? '#fff' : theme.textSecondary }]}>
                {type === 'all' ? 'Alle' : type === 'vacation' ? 'Urlaub' : 'Krank'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending */}
        {pendingRequests.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
              AUSSTEHEND ({pendingRequests.length})
            </Text>
            {pendingRequests.map((r) => renderRequest(r, true))}
          </>
        )}

        {/* Processed */}
        {processedRequests.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>BEARBEITET</Text>
            {processedRequests.map((r) => renderRequest(r, false))}
          </>
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
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md },
  requestCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  requestType: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  requestTypeName: { fontSize: 12, fontWeight: '600' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  employeeName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  requestDate: { fontSize: 13 },
  requestReason: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: borderRadius.button, borderWidth: 1 },
  approveButton: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  rejectButton: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  approveText: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
  rejectText: { color: '#f87171', fontSize: 13, fontWeight: '600' },
});