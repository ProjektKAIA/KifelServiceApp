// app/(employee)/timetracking.tsx

import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, StyleSheet, Alert, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Square, Coffee, MapPin, Clock, AlertCircle, Pause, Timer } from 'lucide-react-native';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Typography, Button, LoadingSpinner } from '@/src/components/atoms';
import { Card, StatusPill, LocationPermissionModal } from '@/src/components/molecules';
import { ScreenHeader, StatsGrid } from '@/src/components/organisms';

import { useTheme, useLocation } from '@/src/hooks';
import { useTimeStore } from '@/src/store/timeStore';
import { useAuthStore } from '@/src/store/authStore';
import { spacing } from '@/src/constants/spacing';
import { isFeatureEnabled } from '@/src/config/features';
import { useOfflineSync } from '@/src/hooks/useOfflineSync';
import { timeEntriesCollection } from '@/src/lib/firestore';

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
    currentEntry,
    updateElapsedTime,
    elapsedSeconds,
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
    // Background-Location (DSGVO-konform)
    startBackgroundTracking,
    stopBackgroundTracking,
  } = useLocation();

  const { isOnline, addToQueue } = useOfflineSync();

  const gpsEnabled = isFeatureEnabled('gpsTracking');
  const offlineModeEnabled = isFeatureEnabled('offlineMode');

  // Permission modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Timer for elapsed time display
  const [displayTime, setDisplayTime] = useState('00:00:00');
  const [breakTime, setBreakTime] = useState('00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTime = format(new Date(), 'HH:mm');
  const currentDate = format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de });

  // Format seconds to HH:MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format minutes to MM:SS
  const formatBreakTime = (totalMinutes: number, currentBreakStart: number | null): string => {
    let totalSeconds = totalMinutes * 60;
    if (currentBreakStart) {
      totalSeconds += Math.floor((Date.now() - currentBreakStart) / 1000);
    }
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update timer every second when working
  useEffect(() => {
    if (isWorking) {
      timerRef.current = setInterval(() => {
        updateElapsedTime();

        // Update break time display
        if (currentEntry) {
          setBreakTime(formatBreakTime(currentEntry.breakMinutes, currentEntry.breakStart));
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isWorking, currentEntry]);

  // Update display time when elapsed seconds change
  useEffect(() => {
    setDisplayTime(formatElapsedTime(elapsedSeconds));
  }, [elapsedSeconds]);

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
    // Check if GPS is enabled and permission is needed
    if (gpsEnabled && permissionStatus !== 'granted') {
      // Show our custom permission modal first
      setShowPermissionModal(true);
      return;
    }

    // Permission already granted or GPS disabled - proceed
    await proceedWithClockIn();
  };

  const handlePermissionAllow = async () => {
    setShowPermissionModal(false);
    const hasPermission = await requestPermission();

    if (hasPermission) {
      await proceedWithClockIn();
    } else {
      // System permission denied - offer to continue without location
      Alert.alert(
        'Standort-Berechtigung verweigert',
        'Sie können trotzdem einstempeln, aber ohne Standorterfassung.',
        [
          { text: 'Ohne Standort fortfahren', onPress: () => performClockIn(null) },
          { text: 'Abbrechen', style: 'cancel' },
        ]
      );
    }
  };

  const handlePermissionDeny = () => {
    setShowPermissionModal(false);
    // User declined in our modal - offer to continue without location
    Alert.alert(
      'Ohne Standort fortfahren?',
      'Sie können trotzdem einstempeln, aber ohne Standorterfassung.',
      [
        { text: 'Ohne Standort fortfahren', onPress: () => performClockIn(null) },
        { text: 'Abbrechen', style: 'cancel' },
      ]
    );
  };

  const proceedWithClockIn = async () => {
    if (gpsEnabled && permissionStatus === 'granted') {
      const loc = await getCurrentLocation();
      performClockIn(loc);
    } else {
      performClockIn(null);
    }
  };

  const performClockIn = async (loc: typeof location) => {
    // Lokalen Eintrag erstellen
    clockIn(user?.id, loc || undefined);

    // Background-GPS-Tracking starten (DSGVO: nur waehrend Arbeitszeit)
    if (gpsEnabled) {
      const bgStarted = await startBackgroundTracking();
      if (bgStarted) {
        console.log('[TimeTracking] Background-GPS gestartet');
      }
    }

    // Firestore-Sync (online oder Queue)
    if (offlineModeEnabled) {
      const localEntryId = useTimeStore.getState().getCurrentEntryLocalId();
      const locationData = loc ? {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.address,
      } : undefined;

      if (isOnline) {
        // Online: Direkt zu Firestore
        try {
          const firestoreId = await timeEntriesCollection.clockIn(user?.id || 'default-user', locationData);
          // Firestore-ID speichern fuer spaetere Updates
          if (localEntryId && firestoreId) {
            useTimeStore.getState().setFirestoreEntryId(localEntryId, firestoreId);
          }
        } catch (error) {
          console.error('[TimeTracking] Firestore clockIn fehlgeschlagen, nutze Queue:', error);
          // Bei Fehler zur Queue hinzufuegen
          await addToQueue('clockIn', {
            userId: user?.id || 'default-user',
            location: locationData,
          }, undefined, localEntryId || undefined);
        }
      } else {
        // Offline: Zur Queue hinzufuegen
        await addToQueue('clockIn', {
          userId: user?.id || 'default-user',
          location: locationData,
        }, undefined, localEntryId || undefined);
      }
    }

    Alert.alert('Arbeitsbeginn', `Arbeit gestartet um ${currentTime} Uhr.`);
  };

  const handleClockOut = async () => {
    Alert.alert('Arbeit beenden', 'Möchten Sie die Arbeit wirklich beenden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Beenden',
        style: 'destructive',
        onPress: async () => {
          // Firestore-ID vor clockOut holen (wird danach geloescht)
          const firestoreEntryId = currentEntry?.firestoreEntryId;
          const localEntryId = currentEntry?.id;

          // Finale Location holen
          let loc = null;
          if (gpsEnabled && permissionStatus === 'granted') {
            loc = await getCurrentLocation();
          }

          // Background-GPS-Tracking stoppen (DSGVO: sofort bei Arbeitsende)
          await stopBackgroundTracking();
          console.log('[TimeTracking] Background-GPS gestoppt');

          // Lokalen Eintrag beenden
          clockOut(loc || undefined);

          // Firestore-Sync (online oder Queue)
          if (offlineModeEnabled) {
            const locationData = loc ? {
              latitude: loc.latitude,
              longitude: loc.longitude,
              address: loc.address,
            } : undefined;

            if (isOnline && firestoreEntryId) {
              // Online und Firestore-ID vorhanden: Direkt updaten
              try {
                await timeEntriesCollection.clockOut(firestoreEntryId, locationData);
              } catch (error) {
                console.error('[TimeTracking] Firestore clockOut fehlgeschlagen, nutze Queue:', error);
                await addToQueue('clockOut', { location: locationData }, firestoreEntryId);
              }
            } else if (firestoreEntryId) {
              // Offline aber Firestore-ID vorhanden: Queue mit ID
              await addToQueue('clockOut', { location: locationData }, firestoreEntryId);
            } else if (localEntryId) {
              // Keine Firestore-ID: Queue mit lokaler ID (wird spaeter gemappt)
              await addToQueue('clockOut', { location: locationData }, undefined, localEntryId);
            }
          }

          Alert.alert('Arbeitszeit erfasst', `Arbeit beendet um ${format(new Date(), 'HH:mm')} Uhr.`);
        },
      },
    ]);
  };

  const handleStartBreak = () => {
    startBreak();
    Alert.alert('Pause', `Pause gestartet um ${format(new Date(), 'HH:mm')} Uhr.`);
  };

  const handleEndBreak = () => {
    endBreak();
    Alert.alert('Pause beendet', `Pause beendet um ${format(new Date(), 'HH:mm')} Uhr.`);
  };

  // Get start time for display
  const getStartTimeDisplay = (): string => {
    if (currentEntry?.clockIn) {
      return format(new Date(currentEntry.clockIn), 'HH:mm');
    }
    return '--:--';
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
            label={isWorking ? (isOnBreak ? 'In Pause' : 'Arbeitet') : 'Nicht aktiv'}
          />
        </Card>

        {/* Working Status Display - Show when working */}
        {isWorking && (
          <Card style={styles.workingCard}>
            <View style={styles.workingHeader}>
              <View style={[styles.statusDot, { backgroundColor: isOnBreak ? theme.warning : theme.success }]} />
              <Typography variant="label" style={{ color: theme.text }}>
                {isOnBreak ? 'Pause läuft' : 'Arbeit läuft'}
              </Typography>
            </View>

            <View style={styles.timeDisplayRow}>
              {/* Arbeitszeit */}
              <View style={styles.timeDisplayItem}>
                <View style={styles.timeDisplayIcon}>
                  <Timer size={20} color={theme.success} />
                </View>
                <Text style={[styles.timerText, { color: theme.text }]}>{displayTime}</Text>
                <Typography variant="caption" color="muted">Arbeitszeit</Typography>
              </View>

              {/* Startzeit */}
              <View style={styles.timeDisplayItem}>
                <View style={styles.timeDisplayIcon}>
                  <Play size={20} color={theme.primary} />
                </View>
                <Text style={[styles.timerText, { color: theme.text }]}>{getStartTimeDisplay()}</Text>
                <Typography variant="caption" color="muted">Gestartet</Typography>
              </View>

              {/* Pausenzeit */}
              <View style={styles.timeDisplayItem}>
                <View style={styles.timeDisplayIcon}>
                  <Coffee size={20} color={theme.warning} />
                </View>
                <Text style={[styles.timerText, { color: isOnBreak ? theme.warning : theme.text }]}>{breakTime}</Text>
                <Typography variant="caption" color="muted">Pause</Typography>
              </View>
            </View>
          </Card>
        )}

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

        {/* Action Buttons - State-based flow */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          AKTIONEN
        </Typography>

        {/* State: Not Working - Show Arbeitsbeginn */}
        {!isWorking && (
          <View style={styles.actionContainer}>
            <Button
              title={isLocationLoading ? 'Standort wird ermittelt...' : 'Arbeitsbeginn'}
              icon={Play}
              onPress={handleClockIn}
              fullWidth
              disabled={isLocationLoading}
              style={{ ...styles.primaryActionButton, backgroundColor: theme.success }}
            />
            <Typography variant="caption" color="muted" style={styles.actionHint}>
              Tippen Sie, um Ihre Arbeitszeit zu starten
            </Typography>
          </View>
        )}

        {/* State: Working but not on break - Show Beenden & Pause */}
        {isWorking === true && isOnBreak !== true && (
          <View style={styles.actionContainer}>
            <Button
              title="Arbeitsende"
              icon={Square}
              variant="danger"
              onPress={handleClockOut}
              fullWidth
              style={styles.primaryActionButton}
            />
            <Button
              title="Pause"
              icon={Coffee}
              onPress={handleStartBreak}
              fullWidth
              style={{ ...styles.secondaryActionButton, backgroundColor: theme.warning }}
            />
          </View>
        )}

        {/* State: On Break - Show Pause beenden & Beenden */}
        {isWorking && isOnBreak && (
          <View style={styles.actionContainer}>
            <Button
              title="Pause beenden"
              icon={Play}
              onPress={handleEndBreak}
              fullWidth
              style={{ ...styles.primaryActionButton, backgroundColor: theme.success }}
            />
            <Button
              title="Arbeit beenden"
              icon={Square}
              variant="danger"
              onPress={handleClockOut}
              fullWidth
              style={styles.secondaryActionButton}
            />
            <Typography variant="caption" color="muted" style={styles.actionHint}>
              Pause beenden und weiterarbeiten
            </Typography>
          </View>
        )}

        {/* Stats */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          ÜBERSICHT
        </Typography>
        <StatsGrid stats={stats} />
      </ScrollView>

      {/* GPS Permission Modal */}
      <LocationPermissionModal
        visible={showPermissionModal}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
        onClose={() => setShowPermissionModal(false)}
      />
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
  workingCard: {
    marginBottom: spacing.base,
    padding: spacing.base,
  },
  workingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeDisplayItem: {
    alignItems: 'center',
    gap: 4,
  },
  timeDisplayIcon: {
    marginBottom: 4,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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
  actionContainer: {
    marginBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonWrapper: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
  primaryActionButton: {
    height: 56,
  },
  secondaryActionButton: {
    marginTop: spacing.sm,
  },
  actionHint: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
});