// app/(employee)/time.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Play, Square, CheckCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTimeStore, LocationData } from '@/src/store/timeStore';
import { useAuthStore } from '@/src/store/authStore';

export default function TimeTrackingScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();
  const { isTracking, elapsedSeconds, currentLocation, locationError, isLocationLoading, clockIn, clockOut, updateLocation, updateElapsedTime, setLocationError, setLocationLoading } = useTimeStore();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError('Standortberechtigung nicht erteilt'); return null; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const locationData: LocationData = { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy, timestamp: location.timestamp };
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        if (address) locationData.address = `${address.city || ''}, ${address.street || ''} ${address.streetNumber || ''}`.trim();
      } catch {}
      updateLocation(locationData);
      return locationData;
    } catch { setLocationError('Standort konnte nicht ermittelt werden'); return null; }
    finally { setLocationLoading(false); }
  };

  const handleClockIn = async () => {
    const location = await getCurrentLocation();
    if (!location) { Alert.alert('Fehler', 'Standort erforderlich für Arbeitsbeginn.'); return; }
    if (user) clockIn(user.id, location);
  };

  const handleClockOut = async () => {
    Alert.alert('Arbeitsende', 'Möchten Sie Ihre Arbeitszeit jetzt beenden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Beenden', style: 'destructive', onPress: async () => { const location = await getCurrentLocation(); if (location) clockOut(location); } },
    ]);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isTracking) { intervalRef.current = setInterval(() => updateElapsedTime(), 1000); }
    else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTracking]);

  useEffect(() => { getCurrentLocation(); }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>GPS-gestützt</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Zeiterfassung</Text>
        </View>

        <Text style={[styles.timeDisplay, { color: theme.text }]}>{currentTime}</Text>

        <View style={styles.gpsStatus}>
          <View style={[styles.gpsDot, { backgroundColor: currentLocation && !locationError ? '#22c55e' : '#ef4444' }]} />
          <Text style={[styles.gpsText, { color: currentLocation && !locationError ? '#4ade80' : '#f87171' }]}>
            {isLocationLoading ? 'Standort wird ermittelt...' : currentLocation && !locationError ? 'GPS aktiv · Standort erkannt' : locationError || 'GPS nicht verfügbar'}
          </Text>
        </View>

        <View style={[styles.workCard, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(99,102,241,0.2)' }]}>
          <Text style={[styles.workLabel, { color: theme.textMuted }]}>Heutige Arbeitszeit</Text>
          <Text style={[styles.workTime, { color: theme.text }]}>{formatTime(elapsedSeconds)}</Text>
          {isTracking && (
            <View style={[styles.statusPill, { backgroundColor: theme.pillSuccess }]}>
              <View style={[styles.statusDot, { backgroundColor: theme.pillSuccessText }]} />
              <Text style={[styles.statusText, { color: theme.pillSuccessText }]}>Aktiv</Text>
            </View>
          )}
        </View>

        {!isTracking ? (
          <TouchableOpacity style={styles.clockInButton} onPress={handleClockIn} activeOpacity={0.8} disabled={isLocationLoading}>
            <Play size={20} color="#fff" fill="#fff" />
            <Text style={styles.clockButtonText}>Arbeitsbeginn</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.clockOutButton} onPress={handleClockOut} activeOpacity={0.8}>
            <Square size={20} color="#fff" fill="#fff" />
            <Text style={styles.clockButtonText}>Arbeitsende</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.locationCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.locationHeader}>
            <MapPin size={16} color={theme.primary} />
            <Text style={[styles.locationTitle, { color: theme.text }]}>Aktueller Standort</Text>
          </View>
          <Text style={[styles.locationAddress, { color: theme.textMuted }]}>{currentLocation?.address || 'Adresse wird ermittelt...'}</Text>
          {currentLocation && !locationError && (
            <View style={styles.locationStatus}>
              <CheckCircle size={12} color="#4ade80" />
              <Text style={styles.locationStatusText}>Im Einsatzgebiet</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.base },
  header: { marginBottom: spacing.lg },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  timeDisplay: { fontSize: 42, fontWeight: '700', textAlign: 'center', letterSpacing: -2, marginVertical: spacing.lg },
  gpsStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: spacing.xl },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  gpsText: { fontSize: 13 },
  workCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  workLabel: { fontSize: 12, marginBottom: 4 },
  workTime: { fontSize: 32, fontWeight: '700', marginBottom: spacing.sm },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  clockInButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 20, borderRadius: borderRadius.button, backgroundColor: '#22c55e', marginBottom: spacing.lg },
  clockOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 20, borderRadius: borderRadius.button, backgroundColor: '#ef4444', marginBottom: spacing.lg },
  clockButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  locationCard: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  locationTitle: { fontSize: 14, fontWeight: '500' },
  locationAddress: { fontSize: 12, marginLeft: 26 },
  locationStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 26, marginTop: 4 },
  locationStatusText: { fontSize: 12, color: '#4ade80' },
});