// app/(employee)/schedule.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { shiftsCollection } from '@/src/lib/firestore';
import { Shift } from '@/src/types';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for first day (Monday = 0, Sunday = 6)
  const firstDayOfWeek = getDay(monthStart);
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const loadShifts = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load shifts for current month and next month
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(addMonths(monthEnd, 1), 'yyyy-MM-dd');

      const userShifts = await shiftsCollection.getForUser(user.id, startDate, endDate);
      setShifts(userShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, monthStart, monthEnd]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadShifts();
  }, [loadShifts]);

  const hasShift = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.some((s) => s.date === dateStr);
  };

  const getShiftForDate = (date: Date): Shift | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.find((s) => s.date === dateStr);
  };

  const isShiftActive = (shift: Shift) => {
    const today = new Date();
    const shiftDate = new Date(shift.date);
    return isSameDay(shiftDate, today) && shift.status !== 'completed' && shift.status !== 'cancelled';
  };

  const upcomingShifts = shifts
    .filter((s) => {
      const shiftDate = new Date(s.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return shiftDate >= today && s.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

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
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>DIENSTPLAN</Text>
        </View>

        {/* Month Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {format(currentMonth, 'MMMM yyyy', { locale: de })}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dienstplan</Text>

        {/* Calendar */}
        <View style={[styles.calendar, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={[styles.weekdayText, { color: theme.textMuted }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Padding for first week */}
            {Array.from({ length: paddingDays }).map((_, i) => (
              <View key={`pad-${i}`} style={styles.dayCell} />
            ))}

            {/* Month days */}
            {monthDays.map((day) => {
              const hasShiftOnDay = hasShift(day);
              const isCurrentDay = isToday(day);

              return (
                <View key={day.toISOString()} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayNumber,
                      hasShiftOnDay && styles.dayWithShift,
                      hasShiftOnDay && { backgroundColor: theme.primary },
                      isCurrentDay && !hasShiftOnDay && { borderColor: theme.primary, borderWidth: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.text },
                        hasShiftOnDay && { color: theme.textInverse },
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Upcoming Shifts */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>KOMMENDE SCHICHTEN</Text>

        {upcomingShifts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Keine kommenden Schichten</Text>
          </View>
        ) : (
          upcomingShifts.map((shift) => {
            const shiftDate = new Date(shift.date);
            const shiftIsToday = isToday(shiftDate);
            const active = isShiftActive(shift);

            return (
              <View
                key={shift.id}
                style={[styles.shiftCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              >
                <View style={styles.shiftInfo}>
                  <Text style={[styles.shiftDate, { color: theme.text }]}>
                    {shiftIsToday ? 'Heute' : format(shiftDate, 'EEE, d. MMM', { locale: de })}
                  </Text>
                  <Text style={[styles.shiftTime, { color: theme.textMuted }]}>
                    {shift.startTime} – {shift.endTime} Uhr
                  </Text>
                  {shift.location && (
                    <View style={styles.shiftLocationRow}>
                      <MapPin size={12} color={theme.primary} />
                      <Text style={[styles.shiftLocation, { color: theme.primary }]}>{shift.location}</Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.shiftStatusPill,
                    { backgroundColor: active ? theme.pillSuccess : theme.pillInfo },
                  ]}
                >
                  <View
                    style={[
                      styles.shiftStatusDot,
                      { backgroundColor: active ? theme.pillSuccessText : theme.pillInfoText },
                    ]}
                  />
                  <Text style={{ color: active ? theme.pillSuccessText : theme.pillInfoText, fontSize: 11, fontWeight: '600' }}>
                    {active ? 'Aktiv' : 'Geplant'}
                  </Text>
                </View>
              </View>
            );
          })
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
    padding: spacing.base,
    paddingTop: spacing.lg,
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.base,
  },
  calendar: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayWithShift: {
    borderRadius: 16,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
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
  shiftCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 13,
    marginBottom: 6,
  },
  shiftLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftLocation: {
    fontSize: 12,
  },
  shiftStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  shiftStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
