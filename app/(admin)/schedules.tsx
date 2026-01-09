// app/(admin)/schedules.tsx

import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react-native';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

import { Typography, Avatar } from '@/src/components/atoms';
import { Card, Modal } from '@/src/components/molecules';
import { ScreenHeader } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface Employee {
  id: string;
  name: string;
}

const mockEmployees: Employee[] = [
  { id: '1', name: 'Max Mustermann' },
  { id: '2', name: 'Thomas Müller' },
  { id: '3', name: 'Sandra Klein' },
];

const mockShifts: Shift[] = [
  { id: '1', employeeId: '1', employeeName: 'Max Mustermann', date: new Date(), startTime: '08:00', endTime: '16:00' },
  { id: '2', employeeId: '2', employeeName: 'Thomas Müller', date: new Date(), startTime: '09:00', endTime: '17:00' },
];

export default function ScheduleManagementScreen() {
  const { theme } = useTheme();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [shifts, setShifts] = useState(mockShifts);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDay = (day: Date): Shift[] => shifts.filter((s) => isSameDay(s.date, day));

  const handleAddShift = (employeeId: string) => {
    if (!selectedDate) return;
    const employee = mockEmployees.find((e) => e.id === employeeId);
    if (!employee) return;

    const newShift: Shift = {
      id: Date.now().toString(),
      employeeId,
      employeeName: employee.name,
      date: selectedDate,
      startTime: '08:00',
      endTime: '16:00',
    };

    setShifts([...shifts, newShift]);
    setShowAddModal(false);
    Alert.alert('Erfolg', 'Schicht wurde hinzugefügt.');
  };

  const handleDeleteShift = (shiftId: string) => {
    Alert.alert('Schicht löschen', 'Möchten Sie diese Schicht wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => setShifts(shifts.filter((s) => s.id !== shiftId)) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="VERWALTUNG" title="Dienstplan bearbeiten" />

        {/* Week Navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.surface }]} onPress={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Typography variant="label">
            {format(weekStart, 'd. MMM', { locale: de })} - {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}
          </Typography>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.surface }]} onPress={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Days */}
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <View key={index} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <View>
                  <Typography variant="label" style={isToday ? { color: theme.primary } : undefined}>
                    {format(day, 'EEEE', { locale: de })}
                  </Typography>
                  <Typography variant="caption" color="muted">{format(day, 'd. MMM', { locale: de })}</Typography>
                </View>
                <TouchableOpacity style={[styles.addDayButton, { backgroundColor: theme.surface }]} onPress={() => { setSelectedDate(day); setShowAddModal(true); }}>
                  <Plus size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>

              {dayShifts.length > 0 ? (
                dayShifts.map((shift) => (
                  <Card key={shift.id} style={styles.shiftCard}>
                    <View style={styles.shiftContent}>
                      <Avatar name={shift.employeeName} size="sm" />
                      <View style={styles.shiftInfo}>
                        <Typography variant="label">{shift.employeeName}</Typography>
                        <Typography variant="caption" color="muted">{shift.startTime} - {shift.endTime}</Typography>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteShift(shift.id)}>
                        <Trash2 size={18} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
              ) : (
                <Card style={styles.emptyCard}>
                  <Typography variant="caption" color="muted">Keine Schichten geplant</Typography>
                </Card>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="Schicht hinzufügen" subtitle={selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de }) : ''}>
        <Typography variant="overline" color="muted" style={styles.modalLabel}>MITARBEITER AUSWÄHLEN</Typography>
        {mockEmployees.map((emp) => (
          <TouchableOpacity key={emp.id} style={[styles.employeeOption, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handleAddShift(emp.id)}>
            <Avatar name={emp.name} size="sm" />
            <Typography variant="body" style={styles.employeeOptionText}>{emp.name}</Typography>
          </TouchableOpacity>
        ))}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  navButton: { padding: spacing.sm, borderRadius: 10 },
  dayContainer: { marginBottom: spacing.lg },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addDayButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shiftCard: { marginBottom: spacing.sm },
  shiftContent: { flexDirection: 'row', alignItems: 'center' },
  shiftInfo: { flex: 1, marginLeft: spacing.md },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.md },
  modalLabel: { marginBottom: spacing.sm },
  employeeOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1, marginBottom: spacing.sm },
  employeeOptionText: { marginLeft: spacing.md },
});