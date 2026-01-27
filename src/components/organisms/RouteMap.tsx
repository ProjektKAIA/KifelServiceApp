// src/components/organisms/RouteMap.tsx

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { LocationPoint, getRouteBounds } from '@/src/utils/locationUtils';
import { useTheme } from '@/src/hooks/useTheme';

interface RouteMapProps {
  locationPoints: LocationPoint[];
  height?: number;
}

export default function RouteMap({ locationPoints, height = 250 }: RouteMapProps) {
  const { theme } = useTheme();

  if (locationPoints.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height, backgroundColor: theme.surface, borderRadius: 12 }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>Keine GPS-Daten vorhanden</Text>
      </View>
    );
  }

  const sorted = [...locationPoints].sort((a, b) => a.timestamp - b.timestamp);
  const region = getRouteBounds(sorted);
  const coordinates = sorted.map(p => ({ latitude: p.latitude, longitude: p.longitude }));

  const startPoint = sorted[0];
  const endPoint = sorted[sorted.length - 1];

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor={theme.primary}
          strokeWidth={3}
        />
        <Marker
          coordinate={{ latitude: startPoint.latitude, longitude: startPoint.longitude }}
          pinColor="#22c55e"
          title="Start"
        />
        {sorted.length > 1 && (
          <Marker
            coordinate={{ latitude: endPoint.latitude, longitude: endPoint.longitude }}
            pinColor="#ef4444"
            title="Ende"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
