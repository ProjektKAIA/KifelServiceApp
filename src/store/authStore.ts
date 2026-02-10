// src/store/authStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { usersCollection, pushTokensCollection } from '../lib/firestore';
import { isFeatureEnabled } from '../config/features';
import { useNotificationStore } from './notificationStore';

// Dev Test-Accounts (ohne Firebase)
const DEV_ACCOUNTS: Record<string, { password: string; user: User }> = {
  'admin@dev.local': {
    password: 'admin',
    user: {
      id: 'dev-admin-001',
      email: 'admin@dev.local',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'test@dev.local': {
    password: 'test',
    user: {
      id: 'dev-employee-001',
      email: 'test@dev.local',
      firstName: 'Max',
      lastName: 'Mustermann',
      role: 'employee',
      status: 'active',
      location: 'Düsseldorf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  _hasHydrated: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
}


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => set({ token }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // DEV: Check for dev accounts first (only in __DEV__ mode)
          if (__DEV__ && DEV_ACCOUNTS[email.toLowerCase()]) {
            const devAccount = DEV_ACCOUNTS[email.toLowerCase()];
            if (password === devAccount.password) {
              set({
                user: devAccount.user,
                token: 'dev-token-' + Date.now(),
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return true;
            } else {
              set({ isLoading: false, error: 'Falsches Dev-Passwort' });
              return false;
            }
          }

          // Check if Firebase is configured
          if (!isFirebaseConfigured()) {
            set({ isLoading: false, error: 'Firebase ist nicht konfiguriert. Bitte kontaktieren Sie den Support.' });
            return false;
          }

          // Firebase Authentication
          const userCredential = await firebaseAuth.signIn(email, password);
          const firebaseUser = userCredential.user;

          // Get or create user profile from Firestore
          let userProfile = await usersCollection.get(firebaseUser.uid);

          if (!userProfile) {
            // Create profile for new user
            const nameParts = firebaseUser.displayName?.split(' ') || ['Neuer', 'Mitarbeiter'];
            await usersCollection.create(firebaseUser.uid, {
              email: firebaseUser.email || email,
              firstName: nameParts[0] || 'Neuer',
              lastName: nameParts.slice(1).join(' ') || 'Mitarbeiter',
              role: 'employee',
            });
            userProfile = await usersCollection.get(firebaseUser.uid);
          }

          if (!userProfile) {
            set({ isLoading: false, error: 'Profil konnte nicht geladen werden' });
            return false;
          }

          const token = await firebaseUser.getIdToken();

          set({
            user: userProfile,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (err: any) {
          let errorMessage = 'Ein Fehler ist aufgetreten';

          if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            errorMessage = 'Ungültige Anmeldedaten';
          } else if (err.code === 'auth/user-not-found') {
            errorMessage = 'Benutzer nicht gefunden';
          } else if (err.code === 'auth/too-many-requests') {
            errorMessage = 'Zu viele Versuche. Bitte später erneut versuchen.';
          } else if (err.code === 'auth/network-request-failed') {
            errorMessage = 'Netzwerkfehler. Bitte Verbindung prüfen.';
          } else if (err.message) {
            errorMessage = err.message;
          }

          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      logout: async () => {
        const { user } = get();

        try {
          // Deactivate push tokens before logout
          if (isFeatureEnabled('pushNotifications') && user?.id) {
            try {
              await pushTokensCollection.deactivateAllForUser(user.id);
            } catch (tokenError) {
              console.error('[Auth] Error deactivating push tokens:', tokenError);
            }
          }

          // Reset notification store state
          useNotificationStore.getState().reset();

          if (isFirebaseConfigured()) {
            await firebaseAuth.signOut();
          }
        } catch (error) {
          console.error('Logout error:', error);
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Refresh user data from Firestore
      refreshUser: async () => {
        const { user } = get();
        if (!user || !isFirebaseConfigured()) return;

        try {
          const freshUserData = await usersCollection.get(user.id);
          if (freshUserData) {
            set({ user: freshUserData });
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
        }
      },

      reset: () => {
        set({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: 'kifel-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // WICHTIG: Nur Token speichern, NICHT die User-Daten
      // User-Daten werden immer frisch aus Firestore geladen
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // User-ID für Refresh speichern, aber nicht die kompletten Daten
        _userId: state.user?.id,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

// Initialize auth state after hydration
let authInitialized = false;

const initializeAuth = async () => {
  if (authInitialized) return;
  authInitialized = true;

  if (!isFirebaseConfigured()) {
    useAuthStore.setState({ isLoading: false });
    return;
  }

  // Wait for Firebase Auth to initialize
  firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
      useAuthStore.getState().reset();
      return;
    }

    // Always fetch fresh user data from Firestore
    try {
      const userProfile = await usersCollection.get(firebaseUser.uid);

      if (userProfile) {
        const token = await firebaseUser.getIdToken();

        useAuthStore.setState({
          user: userProfile,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        useAuthStore.setState({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      useAuthStore.setState({ isLoading: false });
    }
  });
};

// Start initialization when Firebase is configured
if (isFirebaseConfigured()) {
  initializeAuth();
} else {
  useAuthStore.setState({ isLoading: false });
}
