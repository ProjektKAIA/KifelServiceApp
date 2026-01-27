// src/i18n/index.ts

export { de } from './translations/de';
export { en } from './translations/en';
export { tr } from './translations/tr';
export { ru } from './translations/ru';
export type { TranslationKey } from './translations/de';

export type Language = 'de' | 'en' | 'tr' | 'ru';

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
  { code: 'tr', label: 'TR' },
  { code: 'ru', label: 'RU' },
];
