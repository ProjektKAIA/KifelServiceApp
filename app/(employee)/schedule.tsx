// app/(employee)/schedule.tsx

import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

import { Typography } from '@/src/components/atoms';
import { Card } from '@/src/components/molecules';
import { ScreenHeader, ShiftCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface Shift {
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
}

const mockShifts: Shift[] = [
  { date: new Date(), startTime: '08:00', endTime: '16:00', location: 'Berlin Mitte' },
  { date: addDays(new Date(), 1), startTime: '09:00', endTime: '17:00', location: 'Berlin Mitte' },
  { date: addDays(new Date(), 3), startTime: '07:00', endTime: '15:00', location: 'Potsdam' },
];

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftForDay = (day: Date): Shift | undefined => {
    return mockShifts.find((s) => isSameDay(s.date, day));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="PLANUNG" title="Dienstplan" />

        {/* Week Navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.surface }]}
            onPress={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <Typography variant="label">
            {format(weekStart, 'd. MMM', { locale: de })} - {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}
          </Typography>

          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.surface }]}
            onPress={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Days */}
        {weekDays.map((day, index) => {
          const shift = getShiftForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <View key={index} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <Typography variant="label" style={isToday ? { color: theme.primary } : undefined}>
                  {format(day, 'EEEE', { locale: de })}
                </Typography>
                <Typography variant="caption" color="muted">{format(day, 'd. MMM', { locale: de })}</Typography>
              </View>

              {shift ? (
                <ShiftCard
                  label={`${shift.startTime} - ${shift.endTime}`}
                  timeRange={`${shift.startTime} - ${shift.endTime}`}
                  location={shift.location}
                  isActive={isToday}
                  accentColor={isToday ? '#22c55e' : '#3b82f6'}
                />
              ) : (
                <Card style={styles.emptyCard}>
                  <Typography variant="caption" color="muted" style={styles.emptyText}>
                    Keine Schicht
                  </Typography>
                </Card>
              )}
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
    paddingBottom: spacing['3xl'],
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  navButton: {
    padding: spacing.sm,
    borderRadius: 10,
  },
  dayContainer: {
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontStyle: 'italic',
  },
});