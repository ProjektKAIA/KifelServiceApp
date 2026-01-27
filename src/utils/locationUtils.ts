// src/utils/locationUtils.ts

import { TimeEntry } from '@/src/lib/firestore';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
  address?: string | null;
}

/**
 * Ein Eintrag gilt als "Außen" (Feld), wenn er >= 2 GPS-Punkte in locationHistory hat.
 */
export function isFieldEntry(entry: TimeEntry): boolean {
  return Array.isArray(entry.locationHistory) && entry.locationHistory.length >= 2;
}

/**
 * Haversine-Formel: Berechnet die Distanz zwischen zwei GPS-Koordinaten in Metern.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Erdradius in Metern
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Berechnet die Gesamtdistanz einer Route in Metern.
 */
export function calculateTotalDistance(points: LocationPoint[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return total;
}

/**
 * Formatiert eine Distanz in Metern als lesbaren String.
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Berechnet eine Map-Region, die alle Punkte umfasst (mit Padding).
 */
export function getRouteBounds(points: LocationPoint[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (points.length === 0) {
    return {
      latitude: 51.1657,
      longitude: 10.4515,
      latitudeDelta: 5,
      longitudeDelta: 5,
    };
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;

  for (const p of points) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  }

  const padding = 0.3;
  const latDelta = Math.max((maxLat - minLat) * (1 + padding), 0.005);
  const lonDelta = Math.max((maxLon - minLon) * (1 + padding), 0.005);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}
