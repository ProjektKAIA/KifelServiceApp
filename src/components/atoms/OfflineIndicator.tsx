// src/components/atoms/OfflineIndicator.tsx
// Banner-Komponente fuer Offline-Status und ausstehende Synchronisationen

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useOfflineSync } from '@/src/hooks/useOfflineSync';

interface OfflineIndicatorProps {
  /** Callback wenn auf Sync-Button geklickt wird */
  onSyncPress?: () => void;
}

/**
 * Zeigt einen Banner an wenn:
 * - Das Geraet offline ist
 * - Es ausstehende Synchronisationen gibt
 *
 * Wird automatisch ausgeblendet wenn online und keine ausstehenden Operationen
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncPress }) => {
  const { isOnline, pendingOperations, isProcessing, syncNow } = useOfflineSync();

  // Nichts anzeigen wenn online und keine ausstehenden Operationen
  if (isOnline && pendingOperations === 0) {
    return null;
  }

  const handlePress = () => {
    if (onSyncPress) {
      onSyncPress();
    } else if (isOnline && pendingOperations > 0 && !isProcessing) {
      syncNow();
    }
  };

  // Offline-Modus
  if (!isOnline) {
    return (
      <View style={[styles.container, styles.offline]}>
        <WifiOff size={14} color="#fff" />
        <Text style={styles.text}>Offline-Modus</Text>
        {pendingOperations > 0 && (
          <Text style={styles.badge}>{pendingOperations}</Text>
        )}
      </View>
    );
  }

  // Online aber ausstehende Operationen
  return (
    <Pressable
      style={[styles.container, styles.syncing]}
      onPress={handlePress}
      disabled={isProcessing}
    >
      <RefreshCw
        size={14}
        color="#fff"
        style={isProcessing ? styles.spinning : undefined}
      />
      <Text style={styles.text}>
        {isProcessing
          ? 'Synchronisiere...'
          : `${pendingOperations} ausstehend`}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  offline: {
    backgroundColor: '#dc2626', // red-600
  },
  syncing: {
    backgroundColor: '#f59e0b', // amber-500
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  spinning: {
    // Note: Animation muesste mit Animated API implementiert werden
    // Fuer jetzt nur visueller Hinweis
    opacity: 0.7,
  },
});
