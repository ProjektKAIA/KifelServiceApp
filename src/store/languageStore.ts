// src/store/languageStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '@/src/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'de',

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'kifel-language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
