// app/(admin)/schedules.tsx

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
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from 'lucide-react-native';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

export default function SchedulesScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const shifts: Shift[] = [
    { id: '1', employeeId: '1', employeeName: 'Max M.', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', location: 'Standort Forst' },
    { id: '2', employeeId: '2', employeeName: 'Anna S.', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00', location: 'Standort Mitte' },
    { id: '3', employeeId: '3', employeeName: 'Tom W.', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', location: 'Standort Nord' },
    { id: '4', employeeId: '1', employeeName: 'Max M.', date: format(addDays(weekStart, 2), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', location: 'Standort Forst' },
    { id: '5', employeeId: '4', employeeName: 'Lisa K.', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), startTime: '10:00', endTime: '18:00', location: 'Standort Süd' },
  ];

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDay = (date: Date): Shift[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => s.date === dateStr);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Planung</Text>
        <Text style={[styles.headerLarge, { color: theme.text }]}>Dienstpläne</Text>
      </View>

      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setCurrentWeek(subWeeks(currentWeek, 1))} style={styles.navButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.weekLabel, { color: theme.text }]}>
          {format(weekStart, 'dd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}
        </Text>
        <TouchableOpacity onPress={() => setCurrentWeek(addWeeks(currentWeek, 1))} style={styles.navButton}>
          <ChevronRight size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <View key={index} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, isToday && { backgroundColor: theme.primary }]}>
                  <Text style={[styles.dayNumber, { color: isToday ? '#fff' : theme.text }]}>
                    {format(day, 'd')}
                  </Text>
                </View>
                <Text style={[styles.dayName, { color: theme.textSecondary }]}>
                  {format(day, 'EEEE', { locale: de })}
                </Text>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.surface }]}>
                  <Plus size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {dayShifts.length === 0 ? (
                <View style={[styles.emptyDay, { borderColor: theme.borderLight }]}>
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>Keine Schichten</Text>
                </View>
              ) : (
                dayShifts.map((shift) => (
                  <TouchableOpacity
                    key={shift.id}
                    style={[styles.shiftCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.shiftMain}>
                      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>{shift.employeeName.split(' ').map(n => n[0]).join('')}</Text>
                      </View>
                      <View style={styles.shiftInfo}>
                        <Text style={[styles.employeeName, { color: theme.text }]}>{shift.employeeName}</Text>
                        <View style={styles.shiftMeta}>
                          <Clock size={12} color={theme.textMuted} />
                          <Text style={[styles.shiftTime, { color: theme.textSecondary }]}>
                            {shift.startTime} – {shift.endTime}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.shiftLocation}>
                      <MapPin size={12} color={theme.textMuted} />
                      <Text style={[styles.locationText, { color: theme.textMuted }]}>{shift.location}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.md, marginBottom: spacing.md },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, marginBottom: spacing.md },
  navButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  weekLabel: { fontSize: 15, fontWeight: '600' },
  content: { padding: spacing.base, paddingBottom: 100 },
  daySection: { marginBottom: spacing.lg },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  dayBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontSize: 14, fontWeight: '700' },
  dayName: { flex: 1, fontSize: 14, fontWeight: '500' },
  addButton: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyDay: { borderWidth: 1, borderStyle: 'dashed', borderRadius: borderRadius.card, padding: spacing.base, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  shiftCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.card, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  shiftMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  shiftInfo: {},
  employeeName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  shiftMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shiftTime: { fontSize: 12 },
  shiftLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 11 },
  fab: { position: 'absolute', bottom: 100, right: spacing.base, width: 56, height: 56, borderRadius: 16, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
});