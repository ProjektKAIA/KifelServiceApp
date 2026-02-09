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
  pushNotificationsEnabled: boolean;
  offlineModeEnabled: boolean;

  // Admin features
  adminDashboardEnabled: boolean;
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
    pushNotificationsEnabled: isFeatureEnabled('pushNotifications'),
    offlineModeEnabled: isFeatureEnabled('offlineMode'),

    // Admin features
    adminDashboardEnabled: isFeatureEnabled('adminDashboard'),
  }), []);
};
