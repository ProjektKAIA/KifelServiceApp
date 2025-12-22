// app/(employee)/vacation.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Thermometer, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

type RequestType = 'vacation' | 'sick';
type RequestStatus = 'pending' | 'approved' | 'rejected';

interface Request {
  id: string;
  type: RequestType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: RequestStatus;
  createdAt: string;
}

export default function VacationScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [requestType, setRequestType] = useState<RequestType>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Mock-Daten
  const stats = { remainingVacation: 18, usedVacation: 12, sickDays: 3 };
  const requests: Request[] = [
    { id: '1', type: 'vacation', startDate: '2025-01-15', endDate: '2025-01-20', status: 'approved', createdAt: '2025-01-02' },
    { id: '2', type: 'sick', startDate: '2025-01-08', endDate: '2025-01-09', reason: 'Erkältung', status: 'approved', createdAt: '2025-01-08' },
    { id: '3', type: 'vacation', startDate: '2025-02-10', endDate: '2025-02-14', status: 'pending', createdAt: '2025-01-10' },
  ];

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      Alert.alert('Fehler', 'Bitte Start- und Enddatum angeben.');
      return;
    }
    Alert.alert('Erfolg', `${requestType === 'vacation' ? 'Urlaubsantrag' : 'Krankmeldung'} wurde eingereicht.`);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const getStatusConfig = (status: RequestStatus) => {
    switch (status) {
      case 'approved': return { icon: CheckCircle, color: '#4ade80', bg: 'rgba(34,197,94,0.1)', label: 'Genehmigt' };
      case 'rejected': return { icon: XCircle, color: '#f87171', bg: 'rgba(239,68,68,0.1)', label: 'Abgelehnt' };
      default: return { icon: AlertCircle, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', label: 'Ausstehend' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Abwesenheit</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Urlaub & Krankmeldung</Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Sun size={20} color="#4ade80" />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.remainingVacation}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Resturlaub</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Calendar size={20} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.usedVacation}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Genommen</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Thermometer size={20} color="#f87171" />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.sickDays}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Krankheit</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'request' && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab('request')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'request' ? '#fff' : theme.textMuted }]}>
              Neuer Antrag
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'history' ? '#fff' : theme.textMuted }]}>
              Verlauf
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'request' ? (
          <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            {/* Type Selection */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Art der Abwesenheit</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, {
                  backgroundColor: requestType === 'vacation' ? 'rgba(34,197,94,0.1)' : theme.surface,
                  borderColor: requestType === 'vacation' ? '#4ade80' : theme.border,
                }]}
                onPress={() => setRequestType('vacation')}
              >
                <Sun size={18} color={requestType === 'vacation' ? '#4ade80' : theme.textMuted} />
                <Text style={[styles.typeText, { color: requestType === 'vacation' ? '#4ade80' : theme.textMuted }]}>
                  Urlaub
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, {
                  backgroundColor: requestType === 'sick' ? 'rgba(239,68,68,0.1)' : theme.surface,
                  borderColor: requestType === 'sick' ? '#f87171' : theme.border,
                }]}
                onPress={() => setRequestType('sick')}
              >
                <Thermometer size={18} color={requestType === 'sick' ? '#f87171' : theme.textMuted} />
                <Text style={[styles.typeText, { color: requestType === 'sick' ? '#f87171' : theme.textMuted }]}>
                  Krank
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Inputs */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Zeitraum</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="TT.MM.JJJJ"
                placeholderTextColor={theme.textMuted}
                value={startDate}
                onChangeText={setStartDate}
              />
              <Text style={[styles.dateSeparator, { color: theme.textMuted }]}>bis</Text>
              <TextInput
                style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="TT.MM.JJJJ"
                placeholderTextColor={theme.textMuted}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>

            {/* Reason */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Bemerkung (optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Zusätzliche Informationen..."
              placeholderTextColor={theme.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />

            {/* Submit */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Antrag einreichen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyList}>
            {requests.map((req) => {
              const status = getStatusConfig(req.status);
              return (
                <View key={req.id} style={[styles.historyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyType}>
                      {req.type === 'vacation' ? <Sun size={16} color="#4ade80" /> : <Thermometer size={16} color="#f87171" />}
                      <Text style={[styles.historyTypeName, { color: theme.text }]}>
                        {req.type === 'vacation' ? 'Urlaub' : 'Krankmeldung'}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                      <status.icon size={12} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.historyDates, { color: theme.textSecondary }]}>
                    {req.startDate} – {req.endDate}
                  </Text>
                  {req.reason && <Text style={[styles.historyReason, { color: theme.textMuted }]}>{req.reason}</Text>}
                </View>
              );
            })}
          </View>
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
  statsCard: { flexDirection: 'row', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.lg },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, marginVertical: 8 },
  tabContainer: { flexDirection: 'row', borderRadius: borderRadius.button, padding: 4, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.button - 2, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  formCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base },
  label: { fontSize: 13, fontWeight: '500', marginBottom: spacing.sm, marginTop: spacing.md },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: borderRadius.button, borderWidth: 1 },
  typeText: { fontSize: 14, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateInput: { flex: 1, padding: 12, borderRadius: borderRadius.button, borderWidth: 1, fontSize: 14 },
  dateSeparator: { fontSize: 14 },
  textArea: { padding: 12, borderRadius: borderRadius.button, borderWidth: 1, fontSize: 14, textAlignVertical: 'top', minHeight: 80 },
  submitButton: { backgroundColor: '#3b82f6', padding: 16, borderRadius: borderRadius.button, alignItems: 'center', marginTop: spacing.lg },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historyList: { gap: spacing.md },
  historyCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  historyType: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTypeName: { fontSize: 14, fontWeight: '600' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  historyDates: { fontSize: 13 },
  historyReason: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
});