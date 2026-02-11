// src/store/languageStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '@/src/i18n';
import { usersCollection } from '@/src/lib/firestore';
import { useAuthStore } from './authStore';
import { logError } from '@/src/utils/errorHandler';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  syncLanguageToFirestore: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'de',

      setLanguage: (language) => {
        set({ language });
        // Sync to Firestore if user is authenticated
        get().syncLanguageToFirestore();
      },

      // Sync language preference to Firestore for push notifications
      syncLanguageToFirestore: async () => {
        const { user } = useAuthStore.getState();
        if (!user?.id) return;

        try {
          await usersCollection.update(user.id, {
            language: get().language,
          });

        } catch (error) {
          logError(error, 'LanguageStore:syncLanguageToFirestore');
        }
      },
    }),
    {
      name: 'kifel-language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
