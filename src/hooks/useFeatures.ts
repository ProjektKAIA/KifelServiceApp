// src/hooks/useFeatures.ts

import { useMemo } from 'react';
import { features, FeatureFlags, isFeatureEnabled } from '@/src/config/features';

interface UseFeatureReturn {
  features: FeatureFlags;
  isEnabled: (feature: keyof FeatureFlags) => boolean;

  // Convenience getters for common feature checks
  timeTrackingEnabled: boolean;
  gpsTrackingEnabled: boolean;
  scheduleEnabled: boolean;
  vacationEnabled: boolean;
  sickLeaveEnabled: boolean;
  chatEnabled: boolean;
  darkModeEnabled: boolean;
  pushNotificationsEnabled: boolean;
  offlineModeEnabled: boolean;

  // Public features
  publicAboutEnabled: boolean;
  publicContactEnabled: boolean;
  publicCareerEnabled: boolean;

  // Admin features
  adminDashboardEnabled: boolean;
  adminReportsEnabled: boolean;
  adminChatModerationEnabled: boolean;
}

export const useFeatures = (): UseFeatureReturn => {
  return useMemo(() => ({
    features,
    isEnabled: isFeatureEnabled,

    // Convenience getters
    timeTrackingEnabled: isFeatureEnabled('timeTracking'),
    gpsTrackingEnabled: isFeatureEnabled('gpsTracking'),
    scheduleEnabled: isFeatureEnabled('schedule'),
    vacationEnabled: isFeatureEnabled('vacation'),
    sickLeaveEnabled: isFeatureEnabled('sickLeave'),
    chatEnabled: isFeatureEnabled('chat'),
    darkModeEnabled: isFeatureEnabled('darkMode'),
    pushNotificationsEnabled: isFeatureEnabled('pushNotifications'),
    offlineModeEnabled: isFeatureEnabled('offlineMode'),

    // Public features
    publicAboutEnabled: isFeatureEnabled('publicAbout'),
    publicContactEnabled: isFeatureEnabled('publicContact'),
    publicCareerEnabled: isFeatureEnabled('publicCareer'),

    // Admin features
    adminDashboardEnabled: isFeatureEnabled('adminDashboard'),
    adminReportsEnabled: isFeatureEnabled('adminReports'),
    adminChatModerationEnabled: isFeatureEnabled('adminChatModeration'),
  }), []);
};
