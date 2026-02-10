// app/(employee)/timetracking.tsx

import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, StyleSheet, Alert, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Square, Coffee, MapPin, Clock, AlertCircle, Pause, Timer, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Typography, Button, LoadingSpinner } from '@/src/components/atoms';
import { Card, StatusPill, LocationPermissionModal } from '@/src/components/molecules';
import { ScreenHeader, StatsGrid } from '@/src/components/organisms';

import { useTheme, useLocation } from '@/src/hooks';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useTimeStore } from '@/src/store/timeStore';
import { useAuthStore } from '@/src/store/authStore';
import { useLocationStore } from '@/src/store/locationStore';
import { spacing } from '@/src/constants/spacing';
import { isFeatureEnabled, features } from '@/src/config/features';
import { useOfflineSync } from '@/src/hooks/useOfflineSync';
import { timeEntriesCollection, shiftsCollection } from '@/src/lib/firestore';
import { validateClockInLocation } from '@/src/utils/locationUtils';
import { LocationValidation } from '@/src/types';

export default function TimeTrackingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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
  const { locations: savedLocations, fetchLocations, getLocationById } = useLocationStore();

  const gpsEnabled = isFeatureEnabled('gpsTracking');
  const offlineModeEnabled = isFeatureEnabled('offlineMode');
  const locationValidationEnabled = isFeatureEnabled('locationValidation');

  // Location validation state
  const [locationValidation, setLocationValidationState] = useState<LocationValidation | null>(null);

  // Fetch locations on mount for validation
  useEffect(() => {
    if (locationValidationEnabled) {
      fetchLocations();
    }
  }, [locationValidationEnabled, fetchLocations]);

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

  // Sync validation state from currentEntry (for reload/persist scenarios)
  useEffect(() => {
    if (currentEntry?.locationValidation) {
      setLocationValidationState(currentEntry.locationValidation);
    } else if (!isWorking) {
      setLocationValidationState(null);
    }
  }, [currentEntry?.locationValidation, isWorking]);

  const stats = [
    { value: todayHours.toFixed(1), label: t('timetracking.hoursToday'), icon: Clock },
    { value: '38.5', label: t('timetracking.thisWeek'), icon: Clock },
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
        t('timetracking.locationPermissionDenied'),
        t('timetracking.canClockInWithout'),
        [
          { text: t('timetracking.continueWithoutLocation'), onPress: () => performClockIn(null) },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    }
  };

  const handlePermissionDeny = () => {
    setShowPermissionModal(false);
    // User declined in our modal - offer to continue without location
    Alert.alert(
      t('timetracking.continueWithoutLocationQuestion'),
      t('timetracking.canClockInWithout'),
      [
        { text: t('timetracking.continueWithoutLocation'), onPress: () => performClockIn(null) },
        { text: t('common.cancel'), style: 'cancel' },
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
    // Standort-Validierung: Heutige Schicht laden und Distanz prüfen
    let validation: LocationValidation | undefined;

    if (locationValidationEnabled && loc) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const userShifts = await shiftsCollection.getForUser(user?.id || '', today, today);
        const todayShift = userShifts.find(s => s.locationId);

        if (todayShift?.locationId) {
          const targetLocation = getLocationById(todayShift.locationId);
          if (targetLocation) {
            const threshold = targetLocation.radius ?? features.locationValidationRadius;
            const result = validateClockInLocation(
              loc.latitude,
              loc.longitude,
              targetLocation.latitude,
              targetLocation.longitude,
              threshold
            );
            validation = {
              isValid: result.isValid,
              distanceMeters: result.distanceMeters,
              expectedLocationName: targetLocation.name,
              thresholdMeters: threshold,
            };
          }
        }
      } catch (error) {
        console.error('[TimeTracking] Location validation fehlgeschlagen:', error);
        // Validation failure should not block clock-in
      }
    }

    // Lokalen Eintrag erstellen
    clockIn(user?.id, loc || undefined);

    // Validation-Ergebnis im Store speichern
    if (validation) {
      useTimeStore.getState().setLocationValidation(validation);
      setLocationValidationState(validation);
    }

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
          const firestoreId = await timeEntriesCollection.clockIn(user?.id || 'default-user', locationData, validation);
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

    Alert.alert(t('timetracking.clockInTitle'), t('timetracking.clockInMessage').replace('{time}', currentTime));
  };

  const handleClockOut = async () => {
    Alert.alert(t('timetracking.clockOutTitle'), t('timetracking.clockOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('timetracking.endButton'),
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

          Alert.alert(t('timetracking.clockOutDone'), t('timetracking.clockOutMessage').replace('{time}', format(new Date(), 'HH:mm')));
        },
      },
    ]);
  };

  const handleStartBreak = () => {
    startBreak();
    Alert.alert(t('timetracking.breakStartTitle'), t('timetracking.breakStartMessage').replace('{time}', format(new Date(), 'HH:mm')));
  };

  const handleEndBreak = () => {
    endBreak();
    Alert.alert(t('timetracking.breakEndTitle'), t('timetracking.breakEndMessage').replace('{time}', format(new Date(), 'HH:mm')));
  };

  // Get start time for display
  const getStartTimeDisplay = (): string => {
    if (currentEntry?.clockIn) {
      return format(new Date(currentEntry.clockIn), 'HH:mm');
    }
    return '--:--';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline={t('timetracking.title')} title={t('timetracking.title')} />

        {/* Current Time Card */}
        <Card variant="accent" accentColor={theme.secondary} style={styles.timeCard}>
          <View style={styles.timeContent}>
            <Typography variant="h1" style={styles.bigTime}>{currentTime}</Typography>
            <Typography variant="caption" color="muted">{currentDate}</Typography>
          </View>
          <StatusPill
            status={isWorking ? (isOnBreak ? 'warning' : 'active') : 'inactive'}
            label={isWorking ? (isOnBreak ? t('timetracking.onBreak') : t('timetracking.working')) : t('timetracking.notStarted')}
          />
        </Card>

        {/* Working Status Display - Show when working */}
        {isWorking && (
          <Card style={styles.workingCard}>
            <View style={styles.workingHeader}>
              <View style={[styles.statusDot, { backgroundColor: isOnBreak ? theme.warning : theme.success }]} />
              <Typography variant="label" style={{ color: theme.text }}>
                {isOnBreak ? t('timetracking.breakRunning') : t('timetracking.workRunning')}
              </Typography>
            </View>

            <View style={styles.timeDisplayRow}>
              {/* Arbeitszeit */}
              <View style={styles.timeDisplayItem}>
                <View style={styles.timeDisplayIcon}>
                  <Timer size={20} color={theme.success} />
                </View>
                <Text style={[styles.timerText, { color: theme.text }]}>{displayTime}</Text>
                <Typography variant="caption" color="muted">{t('timetracking.workTime')}</Typography>
              </View>

              {/* Startzeit */}
              <View style={styles.timeDisplayItem}>
                <View style={styles.timeDisplayIcon}>
                  <Play size={20} color={theme.primary} />
                </View>
                <Text style={[styles.timerText, { color: theme.text }]}>{getStartTimeDisplay()}</Text>
                <Typography variant="caption" color="muted">{t('timetracking.started')}</Typography>
              </View>

              {/* Pausenzeit */}
              <View style={styles.timeDisplayItem}>
                <View style={styles.timeDisplayIcon}>
                  <Coffee size={20} color={theme.warning} />
                </View>
                <Text style={[styles.timerText, { color: isOnBreak ? theme.warning : theme.text }]}>{breakTime}</Text>
                <Typography variant="caption" color="muted">{t('timetracking.breakLabel')}</Typography>
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
                {t('timetracking.locating')}
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

        {/* Location Validation Status */}
        {isWorking && locationValidation && (
          <Card style={[
            styles.validationCard,
            {
              borderLeftWidth: 3,
              borderLeftColor: locationValidation.isValid ? theme.success : theme.warning,
            },
          ]}>
            <View style={styles.locationRow}>
              {locationValidation.isValid ? (
                <CheckCircle size={16} color={theme.success} />
              ) : (
                <AlertTriangle size={16} color={theme.warning} />
              )}
              <View style={{ flex: 1 }}>
                <Typography variant="caption" style={{
                  color: locationValidation.isValid ? theme.success : theme.warning,
                  fontWeight: '600',
                }}>
                  {locationValidation.isValid
                    ? t('timetracking.correctLocation')
                    : t('timetracking.wrongLocation')}
                </Typography>
                {!locationValidation.isValid && (
                  <Typography variant="caption" color="muted">
                    {locationValidation.expectedLocationName} · {locationValidation.distanceMeters}m {t('timetracking.fromExpected')}
                  </Typography>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons - State-based flow */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          {t('timetracking.actions')}
        </Typography>

        {/* State: Not Working - Show Arbeitsbeginn */}
        {!isWorking && (
          <View style={styles.actionContainer}>
            <Button
              title={isLocationLoading ? t('timetracking.locating') : t('timetracking.startWork')}
              icon={Play}
              onPress={handleClockIn}
              fullWidth
              disabled={isLocationLoading}
              style={{ ...styles.primaryActionButton, backgroundColor: theme.success }}
            />
            <Typography variant="caption" color="muted" style={styles.actionHint}>
              {t('timetracking.tapToStart')}
            </Typography>
          </View>
        )}

        {/* State: Working but not on break - Show Beenden & Pause */}
        {isWorking === true && isOnBreak !== true && (
          <View style={styles.actionContainer}>
            <Button
              title={t('timetracking.endWork')}
              icon={Square}
              variant="danger"
              onPress={handleClockOut}
              fullWidth
              style={styles.primaryActionButton}
            />
            <Button
              title={t('timetracking.startBreak')}
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
              title={t('timetracking.endBreak')}
              icon={Play}
              onPress={handleEndBreak}
              fullWidth
              style={{ ...styles.primaryActionButton, backgroundColor: theme.success }}
            />
            <Button
              title={t('timetracking.endWork')}
              icon={Square}
              variant="danger"
              onPress={handleClockOut}
              fullWidth
              style={styles.secondaryActionButton}
            />
            <Typography variant="caption" color="muted" style={styles.actionHint}>
              {t('timetracking.endBreakHint')}
            </Typography>
          </View>
        )}

        {/* Stats */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          {t('timetracking.overviewSection')}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingTop: 0,
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
  validationCard: {
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