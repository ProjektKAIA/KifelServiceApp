// app/(employee)/schedule.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react-native';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function ScheduleScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { user } = useAuthStore();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Mock-Daten
  const shifts: Shift[] = [
    { id: '1', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', location: 'Standort Forst', status: 'scheduled' },
    { id: '2', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00', location: 'Standort Mitte', status: 'scheduled' },
    { id: '3', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', location: 'Standort Nord', status: 'scheduled' },
    { id: '4', date: format(addDays(weekStart, 4), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', location: 'Standort Forst', status: 'scheduled' },
  ];

  const getShiftForDay = (day: Date): Shift | undefined => {
    return shifts.find((s) => s.date === format(day, 'yyyy-MM-dd'));
  };

  const getTotalHours = (): number => {
    return shifts.reduce((acc, shift) => {
      const start = parseInt(shift.startTime.split(':')[0]);
      const end = parseInt(shift.endTime.split(':')[0]);
      return acc + (end - start);
    }, 0);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
            Meine Schichten
          </Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>
            Dienstplan
          </Text>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity
            onPress={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            style={[styles.navButton, { backgroundColor: theme.surface }]}
          >
            <ChevronLeft size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.weekText, { color: theme.text }]}>
            KW {format(weekStart, 'w')} · {format(weekStart, 'd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'd. MMM', { locale: de })}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            style={[styles.navButton, { backgroundColor: theme.surface }]}
          >
            <ChevronRight size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Week Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{shifts.length}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Schichten</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{getTotalHours()}h</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Stunden</Text>
          </View>
        </View>

        {/* Week Grid */}
        {weekDays.map((day, index) => {
          const shift = getShiftForDay(day);
          const isToday = isSameDay(day, new Date());
          const isWeekend = index >= 5;

          return (
            <View
              key={index}
              style={[styles.dayCard, {
                backgroundColor: shift ? theme.cardBackground : 'transparent',
                borderColor: isToday ? theme.primary : shift ? theme.cardBorder : theme.border,
                borderWidth: isToday ? 2 : 1,
                opacity: isWeekend && !shift ? 0.5 : 1,
              }]}
            >
              <View style={styles.dayHeader}>
                <View>
                  <Text style={[styles.dayName, { color: theme.textMuted }]}>
                    {format(day, 'EEEE', { locale: de })}
                  </Text>
                  <Text style={[styles.dayDate, { color: theme.text }]}>
                    {format(day, 'd. MMMM', { locale: de })}
                  </Text>
                </View>
                {isToday && (
                  <View style={[styles.todayBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.todayText}>Heute</Text>
                  </View>
                )}
              </View>

              {shift ? (
                <View style={styles.shiftInfo}>
                  <View style={styles.shiftRow}>
                    <Clock size={14} color={theme.textSecondary} />
                    <Text style={[styles.shiftTime, { color: theme.text }]}>
                      {shift.startTime} – {shift.endTime}
                    </Text>
                  </View>
                  <View style={styles.shiftRow}>
                    <MapPin size={14} color={theme.textSecondary} />
                    <Text style={[styles.shiftLocation, { color: theme.textSecondary }]}>
                      {shift.location}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.noShift, { color: theme.textMuted }]}>
                  Kein Dienst
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base },
  header: { marginBottom: spacing.lg },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  navButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  weekText: { fontSize: 14, fontWeight: '600' },
  summaryCard: { flexDirection: 'row', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.xl },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  summaryDivider: { width: 1, marginVertical: 4 },
  dayCard: { borderRadius: borderRadius.card, padding: spacing.base, marginBottom: spacing.sm },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  dayName: { fontSize: 12, fontWeight: '500' },
  dayDate: { fontSize: 15, fontWeight: '600' },
  todayBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  todayText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  shiftInfo: { gap: 6 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shiftTime: { fontSize: 14, fontWeight: '500' },
  shiftLocation: { fontSize: 13 },
  noShift: { fontSize: 13, fontStyle: 'italic' },
});