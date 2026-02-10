// app/(employee)/time.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Square, CheckCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTimeStore, LocationData } from '@/src/store/timeStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';

export default function TimeTrackingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuthStore();
  const {
    isTracking,
    elapsedSeconds,
    currentLocation,
    locationError,
    isLocationLoading,
    clockIn,
    clockOut,
    updateLocation,
    updateElapsedTime,
    setLocationError,
    setLocationLoading,
    currentEntry,
  } = useTimeStore();

  const startTime = currentEntry?.clockIn || null;

  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStartTime = (): string => {
    if (!startTime) return '';
    return new Date(startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(t('empTime.locationDenied'));
        return null;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          locationData.address = `${address.city || ''}, ${address.street || ''} ${address.streetNumber || ''}`.trim();
        }
      } catch {}
      updateLocation(locationData);
      return locationData;
    } catch {
      setLocationError(t('empTime.locationFetchError'));
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleClockIn = async () => {
    const location = await getCurrentLocation();
    if (!location) {
      Alert.alert(t('common.error'), t('empTime.locationRequired'));
      return;
    }
    if (user) clockIn(user.id, location);
  };

  const handleClockOut = async () => {
    Alert.alert(t('empTime.clockOutTitle'), t('empTime.clockOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('empTime.endButton'),
        style: 'destructive',
        onPress: async () => {
          const location = await getCurrentLocation();
          if (location) clockOut(location);
        },
      },
    ]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => updateElapsedTime(), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTracking]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const hasLocation = currentLocation && !locationError;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
      <View style={styles.content}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>{t('empTime.badge')}</Text>
        </View>

        {/* Header */}
        <Text style={[styles.headerSmall, { color: theme.textMuted }]}>{t('empTime.gpsSupported')}</Text>
        <Text style={[styles.headerLarge, { color: theme.text }]}>{t('empTime.title')}</Text>

        {/* Big Time Display */}
        <Text style={[styles.timeDisplay, { color: theme.text }]}>{currentTime}</Text>

        {/* GPS Status */}
        <View style={styles.gpsStatus}>
          <View style={[styles.gpsDot, { backgroundColor: hasLocation ? theme.success : theme.danger }]} />
          <Text style={[styles.gpsText, { color: hasLocation ? theme.statusActive : theme.statusInactive }]}>
            {isLocationLoading
              ? t('empTime.locating')
              : hasLocation
              ? `${t('empTime.gpsActive')} · ${t('empTime.locationDetected')}`
              : locationError || t('empTime.gpsInactive')}
          </Text>
        </View>

        {/* Work Time Card */}
        <View
          style={[
            styles.workCard,
            {
              backgroundColor: isTracking ? 'rgba(59,130,246,0.1)' : theme.cardBackground,
              borderColor: isTracking ? 'rgba(99,102,241,0.2)' : theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.workLabel, { color: theme.textMuted }]}>{t('empTime.todayWorkTime')}</Text>
          <Text style={[styles.workTime, { color: theme.text }]}>{formatTime(elapsedSeconds)}</Text>
          {isTracking && (
            <View style={[styles.statusPill, { backgroundColor: theme.pillSuccess }]}>
              <View style={[styles.statusDot, { backgroundColor: theme.pillSuccessText }]} />
              <Text style={[styles.statusText, { color: theme.pillSuccessText }]}>
                {t('empTime.activeSince').replace('{time}', formatStartTime())}
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {!isTracking ? (
          <TouchableOpacity style={[styles.clockInButton, { backgroundColor: theme.success }]} onPress={handleClockIn} activeOpacity={0.8}>
            <Text style={[styles.clockButtonText, { color: theme.textInverse }]}>▶ {t('empTime.clockIn')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.clockOutButton, { backgroundColor: theme.danger }]} onPress={handleClockOut} activeOpacity={0.8}>
            <Square size={18} color={theme.textInverse} fill={theme.textInverse} />
            <Text style={[styles.clockButtonText, { color: theme.textInverse }]}>{t('empTime.clockOut')}</Text>
          </TouchableOpacity>
        )}

        {/* Location Card */}
        <View style={[styles.locationCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.locationHeader}>
            <MapPin size={18} color={theme.textSecondary} />
            <Text style={[styles.locationTitle, { color: theme.text }]}>{t('empTime.currentLocation')}</Text>
          </View>
          <Text style={[styles.locationAddress, { color: theme.textMuted }]}>
            {currentLocation?.address || t('empTime.locating')}
          </Text>
          {hasLocation && (
            <View style={styles.locationStatus}>
              <CheckCircle size={14} color={theme.statusActive} />
              <Text style={[styles.locationStatusText, { color: theme.statusActive }]}>{t('empTime.inServiceArea')}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.base,
    paddingTop: 0,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerSmall: {
    fontSize: 13,
    marginBottom: 4,
  },
  headerLarge: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  timeDisplay: {
    fontSize: 56,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gpsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  workCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  workLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  workTime: {
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: spacing.md,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clockInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 20,
    borderRadius: borderRadius.card,
    marginBottom: spacing.lg,
  },
  clockOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 20,
    borderRadius: borderRadius.card,
    marginBottom: spacing.lg,
  },
  clockButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.sm,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 13,
    marginLeft: 28,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 28,
    marginTop: 6,
  },
  locationStatusText: {
    fontSize: 12,
  },
});