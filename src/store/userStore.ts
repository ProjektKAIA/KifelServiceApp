// src/store/userStore.ts

import { create } from 'zustand';
import { User, EmployeeStats, AdminStats } from '../types';

interface UserState {
  employees: User[];
  stats: EmployeeStats | null;
  adminStats: AdminStats | null;
  isLoading: boolean;

  setEmployees: (employees: User[]) => void;
  addEmployee: (employee: User) => void;
  updateEmployee: (id: string, data: Partial<User>) => void;
  removeEmployee: (id: string) => void;
  setStats: (stats: EmployeeStats) => void;
  setAdminStats: (stats: AdminStats) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  employees: [],
  stats: null,
  adminStats: null,
  isLoading: false,
};

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,

  setEmployees: (employees) => set({ employees }),

  addEmployee: (employee) =>
    set((state) => ({ employees: [...state.employees, employee] })),

  updateEmployee: (id, data) =>
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...data } : emp
      ),
    })),

  removeEmployee: (id) =>
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    })),

  setStats: (stats) => set({ stats }),

  setAdminStats: (adminStats) => set({ adminStats }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set(initialState),
}));