// src/types/notifications.ts

/**
 * Push Token stored in Firestore
 */
export interface PushToken {
  id: string;
  userId: string;
  token: string; // ExpoPushToken
  platform: 'ios' | 'android';
  deviceName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User notification preferences stored in Firestore
 */
export interface NotificationPreferences {
  id: string; // Same as userId
  enabled: boolean;

  // Vacation & Absence
  vacationRequests: boolean;
  vacationUpdates: boolean;

  // Chat
  chatMessages: boolean;
  chatMentions: boolean;

  // Shifts
  shiftChanges: boolean;

  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format, e.g. "22:00"
  quietHoursEnd: string;   // HH:mm format, e.g. "07:00"

  updatedAt: string;
}

/**
 * Default notification preferences for new users
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'id' | 'updatedAt'> = {
  enabled: true,
  vacationRequests: true,
  vacationUpdates: true,
  chatMessages: true,
  chatMentions: true,
  shiftChanges: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

/**
 * Notification categories for Android channels
 */
export type NotificationChannel = 'chat' | 'vacation' | 'shifts' | 'system';

/**
 * Notification channel configuration
 */
export interface NotificationChannelConfig {
  id: NotificationChannel;
  name: string;
  description: string;
  importance: 'default' | 'high' | 'low' | 'max' | 'min';
  sound: boolean;
  vibration: boolean;
}

/**
 * Push notification payload structure
 */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}

/**
 * Notification types for routing and handling
 */
export type NotificationType =
  | 'vacation_request_created'
  | 'vacation_request_approved'
  | 'vacation_request_rejected'
  | 'chat_message'
  | 'chat_mention'
  | 'shift_created'
  | 'shift_updated'
  | 'shift_deleted'
  | 'invite_accepted'
  | 'profile_updated'
  | 'system';

/**
 * Data payload attached to notifications for deep linking
 */
export interface NotificationData {
  type: NotificationType;
  targetScreen?: string;
  entityId?: string;
  userId?: string;
  [key: string]: string | undefined;
}

/**
 * Notification response when user taps on notification
 */
export interface NotificationTapResponse {
  type: NotificationType;
  targetScreen?: string;
  entityId?: string;
}
