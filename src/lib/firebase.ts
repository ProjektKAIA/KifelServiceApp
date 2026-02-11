// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is available in React Native bundle
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import {
  getFirestore,
  Firestore
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('DEIN-')
  );
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured()) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Initialize Auth with AsyncStorage persistence for React Native
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    app = getApps()[0];
    auth = getAuth(app);
  }
  db = getFirestore(app);
  storage = getStorage(app);
} else {
}

export { app, auth, db, storage };

// Auth Helper Functions
export const firebaseAuth = {
  // Login
  signIn: async (email: string, password: string) => {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase not configured');
    }
    return signInWithEmailAndPassword(auth, email, password);
  },

  // Registrierung
  signUp: async (email: string, password: string) => {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase not configured');
    }
    return createUserWithEmailAndPassword(auth, email, password);
  },

  // Logout
  signOut: async () => {
    if (!isFirebaseConfigured() || !auth) {
      return;
    }
    return firebaseSignOut(auth);
  },

  // Aktuellen User abrufen
  getCurrentUser: (): FirebaseUser | null => {
    if (!isFirebaseConfigured() || !auth) {
      return null;
    }
    return auth.currentUser;
  },

  // Auth State Listener
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    if (!isFirebaseConfigured() || !auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },

  // Passwort zurücksetzen
  resetPassword: async (email: string) => {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase not configured');
    }
    return sendPasswordResetEmail(auth, email);
  },
};

export default app;
