// src/hooks/useTranslation.ts

import { useLanguageStore } from '@/src/store/languageStore';
import { de, en, tr, ru } from '@/src/i18n';
import type { Language, TranslationKey } from '@/src/i18n';

const translations: Record<Language, Record<string, string>> = { de, en, tr, ru };

interface UseTranslationReturn {
  t: (key: TranslationKey) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useTranslation = (): UseTranslationReturn => {
  const { language, setLanguage } = useLanguageStore();

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] ?? translations.de[key] ?? key;
  };

  return { t, language, setLanguage };
};
