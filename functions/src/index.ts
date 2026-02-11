/**
 * Firebase Cloud Functions for KifelService Push Notifications
 *
 * These functions trigger push notifications when specific events occur in Firestore.
 * Supports multilingual notifications (DE, EN, TR, RU) based on user preferences.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Expo SDK
const expo = new Expo();

// Supported languages
type Language = 'de' | 'en' | 'tr' | 'ru';
const DEFAULT_LANGUAGE: Language = 'de';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const translations: Record<Language, {
  // Vacation
  vacationRequestNew: string;
  vacationRequestNewBody: (name: string) => string;
  vacationApproved: string;
  vacationApprovedBody: (startDate: string, endDate: string) => string;
  vacationRejected: string;
  vacationRejectedBody: (startDate: string, endDate: string) => string;

  // Chat
  chatNewMessage: (name: string) => string;
  chatMention: (name: string) => string;
  chatAllMention: (name: string) => string;

  // Shifts
  shiftNew: string;
  shiftNewBody: (date: string, start: string, end: string) => string;
  shiftUpdated: string;
  shiftUpdatedBody: (date: string, start: string, end: string) => string;
  shiftCancelled: string;
  shiftCancelledBody: (date: string) => string;

  // Invite
  inviteAccepted: string;
  inviteAcceptedBody: (name: string) => string;

  // Time Entry Approval
  timeEntryFlagged: string;
  timeEntryFlaggedBody: (name: string) => string;
  timeEntryApproved: string;
  timeEntryApprovedBody: (date: string) => string;
  timeEntryRejected: string;
  timeEntryRejectedBody: (date: string) => string;
}> = {
  // German (Default)
  de: {
    vacationRequestNew: 'Neuer Urlaubsantrag',
    vacationRequestNewBody: (name) => `${name} hat einen Urlaubsantrag eingereicht`,
    vacationApproved: 'Urlaubsantrag genehmigt',
    vacationApprovedBody: (start, end) => `Ihr Urlaubsantrag vom ${start} bis ${end} wurde genehmigt`,
    vacationRejected: 'Urlaubsantrag abgelehnt',
    vacationRejectedBody: (start, end) => `Ihr Urlaubsantrag vom ${start} bis ${end} wurde abgelehnt`,

    chatNewMessage: (name) => `Neue Nachricht von ${name}`,
    chatMention: (name) => `${name} hat Sie erwähnt`,
    chatAllMention: (name) => `${name} hat alle erwähnt`,

    shiftNew: 'Neue Schicht zugewiesen',
    shiftNewBody: (date, start, end) => `${date}: ${start} - ${end}`,
    shiftUpdated: 'Schicht geändert',
    shiftUpdatedBody: (date, start, end) => `${date}: ${start} - ${end}`,
    shiftCancelled: 'Schicht storniert',
    shiftCancelledBody: (date) => `Ihre Schicht am ${date} wurde storniert`,

    inviteAccepted: 'Einladung angenommen',
    inviteAcceptedBody: (name) => `${name} ist dem Team beigetreten`,

    timeEntryFlagged: 'Zeiteintrag zur Prüfung',
    timeEntryFlaggedBody: (name) => `${name} hat sich am falschen Standort eingestempelt`,
    timeEntryApproved: 'Zeiteintrag genehmigt',
    timeEntryApprovedBody: (date) => `Ihr Zeiteintrag vom ${date} wurde genehmigt`,
    timeEntryRejected: 'Zeiteintrag abgelehnt',
    timeEntryRejectedBody: (date) => `Ihr Zeiteintrag vom ${date} wurde abgelehnt`,
  },

  // English
  en: {
    vacationRequestNew: 'New vacation request',
    vacationRequestNewBody: (name) => `${name} has submitted a vacation request`,
    vacationApproved: 'Vacation request approved',
    vacationApprovedBody: (start, end) => `Your vacation request from ${start} to ${end} has been approved`,
    vacationRejected: 'Vacation request rejected',
    vacationRejectedBody: (start, end) => `Your vacation request from ${start} to ${end} has been rejected`,

    chatNewMessage: (name) => `New message from ${name}`,
    chatMention: (name) => `${name} mentioned you`,
    chatAllMention: (name) => `${name} mentioned everyone`,

    shiftNew: 'New shift assigned',
    shiftNewBody: (date, start, end) => `${date}: ${start} - ${end}`,
    shiftUpdated: 'Shift changed',
    shiftUpdatedBody: (date, start, end) => `${date}: ${start} - ${end}`,
    shiftCancelled: 'Shift cancelled',
    shiftCancelledBody: (date) => `Your shift on ${date} has been cancelled`,

    inviteAccepted: 'Invitation accepted',
    inviteAcceptedBody: (name) => `${name} has joined the team`,

    timeEntryFlagged: 'Time entry flagged for review',
    timeEntryFlaggedBody: (name) => `${name} clocked in at the wrong location`,
    timeEntryApproved: 'Time entry approved',
    timeEntryApprovedBody: (date) => `Your time entry from ${date} has been approved`,
    timeEntryRejected: 'Time entry rejected',
    timeEntryRejectedBody: (date) => `Your time entry from ${date} has been rejected`,
  },

  // Turkish
  tr: {
    vacationRequestNew: 'Yeni izin talebi',
    vacationRequestNewBody: (name) => `${name} bir izin talebi gönderdi`,
    vacationApproved: 'İzin talebi onaylandı',
    vacationApprovedBody: (start, end) => `${start} - ${end} tarihleri arasındaki izin talebiniz onaylandı`,
    vacationRejected: 'İzin talebi reddedildi',
    vacationRejectedBody: (start, end) => `${start} - ${end} tarihleri arasındaki izin talebiniz reddedildi`,

    chatNewMessage: (name) => `${name} adlı kişiden yeni mesaj`,
    chatMention: (name) => `${name} sizden bahsetti`,
    chatAllMention: (name) => `${name} herkesten bahsetti`,

    shiftNew: 'Yeni vardiya atandı',
    shiftNewBody: (date, start, end) => `${date}: ${start} - ${end}`,
    shiftUpdated: 'Vardiya değiştirildi',
    shiftUpdatedBody: (date, start, end) => `${date}: ${start} - ${end}`,
    shiftCancelled: 'Vardiya iptal edildi',
    shiftCancelledBody: (date) => `${date} tarihindeki vardiyanız iptal edildi`,

    inviteAccepted: 'Davet kabul edildi',
    inviteAcceptedBody: (name) => `${name} takıma katıldı`,

    timeEntryFlagged: 'Zaman kaydı inceleme bekliyor',
    timeEntryFlaggedBody: (name) => `${name} yanlış konumda giriş yaptı`,
    timeEntryApproved: 'Zaman kaydı onaylandı',
    timeEntryApprovedBody: (date) => `${date} tarihli zaman kaydınız onaylandı`,
    timeEntryRejected: 'Zaman kaydı reddedildi',
    timeEntryRejectedBody: (date) => `${date} tarihli zaman kaydınız reddedildi`,
  },

  // Russian
  ru: {
    vacationRequestNew: 'Новая заявка на отпуск',
    vacationRequestNewBody: (name) => `${name} подал(а) заявку на отпуск`,
    vacationApproved: 'Заявка на отпуск одобрена',
    vacationApprovedBody: (start, end) => `Ваша заявка на отпуск с ${start} по ${end} одобрена`,
    vacationRejected: 'Заявка на отпуск отклонена',
    vacationRejectedBody: (start, end) => `Ваша заявка на отпуск с ${start} по ${end} отклонена`,

    chatNewMessage: (name) => `Новое сообщение от ${name}`,
    chatMention: (name) => `${name} упомянул(а) вас`,
    chatAllMention: (name) => `${name} упомянул(а) всех`,

    shiftNew: 'Назначена новая смена',
    shiftNewBody: (date, start, end) => `${date}: ${start} - ${end}`,
    shiftUpdated: 'Смена изменена',
    shiftUpdatedBody: (date, start, end) => `${date}: ${start} - ${end}`,
    shiftCancelled: 'Смена отменена',
    shiftCancelledBody: (date) => `Ваша смена на ${date} была отменена`,

    inviteAccepted: 'Приглашение принято',
    inviteAcceptedBody: (name) => `${name} присоединился(-ась) к команде`,

    timeEntryFlagged: 'Запись времени на проверке',
    timeEntryFlaggedBody: (name) => `${name} отметился(-ась) не на том месте`,
    timeEntryApproved: 'Запись времени одобрена',
    timeEntryApprovedBody: (date) => `Ваша запись времени от ${date} была одобрена`,
    timeEntryRejected: 'Запись времени отклонена',
    timeEntryRejectedBody: (date) => `Ваша запись времени от ${date} была отклонена`,
  },
};

// Get translation for a user's language
function t(lang: Language | string | undefined) {
  const validLang = (lang && lang in translations) ? lang as Language : DEFAULT_LANGUAGE;
  return translations[validLang];
}

// =============================================================================
// TYPES
// =============================================================================

interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  deviceName: string | null;
  isActive: boolean;
}

interface NotificationPreferences {
  enabled: boolean;
  vacationRequests: boolean;
  vacationUpdates: boolean;
  chatMessages: boolean;
  chatMentions: boolean;
  shiftChanges: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee';
  language?: Language;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Get all active tokens for a user
async function getActiveTokensForUser(userId: string): Promise<PushToken[]> {
  const snapshot = await db
    .collection('pushTokens')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();

  return snapshot.docs.map((doc) => doc.data() as PushToken);
}

// Get all admin users
async function getAdminUsers(): Promise<User[]> {
  const snapshot = await db.collection('users').where('role', '==', 'admin').get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
}

// Get user by ID
async function getUser(userId: string): Promise<User | null> {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as User;
}

// Get user's language preference
async function getUserLanguage(userId: string): Promise<Language> {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return DEFAULT_LANGUAGE;
  const data = doc.data();
  const lang = data?.language;
  return (lang && lang in translations) ? lang as Language : DEFAULT_LANGUAGE;
}

// Get notification preferences for a user
async function getPreferences(userId: string): Promise<NotificationPreferences | null> {
  const doc = await db.collection('notificationPreferences').doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as NotificationPreferences;
}

// Check if user should receive notification based on preferences and quiet hours
function shouldSendNotification(
  prefs: NotificationPreferences | null,
  category: keyof NotificationPreferences
): boolean {
  // If no preferences, default to enabled
  if (!prefs) return true;

  // Check master switch
  if (!prefs.enabled) return false;

  // Check category
  if (prefs[category] === false) return false;

  // Check quiet hours
  if (prefs.quietHoursEnabled) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const start = prefs.quietHoursStart;
    const end = prefs.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      if (currentTime >= start || currentTime <= end) {
        return false;
      }
    } else {
      if (currentTime >= start && currentTime <= end) {
        return false;
      }
    }
  }

  return true;
}

// Send push notifications
async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }

  return tickets;
}

// =============================================================================
// VACATION REQUEST TRIGGERS
// =============================================================================

/**
 * Notify admins when a new vacation request is created
 */
export const onVacationRequestCreated = functions.firestore
  .document('vacationRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const request = snapshot.data();
    const user = await getUser(request.userId);

    if (!user) return;

    const admins = await getAdminUsers();
    const messages: ExpoPushMessage[] = [];
    const userName = `${user.firstName} ${user.lastName}`;

    for (const admin of admins) {
      const prefs = await getPreferences(admin.id);

      if (!shouldSendNotification(prefs, 'vacationRequests')) continue;

      const tokens = await getActiveTokensForUser(admin.id);
      const lang = await getUserLanguage(admin.id);
      const tr = t(lang);

      for (const tokenData of tokens) {
        if (!Expo.isExpoPushToken(tokenData.token)) continue;

        messages.push({
          to: tokenData.token,
          sound: 'default',
          title: tr.vacationRequestNew,
          body: tr.vacationRequestNewBody(userName),
          data: {
            type: 'vacation_request_created',
            targetScreen: '/(admin)/requests',
            entityId: context.params.requestId,
            userId: request.userId,
          },
          channelId: 'vacation',
        });
      }
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} vacation request notifications`);
    }
  });

/**
 * Notify employee when their vacation request is approved or rejected
 */
export const onVacationRequestUpdated = functions.firestore
  .document('vacationRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger on status change
    if (before.status === after.status) return;

    // Only notify on approval or rejection
    if (after.status !== 'approved' && after.status !== 'rejected') return;

    const prefs = await getPreferences(after.userId);
    if (!shouldSendNotification(prefs, 'vacationUpdates')) return;

    const tokens = await getActiveTokensForUser(after.userId);
    const lang = await getUserLanguage(after.userId);
    const tr = t(lang);
    const messages: ExpoPushMessage[] = [];

    const isApproved = after.status === 'approved';
    const title = isApproved ? tr.vacationApproved : tr.vacationRejected;
    const body = isApproved
      ? tr.vacationApprovedBody(after.startDate, after.endDate)
      : tr.vacationRejectedBody(after.startDate, after.endDate);

    for (const tokenData of tokens) {
      if (!Expo.isExpoPushToken(tokenData.token)) continue;

      messages.push({
        to: tokenData.token,
        sound: 'default',
        title,
        body,
        data: {
          type: isApproved ? 'vacation_request_approved' : 'vacation_request_rejected',
          targetScreen: '/(employee)/vacation',
          entityId: context.params.requestId,
        },
        channelId: 'vacation',
      });
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} vacation update notifications`);
    }
  });

// =============================================================================
// CHAT MESSAGE TRIGGERS
// =============================================================================

/**
 * Notify users when a new chat message is sent
 */
export const onChatMessageCreated = functions.firestore
  .document('chatMessages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const sender = await getUser(message.userId);

    if (!sender) return;

    // Get all users except the sender
    const usersSnapshot = await db.collection('users').get();
    const messages: ExpoPushMessage[] = [];

    // Check if this is an @all message
    const isAllMention = message.content && message.content.includes('@all');

    for (const userDoc of usersSnapshot.docs) {
      if (userDoc.id === message.userId) continue;

      const userData = userDoc.data();
      const prefs = await getPreferences(userDoc.id);

      // Check if this is a personal mention
      const isPersonalMention =
        !isAllMention && message.content && message.content.includes(`@${userData.firstName}`);

      // @all → treat as mention (always notify, respects chatMentions pref)
      // @personal → chatMentions pref
      // normal → chatMessages pref
      if (isAllMention || isPersonalMention) {
        if (!shouldSendNotification(prefs, 'chatMentions')) continue;
      } else {
        if (!shouldSendNotification(prefs, 'chatMessages')) continue;
      }

      const tokens = await getActiveTokensForUser(userDoc.id);
      const lang = await getUserLanguage(userDoc.id);
      const tr = t(lang);

      for (const tokenData of tokens) {
        if (!Expo.isExpoPushToken(tokenData.token)) continue;

        const title = isAllMention
          ? tr.chatAllMention(sender.firstName)
          : isPersonalMention
            ? tr.chatMention(sender.firstName)
            : tr.chatNewMessage(sender.firstName);

        const notificationType = isAllMention
          ? 'chat_mention'
          : isPersonalMention ? 'chat_mention' : 'chat_message';

        messages.push({
          to: tokenData.token,
          sound: 'default',
          title,
          body: message.content.substring(0, 100),
          data: {
            type: notificationType,
            targetScreen: userData.role === 'admin' ? '/(admin)/chat' : '/(employee)/chat',
            entityId: context.params.messageId,
            userId: message.userId,
          },
          channelId: 'chat',
        });
      }
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} chat notifications`);
    }
  });

// =============================================================================
// SHIFT TRIGGERS
// =============================================================================

/**
 * Notify employee when a shift is assigned to them
 */
export const onShiftCreated = functions.firestore
  .document('shifts/{shiftId}')
  .onCreate(async (snapshot, context) => {
    const shift = snapshot.data();

    const prefs = await getPreferences(shift.userId);
    if (!shouldSendNotification(prefs, 'shiftChanges')) return;

    const tokens = await getActiveTokensForUser(shift.userId);
    const lang = await getUserLanguage(shift.userId);
    const tr = t(lang);
    const messages: ExpoPushMessage[] = [];

    for (const tokenData of tokens) {
      if (!Expo.isExpoPushToken(tokenData.token)) continue;

      messages.push({
        to: tokenData.token,
        sound: 'default',
        title: tr.shiftNew,
        body: tr.shiftNewBody(shift.date, shift.startTime, shift.endTime),
        data: {
          type: 'shift_created',
          targetScreen: '/(employee)/schedule',
          entityId: context.params.shiftId,
        },
        channelId: 'shifts',
      });
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} shift creation notifications`);
    }
  });

/**
 * Notify employee when their shift is updated
 */
export const onShiftUpdated = functions.firestore
  .document('shifts/{shiftId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if anything significant changed
    if (
      before.date === after.date &&
      before.startTime === after.startTime &&
      before.endTime === after.endTime &&
      before.locationId === after.locationId
    ) {
      return;
    }

    const prefs = await getPreferences(after.userId);
    if (!shouldSendNotification(prefs, 'shiftChanges')) return;

    const tokens = await getActiveTokensForUser(after.userId);
    const lang = await getUserLanguage(after.userId);
    const tr = t(lang);
    const messages: ExpoPushMessage[] = [];

    for (const tokenData of tokens) {
      if (!Expo.isExpoPushToken(tokenData.token)) continue;

      messages.push({
        to: tokenData.token,
        sound: 'default',
        title: tr.shiftUpdated,
        body: tr.shiftUpdatedBody(after.date, after.startTime, after.endTime),
        data: {
          type: 'shift_updated',
          targetScreen: '/(employee)/schedule',
          entityId: context.params.shiftId,
        },
        channelId: 'shifts',
      });
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} shift update notifications`);
    }
  });

/**
 * Notify employee when their shift is deleted
 */
export const onShiftDeleted = functions.firestore
  .document('shifts/{shiftId}')
  .onDelete(async (snapshot) => {
    const shift = snapshot.data();

    const prefs = await getPreferences(shift.userId);
    if (!shouldSendNotification(prefs, 'shiftChanges')) return;

    const tokens = await getActiveTokensForUser(shift.userId);
    const lang = await getUserLanguage(shift.userId);
    const tr = t(lang);
    const messages: ExpoPushMessage[] = [];

    for (const tokenData of tokens) {
      if (!Expo.isExpoPushToken(tokenData.token)) continue;

      messages.push({
        to: tokenData.token,
        sound: 'default',
        title: tr.shiftCancelled,
        body: tr.shiftCancelledBody(shift.date),
        data: {
          type: 'shift_deleted',
          targetScreen: '/(employee)/schedule',
        },
        channelId: 'shifts',
      });
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} shift deletion notifications`);
    }
  });

// =============================================================================
// INVITE TRIGGERS
// =============================================================================

/**
 * Notify admins when an invite is accepted
 */
export const onInviteAccepted = functions.firestore
  .document('invites/{inviteId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger when status changes to accepted
    if (before.status === after.status || after.status !== 'accepted') return;

    const admins = await getAdminUsers();
    const messages: ExpoPushMessage[] = [];
    const newMemberName = `${after.firstName} ${after.lastName}`;

    for (const admin of admins) {
      const tokens = await getActiveTokensForUser(admin.id);
      const lang = await getUserLanguage(admin.id);
      const tr = t(lang);

      for (const tokenData of tokens) {
        if (!Expo.isExpoPushToken(tokenData.token)) continue;

        messages.push({
          to: tokenData.token,
          sound: 'default',
          title: tr.inviteAccepted,
          body: tr.inviteAcceptedBody(newMemberName),
          data: {
            type: 'invite_accepted',
            targetScreen: '/(admin)/team',
          },
          channelId: 'system',
        });
      }
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} invite accepted notifications`);
    }
  });

// =============================================================================
// ADMIN NOTIFICATION TRIGGERS
// =============================================================================

/**
 * Notify admins when a profile is updated (admin notification created)
 * Note: These notifications use the title/message from the document itself,
 * which should already be in the appropriate language.
 */
export const onAdminNotificationCreated = functions.firestore
  .document('adminNotifications/{notificationId}')
  .onCreate(async (snapshot) => {
    const notification = snapshot.data();

    const admins = await getAdminUsers();
    const messages: ExpoPushMessage[] = [];

    for (const admin of admins) {
      const tokens = await getActiveTokensForUser(admin.id);

      for (const tokenData of tokens) {
        if (!Expo.isExpoPushToken(tokenData.token)) continue;

        messages.push({
          to: tokenData.token,
          sound: 'default',
          title: notification.title,
          body: notification.message,
          data: {
            type: 'profile_updated',
            targetScreen: '/(admin)',
            userId: notification.userId,
          },
          channelId: 'system',
        });
      }
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} admin notification push messages`);
    }
  });

// =============================================================================
// TIME ENTRY APPROVAL TRIGGERS
// =============================================================================

/**
 * Notify admins when a time entry is created with pending approval status
 * (i.e., employee clocked in at wrong location)
 */
export const onTimeEntryCreated = functions.firestore
  .document('timeEntries/{entryId}')
  .onCreate(async (snapshot, context) => {
    const entry = snapshot.data();

    // Only notify if the entry requires approval
    if (entry.approvalStatus !== 'pending') return;

    const user = await getUser(entry.userId);
    if (!user) return;

    const admins = await getAdminUsers();
    const messages: ExpoPushMessage[] = [];
    const userName = `${user.firstName} ${user.lastName}`;

    for (const adminUser of admins) {
      const tokens = await getActiveTokensForUser(adminUser.id);
      const lang = await getUserLanguage(adminUser.id);
      const tr = t(lang);

      for (const tokenData of tokens) {
        if (!Expo.isExpoPushToken(tokenData.token)) continue;

        messages.push({
          to: tokenData.token,
          sound: 'default',
          title: tr.timeEntryFlagged,
          body: tr.timeEntryFlaggedBody(userName),
          data: {
            type: 'time_entry_flagged',
            targetScreen: '/(admin)/reports',
            entityId: context.params.entryId,
            userId: entry.userId,
          },
          channelId: 'system',
        });
      }
    }

    // Also create an admin notification document
    if (messages.length > 0) {
      await db.collection('adminNotifications').add({
        type: 'time_entry_flagged',
        title: translations.de.timeEntryFlagged,
        message: translations.de.timeEntryFlaggedBody(userName),
        userId: entry.userId,
        entityId: context.params.entryId,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} time entry flagged notifications`);
    }
  });

/**
 * Notify employee when their time entry approval status changes
 */
export const onTimeEntryApprovalChanged = functions.firestore
  .document('timeEntries/{entryId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger on approvalStatus change
    if (before.approvalStatus === after.approvalStatus) return;

    // Only notify on approved or rejected
    if (after.approvalStatus !== 'approved' && after.approvalStatus !== 'rejected') return;

    const tokens = await getActiveTokensForUser(after.userId);
    const lang = await getUserLanguage(after.userId);
    const tr = t(lang);
    const messages: ExpoPushMessage[] = [];

    const entryDate = after.date || (after.clockIn ? new Date(after.clockIn).toLocaleDateString('de-DE') : '');
    const isApproved = after.approvalStatus === 'approved';
    const title = isApproved ? tr.timeEntryApproved : tr.timeEntryRejected;
    const body = isApproved
      ? tr.timeEntryApprovedBody(entryDate)
      : tr.timeEntryRejectedBody(entryDate);

    for (const tokenData of tokens) {
      if (!Expo.isExpoPushToken(tokenData.token)) continue;

      messages.push({
        to: tokenData.token,
        sound: 'default',
        title,
        body,
        data: {
          type: isApproved ? 'time_entry_approved' : 'time_entry_rejected',
          targetScreen: '/(employee)/reports',
          entityId: context.params.entryId,
        },
        channelId: 'system',
      });
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`Sent ${messages.length} time entry approval notifications`);
    }
  });
