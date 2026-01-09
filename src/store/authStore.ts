// src/store/authStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { usersCollection } from '../lib/firestore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  useMockAuth: boolean;
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

// Mock-User für Offline-Entwicklung
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
      useMockAuth: !isFirebaseConfigured(),
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
          // Mock-Auth wenn Firebase nicht konfiguriert
          if (get().useMockAuth) {
            console.log('🔐 Using mock authentication (Firebase not configured)');
            await new Promise((resolve) => setTimeout(resolve, 500));

            const mockUser = MOCK_USERS[email.toLowerCase()];

            if (!mockUser || mockUser.password !== password) {
              set({ isLoading: false, error: 'Ungültige Anmeldedaten' });
              return false;
            }

            set({
              user: mockUser.user,
              token: `mock-token-${Date.now()}`,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }

          // Firebase Authentication
          console.log('🔥 Using Firebase authentication');
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

          console.log('🔥 Login successful, role:', userProfile.role);

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
        try {
          if (!get().useMockAuth) {
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
        const { user, useMockAuth } = get();
        if (!user || useMockAuth) return;

        try {
          const freshUserData = await usersCollection.get(user.id);
          if (freshUserData) {
            console.log('🔥 User refreshed, role:', freshUserData.role);
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

  const state = useAuthStore.getState();

  if (state.useMockAuth) {
    useAuthStore.setState({ isLoading: false });
    return;
  }

  // Wait for Firebase Auth to initialize
  firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
    console.log('🔥 Auth state changed:', firebaseUser ? `signed in (${firebaseUser.uid})` : 'signed out');

    if (!firebaseUser) {
      useAuthStore.getState().reset();
      return;
    }

    // Always fetch fresh user data from Firestore
    try {
      const userProfile = await usersCollection.get(firebaseUser.uid);

      if (userProfile) {
        const token = await firebaseUser.getIdToken();
        console.log('🔥 Setting user from Firestore, role:', userProfile.role);

        useAuthStore.setState({
          user: userProfile,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.log('🔥 No profile found for user');
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
