// app/(admin)/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Users, Check, X, Bell, ChevronRight, User, AlertCircle, Trash2 } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { vacationRequestsCollection, statsCollection, usersCollection, adminNotificationsCollection, timeEntriesCollection, deletionRequestsCollection } from '@/src/lib/firestore';
import { VacationRequest, User as UserType, AdminStats, AdminNotification } from '@/src/types';
import { useAuthStore } from '@/src/store/authStore';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from '@/src/utils/toast';

interface OpenRequest extends VacationRequest {
  employeeName: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const greeting = getGreeting();
  const userName = user?.firstName || 'Admin';

  function getGreeting(): string {
    const hour = new Date().getHours();
    const random = Math.random();

    let key: string;
    if (hour >= 5 && hour < 9) key = 'adminDashboard.greetingsEarlyMorning';
    else if (hour >= 9 && hour < 11) key = 'adminDashboard.greetingsMorning';
    else if (hour >= 11 && hour < 14) key = 'adminDashboard.greetingsNoon';
    else if (hour >= 14 && hour < 17) key = 'adminDashboard.greetingsAfternoon';
    else if (hour >= 17 && hour < 21) key = 'adminDashboard.greetingsEvening';
    else key = 'adminDashboard.greetingsNight';

    const greetings = t(key as any).split('|');
    return greetings[Math.floor(random * greetings.length)];
  }

  const [stats, setStats] = useState<AdminStats>({
    totalEmployees: 0,
    activeToday: 0,
    onVacation: 0,
    sick: 0,
    pendingRequests: 0,
  });
  const [openRequests, setOpenRequests] = useState<OpenRequest[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [pendingEntriesCount, setPendingEntriesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load stats, pending requests, and notifications in parallel
      const [adminStats, pendingRequests, employees, adminNotifications, pendingEntries] = await Promise.all([
        statsCollection.getAdminStats(),
        vacationRequestsCollection.getAll('pending'),
        usersCollection.getAll(),
        user ? adminNotificationsCollection.getUnread(user.id) : Promise.resolve([]),
        timeEntriesCollection.getPendingApproval(),
      ]);

      setStats(adminStats);
      setNotifications(adminNotifications);
      setPendingEntriesCount(pendingEntries.length);

      // Map requests with employee names
      const requestsWithNames = pendingRequests.map(req => {
        const employee = employees.find(e => e.id === req.userId);
        return {
          ...req,
          employeeName: employee ? `${employee.firstName} ${employee.lastName.charAt(0)}.` : t('adminDashboard.unknown'),
        };
      });

      setOpenRequests(requestsWithNames);

      // Cleanup: alte Notifications entfernen (>30 Tage)
      if (user?.id) {
        adminNotificationsCollection.deleteOld(30).catch(() => {});
      }
    } catch (error) {
      toast.loadError(t('adminDashboard.dashboardData'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const handleApprove = async (requestId: string) => {
    if (!user) return;

    try {
      await vacationRequestsCollection.updateStatus(requestId, 'approved', user.id);
      toast.success(t('adminDashboard.requestApproved'));
      loadData();
    } catch (error) {
      toast.error(error, t('adminDashboard.approvalFailed'));
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;

    Alert.alert(
      t('adminDashboard.rejectRequest'),
      t('adminDashboard.rejectConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('adminRequests.reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              await vacationRequestsCollection.updateStatus(requestId, 'rejected', user.id);
              toast.success(t('adminDashboard.requestRejected'));
              loadData();
            } catch (error) {
              toast.error(error, t('adminDashboard.rejectionFailed'));
            }
          },
        },
      ]
    );
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${format(start, 'd. MMM', { locale: de })} – ${format(end, 'd. MMM yyyy', { locale: de })}`;
    } catch {
      return `${startDate} – ${endDate}`;
    }
  };

  const getRequestTypeLabel = (type: VacationRequest['type']) => {
    switch (type) {
      case 'vacation': return t('empVacation.typeVacation');
      case 'sick': return t('empVacation.typeSick');
      case 'other': return t('empVacation.typeOther');
      default: return type;
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await adminNotificationsCollection.markAsRead(notificationId, user.id);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      toast.error(error, t('adminDashboard.markReadError'));
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      await adminNotificationsCollection.markAllAsRead(user.id);
      setNotifications([]);
      toast.success(t('adminDashboard.allMarkedRead'));
    } catch (error) {
      toast.error(error, t('common.error'));
    }
  };

  const handleApproveDeletionRequest = (notification: AdminNotification) => {
    const userName = notification.userName;
    const userId = notification.userId;
    const entityId = notification.entityId;
    Alert.alert(
      t('deletion.approveRequest'),
      t('deletion.approveConfirm').replace('{name}', userName),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('deletion.approveRequest'),
          style: 'destructive',
          onPress: async () => {
            try {
              await usersCollection.deleteAccount(userId);
              if (entityId) {
                await deletionRequestsCollection.updateStatus(entityId, 'approved');
              }
              if (user) {
                await adminNotificationsCollection.markAsRead(notification.id, user.id);
              }
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
              toast.success(t('deletion.approved'));
            } catch (error) {
              toast.error(error, t('common.error'));
            }
          },
        },
      ]
    );
  };

  const handleRejectDeletionRequest = (notification: AdminNotification) => {
    const userName = notification.userName;
    const entityId = notification.entityId;
    Alert.alert(
      t('deletion.rejectRequest'),
      t('deletion.rejectConfirm').replace('{name}', userName),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('deletion.rejectRequest'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (entityId) {
                await deletionRequestsCollection.updateStatus(entityId, 'rejected');
              }
              if (user) {
                await adminNotificationsCollection.markAsRead(notification.id, user.id);
              }
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
              toast.success(t('deletion.rejected'));
            } catch (error) {
              toast.error(error, t('common.error'));
            }
          },
        },
      ]
    );
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return t('adminDashboard.justNow');
      if (diffMins < 60) return t('adminDashboard.minutesAgo').replace('{count}', String(diffMins));
      if (diffHours < 24) return t('adminDashboard.hoursAgo').replace('{count}', String(diffHours));
      if (diffDays < 7) return t('adminDashboard.daysAgo').replace('{count}', String(diffDays));
      return format(date, 'd. MMM', { locale: de });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {/* Logo Banner */}
        <View style={styles.logoBanner}>
          <Image
            source={require('@/assets/images/kifel-service-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.greeting, { color: theme.text }]}>{greeting}</Text>
          <View style={[styles.badge, { backgroundColor: theme.pillSecondary }]}>
            <Text style={[styles.badgeText, { color: theme.pillSecondaryText }]}>ADMIN</Text>
          </View>
        </View>
        <Text style={[styles.userName, { color: theme.textMuted }]}>{userName}</Text>

        {/* Live Status Card */}
        <View style={[styles.statusCard, {
          backgroundColor: theme.pillSecondary,
          borderColor: theme.secondary
        }]}>
          <Text style={[styles.statusLabel, { color: theme.textMuted }]}>{t('adminDashboard.liveStatus')}</Text>

          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>{t('adminDashboard.totalEmployees')}</Text>
            <Text style={[styles.statusItemValue, { color: theme.text }]}>{stats.totalEmployees}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>{t('adminDashboard.activeWorking')}</Text>
            <Text style={[styles.statusItemValue, { color: theme.statusActive }]}>{stats.activeToday}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>{t('adminDashboard.reportedSick')}</Text>
            <Text style={[styles.statusItemValue, { color: theme.statusPending }]}>{stats.sick}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>{t('adminDashboard.onVacation')}</Text>
            <Text style={[styles.statusItemValue, { color: theme.primary }]}>{stats.onVacation}</Text>
          </View>
        </View>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                {t('adminDashboard.notifications')} ({notifications.length})
              </Text>
              <TouchableOpacity onPress={handleMarkAllNotificationsAsRead}>
                <Text style={[styles.markAllText, { color: theme.primary }]}>{t('adminDashboard.markAllRead')}</Text>
              </TouchableOpacity>
            </View>

            {notifications.slice(0, 3).map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, { backgroundColor: theme.cardBackground, borderColor: notification.type === 'deletion_request' ? theme.danger : theme.primary }]}
                onPress={() => notification.type !== 'deletion_request' && handleMarkNotificationAsRead(notification.id)}
                activeOpacity={notification.type === 'deletion_request' ? 1 : 0.7}
              >
                <View style={[styles.notificationIcon, { backgroundColor: notification.type === 'deletion_request' ? theme.danger + '20' : theme.pillInfo }]}>
                  {notification.type === 'deletion_request' ? (
                    <Trash2 size={16} color={theme.danger} />
                  ) : (
                    <User size={16} color={theme.pillInfoText} />
                  )}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, { color: theme.text }]} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationMessage, { color: theme.textSecondary }]} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  {notification.type === 'deletion_request' && (
                    <View style={styles.deletionActions}>
                      <TouchableOpacity
                        style={[styles.deletionButton, { backgroundColor: theme.danger }]}
                        onPress={() => handleApproveDeletionRequest(notification)}
                      >
                        <Check size={14} color="#fff" />
                        <Text style={styles.deletionButtonText}>{t('deletion.approve')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deletionButton, { backgroundColor: theme.textMuted }]}
                        onPress={() => handleRejectDeletionRequest(notification)}
                      >
                        <X size={14} color="#fff" />
                        <Text style={styles.deletionButtonText}>{t('deletion.reject')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {notification.changes && (
                    <View style={styles.changesContainer}>
                      {Object.entries(notification.changes).slice(0, 2).map(([field, change]) => (
                        <Text key={field} style={[styles.changeText, { color: theme.textMuted }]}>
                          {field}: {change.old} → {change.new}
                        </Text>
                      ))}
                      {Object.keys(notification.changes).length > 2 && (
                        <Text style={[styles.changeText, { color: theme.textMuted }]}>
                          {t('adminDashboard.moreChanges').replace('{count}', String(Object.keys(notification.changes).length - 2))}
                        </Text>
                      )}
                    </View>
                  )}
                  <Text style={[styles.notificationTime, { color: theme.textMuted }]}>
                    {formatNotificationTime(notification.createdAt)}
                  </Text>
                </View>
                {notification.type !== 'deletion_request' && (
                  <ChevronRight size={16} color={theme.textMuted} />
                )}
              </TouchableOpacity>
            ))}

            {notifications.length > 3 && (
              <Text style={[styles.moreNotifications, { color: theme.textMuted }]}>
                {t('adminDashboard.moreNotifications').replace('{count}', String(notifications.length - 3))}
              </Text>
            )}
          </>
        )}

        {/* Management Section */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: notifications.length > 0 ? spacing.lg : 0 }]}>{t('adminDashboard.admin')}</Text>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(admin)/schedules')}
          activeOpacity={0.7}
        >
          <Calendar size={20} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>{t('adminDashboard.editSchedule')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(admin)/team')}
          activeOpacity={0.7}
        >
          <Users size={20} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>{t('adminDashboard.manageEmployees')}</Text>
        </TouchableOpacity>

        {/* Pending Time Entries */}
        {pendingEntriesCount > 0 && (
          <TouchableOpacity
            style={[styles.pendingEntriesCard, { backgroundColor: theme.warning + '15', borderColor: theme.warning + '40' }]}
            onPress={() => router.push('/(admin)/reports')}
            activeOpacity={0.7}
          >
            <View style={[styles.pendingEntriesIcon, { backgroundColor: theme.warning + '25' }]}>
              <AlertCircle size={20} color={theme.warning} />
            </View>
            <View style={styles.pendingEntriesInfo}>
              <Text style={[styles.pendingEntriesTitle, { color: theme.warning }]}>
                {t('approval.pendingEntries')}
              </Text>
              <Text style={[styles.pendingEntriesCount, { color: theme.textSecondary }]}>
                {pendingEntriesCount} {pendingEntriesCount === 1 ? 'Eintrag' : 'Einträge'}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.warning} />
          </TouchableOpacity>
        )}

        {/* Open Requests */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.lg }]}>
          {t('adminDashboard.openRequestsSection')} ({openRequests.length})
        </Text>

        {openRequests.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('adminDashboard.noActivity')}</Text>
          </View>
        ) : (
          openRequests.map((request) => (
            <View
              key={request.id}
              style={[styles.requestCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            >
              <View style={styles.requestInfo}>
                <Text style={[styles.requestTitle, { color: theme.text }]}>
                  {request.employeeName} – {getRequestTypeLabel(request.type)}
                </Text>
                <Text style={[styles.requestDate, { color: theme.textMuted }]}>
                  {formatDateRange(request.startDate, request.endDate)} ({request.days} {t('adminDashboard.days')})
                </Text>
                {request.reason && (
                  <Text style={[styles.requestReason, { color: theme.textSecondary }]} numberOfLines={1}>
                    {request.reason}
                  </Text>
                )}
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.actionIcon, { backgroundColor: theme.pillSuccess }]}
                  activeOpacity={0.7}
                  onPress={() => handleApprove(request.id)}
                >
                  <Check size={16} color={theme.pillSuccessText} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIcon, { backgroundColor: theme.pillDanger }]}
                  activeOpacity={0.7}
                  onPress={() => handleReject(request.id)}
                >
                  <X size={16} color={theme.pillDangerText} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  logoBanner: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  logo: {
    width: 140,
    height: 45,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: spacing.lg,
  },
  statusCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusItemLabel: {
    fontSize: 14,
  },
  statusItemValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  deletionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  deletionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.button,
  },
  deletionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  changesContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  changeText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  notificationTime: {
    fontSize: 11,
    marginTop: 4,
  },
  moreNotifications: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 13,
  },
  requestReason: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingEntriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  pendingEntriesIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingEntriesInfo: {
    flex: 1,
  },
  pendingEntriesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingEntriesCount: {
    fontSize: 12,
    marginTop: 2,
  },
});
