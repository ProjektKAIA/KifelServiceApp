// app/(employee)/vacation.tsx

import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palmtree, Thermometer, Calendar, Clock } from 'lucide-react-native';

import { Typography, Button } from '@/src/components/atoms';
import { Card, Modal } from '@/src/components/molecules';
import { ScreenHeader, StatsGrid } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

export default function VacationScreen() {
  const { theme } = useTheme();
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showSickModal, setShowSickModal] = useState(false);

  const stats = [
    { value: 24, label: 'Urlaubstage\ngesamt', icon: Calendar },
    { value: 12, label: 'Verbleibend', icon: Clock, accentColor: '#22c55e' },
  ];

  const handleVacationRequest = () => {
    setShowVacationModal(false);
    Alert.alert('Info', 'Urlaubsanträge werden in einer zukünftigen Version verfügbar sein.');
  };

  const handleSickReport = () => {
    setShowSickModal(false);
    Alert.alert('Info', 'Krankmeldungen werden in einer zukünftigen Version verfügbar sein.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="ABWESENHEIT" title="Urlaub & Krankmeldung" />

        {/* Stats */}
        <Card variant="accent" accentColor="#8b5cf6" style={styles.statsCard}>
          <StatsGrid stats={stats} />
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            title="Urlaub beantragen"
            icon={Palmtree}
            variant="secondary"
            onPress={() => setShowVacationModal(true)}
            style={styles.actionButton}
          />
          <Button
            title="Krank melden"
            icon={Thermometer}
            variant="secondary"
            onPress={() => setShowSickModal(true)}
            style={styles.actionButton}
          />
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Typography variant="label">Hinweis</Typography>
          <Typography variant="caption" color="muted" style={styles.infoText}>
            Urlaubsanträge müssen mindestens 2 Wochen im Voraus gestellt werden.
            Krankmeldungen bitte zusätzlich telefonisch mitteilen.
          </Typography>
        </Card>
      </ScrollView>

      {/* Vacation Modal */}
      <Modal visible={showVacationModal} onClose={() => setShowVacationModal(false)} title="Urlaub beantragen">
        <Typography variant="body" color="muted" style={styles.modalText}>
          Urlaubsanträge werden in einer zukünftigen Version verfügbar sein.
        </Typography>
        <Button title="Verstanden" onPress={handleVacationRequest} fullWidth />
      </Modal>

      {/* Sick Modal */}
      <Modal visible={showSickModal} onClose={() => setShowSickModal(false)} title="Krankmeldung">
        <Typography variant="body" color="muted" style={styles.modalText}>
          Krankmeldungen werden in einer zukünftigen Version verfügbar sein.
        </Typography>
        <Button title="Verstanden" variant="danger" onPress={handleSickReport} fullWidth />
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
  statsCard: {
    marginBottom: spacing.base,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  infoCard: {
    marginTop: spacing.md,
  },
  infoText: {
    marginTop: 4,
    lineHeight: 20,
  },
  modalText: {
    marginBottom: spacing.lg,
  },
});