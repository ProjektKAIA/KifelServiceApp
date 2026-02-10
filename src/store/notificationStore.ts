// src/store/notificationStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  NotificationPreferences,
  PushToken,
  NotificationTapResponse,
} from '../types/notifications';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notifications';
import { pushNotificationService } from '../services/pushNotificationService';
import { pushTokensCollection, notificationPreferencesCollection } from '../lib/firestore';
import { logError } from '../utils/errorHandler';

interface NotificationState {
  // Token state
  pushToken: string | null;
  tokenId: string | null;
  isTokenRegistered: boolean;

  // Permission state
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  hasAskedPermission: boolean;

  // Preferences
  preferences: NotificationPreferences | null;

  // Loading states
  isInitializing: boolean;
  isRegistering: boolean;
  isSavingPreferences: boolean;

  // Last notification tap (for navigation)
  lastTapResponse: NotificationTapResponse | null;

  // Actions
  initialize: (userId: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  registerToken: (userId: string) => Promise<boolean>;
  deactivateToken: () => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  loadPreferences: (userId: string) => Promise<void>;
  setLastTapResponse: (response: NotificationTapResponse | null) => void;
  clearLastTapResponse: () => void;
  reset: () => void;
}

const initialState = {
  pushToken: null,
  tokenId: null,
  isTokenRegistered: false,
  permissionStatus: 'undetermined' as const,
  hasAskedPermission: false,
  preferences: null,
  isInitializing: false,
  isRegistering: false,
  isSavingPreferences: false,
  lastTapResponse: null,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Initialize notification system for a user
       */
      initialize: async (userId: string) => {
        const state = get();
        if (state.isInitializing) return;

        set({ isInitializing: true });

        try {
          // Initialize the push notification service
          await pushNotificationService.initialize();

          // Check current permission status
          const status = await pushNotificationService.getPermissionStatus();
          set({ permissionStatus: status });

          // Load user preferences
          await get().loadPreferences(userId);

          // If permissions are already granted, register token
          if (status === 'granted') {
            await get().registerToken(userId);
          }

        } catch (error) {
          logError(error, 'NotificationStore:initialize');
        } finally {
          set({ isInitializing: false });
        }
      },

      /**
       * Request notification permissions from user
       */
      requestPermissions: async () => {
        set({ hasAskedPermission: true });

        const granted = await pushNotificationService.requestPermissions();
        set({ permissionStatus: granted ? 'granted' : 'denied' });

        return granted;
      },

      /**
       * Register push token with Firestore
       */
      registerToken: async (userId: string) => {
        const state = get();
        if (state.isRegistering) return false;

        set({ isRegistering: true });

        try {
          // Get push token from Expo
          const token = await pushNotificationService.getExpoPushToken();

          if (!token) {
            return false;
          }

          // Get device info
          const deviceInfo = pushNotificationService.getDeviceInfo();

          // Save to Firestore
          const tokenId = await pushTokensCollection.register({
            userId,
            token,
            platform: deviceInfo.platform,
            deviceName: deviceInfo.deviceName,
          });

          set({
            pushToken: token,
            tokenId,
            isTokenRegistered: true,
          });

          return true;
        } catch (error) {
          logError(error, 'NotificationStore:registerToken');
          return false;
        } finally {
          set({ isRegistering: false });
        }
      },

      /**
       * Deactivate push token (on logout)
       */
      deactivateToken: async () => {
        const { tokenId } = get();

        if (!tokenId) {
          return;
        }

        try {
          await pushTokensCollection.deactivate(tokenId);
        } catch (error) {
          logError(error, 'NotificationStore:deactivateToken');
        }

        // Reset token state
        set({
          pushToken: null,
          tokenId: null,
          isTokenRegistered: false,
        });
      },

      /**
       * Load notification preferences from Firestore
       */
      loadPreferences: async (userId: string) => {
        try {
          const preferences = await notificationPreferencesCollection.get(userId);

          if (preferences) {
            set({ preferences });
          } else {
            // Create default preferences
            const defaultPrefs: NotificationPreferences = {
              id: userId,
              ...DEFAULT_NOTIFICATION_PREFERENCES,
              updatedAt: new Date().toISOString(),
            };

            await notificationPreferencesCollection.save(defaultPrefs);
            set({ preferences: defaultPrefs });
          }
        } catch (error) {
          logError(error, 'NotificationStore:loadPreferences');
        }
      },

      /**
       * Update notification preferences
       */
      updatePreferences: async (updates: Partial<NotificationPreferences>) => {
        const { preferences } = get();
        if (!preferences) return;

        set({ isSavingPreferences: true });

        try {
          const updatedPrefs: NotificationPreferences = {
            ...preferences,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          await notificationPreferencesCollection.save(updatedPrefs);
          set({ preferences: updatedPrefs });
        } catch (error) {
          logError(error, 'NotificationStore:updatePreferences');
          throw error;
        } finally {
          set({ isSavingPreferences: false });
        }
      },

      /**
       * Set last notification tap response for navigation
       */
      setLastTapResponse: (response) => {
        set({ lastTapResponse: response });
      },

      /**
       * Clear last tap response after navigation
       */
      clearLastTapResponse: () => {
        set({ lastTapResponse: null });
      },

      /**
       * Reset store (on logout)
       */
      reset: () => {
        pushNotificationService.cleanup();
        set(initialState);
      },
    }),
    {
      name: 'kifel-notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasAskedPermission: state.hasAskedPermission,
        tokenId: state.tokenId,
      }),
    }
  )
);
