// src/services/pushNotificationService.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { logError } from '../utils/errorHandler';
import { isFeatureEnabled } from '../config/features';
import type {
  NotificationChannel,
  NotificationChannelConfig,
  NotificationData,
  NotificationTapResponse,
} from '../types/notifications';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Android notification channel configurations
 */
const NOTIFICATION_CHANNELS: NotificationChannelConfig[] = [
  {
    id: 'chat',
    name: 'Chat-Nachrichten',
    description: 'Benachrichtigungen fuer neue Chat-Nachrichten',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  {
    id: 'vacation',
    name: 'Urlaub & Abwesenheit',
    description: 'Benachrichtigungen fuer Urlaubsantraege und Updates',
    importance: 'default',
    sound: true,
    vibration: true,
  },
  {
    id: 'shifts',
    name: 'Schichten & Dienstplan',
    description: 'Benachrichtigungen fuer Schichtaenderungen',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  {
    id: 'system',
    name: 'Systembenachrichtigungen',
    description: 'Allgemeine Systemmeldungen',
    importance: 'default',
    sound: true,
    vibration: false,
  },
];

/**
 * Map importance string to Expo importance value
 */
function getImportance(importance: NotificationChannelConfig['importance']): Notifications.AndroidImportance {
  switch (importance) {
    case 'max':
      return Notifications.AndroidImportance.MAX;
    case 'high':
      return Notifications.AndroidImportance.HIGH;
    case 'low':
      return Notifications.AndroidImportance.LOW;
    case 'min':
      return Notifications.AndroidImportance.MIN;
    default:
      return Notifications.AndroidImportance.DEFAULT;
  }
}

/**
 * Push Notification Service for managing Expo push notifications
 */
class PushNotificationService {
  private isInitialized = false;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private onNotificationTap: ((response: NotificationTapResponse) => void) | null = null;

  /**
   * Initialize the push notification service
   * Sets up Android channels and notification listeners
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (!isFeatureEnabled('pushNotifications')) {
      return;
    }

    try {
      // Setup Android notification channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Setup notification listeners
      this.setupListeners();

      this.isInitialized = true;
    } catch (error) {
      logError(error, 'PushNotificationService:initialize');
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    for (const channel of NOTIFICATION_CHANNELS) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: getImportance(channel.importance),
        sound: channel.sound ? 'default' : undefined,
        vibrationPattern: channel.vibration ? [0, 250, 250, 250] : undefined,
        enableVibrate: channel.vibration,
        enableLights: true,
        lightColor: '#1a73e8',
      });
    }
  }

  /**
   * Setup notification listeners for foreground and tap handling
   */
  private setupListeners(): void {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener((_notification) => {
      // Notification received in foreground
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData | undefined;

      if (this.onNotificationTap && data) {
        this.onNotificationTap({
          type: data.type,
          targetScreen: data.targetScreen,
          entityId: data.entityId,
        });
      }
    });
  }

  /**
   * Set callback for notification tap events
   */
  setOnNotificationTap(callback: (response: NotificationTapResponse) => void): void {
    this.onNotificationTap = callback;
  }

  /**
   * Check if device can receive push notifications
   */
  canReceivePushNotifications(): boolean {
    if (!Device.isDevice) {
      return false;
    }
    return true;
  }

  /**
   * Get current notification permission status
   */
  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Request notification permissions from user
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.canReceivePushNotifications()) {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();

      return status === 'granted';
    } catch (error) {
      logError(error, 'PushNotificationService:requestPermissions');
      return false;
    }
  }

  /**
   * Get the Expo push token for this device
   */
  async getExpoPushToken(): Promise<string | null> {
    if (!this.canReceivePushNotifications()) {
      return null;
    }

    try {
      // Ensure permissions are granted
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get project ID from Expo config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        // No project ID found - using default
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return tokenData.data;
    } catch (error) {
      logError(error, 'PushNotificationService:getExpoPushToken');
      return null;
    }
  }

  /**
   * Get device platform information
   */
  getDeviceInfo(): { platform: 'ios' | 'android'; deviceName: string | null } {
    return {
      platform: Platform.OS as 'ios' | 'android',
      deviceName: Device.deviceName,
    };
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    channel: NotificationChannel = 'system',
    data?: NotificationData
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as Record<string, unknown>,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: channel }),
      },
      trigger: null, // Immediate
    });

    return identifier;
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count (iOS)
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count (iOS)
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge count (iOS)
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Cleanup listeners on unmount
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }

    this.onNotificationTap = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
