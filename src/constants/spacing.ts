// src/constants/spacing.ts

// Re-export aus theme für Konsistenz
export { spacing, borderRadius } from '@/src/theme/spacing';

export type Spacing = keyof typeof import('@/src/theme/spacing').spacing;
export type BorderRadius = keyof typeof import('@/src/theme/spacing').borderRadius;