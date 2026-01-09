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
  date: string;
  clockIn: number | null;
  clockOut: number | null;
  clockInLocation: LocationData | null;
  clockOutLocation: LocationData | null;
  locationHistory: LocationData[];
  breakMinutes: number;
  breakStart: number | null;
  notes?: string;
  status: 'active' | 'completed' | 'pending_review';
  shiftId?: string;
}

interface TimeState {
  currentEntry: TimeEntry | null;
  entries: TimeEntry[];
  isTracking: boolean;
  isWorking: boolean;
  isOnBreak: boolean;
  elapsedSeconds: number;
  todayHours: number;
  currentLocation: LocationData | null;
  locationError: string | null;
  isLocationLoading: boolean;
  error: string | null;
  isLoading: boolean;

  // Actions
  clockIn: (userId?: string, location?: LocationData, shiftId?: string) => void;
  clockOut: (location?: LocationData) => void;
  startBreak: () => void;
  endBreak: () => void;
  updateLocation: (location: LocationData) => void;
  setLocationError: (error: string | null) => void;
  setLocationLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateElapsedTime: () => void;
  addBreakTime: (minutes: number) => void;
  addNote: (note: string) => void;
  getEntriesForDate: (date: string) => TimeEntry[];
  getEntriesForMonth: (year: number, month: number) => TimeEntry[];
  getTotalHoursForMonth: (year: number, month: number) => number;
  resetCurrentEntry: () => void;
  calculateTodayHours: () => void;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
};

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      currentEntry: null,
      entries: [],
      isTracking: false,
      isWorking: false,
      isOnBreak: false,
      elapsedSeconds: 0,
      todayHours: 0,
      currentLocation: null,
      locationError: null,
      isLocationLoading: false,
      error: null,
      isLoading: false,

      clockIn: (userId = 'default-user', location, shiftId) => {
        const now = Date.now();
        const newEntry: TimeEntry = {
          id: generateId(),
          userId,
          date: formatDate(now),
          clockIn: now,
          clockOut: null,
          clockInLocation: location || null,
          clockOutLocation: null,
          locationHistory: location ? [location] : [],
          breakMinutes: 0,
          breakStart: null,
          status: 'active',
          shiftId,
        };

        set({
          currentEntry: newEntry,
          isTracking: true,
          isWorking: true,
          isOnBreak: false,
          elapsedSeconds: 0,
          currentLocation: location || null,
          locationError: null,
        });
      },

      clockOut: (location) => {
        const { currentEntry, entries, isOnBreak } = get();
        if (!currentEntry) return;

        // Falls noch in Pause, diese beenden
        let finalBreakMinutes = currentEntry.breakMinutes;
        if (isOnBreak && currentEntry.breakStart) {
          const breakDuration = Math.floor((Date.now() - currentEntry.breakStart) / 1000 / 60);
          finalBreakMinutes += breakDuration;
        }

        const now = Date.now();
        const completedEntry: TimeEntry = {
          ...currentEntry,
          clockOut: now,
          clockOutLocation: location || null,
          locationHistory: location 
            ? [...currentEntry.locationHistory, location] 
            : currentEntry.locationHistory,
          breakMinutes: finalBreakMinutes,
          breakStart: null,
          status: 'completed',
        };

        set({
          currentEntry: null,
          entries: [...entries, completedEntry],
          isTracking: false,
          isWorking: false,
          isOnBreak: false,
          elapsedSeconds: 0,
        });

        // Heute-Stunden neu berechnen
        get().calculateTodayHours();
      },

      startBreak: () => {
        const { currentEntry } = get();
        if (!currentEntry || !currentEntry.clockIn) return;

        set({
          isOnBreak: true,
          currentEntry: {
            ...currentEntry,
            breakStart: Date.now(),
          },
        });
      },

      endBreak: () => {
        const { currentEntry } = get();
        if (!currentEntry || !currentEntry.breakStart) return;

        const breakDuration = Math.floor((Date.now() - currentEntry.breakStart) / 1000 / 60);

        set({
          isOnBreak: false,
          currentEntry: {
            ...currentEntry,
            breakMinutes: currentEntry.breakMinutes + breakDuration,
            breakStart: null,
          },
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

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      updateElapsedTime: () => {
        const { currentEntry, isTracking, isOnBreak } = get();
        if (!isTracking || !currentEntry?.clockIn) return;

        let elapsed = Math.floor((Date.now() - currentEntry.clockIn) / 1000);
        
        // Pausenzeit abziehen
        elapsed -= currentEntry.breakMinutes * 60;
        
        // Aktuelle Pause abziehen
        if (isOnBreak && currentEntry.breakStart) {
          const currentBreakSeconds = Math.floor((Date.now() - currentEntry.breakStart) / 1000);
          elapsed -= currentBreakSeconds;
        }

        set({ elapsedSeconds: Math.max(0, elapsed) });
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

      calculateTodayHours: () => {
        const today = getTodayDateString();
        const todayEntries = get().entries.filter((e) => e.date === today);
        
        let totalMinutes = 0;
        for (const entry of todayEntries) {
          if (entry.clockIn && entry.clockOut) {
            const durationMinutes = (entry.clockOut - entry.clockIn) / 1000 / 60;
            totalMinutes += durationMinutes - entry.breakMinutes;
          }
        }

        set({ todayHours: Math.round((totalMinutes / 60) * 10) / 10 });
      },

      resetCurrentEntry: () => {
        set({
          currentEntry: null,
          isTracking: false,
          isWorking: false,
          isOnBreak: false,
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
        isWorking: state.isWorking,
        isOnBreak: state.isOnBreak,
        todayHours: state.todayHours,
      }),
    }
  )
);