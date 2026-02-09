// src/hooks/usePushNotifications.ts

import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { pushNotificationService } from '../services/pushNotificationService';
import { isFeatureEnabled } from '../config/features';
import type { NotificationTapResponse, NotificationPreferences } from '../types/notifications';

/**
 * Hook for integrating push notifications in components
 */
export function usePushNotifications() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const {
    pushToken,
    isTokenRegistered,
    permissionStatus,
    hasAskedPermission,
    preferences,
    isInitializing,
    isSavingPreferences,
    lastTapResponse,
    initialize,
    requestPermissions,
    registerToken,
    updatePreferences,
    clearLastTapResponse,
  } = useNotificationStore();

  /**
   * Initialize notifications when user is authenticated
   */
  useEffect(() => {
    if (!isFeatureEnabled('pushNotifications')) return;
    if (!isAuthenticated || !user?.id) return;
    if (isInitializing) return;

    initialize(user.id);
  }, [isAuthenticated, user?.id]);

  /**
   * Handle notification tap navigation
   */
  useEffect(() => {
    if (!lastTapResponse) return;

    handleNotificationNavigation(lastTapResponse);
    clearLastTapResponse();
  }, [lastTapResponse]);

  /**
   * Set up notification tap handler
   */
  useEffect(() => {
    if (!isFeatureEnabled('pushNotifications')) return;

    pushNotificationService.setOnNotificationTap((response) => {
      useNotificationStore.getState().setLastTapResponse(response);
    });
  }, []);

  /**
   * Navigate to appropriate screen based on notification type
   */
  const handleNotificationNavigation = useCallback((response: NotificationTapResponse) => {
    const { type, targetScreen, entityId } = response;

    console.log('[usePushNotifications] Navigating for notification type:', type);

    switch (type) {
      case 'vacation_request_created':
        // Admin goes to requests screen
        if (user?.role === 'admin') {
          router.push('/(admin)/requests');
        }
        break;

      case 'vacation_request_approved':
      case 'vacation_request_rejected':
        // Employee goes to vacation screen
        if (user?.role === 'employee') {
          router.push('/(employee)/vacation');
        }
        break;

      case 'chat_message':
      case 'chat_mention':
        // Go to chat screen
        if (user?.role === 'admin') {
          router.push('/(admin)/chat');
        } else {
          router.push('/(employee)/chat');
        }
        break;

      case 'shift_created':
      case 'shift_updated':
      case 'shift_deleted':
        // Go to schedule screen
        if (user?.role === 'admin') {
          router.push('/(admin)/schedules');
        } else {
          router.push('/(employee)/schedule');
        }
        break;

      case 'invite_accepted':
        // Admin goes to team screen
        if (user?.role === 'admin') {
          router.push('/(admin)/team');
        }
        break;

      case 'profile_updated':
        // Admin goes to notifications (if we have a dedicated screen)
        // For now, just go to dashboard
        if (user?.role === 'admin') {
          router.push('/(admin)');
        }
        break;

      default:
        // Use targetScreen if provided
        if (targetScreen) {
          router.push(targetScreen as any);
        }
    }
  }, [user?.role, router]);

  /**
   * Request push notification permissions
   */
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!isFeatureEnabled('pushNotifications')) return false;
    if (!user?.id) return false;

    const granted = await requestPermissions();

    if (granted) {
      await registerToken(user.id);
    }

    return granted;
  }, [user?.id, requestPermissions, registerToken]);

  /**
   * Update a specific preference
   */
  const setPreference = useCallback(
    async <K extends keyof NotificationPreferences>(
      key: K,
      value: NotificationPreferences[K]
    ): Promise<void> => {
      await updatePreferences({ [key]: value });
    },
    [updatePreferences]
  );

  /**
   * Toggle quiet hours
   */
  const toggleQuietHours = useCallback(
    async (enabled: boolean): Promise<void> => {
      await updatePreferences({ quietHoursEnabled: enabled });
    },
    [updatePreferences]
  );

  /**
   * Set quiet hours time range
   */
  const setQuietHours = useCallback(
    async (start: string, end: string): Promise<void> => {
      await updatePreferences({
        quietHoursStart: start,
        quietHoursEnd: end,
      });
    },
    [updatePreferences]
  );

  /**
   * Check if notifications are fully enabled
   */
  const isFullyEnabled =
    isFeatureEnabled('pushNotifications') &&
    permissionStatus === 'granted' &&
    isTokenRegistered &&
    preferences?.enabled === true;

  return {
    // State
    isEnabled: isFullyEnabled,
    isTokenRegistered,
    permissionStatus,
    hasAskedPermission,
    preferences,
    isLoading: isInitializing,
    isSaving: isSavingPreferences,

    // Actions
    enableNotifications,
    setPreference,
    updatePreferences,
    toggleQuietHours,
    setQuietHours,

    // Feature check
    isFeatureAvailable: isFeatureEnabled('pushNotifications'),
  };
}

export default usePushNotifications;
