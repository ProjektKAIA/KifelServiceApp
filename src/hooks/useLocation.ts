// src/hooks/useLocation.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { useTimeStore, LocationData } from '@/src/store/timeStore';
import { isFeatureEnabled, features } from '@/src/config/features';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'restricted';

interface UseLocationReturn {
  location: LocationData | null;
  permissionStatus: LocationPermissionStatus;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationData | null>;
  startTracking: () => void;
  stopTracking: () => void;
  isTracking: boolean;
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { updateLocation, setLocationError, setLocationLoading } = useTimeStore();

  // Check if GPS tracking is enabled via feature flags
  const gpsEnabled = isFeatureEnabled('gpsTracking');

  // Check initial permission status
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status as LocationPermissionStatus);
    } catch (err) {
      console.error('Error checking location permission:', err);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!gpsEnabled) {
      setError('GPS-Tracking ist deaktiviert');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status as LocationPermissionStatus);

      if (status !== 'granted') {
        setError('Standort-Berechtigung wurde verweigert');
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler bei Standort-Berechtigung';
      setError(errorMessage);
      setLocationError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [gpsEnabled, setLocationError]);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!gpsEnabled) {
      setError('GPS-Tracking ist deaktiviert');
      return null;
    }

    if (permissionStatus !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    setIsLoading(true);
    setLocationLoading(true);
    setError(null);

    try {
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy,
        timestamp: locationResult.timestamp,
      };

      // Try to get address (reverse geocoding)
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        if (address) {
          locationData.address = [
            address.street,
            address.streetNumber,
            address.postalCode,
            address.city,
          ].filter(Boolean).join(' ');
        }
      } catch {
        // Reverse geocoding failed, continue without address
      }

      setLocation(locationData);
      updateLocation(locationData);
      return locationData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Abrufen des Standorts';
      setError(errorMessage);
      setLocationError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
      setLocationLoading(false);
    }
  }, [gpsEnabled, permissionStatus, requestPermission, updateLocation, setLocationError, setLocationLoading]);

  const startTracking = useCallback(() => {
    if (!gpsEnabled) {
      setError('GPS-Tracking ist deaktiviert');
      return;
    }

    if (trackingIntervalRef.current) {
      return; // Already tracking
    }

    setIsTracking(true);

    // Get initial location
    getCurrentLocation();

    // Set up interval for periodic updates
    const intervalMs = features.gpsInterval * 60 * 1000; // Convert minutes to ms
    trackingIntervalRef.current = setInterval(() => {
      getCurrentLocation();
    }, intervalMs);
  }, [gpsEnabled, getCurrentLocation]);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  return {
    location,
    permissionStatus,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
    isTracking,
  };
};
