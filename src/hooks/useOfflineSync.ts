// src/hooks/useOfflineSync.ts
// Hook fuer Offline-Synchronisation in Komponenten

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStore } from '@/src/services/networkService';
import {
  addToSyncQueue,
  processSyncQueue,
  addQueueListener,
  QueueOperationType,
} from '@/src/services/offlineQueueService';

interface UseOfflineSyncReturn {
  /** Ist das Geraet aktuell online? */
  isOnline: boolean;
  /** Anzahl der ausstehenden Operationen in der Queue */
  pendingOperations: number;
  /** Wird die Queue gerade verarbeitet? */
  isProcessing: boolean;
  /** Fuegt eine Operation zur Queue hinzu */
  addToQueue: (
    type: QueueOperationType,
    data: Record<string, unknown>,
    entryId?: string,
    localEntryId?: string
  ) => Promise<string>;
  /** Triggert die Synchronisation manuell */
  syncNow: () => Promise<void>;
}

/**
 * Hook fuer Offline-Synchronisation
 *
 * @example
 * ```tsx
 * const { isOnline, pendingOperations, addToQueue } = useOfflineSync();
 *
 * const handleClockIn = async () => {
 *   if (!isOnline) {
 *     await addToQueue('clockIn', { userId, location });
 *   }
 * };
 * ```
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const { isConnected, isInternetReachable } = useNetworkStore();
  const [queueStatus, setQueueStatus] = useState({ pending: 0, isProcessing: false });

  // Queue-Status listener
  useEffect(() => {
    const unsubscribe = addQueueListener((status) => {
      setQueueStatus(status);
    });

    return unsubscribe;
  }, []);

  // Online-Status berechnen
  const isOnline = isConnected && (isInternetReachable ?? true);

  // Queue-Operation hinzufuegen
  const addToQueue = useCallback(
    async (
      type: QueueOperationType,
      data: Record<string, unknown>,
      entryId?: string,
      localEntryId?: string
    ) => {
      return addToSyncQueue(type, data, entryId, localEntryId);
    },
    []
  );

  // Manuelle Synchronisation
  const syncNow = useCallback(async () => {
    await processSyncQueue();
  }, []);

  return {
    isOnline,
    pendingOperations: queueStatus.pending,
    isProcessing: queueStatus.isProcessing,
    addToQueue,
    syncNow,
  };
}
