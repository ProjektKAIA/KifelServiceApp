// app/(employee)/schedule.tsx

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

const mockShifts = [
  { date: '2024-12-02', startTime: '08:00', endTime: '16:00', location: 'Standort Forst' },
  { date: '2024-12-04', startTime: '08:00', endTime: '16:00', location: 'Standort Forst' },
  { date: '2024-12-05', startTime: '10:00', endTime: '18:00', location: 'Standort Cottbus' },
  { date: '2024-12-12', startTime: '08:00', endTime: '16:00', location: 'Standort Forst' },
  { date: '2024-12-13', startTime: '10:00', endTime: '18:00', location: 'Standort Cottbus' },
];

export default function ScheduleScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = start.getDay();
    const emptyDays = startDay === 0 ? 6 : startDay - 1;
    return Array(emptyDays).fill(null).concat(days);
  }, [currentMonth]);

  const getShiftForDate = (date: Date | null) => {
    if (!date) return null;
    return mockShifts.find(s => s.date === format(date, 'yyyy-MM-dd'));
  };

  const upcomingShifts = useMemo(() => {
    const today = new Date();
    return mockShifts.filter(s => new Date(s.date) >= today).slice(0, 3);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
            {format(currentMonth, 'MMMM yyyy', { locale: de })}
          </Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Dienstplan</Text>
        </View>

        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={[styles.navButton, { backgroundColor: theme.surface }]}>
            <ChevronLeft size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.text }]}>{format(currentMonth, 'MMMM yyyy', { locale: de })}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={[styles.navButton, { backgroundColor: theme.surface }]}>
            <ChevronRight size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.calendar, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, i) => <Text key={i} style={[styles.weekDay, { color: theme.textMuted }]}>{day}</Text>)}
          </View>
          <View style={styles.daysGrid}>
            {calendarDays.map((day, i) => {
              const shift = getShiftForDate(day);
              const isCurrent = day && isToday(day);
              return (
                <View key={i} style={styles.dayCell}>
                  {day && (
                    <View style={[styles.dayContent, shift && { backgroundColor: 'rgba(59,130,246,0.15)' }, isCurrent && styles.dayToday]}>
                      <Text style={[styles.dayNumber, { color: theme.textMuted }, shift && { color: theme.primary, fontWeight: '600' }, isCurrent && { color: '#fff', fontWeight: '600' }]}>
                        {format(day, 'd')}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>KOMMENDE SCHICHTEN</Text>
        {upcomingShifts.map((shift, i) => {
          const shiftDate = new Date(shift.date);
          const isActive = isToday(shiftDate);
          return (
            <View key={i} style={[styles.shiftCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <View style={styles.shiftInfo}>
                <Text style={[styles.shiftDate, { color: theme.text }]}>
                  {isToday(shiftDate) ? `Heute, ${format(shiftDate, 'd. MMM', { locale: de })}` : format(shiftDate, 'EEE, d. MMM', { locale: de })}
                </Text>
                <Text style={[styles.shiftTime, { color: theme.textMuted }]}>{shift.startTime} – {shift.endTime} Uhr</Text>
                <View style={styles.shiftLocation}>
                  <MapPin size={12} color={theme.primary} />
                  <Text style={[styles.shiftLocationText, { color: theme.primary }]}>{shift.location}</Text>
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: isActive ? theme.pillSuccess : theme.pillInfo }]}>
                <View style={[styles.statusDot, { backgroundColor: isActive ? theme.pillSuccessText : theme.pillInfoText }]} />
                <Text style={[styles.statusText, { color: isActive ? theme.pillSuccessText : theme.pillInfoText }]}>{isActive ? 'Aktiv' : 'Geplant'}</Text>
              </View>
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
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  navButton: { padding: spacing.sm, borderRadius: borderRadius.sm },
  monthText: { fontSize: 16, fontWeight: '600' },
  calendar: { borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.md, marginBottom: spacing.xl },
  weekDaysRow: { flexDirection: 'row', marginBottom: spacing.sm },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '500' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, padding: 2 },
  dayContent: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.sm },
  dayToday: { backgroundColor: '#3b82f6' },
  dayNumber: { fontSize: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md },
  shiftCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  shiftInfo: { flex: 1 },
  shiftDate: { fontSize: 14, fontWeight: '600' },
  shiftTime: { fontSize: 12, marginTop: 4 },
  shiftLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  shiftLocationText: { fontSize: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
});