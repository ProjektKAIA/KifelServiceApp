// app/(admin)/schedule.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
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

interface Employee {
  id: string;
  name: string;
  short: string;
}

export default function ScheduleManagementScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const employees: Employee[] = [
    { id: '1', name: 'Max Müller', short: 'MM' },
    { id: '2', name: 'Anna Schmidt', short: 'AS' },
    { id: '3', name: 'Tom Weber', short: 'TW' },
    { id: '4', name: 'Lisa Fischer', short: 'LF' },
  ];

  const [shifts, setShifts] = useState<Shift[]>([
    { id: '1', employeeId: '1', employeeName: 'MM', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', location: 'Forst' },
    { id: '2', employeeId: '2', employeeName: 'AS', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00', location: 'Mitte' },
    { id: '3', employeeId: '1', employeeName: 'MM', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', location: 'Forst' },
    { id: '4', employeeId: '3', employeeName: 'TW', date: format(addDays(weekStart, 2), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', location: 'Nord' },
    { id: '5', employeeId: '2', employeeName: 'AS', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', location: 'Mitte' },
  ]);

  const getShiftsForDay = (day: Date): Shift[] => {
    return shifts.filter((s) => s.date === format(day, 'yyyy-MM-dd'));
  };

  const handleDeleteShift = (shiftId: string) => {
    Alert.alert('Schicht löschen', 'Diese Schicht wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => setShifts((prev) => prev.filter((s) => s.id !== shiftId)) },
    ]);
  };

  const handleAddShift = (day: Date) => {
    Alert.alert('Schicht hinzufügen', 'Mitarbeiter auswählen:', [
      { text: 'Abbrechen', style: 'cancel' },
      ...employees.map((emp) => ({
        text: emp.name,
        onPress: () => {
          const newShift: Shift = {
            id: Date.now().toString(),
            employeeId: emp.id,
            employeeName: emp.short,
            date: format(day, 'yyyy-MM-dd'),
            startTime: '08:00',
            endTime: '16:00',
            location: 'Forst',
          };
          setShifts((prev) => [...prev, newShift]);
        },
      })),
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Bearbeiten</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Dienstplan</Text>
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

        {/* Week Grid */}
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isWeekend = index >= 5;

          return (
            <View
              key={index}
              style={[styles.dayCard, {
                backgroundColor: theme.cardBackground,
                borderColor: isToday ? theme.primary : theme.cardBorder,
                borderWidth: isToday ? 2 : 1,
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
                <TouchableOpacity
                  style={[styles.addShiftButton, { backgroundColor: theme.surface }]}
                  onPress={() => handleAddShift(day)}
                >
                  <Plus size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>

              {dayShifts.length > 0 ? (
                <View style={styles.shiftsList}>
                  {dayShifts.map((shift) => (
                    <View
                      key={shift.id}
                      style={[styles.shiftItem, { backgroundColor: theme.surface }]}
                    >
                      <View style={[styles.shiftAvatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.shiftAvatarText}>{shift.employeeName}</Text>
                      </View>
                      <View style={styles.shiftInfo}>
                        <View style={styles.shiftRow}>
                          <Clock size={12} color={theme.textSecondary} />
                          <Text style={[styles.shiftTime, { color: theme.text }]}>
                            {shift.startTime} – {shift.endTime}
                          </Text>
                        </View>
                        <View style={styles.shiftRow}>
                          <MapPin size={12} color={theme.textMuted} />
                          <Text style={[styles.shiftLocation, { color: theme.textMuted }]}>
                            {shift.location}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.shiftActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: 'rgba(59,130,246,0.1)' }]}
                          onPress={() => Alert.alert('Bearbeiten', 'Schicht bearbeiten')}
                        >
                          <Edit2 size={14} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                          onPress={() => handleDeleteShift(shift.id)}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noShifts, { color: theme.textMuted }]}>
                  Keine Schichten geplant
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
  dayCard: { borderRadius: borderRadius.card, padding: spacing.base, marginBottom: spacing.md },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  dayName: { fontSize: 12, fontWeight: '500' },
  dayDate: { fontSize: 15, fontWeight: '600' },
  addShiftButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  shiftsList: { gap: spacing.sm },
  shiftItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.md },
  shiftAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  shiftAvatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  shiftInfo: { flex: 1, gap: 2 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shiftTime: { fontSize: 13, fontWeight: '500' },
  shiftLocation: { fontSize: 12 },
  shiftActions: { flexDirection: 'row', gap: 6 },
  actionButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  noShifts: { fontSize: 13, fontStyle: 'italic' },
});