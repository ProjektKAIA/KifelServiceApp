// src/store/authStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithToken: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

// Mock-User für Entwicklung
const MOCK_USERS: Record<string, { user: User; password: string }> = {
  'admin@kifel.de': {
    password: 'admin123',
    user: {
      id: 'admin-1',
      email: 'admin@kifel.de',
      firstName: 'Alexander',
      lastName: 'Kifel',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'max@kifel.de': {
    password: 'max123',
    user: {
      id: 'emp-1',
      email: 'max@kifel.de',
      firstName: 'Max',
      lastName: 'Mustermann',
      role: 'employee',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => set({ token }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Simulierte API-Verzögerung
          await new Promise((resolve) => setTimeout(resolve, 500));

          const mockUser = MOCK_USERS[email.toLowerCase()];

          if (!mockUser || mockUser.password !== password) {
            set({ isLoading: false, error: 'Ungültige Anmeldedaten' });
            return false;
          }

          const token = `mock-token-${Date.now()}`;

          set({
            user: mockUser.user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      loginWithToken: async (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      loadStoredAuth: async () => {
        // Persist middleware lädt automatisch
        // Nur isLoading auf false setzen
        set({ isLoading: false });
      },
    }),
    {
      name: 'kifel-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);