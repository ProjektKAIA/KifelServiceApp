// src/screens/admin/ScheduleManagementScreen.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, X, Trash2 } from 'lucide-react-native';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

const mockShifts: Shift[] = [
  { id: '1', employeeId: '1', employeeName: 'Max M.', date: '2024-12-16', startTime: '08:00', endTime: '16:00', location: 'Forst' },
  { id: '2', employeeId: '2', employeeName: 'Sandra K.', date: '2024-12-16', startTime: '10:00', endTime: '18:00', location: 'Cottbus' },
  { id: '3', employeeId: '3', employeeName: 'Thomas M.', date: '2024-12-17', startTime: '08:00', endTime: '16:00', location: 'Forst' },
  { id: '4', employeeId: '1', employeeName: 'Max M.', date: '2024-12-18', startTime: '08:00', endTime: '16:00', location: 'Forst' },
  { id: '5', employeeId: '2', employeeName: 'Sandra K.', date: '2024-12-19', startTime: '08:00', endTime: '16:00', location: 'Forst' },
];

const employees = [
  { id: '1', name: 'Max Mustermann', short: 'Max M.' },
  { id: '2', name: 'Sandra Koch', short: 'Sandra K.' },
  { id: '3', name: 'Thomas Müller', short: 'Thomas M.' },
];

const locations = ['Forst', 'Cottbus', 'Berlin'];

export default function ScheduleManagementScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shifts, setShifts] = useState(mockShifts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter((s) => s.date === dateStr);
  };

  const handleDeleteShift = (shiftId: string) => {
    Alert.alert(
      'Schicht löschen',
      'Möchten Sie diese Schicht wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => setShifts((prev) => prev.filter((s) => s.id !== shiftId)),
        },
      ]
    );
  };

  const handleAddShift = (employeeId: string) => {
    if (!selectedDate) return;

    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;

    const newShift: Shift = {
      id: Date.now().toString(),
      employeeId,
      employeeName: employee.short,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '16:00',
      location: 'Forst',
    };

    setShifts((prev) => [...prev, newShift]);
    setShowAddModal(false);
    setSelectedDate(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
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

          return (
            <View key={index} style={[styles.dayCard, {
              backgroundColor: theme.cardBackground,
              borderColor: isToday ? theme.primary : theme.cardBorder,
              borderWidth: isToday ? 2 : 1,
            }]}>
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
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                  onPress={() => { setSelectedDate(day); setShowAddModal(true); }}
                >
                  <Plus size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              {dayShifts.length === 0 ? (
                <Text style={[styles.noShifts, { color: theme.textMuted }]}>
                  Keine Schichten
                </Text>
              ) : (
                dayShifts.map((shift) => (
                  <View key={shift.id} style={[styles.shiftItem, { backgroundColor: theme.surface }]}>
                    <View style={styles.shiftInfo}>
                      <Text style={[styles.shiftEmployee, { color: theme.text }]}>
                        {shift.employeeName}
                      </Text>
                      <View style={styles.shiftDetails}>
                        <Clock size={12} color={theme.textMuted} />
                        <Text style={[styles.shiftTime, { color: theme.textMuted }]}>
                          {shift.startTime} – {shift.endTime}
                        </Text>
                        <MapPin size={12} color={theme.textMuted} />
                        <Text style={[styles.shiftLocation, { color: theme.textMuted }]}>
                          {shift.location}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteShift(shift.id)}>
                      <Trash2 size={16} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Add Shift Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Schicht hinzufügen
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedDate && (
              <Text style={[styles.modalDate, { color: theme.textMuted }]}>
                {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
              </Text>
            )}
            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Mitarbeiter auswählen</Text>
            {employees.map((emp) => (
              <TouchableOpacity
                key={emp.id}
                style={[styles.employeeOption, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => handleAddShift(emp.id)}
              >
                <Text style={[styles.employeeOptionText, { color: theme.text }]}>{emp.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  header: { marginBottom: spacing.lg },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  navButton: { padding: spacing.sm, borderRadius: borderRadius.sm },
  weekText: { fontSize: 14, fontWeight: '600' },
  dayCard: { borderRadius: borderRadius.card, padding: spacing.base, marginBottom: spacing.md },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  dayName: { fontSize: 11, fontWeight: '500' },
  dayDate: { fontSize: 15, fontWeight: '600' },
  addButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  noShifts: { fontSize: 13, fontStyle: 'italic' },
  shiftItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm, borderRadius: borderRadius.sm, marginTop: spacing.sm },
  shiftInfo: { flex: 1 },
  shiftEmployee: { fontSize: 13, fontWeight: '600' },
  shiftDetails: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  shiftTime: { fontSize: 11, marginRight: 8 },
  shiftLocation: { fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalDate: { fontSize: 14, marginBottom: spacing.lg },
  modalLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: spacing.sm },
  employeeOption: { padding: spacing.base, borderRadius: borderRadius.button, borderWidth: 1, marginBottom: spacing.sm },
  employeeOptionText: { fontSize: 14, fontWeight: '500' },
});