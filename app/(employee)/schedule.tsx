// app/(employee)/schedule.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

// Mock data for shifts
const mockShifts = [
  { id: '1', date: new Date(), startTime: '08:00', endTime: '16:00', location: 'Standort Forst', status: 'active' },
  { id: '2', date: new Date(Date.now() + 86400000), startTime: '10:00', endTime: '18:00', location: 'Standort Cottbus', status: 'planned' },
  { id: '3', date: new Date(Date.now() + 86400000 * 4), startTime: '08:00', endTime: '16:00', location: 'Standort Forst', status: 'planned' },
  { id: '4', date: new Date(Date.now() + 86400000 * 5), startTime: '08:00', endTime: '16:00', location: 'Standort Forst', status: 'planned' },
  { id: '5', date: new Date(Date.now() + 86400000 * 6), startTime: '08:00', endTime: '16:00', location: 'Standort Cottbus', status: 'planned' },
  { id: '6', date: new Date(Date.now() + 86400000 * 11), startTime: '08:00', endTime: '16:00', location: 'Standort Forst', status: 'planned' },
  { id: '7', date: new Date(Date.now() + 86400000 * 12), startTime: '08:00', endTime: '16:00', location: 'Standort Forst', status: 'planned' },
];

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function ScheduleScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for first day (Monday = 0, Sunday = 6)
  const firstDayOfWeek = getDay(monthStart);
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const hasShift = (date: Date) => mockShifts.some((s) => isSameDay(s.date, date));
  const getShiftStatus = (date: Date) => mockShifts.find((s) => isSameDay(s.date, date))?.status;

  const upcomingShifts = mockShifts
    .filter((s) => s.date >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
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
              const status = getShiftStatus(day);
              const isCurrentDay = isToday(day);

              return (
                <View key={day.toISOString()} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayNumber,
                      hasShiftOnDay && styles.dayWithShift,
                      hasShiftOnDay && { backgroundColor: status === 'active' ? '#3b82f6' : '#3b82f6' },
                      isCurrentDay && !hasShiftOnDay && { borderColor: theme.primary, borderWidth: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.text },
                        hasShiftOnDay && { color: '#fff' },
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

        {upcomingShifts.map((shift) => {
          const isActive = shift.status === 'active';
          const shiftIsToday = isToday(shift.date);

          return (
            <View
              key={shift.id}
              style={[styles.shiftCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            >
              <View style={styles.shiftInfo}>
                <Text style={[styles.shiftDate, { color: theme.text }]}>
                  {shiftIsToday ? 'Heute' : format(shift.date, 'EEE, d. MMM', { locale: de })}
                </Text>
                <Text style={[styles.shiftTime, { color: theme.textMuted }]}>
                  {shift.startTime} – {shift.endTime} Uhr
                </Text>
                <View style={styles.shiftLocationRow}>
                  <MapPin size={12} color={theme.primary} />
                  <Text style={[styles.shiftLocation, { color: theme.primary }]}>{shift.location}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.shiftStatusPill,
                  { backgroundColor: shiftIsToday ? theme.pillSuccess : theme.pillInfo },
                ]}
              >
                <View
                  style={[
                    styles.shiftStatusDot,
                    { backgroundColor: shiftIsToday ? theme.pillSuccessText : theme.pillInfoText },
                  ]}
                />
                <Text style={{ color: shiftIsToday ? theme.pillSuccessText : theme.pillInfoText, fontSize: 11, fontWeight: '600' }}>
                  {shiftIsToday ? 'Aktiv' : 'Geplant'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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