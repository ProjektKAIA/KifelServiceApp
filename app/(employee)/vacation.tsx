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
import { useRouter } from 'expo-router';
import { ArrowLeft, Sun, Thermometer, Calendar, Clock, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

type RequestType = 'vacation' | 'sick';
type RequestStatus = 'pending' | 'approved' | 'rejected';

interface Request {
  id: string;
  type: RequestType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: RequestStatus;
  createdAt: string;
}

export default function VacationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [requestType, setRequestType] = useState<RequestType>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = { totalVacation: 30, usedVacation: 12, remainingVacation: 18 };

  const requests: Request[] = [
    { id: '1', type: 'vacation', startDate: '2025-02-10', endDate: '2025-02-14', days: 5, status: 'approved', createdAt: '2025-01-05' },
    { id: '2', type: 'sick', startDate: '2025-01-08', endDate: '2025-01-09', days: 2, reason: 'Erkältung', status: 'approved', createdAt: '2025-01-08' },
    { id: '3', type: 'vacation', startDate: '2025-03-24', endDate: '2025-03-28', days: 5, status: 'pending', createdAt: '2025-01-15' },
  ];

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color="#22c55e" />;
      case 'rejected': return <XCircle size={16} color="#ef4444" />;
      default: return <AlertCircle size={16} color="#f59e0b" />;
    }
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case 'approved': return 'Genehmigt';
      case 'rejected': return 'Abgelehnt';
      default: return 'Ausstehend';
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Fehler', 'Bitte Start- und Enddatum angeben.');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    Alert.alert('Antrag gesendet', 'Ihr Antrag wurde erfolgreich eingereicht.');
    setStartDate('');
    setEndDate('');
    setReason('');
    setActiveTab('history');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Urlaub & Abwesenheit</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.statsCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalVacation}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Gesamt</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.borderLight }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.usedVacation}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Genommen</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.borderLight }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.remainingVacation}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Verbleibend</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'new' ? '#fff' : theme.textSecondary }]}>Neuer Antrag</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'history' ? '#fff' : theme.textSecondary }]}>Verlauf</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'new' ? (
          <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ART DER ABWESENHEIT</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, requestType === 'vacation' && { backgroundColor: `${theme.primary}20`, borderColor: theme.primary }]}
                onPress={() => setRequestType('vacation')}
              >
                <Sun size={20} color={requestType === 'vacation' ? theme.primary : theme.textMuted} />
                <Text style={[styles.typeButtonText, { color: requestType === 'vacation' ? theme.primary : theme.textSecondary }]}>Urlaub</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, requestType === 'sick' && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' }]}
                onPress={() => setRequestType('sick')}
              >
                <Thermometer size={20} color={requestType === 'sick' ? '#ef4444' : theme.textMuted} />
                <Text style={[styles.typeButtonText, { color: requestType === 'sick' ? '#ef4444' : theme.textSecondary }]}>Krankmeldung</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Von</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="TT.MM.JJJJ"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bis</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="TT.MM.JJJJ"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bemerkung (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={reason}
                onChangeText={setReason}
                placeholder="Zusätzliche Informationen..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Send size={18} color="#fff" />
              <Text style={styles.submitButtonText}>{isSubmitting ? 'Wird gesendet...' : 'Antrag einreichen'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {requests.map((request) => (
              <View key={request.id} style={[styles.historyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyType}>
                    {request.type === 'vacation' ? <Sun size={16} color="#f59e0b" /> : <Thermometer size={16} color="#ef4444" />}
                    <Text style={[styles.historyTypeText, { color: theme.text }]}>
                      {request.type === 'vacation' ? 'Urlaub' : 'Krankmeldung'}
                    </Text>
                  </View>
                  <View style={styles.historyStatus}>
                    {getStatusIcon(request.status)}
                    <Text style={[styles.historyStatusText, { color: theme.textSecondary }]}>{getStatusText(request.status)}</Text>
                  </View>
                </View>
                <View style={styles.historyDates}>
                  <Calendar size={14} color={theme.textMuted} />
                  <Text style={[styles.historyDatesText, { color: theme.textSecondary }]}>
                    {request.startDate} – {request.endDate} ({request.days} Tage)
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  statsCard: { flexDirection: 'row', marginHorizontal: spacing.base, borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.base, marginTop: spacing.lg, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.button, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  formCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: spacing.md },
  typeSelector: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 14, borderRadius: borderRadius.button, borderWidth: 1, borderColor: 'transparent' },
  typeButtonText: { fontSize: 14, fontWeight: '500' },
  row: { flexDirection: 'row', gap: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: spacing.sm },
  input: { borderRadius: borderRadius.button, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15 },
  textArea: { height: 80, paddingTop: 14 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#3b82f6', padding: 16, borderRadius: borderRadius.button, marginTop: spacing.sm },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  historyCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.sm },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  historyType: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyTypeText: { fontSize: 14, fontWeight: '600' },
  historyStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatusText: { fontSize: 12 },
  historyDates: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyDatesText: { fontSize: 13 },
});