// src/store/scheduleStore.ts

import { create } from 'zustand';
import { Shift } from '../types';

interface ScheduleState {
  shifts: Shift[];
  currentShift: Shift | null;
  selectedDate: string;
  isLoading: boolean;
  error: string | null;

  setShifts: (shifts: Shift[]) => void;
  addShift: (shift: Shift) => void;
  updateShift: (id: string, data: Partial<Shift>) => void;
  removeShift: (id: string) => void;
  setCurrentShift: (shift: Shift | null) => void;
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getShiftsForDate: (date: string) => Shift[];
  getShiftsForUser: (userId: string) => Shift[];
  reset: () => void;
}

const initialState = {
  shifts: [],
  currentShift: null,
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: false,
  error: null as string | null,
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  ...initialState,

  setShifts: (shifts) => set({ shifts }),

  addShift: (shift) =>
    set((state) => ({ shifts: [...state.shifts, shift] })),

  updateShift: (id, data) =>
    set((state) => ({
      shifts: state.shifts.map((shift) =>
        shift.id === id ? { ...shift, ...data } : shift
      ),
    })),

  removeShift: (id) =>
    set((state) => ({
      shifts: state.shifts.filter((shift) => shift.id !== id),
    })),

  setCurrentShift: (currentShift) => set({ currentShift }),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  getShiftsForDate: (date) => {
    return get().shifts.filter((shift) => shift.date === date);
  },

  getShiftsForUser: (userId) => {
    return get().shifts.filter((shift) => shift.userId === userId);
  },

  reset: () => set(initialState),
}));