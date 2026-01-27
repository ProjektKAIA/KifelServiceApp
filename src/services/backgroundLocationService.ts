// src/services/backgroundLocationService.ts
// Background-Location-Tracking fuer DSGVO-konforme Zeiterfassung
// Tracking nur aktiv waehrend der Arbeitszeit (eingestempelt)

import * as Location from 'expo-location';
import { features } from '@/src/config/features';

let TaskManager: typeof import('expo-task-manager') | null = null;
try {
  TaskManager = require('expo-task-manager');
} catch {
  console.warn('[BackgroundLocation] expo-task-manager not available (Expo Go?)');
}

const BACKGROUND_LOCATION_TASK = 'kifel-background-location-task';

// Callback fuer Location-Updates
type LocationUpdateCallback = (location: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}) => void;

let locationUpdateCallback: LocationUpdateCallback | null = null;

/**
 * Setzt den Callback fuer Location-Updates
 * Der Callback wird aufgerufen wenn neue Location-Daten verfuegbar sind
 */
export function setLocationUpdateCallback(callback: LocationUpdateCallback | null): void {
  locationUpdateCallback = callback;
}

/**
 * Task-Definition fuer Background-Location
 * WICHTIG: Muss ausserhalb von Komponenten definiert werden
 */
if (TaskManager) {
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] Task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };

    console.log(`[BackgroundLocation] Received ${locations.length} location(s)`);

    // Locations verarbeiten
    for (const location of locations) {
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      console.log('[BackgroundLocation] Location:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy?.toFixed(0),
      });

      // Callback aufrufen wenn gesetzt
      if (locationUpdateCallback) {
        locationUpdateCallback(locationData);
      }
    }
  }
});
}

/**
 * Fordert Background-Location-Berechtigung an
 */
export async function requestBackgroundPermission(): Promise<boolean> {
  try {
    // Zuerst Foreground-Permission pruefen/anfordern
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn('[BackgroundLocation] Foreground permission denied');
      return false;
    }

    // Dann Background-Permission anfordern
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('[BackgroundLocation] Background permission denied');
      return false;
    }

    console.log('[BackgroundLocation] All permissions granted');
    return true;
  } catch (error) {
    console.error('[BackgroundLocation] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Prueft ob Background-Location-Berechtigung vorhanden ist
 */
export async function hasBackgroundPermission(): Promise<boolean> {
  try {
    const { status: foreground } = await Location.getForegroundPermissionsAsync();
    const { status: background } = await Location.getBackgroundPermissionsAsync();

    return foreground === 'granted' && background === 'granted';
  } catch (error) {
    console.error('[BackgroundLocation] Error checking permissions:', error);
    return false;
  }
}

/**
 * Startet das Background-Location-Tracking
 * DSGVO: Sollte nur bei Arbeitsbeginn (clockIn) aufgerufen werden
 */
export async function startBackgroundLocationTask(): Promise<boolean> {
  // GPS-Tracking muss in Features aktiviert sein
  if (!features.gpsTracking) {
    console.log('[BackgroundLocation] GPS tracking disabled in features');
    return false;
  }

  // Permission pruefen
  const hasPermission = await hasBackgroundPermission();
  if (!hasPermission) {
    console.warn('[BackgroundLocation] Missing background permission');
    // Versuche Permission anzufordern
    const granted = await requestBackgroundPermission();
    if (!granted) {
      return false;
    }
  }

  if (!TaskManager) {
    console.warn('[BackgroundLocation] TaskManager not available');
    return false;
  }

  // Pruefen ob Task bereits laeuft
  const isRunning = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRunning) {
    console.log('[BackgroundLocation] Task already running');
    return true;
  }

  try {
    // GPS-Intervall aus Features (Minuten -> Millisekunden)
    const intervalMinutes = features.gpsInterval || 5;
    const intervalMs = intervalMinutes * 60 * 1000;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: intervalMs,
      distanceInterval: 50, // Mindestens 50m Bewegung
      deferredUpdatesInterval: intervalMs,
      showsBackgroundLocationIndicator: true, // iOS: zeigt blauen Balken
      foregroundService: {
        notificationTitle: 'Kifel Service - Zeiterfassung aktiv',
        notificationBody: 'Ihr Standort wird waehrend der Arbeitszeit erfasst.',
        notificationColor: '#FF5722',
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Other,
    });

    console.log(`[BackgroundLocation] Task started (interval: ${intervalMinutes} min)`);
    return true;
  } catch (error) {
    console.error('[BackgroundLocation] Error starting task:', error);
    return false;
  }
}

/**
 * Stoppt das Background-Location-Tracking
 * DSGVO: Sollte bei Arbeitsende (clockOut) aufgerufen werden
 */
export async function stopBackgroundLocationTask(): Promise<void> {
  if (!TaskManager) return;
  try {
    const isRunning = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[BackgroundLocation] Task stopped');
    } else {
      console.log('[BackgroundLocation] Task was not running');
    }
  } catch (error) {
    console.error('[BackgroundLocation] Error stopping task:', error);
  }
}

/**
 * Prueft ob das Background-Location-Tracking aktiv ist
 */
export async function isBackgroundLocationRunning(): Promise<boolean> {
  if (!TaskManager) return false;
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  } catch (error) {
    console.error('[BackgroundLocation] Error checking task status:', error);
    return false;
  }
}

/**
 * Gibt den Task-Namen zurueck (fuer Debugging)
 */
export function getTaskName(): string {
  return BACKGROUND_LOCATION_TASK;
}
