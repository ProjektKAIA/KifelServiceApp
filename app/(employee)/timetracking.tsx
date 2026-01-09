// app/(employee)/timetracking.tsx

import React, { useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Square, Coffee, MapPin, Clock, AlertCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Typography, Button, LoadingSpinner } from '@/src/components/atoms';
import { Card, StatusPill } from '@/src/components/molecules';
import { ScreenHeader, StatsGrid } from '@/src/components/organisms';

import { useTheme, useLocation } from '@/src/hooks';
import { useTimeStore } from '@/src/store/timeStore';
import { useAuthStore } from '@/src/store/authStore';
import { spacing } from '@/src/constants/spacing';
import { isFeatureEnabled } from '@/src/config/features';

export default function TimeTrackingScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
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

  const {
    location,
    permissionStatus,
    isLoading: isLocationLoading,
    error: locationError,
    requestPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
  } = useLocation();

  const gpsEnabled = isFeatureEnabled('gpsTracking');

  const currentTime = format(new Date(), 'HH:mm');
  const currentDate = format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de });

  const stats = [
    { value: todayHours.toFixed(1), label: 'Stunden heute', icon: Clock },
    { value: '38.5', label: 'Diese Woche', icon: Clock },
  ];

  // Start/stop GPS tracking when working status changes
  useEffect(() => {
    if (isWorking && gpsEnabled) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [isWorking, gpsEnabled, startTracking, stopTracking]);

  const handleClockIn = async () => {
    // Request GPS permission if enabled
    if (gpsEnabled) {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        Alert.alert(
          'Standort-Berechtigung',
          'Für die Zeiterfassung wird der Standort benötigt. Bitte aktivieren Sie die Standort-Berechtigung in den Einstellungen.',
          [
            { text: 'Trotzdem fortfahren', onPress: () => performClockIn(null) },
            { text: 'Abbrechen', style: 'cancel' },
          ]
        );
        return;
      }

      const loc = await getCurrentLocation();
      performClockIn(loc);
    } else {
      performClockIn(null);
    }
  };

  const performClockIn = (loc: typeof location) => {
    clockIn(user?.id, loc || undefined);
    Alert.alert('Eingestempelt', `Sie sind um ${currentTime} eingestempelt.`);
  };

  const handleClockOut = async () => {
    Alert.alert('Ausstempeln', 'Möchten Sie sich wirklich ausstempeln?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Ausstempeln',
        onPress: async () => {
          let loc = null;
          if (gpsEnabled && permissionStatus === 'granted') {
            loc = await getCurrentLocation();
          }
          clockOut(loc || undefined);
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
        <Card variant="accent" accentColor={theme.secondary} style={styles.timeCard}>
          <View style={styles.timeContent}>
            <Typography variant="h1" style={styles.bigTime}>{currentTime}</Typography>
            <Typography variant="caption" color="muted">{currentDate}</Typography>
          </View>
          <StatusPill
            status={isWorking ? (isOnBreak ? 'warning' : 'active') : 'inactive'}
            label={isWorking ? (isOnBreak ? 'Pause' : 'Aktiv') : 'Nicht eingestempelt'}
          />
        </Card>

        {/* Location Error */}
        {locationError && (
          <Card style={styles.errorCard}>
            <View style={styles.locationRow}>
              <AlertCircle size={16} color={theme.danger} />
              <Typography variant="caption" color="error">
                {locationError}
              </Typography>
            </View>
          </Card>
        )}

        {/* Location Loading */}
        {isLocationLoading && (
          <Card style={styles.locationCard}>
            <View style={styles.locationRow}>
              <LoadingSpinner size="small" />
              <Typography variant="caption" color="muted">
                Standort wird ermittelt...
              </Typography>
            </View>
          </Card>
        )}

        {/* Location */}
        {isWorking && currentLocation && !isLocationLoading && (
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
              title={isLocationLoading ? 'Standort wird ermittelt...' : 'Einstempeln'}
              icon={Play}
              onPress={handleClockIn}
              fullWidth
              disabled={isLocationLoading}
              style={{ backgroundColor: theme.success }}
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
  errorCard: {
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