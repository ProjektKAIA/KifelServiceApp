// app/(employee)/timetracking.tsx

import React from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Square, Coffee, MapPin, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Typography, Button } from '@/src/components/atoms';
import { Card, StatusPill } from '@/src/components/molecules';
import { ScreenHeader, StatsGrid } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { useTimeStore } from '@/src/store/timeStore';
import { spacing } from '@/src/constants/spacing';

export default function TimeTrackingScreen() {
  const { theme } = useTheme();
  const {
    isWorking,
    isOnBreak,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    todayHours,
    currentLocation,
  } = useTimeStore();

  const currentTime = format(new Date(), 'HH:mm');
  const currentDate = format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de });

  const stats = [
    { value: todayHours.toFixed(1), label: 'Stunden heute', icon: Clock },
    { value: '38.5', label: 'Diese Woche', icon: Clock },
  ];

  const handleClockIn = () => {
    clockIn();
    Alert.alert('Eingestempelt', `Sie sind um ${currentTime} eingestempelt.`);
  };

  const handleClockOut = () => {
    Alert.alert('Ausstempeln', 'Möchten Sie sich wirklich ausstempeln?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Ausstempeln',
        onPress: () => {
          clockOut();
          Alert.alert('Ausgestempelt', 'Sie sind jetzt ausgestempelt.');
        },
      },
    ]);
  };

  const handleBreakToggle = () => {
    if (isOnBreak) {
      endBreak();
    } else {
      startBreak();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="ZEITERFASSUNG" title="Stempeluhr" />

        {/* Current Time Card */}
        <Card variant="accent" accentColor="#8b5cf6" style={styles.timeCard}>
          <View style={styles.timeContent}>
            <Typography variant="h1" style={styles.bigTime}>{currentTime}</Typography>
            <Typography variant="caption" color="muted">{currentDate}</Typography>
          </View>
          <StatusPill
            status={isWorking ? (isOnBreak ? 'warning' : 'active') : 'inactive'}
            label={isWorking ? (isOnBreak ? 'Pause' : 'Aktiv') : 'Nicht eingestempelt'}
          />
        </Card>

        {/* Location */}
        {isWorking && currentLocation && (
          <Card style={styles.locationCard}>
            <View style={styles.locationRow}>
              <MapPin size={16} color={theme.textMuted} />
              <Typography variant="caption" color="muted">
                {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </Typography>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {!isWorking ? (
            <Button
              title="Einstempeln"
              icon={Play}
              onPress={handleClockIn}
              fullWidth
              style={{ backgroundColor: '#22c55e' }}
            />
          ) : (
            <>
              <Button
                title={isOnBreak ? 'Pause beenden' : 'Pause starten'}
                icon={Coffee}
                variant="secondary"
                onPress={handleBreakToggle}
                style={styles.actionButton}
              />
              <Button
                title="Ausstempeln"
                icon={Square}
                variant="danger"
                onPress={handleClockOut}
                style={styles.actionButton}
              />
            </>
          )}
        </View>

        {/* Stats */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          ÜBERSICHT
        </Typography>
        <StatsGrid stats={stats} />
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
  },
  timeCard: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  timeContent: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bigTime: {
    fontSize: 48,
    fontWeight: '700',
  },
  locationCard: {
    marginBottom: spacing.base,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
});