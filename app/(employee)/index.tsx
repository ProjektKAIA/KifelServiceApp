// app/(employee)/index.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Calendar, Sun, MessageCircle } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTimeStore } from '@/src/store/timeStore';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { statsCollection, shiftsCollection } from '@/src/lib/firestore';
import { format } from 'date-fns';
import type { Shift } from '@/src/types';

interface DashboardStats {
  hoursThisMonth: number;
  remainingVacationDays: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isTracking = useTimeStore((s) => s.isTracking);

  const [stats, setStats] = useState<DashboardStats>({ hoursThisMonth: 0, remainingVacationDays: 0 });
  const [todayShift, setTodayShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    let key: string;
    if (hour >= 5 && hour < 9) key = 'empDashboard.greetingsEarlyMorning';
    else if (hour >= 9 && hour < 12) key = 'empDashboard.greetingsMorning';
    else if (hour >= 12 && hour < 14) key = 'empDashboard.greetingsNoon';
    else if (hour >= 14 && hour < 18) key = 'empDashboard.greetingsAfternoon';
    else if (hour >= 18 && hour < 22) key = 'empDashboard.greetingsEvening';
    else key = 'empDashboard.greetingsNight';

    const greetings = t(key as any).split('|');
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const greeting = getGreeting();
  const userName = user?.firstName || '';

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load stats
      const userStats = await statsCollection.getUserStats(user.id);
      setStats({
        hoursThisMonth: userStats.hoursThisMonth,
        remainingVacationDays: userStats.remainingVacationDays,
      });

      // Load today's shift
      const today = format(new Date(), 'yyyy-MM-dd');
      const shifts = await shiftsCollection.getForUser(user.id, today, today);
      const todaysShift = shifts.find(s => s.date === today && s.status !== 'cancelled');
      setTodayShift(todaysShift || null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const formatShiftTime = (shift: Shift): string => {
    return `${shift.startTime} – ${shift.endTime}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
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
          <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
            <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>{t('empDashboard.employeeBadge')}</Text>
          </View>
        </View>
        <Text style={[styles.userName, { color: theme.textMuted }]}>{userName}</Text>

        {/* Shift Card */}
        {todayShift ? (
          <View style={[styles.shiftCard, {
            backgroundColor: isTracking ? 'rgba(34,197,94,0.1)' : theme.cardBackground,
            borderColor: isTracking ? 'rgba(34,197,94,0.2)' : theme.cardBorder
          }]}>
            <View style={styles.shiftHeader}>
              <View>
                <Text style={[styles.shiftLabel, { color: theme.textMuted }]}>{t('empDashboard.todayShift')}</Text>
                <Text style={[styles.shiftTime, { color: theme.text }]}>{formatShiftTime(todayShift)}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: isTracking ? theme.pillSuccess : theme.pillWarning }]}>
                <View style={[styles.statusDot, { backgroundColor: isTracking ? theme.pillSuccessText : theme.pillWarningText }]} />
                <Text style={[styles.statusText, { color: isTracking ? theme.pillSuccessText : theme.pillWarningText }]}>
                  {isTracking ? t('empDashboard.active') : t('empDashboard.planned')}
                </Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <MapPin size={14} color={theme.textMuted} />
              <Text style={[styles.locationText, { color: theme.textMuted }]}>{todayShift.location || t('empDashboard.noLocation')}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.shiftCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.shiftHeader}>
              <View>
                <Text style={[styles.shiftLabel, { color: theme.textMuted }]}>{t('empDashboard.today')}</Text>
                <Text style={[styles.shiftTime, { color: theme.text }]}>{t('empDashboard.noShift')}</Text>
              </View>
              {isTracking && (
                <View style={[styles.statusPill, { backgroundColor: theme.pillSuccess }]}>
                  <View style={[styles.statusDot, { backgroundColor: theme.pillSuccessText }]} />
                  <Text style={[styles.statusText, { color: theme.pillSuccessText }]}>{t('empDashboard.active')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {isLoading ? '–' : Math.round(stats.hoursThisMonth)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t('empDashboard.hoursPerMonth')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {isLoading ? '–' : stats.remainingVacationDays}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t('empDashboard.remainingVacation')}</Text>
          </View>
        </View>

        {/* Quick Access */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t('empDashboard.quickActions')}</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.success }]}
            onPress={() => router.push('/(employee)/time')}
            activeOpacity={0.8}
          >
            <Clock size={18} color={theme.textInverse} />
            <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>{t('tabs.time')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}
            onPress={() => router.push('/(employee)/schedule')}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>{t('tabs.plan')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}
            onPress={() => router.push('/(employee)/vacation')}
            activeOpacity={0.7}
          >
            <Sun size={18} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>{t('empDashboard.vacation')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}
            onPress={() => router.push('/(employee)/chat')}
            activeOpacity={0.7}
          >
            <MessageCircle size={18} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingTop: 0,
    paddingBottom: 120,
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
  shiftCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  shiftLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 20,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: borderRadius.card,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
