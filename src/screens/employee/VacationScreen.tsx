// src/screens/employee/VacationScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, AlertCircle, Calendar, X } from 'lucide-react-native';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

// Mock-Daten
const mockAbsences = [
  { 
    id: '1',
    type: 'vacation',
    startDate: '2024-12-23',
    endDate: '2024-12-27',
    days: 5,
    status: 'approved',
  },
  { 
    id: '2',
    type: 'sick',
    startDate: '2024-11-05',
    endDate: '2024-11-05',
    days: 1,
    status: 'approved',
  },
  { 
    id: '3',
    type: 'vacation',
    startDate: '2025-01-15',
    endDate: '2025-01-17',
    days: 3,
    status: 'pending',
  },
];

const vacationStats = {
  remaining: 18,
  taken: 12,
  total: 30,
};

export default function VacationScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showSickModal, setShowSickModal] = useState(false);

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: theme.pillSuccess, text: theme.pillSuccessText, label: 'Genehmigt' };
      case 'pending':
        return { bg: theme.pillWarning, text: theme.pillWarningText, label: 'Ausstehend' };
      case 'rejected':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', label: 'Abgelehnt' };
      default:
        return { bg: theme.pillInfo, text: theme.pillInfoText, label: 'Bestätigt' };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation':
        return 'Urlaub';
      case 'sick':
        return 'Krankmeldung';
      default:
        return 'Abwesenheit';
    }
  };

  const handleVacationRequest = () => {
    // TODO: Implementiere Urlaubs-Anfrage
    Alert.alert(
      'Urlaubsantrag',
      'Urlaubsanträge werden in einer zukünftigen Version verfügbar sein.',
      [{ text: 'OK' }]
    );
    setShowVacationModal(false);
  };

  const handleSickReport = () => {
    // TODO: Implementiere Krankmeldung
    Alert.alert(
      'Krankmeldung',
      'Krankmeldungen werden in einer zukünftigen Version verfügbar sein.',
      [{ text: 'OK' }]
    );
    setShowSickModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
            Verwalten
          </Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>
            Urlaub & Krankheit
          </Text>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, {
          backgroundColor: 'rgba(14, 165, 233, 0.12)',
          borderColor: 'rgba(14, 165, 233, 0.2)',
        }]}>
          <View style={styles.statRow}>
            <View>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                Resturlaub 2024
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {vacationStats.remaining} Tage
              </Text>
            </View>
            <View style={styles.statRight}>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                Genommen
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {vacationStats.taken}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.vacationButton}
            onPress={() => setShowVacationModal(true)}
            activeOpacity={0.8}
          >
            <Sun size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Urlaub</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sickButton, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
            onPress={() => setShowSickModal(true)}
            activeOpacity={0.8}
          >
            <AlertCircle size={16} color="#f87171" />
            <Text style={[styles.actionButtonText, { color: '#f87171' }]}>Krank</Text>
          </TouchableOpacity>
        </View>

        {/* Requests List */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
          MEINE ANTRÄGE
        </Text>

        {mockAbsences.map((absence) => {
          const status = getStatusPill(absence.status);
          const startDate = new Date(absence.startDate);
          const endDate = new Date(absence.endDate);
          const isSingleDay = absence.startDate === absence.endDate;

          return (
            <View
              key={absence.id}
              style={[styles.absenceCard, {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
              }]}
            >
              <View style={styles.absenceInfo}>
                <Text style={[styles.absenceDate, { color: theme.text }]}>
                  {isSingleDay 
                    ? format(startDate, 'dd.MM.yyyy')
                    : `${format(startDate, 'dd.MM.')} – ${format(endDate, 'dd.MM.yyyy')}`
                  }
                </Text>
                <Text style={[styles.absenceType, { color: theme.textMuted }]}>
                  {getTypeLabel(absence.type)} · {absence.days} {absence.days === 1 ? 'Tag' : 'Tage'}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: status.text }]} />
                <Text style={[styles.statusText, { color: status.text }]}>
                  {status.label}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Vacation Modal */}
      <Modal
        visible={showVacationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVacationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Urlaub beantragen
              </Text>
              <TouchableOpacity onPress={() => setShowVacationModal(false)}>
                <X size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalText, { color: theme.textMuted }]}>
              Urlaubsanträge werden in einer zukünftigen Version verfügbar sein.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleVacationRequest}
            >
              <Text style={styles.modalButtonText}>Verstanden</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sick Modal */}
      <Modal
        visible={showSickModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSickModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Krankmeldung
              </Text>
              <TouchableOpacity onPress={() => setShowSickModal(false)}>
                <X size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalText, { color: theme.textMuted }]}>
              Krankmeldungen werden in einer zukünftigen Version verfügbar sein.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#ef4444' }]}
              onPress={handleSickReport}
            >
              <Text style={styles.modalButtonText}>Verstanden</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    marginBottom: spacing.xl,
  },
  headerSmall: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerLarge: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statsCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  vacationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.button,
    backgroundColor: '#3b82f6',
  },
  sickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.button,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  absenceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  absenceInfo: {
    flex: 1,
  },
  absenceDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  absenceType: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalButton: {
    padding: 14,
    borderRadius: borderRadius.button,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});