// src/services/networkService.ts
// Netzwerk-Status-Ueberwachung fuer Offline-Mode

import { create } from 'zustand';

type NetInfoState = { isConnected: boolean | null; isInternetReachable: boolean | null; type: string };
type NetInfoSubscription = (() => void);

let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  console.warn('[NetworkService] @react-native-community/netinfo not available (Expo Go?)');
}

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  setNetworkState: (state: Partial<Omit<NetworkState, 'setNetworkState'>>) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true, // Optimistisch starten
  isInternetReachable: true,
  connectionType: null,
  setNetworkState: (state) => set(state),
}));

let unsubscribe: NetInfoSubscription | null = null;
let syncCallback: (() => void) | null = null;

/**
 * Setzt den Callback der aufgerufen wird wenn wieder online
 */
export function setSyncCallback(callback: () => void): void {
  syncCallback = callback;
}

/**
 * Initialisiert den Netzwerk-Listener
 * Sollte beim App-Start aufgerufen werden
 */
export function initNetworkListener(): void {
  if (!NetInfo) {
    console.warn('[NetworkService] NetInfo not available, skipping init');
    return;
  }
  if (unsubscribe) {
    console.log('[NetworkService] Already initialized');
    return;
  }

  console.log('[NetworkService] Initializing network listener');

  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const wasOffline = !useNetworkStore.getState().isConnected;
    const isNowOnline = state.isConnected && (state.isInternetReachable ?? true);

    useNetworkStore.getState().setNetworkState({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
    });

    // Wenn wir von Offline zu Online gewechselt haben, Queue verarbeiten
    if (wasOffline && isNowOnline) {
      console.log('[NetworkService] Back online - triggering sync');
      if (syncCallback) {
        syncCallback();
      }
    }
  });

  // Initialer Check
  NetInfo.fetch().then((state) => {
    useNetworkStore.getState().setNetworkState({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
    });
    console.log('[NetworkService] Initial state:', {
      connected: state.isConnected,
      reachable: state.isInternetReachable,
      type: state.type,
    });
  });
}

/**
 * Bereinigt den Netzwerk-Listener
 * Sollte beim App-Unmount aufgerufen werden
 */
export function cleanupNetworkListener(): void {
  if (unsubscribe) {
    console.log('[NetworkService] Cleaning up network listener');
    unsubscribe();
    unsubscribe = null;
  }
}

/**
 * Prueft ob aktuell eine Netzwerkverbindung besteht
 */
export function isOnline(): boolean {
  const state = useNetworkStore.getState();
  return state.isConnected && (state.isInternetReachable ?? true);
}

/**
 * Prueft den aktuellen Netzwerk-Status (async, fresh)
 */
export async function checkNetworkStatus(): Promise<boolean> {
  if (!NetInfo) return true;
  try {
    const state = await NetInfo.fetch();
    return (state.isConnected ?? false) && (state.isInternetReachable ?? true);
  } catch (error) {
    console.error('[NetworkService] Error checking network status:', error);
    return false;
  }
}
