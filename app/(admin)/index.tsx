// app/(admin)/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Users, Check, X, Bell, ChevronRight, User } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { vacationRequestsCollection, statsCollection, usersCollection, adminNotificationsCollection } from '@/src/lib/firestore';
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
  const { user } = useAuthStore();

  const greeting = getGreeting();
  const userName = user?.firstName || 'Admin';

  function getGreeting(): string {
    const hour = new Date().getHours();
    const random = Math.random();

    // Frühmorgens (5-9)
    if (hour >= 5 && hour < 9) {
      const greetings = ['Moin Chef!', 'Guten Morgen!', 'Moin Moin!', 'Früh dran heute!'];
      return greetings[Math.floor(random * greetings.length)];
    }

    // Vormittag (9-11)
    if (hour >= 9 && hour < 11) {
      const greetings = ['Guten Morgen!', 'Moin!', 'Na, alles im Griff?', 'Schönen Vormittag!'];
      return greetings[Math.floor(random * greetings.length)];
    }

    // Mittag (11-14)
    if (hour >= 11 && hour < 14) {
      const greetings = ['Mahlzeit!', 'Guten Mittag!', 'Mahlzeit Chef!', 'Schon Hunger?'];
      return greetings[Math.floor(random * greetings.length)];
    }

    // Nachmittag (14-17)
    if (hour >= 14 && hour < 17) {
      const greetings = ['Moin!', 'Na, wie läuft\'s?', 'Hallo!', 'Alles klar?'];
      return greetings[Math.floor(random * greetings.length)];
    }

    // Abend (17-21)
    if (hour >= 17 && hour < 21) {
      const greetings = ['Guten Abend!', 'N\'Abend!', 'Nabend!', 'Noch fleißig?'];
      return greetings[Math.floor(random * greetings.length)];
    }

    // Spät (21-5)
    const greetings = ['Noch wach?', 'N\'Abend!', 'Nachtschicht?', 'Hallo Nachteule!'];
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load stats, pending requests, and notifications in parallel
      const [adminStats, pendingRequests, employees, adminNotifications] = await Promise.all([
        statsCollection.getAdminStats(),
        vacationRequestsCollection.getAll('pending'),
        usersCollection.getAll(),
        user ? adminNotificationsCollection.getUnread(user.id) : Promise.resolve([]),
      ]);

      setStats(adminStats);
      setNotifications(adminNotifications);

      // Map requests with employee names
      const requestsWithNames = pendingRequests.map(req => {
        const employee = employees.find(e => e.id === req.userId);
        return {
          ...req,
          employeeName: employee ? `${employee.firstName} ${employee.lastName.charAt(0)}.` : 'Unbekannt',
        };
      });

      setOpenRequests(requestsWithNames);
    } catch (error) {
      toast.loadError('Dashboard-Daten');
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
      toast.success('Antrag wurde genehmigt');
      loadData();
    } catch (error) {
      toast.error(error, 'Genehmigung fehlgeschlagen');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;

    Alert.alert(
      'Antrag ablehnen',
      'Möchten Sie diesen Antrag wirklich ablehnen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Ablehnen',
          style: 'destructive',
          onPress: async () => {
            try {
              await vacationRequestsCollection.updateStatus(requestId, 'rejected', user.id);
              toast.success('Antrag wurde abgelehnt');
              loadData();
            } catch (error) {
              toast.error(error, 'Ablehnung fehlgeschlagen');
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
      case 'vacation': return 'Urlaub';
      case 'sick': return 'Krankmeldung';
      case 'other': return 'Sonstiges';
      default: return type;
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await adminNotificationsCollection.markAsRead(notificationId, user.id);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      toast.error(error, 'Fehler beim Markieren');
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      await adminNotificationsCollection.markAllAsRead(user.id);
      setNotifications([]);
      toast.success('Alle als gelesen markiert');
    } catch (error) {
      toast.error(error, 'Fehler');
    }
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'gerade eben';
      if (diffMins < 60) return `vor ${diffMins} Min.`;
      if (diffHours < 24) return `vor ${diffHours} Std.`;
      if (diffDays < 7) return `vor ${diffDays} Tagen`;
      return format(date, 'd. MMM', { locale: de });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.pillSecondary }]}>
          <Text style={[styles.badgeText, { color: theme.pillSecondaryText }]}>ADMIN</Text>
        </View>

        {/* Header */}
        <Text style={[styles.greeting, { color: theme.text }]}>{greeting}</Text>
        <Text style={[styles.userName, { color: theme.textMuted }]}>{userName}</Text>

        {/* Live Status Card */}
        <View style={[styles.statusCard, {
          backgroundColor: theme.pillSecondary,
          borderColor: theme.secondary
        }]}>
          <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Live-Status</Text>

          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>Mitarbeiter gesamt</Text>
            <Text style={[styles.statusItemValue, { color: theme.text }]}>{stats.totalEmployees}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>Aktiv arbeitend</Text>
            <Text style={[styles.statusItemValue, { color: theme.statusActive }]}>{stats.activeToday}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>Krank gemeldet</Text>
            <Text style={[styles.statusItemValue, { color: theme.statusPending }]}>{stats.sick}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>Im Urlaub</Text>
            <Text style={[styles.statusItemValue, { color: theme.primary }]}>{stats.onVacation}</Text>
          </View>
        </View>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                BENACHRICHTIGUNGEN ({notifications.length})
              </Text>
              <TouchableOpacity onPress={handleMarkAllNotificationsAsRead}>
                <Text style={[styles.markAllText, { color: theme.primary }]}>Alle gelesen</Text>
              </TouchableOpacity>
            </View>

            {notifications.slice(0, 3).map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
                onPress={() => handleMarkNotificationAsRead(notification.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.notificationIcon, { backgroundColor: theme.pillInfo }]}>
                  <User size={16} color={theme.pillInfoText} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, { color: theme.text }]} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationMessage, { color: theme.textSecondary }]} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  {notification.changes && (
                    <View style={styles.changesContainer}>
                      {Object.entries(notification.changes).slice(0, 2).map(([field, change]) => (
                        <Text key={field} style={[styles.changeText, { color: theme.textMuted }]}>
                          {field}: {change.old} → {change.new}
                        </Text>
                      ))}
                      {Object.keys(notification.changes).length > 2 && (
                        <Text style={[styles.changeText, { color: theme.textMuted }]}>
                          +{Object.keys(notification.changes).length - 2} weitere
                        </Text>
                      )}
                    </View>
                  )}
                  <Text style={[styles.notificationTime, { color: theme.textMuted }]}>
                    {formatNotificationTime(notification.createdAt)}
                  </Text>
                </View>
                <ChevronRight size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}

            {notifications.length > 3 && (
              <Text style={[styles.moreNotifications, { color: theme.textMuted }]}>
                +{notifications.length - 3} weitere Benachrichtigungen
              </Text>
            )}
          </>
        )}

        {/* Management Section */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: notifications.length > 0 ? spacing.lg : 0 }]}>VERWALTUNG</Text>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(admin)/schedules')}
          activeOpacity={0.7}
        >
          <Calendar size={20} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Dienstplan bearbeiten</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(admin)/team')}
          activeOpacity={0.7}
        >
          <Users size={20} color={theme.textSecondary} />
          <Text style={[styles.menuButtonText, { color: theme.text }]}>Mitarbeiter verwalten</Text>
        </TouchableOpacity>

        {/* Open Requests */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.lg }]}>
          OFFENE ANTRÄGE ({openRequests.length})
        </Text>

        {openRequests.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Keine offenen Anträge</Text>
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
                  {formatDateRange(request.startDate, request.endDate)} ({request.days} Tage)
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
    </SafeAreaView>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.md,
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
});
