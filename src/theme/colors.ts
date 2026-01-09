// src/theme/colors.ts

export const colors = {
  light: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryGradient: ['#3b82f6', '#6366f1'],
    secondary: '#8b5cf6',
    secondaryLight: '#a78bfa',
    success: '#22c55e',
    successLight: '#4ade80',
    successGradient: ['#22c55e', '#10b981'],
    danger: '#ef4444',
    dangerLight: '#f87171',
    dangerGradient: ['#ef4444', '#dc2626'],
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    info: '#0ea5e9',
    infoLight: '#38bdf8',

    // Semantic colors for status indicators
    statusActive: '#4ade80',
    statusInactive: '#f87171',
    statusPending: '#fbbf24',

    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    surface: 'rgba(0,0,0,0.02)',
    surfaceHover: 'rgba(0,0,0,0.04)',

    text: '#1e293b',
    textSecondary: 'rgba(0,0,0,0.6)',
    textMuted: 'rgba(0,0,0,0.4)',
    textInverse: '#ffffff',

    border: 'rgba(0,0,0,0.1)',
    borderLight: 'rgba(0,0,0,0.05)',

    navBackground: 'rgba(255,255,255,0.95)',
    navBorder: 'rgba(0,0,0,0.05)',
    navInactive: 'rgba(0,0,0,0.35)',

    cardBackground: 'rgba(0,0,0,0.02)',
    cardBorder: 'rgba(0,0,0,0.06)',

    inputBackground: 'rgba(0,0,0,0.03)',
    inputBorder: 'rgba(0,0,0,0.1)',

    pillSuccess: 'rgba(34,197,94,0.12)',
    pillSuccessText: '#16a34a',
    pillWarning: 'rgba(251,191,36,0.15)',
    pillWarningText: '#b45309',
    pillInfo: 'rgba(59,130,246,0.12)',
    pillInfoText: '#2563eb',
    pillDanger: 'rgba(239,68,68,0.12)',
    pillDangerText: '#dc2626',
    pillSecondary: 'rgba(139,92,246,0.12)',
    pillSecondaryText: '#7c3aed',
  },

  dark: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryGradient: ['#3b82f6', '#6366f1'],
    secondary: '#8b5cf6',
    secondaryLight: '#a78bfa',
    success: '#22c55e',
    successLight: '#4ade80',
    successGradient: ['#22c55e', '#10b981'],
    danger: '#ef4444',
    dangerLight: '#f87171',
    dangerGradient: ['#ef4444', '#dc2626'],
    warning: '#fbbf24',
    warningLight: '#fcd34d',
    info: '#0ea5e9',
    infoLight: '#38bdf8',

    // Semantic colors for status indicators
    statusActive: '#4ade80',
    statusInactive: '#f87171',
    statusPending: '#fbbf24',

    background: '#0a0a0f',
    backgroundSecondary: '#1a1a2e',
    surface: 'rgba(255,255,255,0.03)',
    surfaceHover: 'rgba(255,255,255,0.05)',

    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.4)',
    textInverse: '#1e293b',

    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.05)',

    navBackground: 'rgba(10,10,15,0.9)',
    navBorder: 'rgba(255,255,255,0.05)',
    navInactive: 'rgba(255,255,255,0.3)',

    cardBackground: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.06)',

    inputBackground: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.1)',

    pillSuccess: 'rgba(34,197,94,0.15)',
    pillSuccessText: '#4ade80',
    pillWarning: 'rgba(251,191,36,0.15)',
    pillWarningText: '#fbbf24',
    pillInfo: 'rgba(59,130,246,0.15)',
    pillInfoText: '#60a5fa',
    pillDanger: 'rgba(239,68,68,0.15)',
    pillDangerText: '#f87171',
    pillSecondary: 'rgba(139,92,246,0.15)',
    pillSecondaryText: '#a78bfa',
  },
};

export type ColorTheme = typeof colors.light;
export type ThemeMode = 'light' | 'dark';