// src/store/locationStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location as AppLocation } from '@/src/types';
import { locationsCollection } from '@/src/lib/firestore';
import { logError } from '@/src/utils/errorHandler';

interface LocationStoreState {
  locations: AppLocation[];
  isLoading: boolean;
  lastFetched: number | null;

  fetchLocations: () => Promise<void>;
  getLocationById: (id: string) => AppLocation | undefined;
}

export const useLocationStore = create<LocationStoreState>()(
  persist(
    (set, get) => ({
      locations: [],
      isLoading: false,
      lastFetched: null,

      fetchLocations: async () => {
        set({ isLoading: true });
        try {
          const locations = await locationsCollection.getAll();
          set({ locations, isLoading: false, lastFetched: Date.now() });
        } catch (error) {
          logError(error, 'locationStore.fetchLocations');
          set({ isLoading: false });
        }
      },

      getLocationById: (id: string) => {
        return get().locations.find((loc) => loc.id === id);
      },
    }),
    {
      name: 'kifel-locations-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        locations: state.locations,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
