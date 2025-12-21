// src/store/timeStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  address?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockIn: number | null; // Unix timestamp
  clockOut: number | null; // Unix timestamp
  clockInLocation: LocationData | null;
  clockOutLocation: LocationData | null;
  locationHistory: LocationData[];
  breakMinutes: number;
  notes?: string;
  status: 'active' | 'completed' | 'pending_review';
  shiftId?: string;
}

interface TimeState {
  currentEntry: TimeEntry | null;
  entries: TimeEntry[];
  isTracking: boolean;
  elapsedSeconds: number;
  currentLocation: LocationData | null;
  locationError: string | null;
  isLocationLoading: boolean;

  // Actions
  clockIn: (userId: string, location: LocationData, shiftId?: string) => void;
  clockOut: (location: LocationData) => void;
  updateLocation: (location: LocationData) => void;
  setLocationError: (error: string | null) => void;
  setLocationLoading: (loading: boolean) => void;
  updateElapsedTime: () => void;
  addBreakTime: (minutes: number) => void;
  addNote: (note: string) => void;
  getEntriesForDate: (date: string) => TimeEntry[];
  getEntriesForMonth: (year: number, month: number) => TimeEntry[];
  getTotalHoursForMonth: (year: number, month: number) => number;
  resetCurrentEntry: () => void;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
};

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      currentEntry: null,
      entries: [],
      isTracking: false,
      elapsedSeconds: 0,
      currentLocation: null,
      locationError: null,
      isLocationLoading: false,

      clockIn: (userId, location, shiftId) => {
        const now = Date.now();
        const newEntry: TimeEntry = {
          id: generateId(),
          userId,
          date: formatDate(now),
          clockIn: now,
          clockOut: null,
          clockInLocation: location,
          clockOutLocation: null,
          locationHistory: [location],
          breakMinutes: 0,
          status: 'active',
          shiftId,
        };

        set({
          currentEntry: newEntry,
          isTracking: true,
          elapsedSeconds: 0,
          currentLocation: location,
          locationError: null,
        });
      },

      clockOut: (location) => {
        const { currentEntry, entries } = get();
        if (!currentEntry) return;

        const now = Date.now();
        const completedEntry: TimeEntry = {
          ...currentEntry,
          clockOut: now,
          clockOutLocation: location,
          locationHistory: [...currentEntry.locationHistory, location],
          status: 'completed',
        };

        set({
          currentEntry: null,
          entries: [...entries, completedEntry],
          isTracking: false,
          elapsedSeconds: 0,
          currentLocation: null,
        });
      },

      updateLocation: (location) => {
        const { currentEntry } = get();
        if (!currentEntry) {
          set({ currentLocation: location });
          return;
        }

        set({
          currentLocation: location,
          currentEntry: {
            ...currentEntry,
            locationHistory: [...currentEntry.locationHistory, location],
          },
        });
      },

      setLocationError: (error) => set({ locationError: error }),

      setLocationLoading: (loading) => set({ isLocationLoading: loading }),

      updateElapsedTime: () => {
        const { currentEntry, isTracking } = get();
        if (!isTracking || !currentEntry?.clockIn) return;

        const elapsed = Math.floor((Date.now() - currentEntry.clockIn) / 1000);
        set({ elapsedSeconds: elapsed });
      },

      addBreakTime: (minutes) => {
        const { currentEntry } = get();
        if (!currentEntry) return;

        set({
          currentEntry: {
            ...currentEntry,
            breakMinutes: currentEntry.breakMinutes + minutes,
          },
        });
      },

      addNote: (note) => {
        const { currentEntry } = get();
        if (!currentEntry) return;

        set({
          currentEntry: {
            ...currentEntry,
            notes: note,
          },
        });
      },

      getEntriesForDate: (date) => {
        return get().entries.filter((entry) => entry.date === date);
      },

      getEntriesForMonth: (year, month) => {
        const monthStr = month.toString().padStart(2, '0');
        const prefix = `${year}-${monthStr}`;
        return get().entries.filter((entry) => entry.date.startsWith(prefix));
      },

      getTotalHoursForMonth: (year, month) => {
        const monthEntries = get().getEntriesForMonth(year, month);
        let totalMinutes = 0;

        for (const entry of monthEntries) {
          if (entry.clockIn && entry.clockOut) {
            const durationMinutes = (entry.clockOut - entry.clockIn) / 1000 / 60;
            totalMinutes += durationMinutes - entry.breakMinutes;
          }
        }

        return Math.round((totalMinutes / 60) * 10) / 10;
      },

      resetCurrentEntry: () => {
        set({
          currentEntry: null,
          isTracking: false,
          elapsedSeconds: 0,
        });
      },
    }),
    {
      name: 'kifel-time-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
        currentEntry: state.currentEntry,
        isTracking: state.isTracking,
      }),
    }
  )
);