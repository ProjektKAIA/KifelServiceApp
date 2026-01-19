// src/services/offlineQueueService.ts
// Queue-System fuer Offline-Operationen mit automatischer Synchronisation

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline } from './networkService';

const QUEUE_STORAGE_KEY = 'kifel-offline-queue';

export type QueueOperationType =
  | 'clockIn'
  | 'clockOut'
  | 'updateBreak'
  | 'location'
  | 'locationBatch';

export interface QueueItem {
  id: string;
  type: QueueOperationType;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  entryId?: string; // Firestore document ID (fuer Updates)
  localEntryId?: string; // Lokale Entry-ID (fuer Mapping)
}

interface QueueState {
  items: QueueItem[];
  isProcessing: boolean;
}

// In-Memory Queue State
let queueState: QueueState = {
  items: [],
  isProcessing: false,
};

// Listeners fuer Status-Updates
type QueueListener = (status: { pending: number; isProcessing: boolean }) => void;
const listeners: Set<QueueListener> = new Set();

function notifyListeners(): void {
  const status = { pending: queueState.items.length, isProcessing: queueState.isProcessing };
  listeners.forEach((listener) => listener(status));
}

export function addQueueListener(listener: QueueListener): () => void {
  listeners.add(listener);
  // Sofort mit aktuellem Status benachrichtigen
  listener({ pending: queueState.items.length, isProcessing: queueState.isProcessing });
  return () => listeners.delete(listener);
}

/**
 * Laedt die Queue aus AsyncStorage
 * Sollte beim App-Start aufgerufen werden
 */
export async function loadQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      queueState.items = JSON.parse(stored);
      console.log(`[OfflineQueue] Loaded ${queueState.items.length} items from storage`);
      notifyListeners();
    }
  } catch (error) {
    console.error('[OfflineQueue] Error loading queue:', error);
  }
}

/**
 * Speichert die Queue in AsyncStorage
 */
async function saveQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueState.items));
  } catch (error) {
    console.error('[OfflineQueue] Error saving queue:', error);
  }
}

/**
 * Generiert eine eindeutige ID fuer Queue-Items
 */
function generateQueueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Fuegt ein Item zur Queue hinzu
 */
export async function addToSyncQueue(
  type: QueueOperationType,
  data: Record<string, unknown>,
  entryId?: string,
  localEntryId?: string
): Promise<string> {
  const item: QueueItem = {
    id: generateQueueId(),
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: 5,
    entryId,
    localEntryId,
  };

  queueState.items.push(item);
  await saveQueue();
  notifyListeners();

  console.log(`[OfflineQueue] Added item: ${type} (${item.id})`);

  // Sofort versuchen zu syncen wenn online
  if (isOnline()) {
    // Async ohne await, damit der Aufrufer nicht blockiert wird
    processSyncQueue().catch((error) => {
      console.error('[OfflineQueue] Error processing queue:', error);
    });
  }

  return item.id;
}

/**
 * Aktualisiert die entryId fuer Items mit einer bestimmten localEntryId
 * Wird benoetigt wenn clockIn erfolgreich war und wir die Firestore-ID haben
 */
export async function updateEntryIdMapping(localEntryId: string, firestoreEntryId: string): Promise<void> {
  let updated = false;

  queueState.items = queueState.items.map((item) => {
    if (item.localEntryId === localEntryId && !item.entryId) {
      updated = true;
      return { ...item, entryId: firestoreEntryId };
    }
    return item;
  });

  if (updated) {
    await saveQueue();
    console.log(`[OfflineQueue] Updated entryId mapping: ${localEntryId} -> ${firestoreEntryId}`);
  }
}

/**
 * Verarbeitet die Sync-Queue
 */
export async function processSyncQueue(): Promise<void> {
  if (queueState.isProcessing) {
    console.log('[OfflineQueue] Already processing');
    return;
  }

  if (queueState.items.length === 0) {
    console.log('[OfflineQueue] Queue is empty');
    return;
  }

  if (!isOnline()) {
    console.log('[OfflineQueue] Offline - skipping sync');
    return;
  }

  queueState.isProcessing = true;
  notifyListeners();
  console.log(`[OfflineQueue] Processing ${queueState.items.length} items`);

  // Dynamischer Import um zirkulaere Abhaengigkeiten zu vermeiden
  const { timeEntriesCollection } = await import('@/src/lib/firestore');

  try {
    // Kopie erstellen und nach Timestamp sortieren (FIFO)
    const itemsToProcess = [...queueState.items].sort((a, b) => a.timestamp - b.timestamp);

    for (const item of itemsToProcess) {
      try {
        await processQueueItem(item, timeEntriesCollection);

        // Erfolgreich - aus Queue entfernen
        queueState.items = queueState.items.filter((i) => i.id !== item.id);
        await saveQueue();
        notifyListeners();

        console.log(`[OfflineQueue] Successfully processed: ${item.type} (${item.id})`);
      } catch (error) {
        console.error(`[OfflineQueue] Error processing item ${item.id}:`, error);

        // Retry-Count erhoehen
        const itemIndex = queueState.items.findIndex((i) => i.id === item.id);
        if (itemIndex >= 0) {
          queueState.items[itemIndex].retryCount++;

          // Max retries erreicht - entfernen und loggen
          if (queueState.items[itemIndex].retryCount >= queueState.items[itemIndex].maxRetries) {
            console.error(`[OfflineQueue] Max retries reached for item ${item.id}, removing`);
            queueState.items = queueState.items.filter((i) => i.id !== item.id);
          }

          await saveQueue();
          notifyListeners();
        }
      }
    }
  } finally {
    queueState.isProcessing = false;
    notifyListeners();
    console.log(`[OfflineQueue] Processing complete. ${queueState.items.length} items remaining`);
  }
}

/**
 * Verarbeitet ein einzelnes Queue-Item
 */
async function processQueueItem(
  item: QueueItem,
  timeEntriesCollection: typeof import('@/src/lib/firestore').timeEntriesCollection
): Promise<void> {
  switch (item.type) {
    case 'clockIn': {
      const { userId, location } = item.data as {
        userId: string;
        location?: { latitude: number; longitude: number; address?: string };
      };
      const entryId = await timeEntriesCollection.clockIn(userId, location);

      // Mapping fuer nachfolgende Operationen aktualisieren
      if (item.localEntryId) {
        await updateEntryIdMapping(item.localEntryId, entryId);
      }
      break;
    }

    case 'clockOut': {
      if (!item.entryId) {
        throw new Error('Missing entryId for clockOut');
      }
      const { location } = item.data as {
        location?: { latitude: number; longitude: number; address?: string };
      };
      await timeEntriesCollection.clockOut(item.entryId, location);
      break;
    }

    case 'updateBreak': {
      if (!item.entryId) {
        throw new Error('Missing entryId for updateBreak');
      }
      const { breakMinutes } = item.data as { breakMinutes: number };
      await timeEntriesCollection.updateBreak(item.entryId, breakMinutes);
      break;
    }

    case 'location': {
      if (!item.entryId) {
        throw new Error('Missing entryId for location');
      }
      const location = item.data as {
        latitude: number;
        longitude: number;
        accuracy?: number;
        timestamp: number;
        address?: string;
      };
      await timeEntriesCollection.updateLocationHistory(item.entryId, location);
      break;
    }

    case 'locationBatch': {
      if (!item.entryId) {
        throw new Error('Missing entryId for locationBatch');
      }
      const { locations } = item.data as {
        locations: Array<{
          latitude: number;
          longitude: number;
          accuracy?: number;
          timestamp: number;
        }>;
      };
      await timeEntriesCollection.batchUpdateLocationHistory(item.entryId, locations);
      break;
    }

    default:
      console.warn(`[OfflineQueue] Unknown operation type: ${item.type}`);
  }
}

/**
 * Gibt den aktuellen Queue-Status zurueck
 */
export function getQueueStatus(): { pending: number; isProcessing: boolean } {
  return {
    pending: queueState.items.length,
    isProcessing: queueState.isProcessing,
  };
}

/**
 * Leert die Queue (fuer Debugging/Reset)
 */
export async function clearQueue(): Promise<void> {
  queueState.items = [];
  await saveQueue();
  notifyListeners();
  console.log('[OfflineQueue] Queue cleared');
}

/**
 * Gibt alle Queue-Items zurueck (fuer Debugging)
 */
export function getQueueItems(): QueueItem[] {
  return [...queueState.items];
}
