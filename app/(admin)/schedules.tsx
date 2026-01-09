// app/(admin)/schedules.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, MapPin } from 'lucide-react-native';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

import { Typography, Avatar } from '@/src/components/atoms';
import { Card, Modal } from '@/src/components/molecules';
import { ScreenHeader } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';
import { shiftsCollection, usersCollection } from '@/src/lib/firestore';
import { Shift, User } from '@/src/types';

interface DisplayShift extends Shift {
  employeeName: string;
}

export default function ScheduleManagementScreen() {
  const { theme } = useTheme();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [shifts, setShifts] = useState<DisplayShift[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New shift form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [location, setLocation] = useState('');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');

      const [shiftsData, employeesData] = await Promise.all([
        shiftsCollection.getAll(startDate, endDate),
        usersCollection.getAll(),
      ]);

      // Map shifts with employee names
      const shiftsWithNames = shiftsData.map(shift => {
        const employee = employeesData.find(e => e.id === shift.userId);
        return {
          ...shift,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : (shift.employeeName || 'Unbekannt'),
        };
      });

      setShifts(shiftsWithNames);
      setEmployees(employeesData.filter(e => e.status !== 'inactive' && e.status !== 'deleted'));
    } catch (error) {
      console.error('Error loading schedules:', error);
      Alert.alert('Fehler', 'Daten konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getShiftsForDay = (day: Date): DisplayShift[] => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return shifts.filter((s) => s.date === dayStr);
  };

  const resetForm = () => {
    setSelectedEmployeeId(null);
    setStartTime('08:00');
    setEndTime('16:00');
    setLocation('');
  };

  const handleAddShift = async () => {
    if (!selectedDate || !selectedEmployeeId) {
      Alert.alert('Fehler', 'Bitte Mitarbeiter auswählen.');
      return;
    }

    const employee = employees.find((e) => e.id === selectedEmployeeId);
    if (!employee) return;

    try {
      const newShift: Omit<Shift, 'id'> = {
        userId: selectedEmployeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        location: location || 'Büro',
        status: 'scheduled',
      };

      await shiftsCollection.create(newShift);
      setShowAddModal(false);
      resetForm();
      loadData();
      Alert.alert('Erfolg', 'Schicht wurde hinzugefügt.');
    } catch (error) {
      console.error('Error adding shift:', error);
      Alert.alert('Fehler', 'Schicht konnte nicht hinzugefügt werden.');
    }
  };

  const handleDeleteShift = (shiftId: string) => {
    Alert.alert('Schicht löschen', 'Möchten Sie diese Schicht wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          try {
            await shiftsCollection.delete(shiftId);
            loadData();
          } catch (error) {
            console.error('Error deleting shift:', error);
            Alert.alert('Fehler', 'Schicht konnte nicht gelöscht werden.');
          }
        },
      },
    ]);
  };

  const openAddModal = (day: Date) => {
    setSelectedDate(day);
    resetForm();
    setShowAddModal(true);
  };

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
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="VERWALTUNG" title="Dienstplan bearbeiten" />

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
                <TouchableOpacity
                  style={[styles.addDayButton, { backgroundColor: theme.surface }]}
                  onPress={() => openAddModal(day)}
                >
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
                        <View style={styles.shiftDetails}>
                          <Clock size={12} color={theme.textMuted} />
                          <Typography variant="caption" color="muted">{shift.startTime} - {shift.endTime}</Typography>
                        </View>
                        {shift.location && (
                          <View style={styles.shiftDetails}>
                            <MapPin size={12} color={theme.textMuted} />
                            <Typography variant="caption" color="muted">{shift.location}</Typography>
                          </View>
                        )}
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
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Schicht hinzufügen"
        subtitle={selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de }) : ''}
      >
        <Typography variant="overline" color="muted" style={styles.modalLabel}>MITARBEITER AUSWÄHLEN</Typography>
        {employees.map((emp) => (
          <TouchableOpacity
            key={emp.id}
            style={[
              styles.employeeOption,
              {
                backgroundColor: selectedEmployeeId === emp.id ? theme.primary + '20' : theme.surface,
                borderColor: selectedEmployeeId === emp.id ? theme.primary : theme.border
              }
            ]}
            onPress={() => setSelectedEmployeeId(emp.id)}
          >
            <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
            <Typography variant="body" style={styles.employeeOptionText}>{emp.firstName} {emp.lastName}</Typography>
          </TouchableOpacity>
        ))}

        {employees.length === 0 && (
          <Typography variant="caption" color="muted" style={{ textAlign: 'center', marginVertical: spacing.md }}>
            Keine Mitarbeiter vorhanden
          </Typography>
        )}

        <Typography variant="overline" color="muted" style={{ ...styles.modalLabel, marginTop: spacing.lg }}>ZEIT</Typography>
        <View style={styles.timeRow}>
          <View style={styles.timeInput}>
            <Typography variant="caption" color="muted">Von</Typography>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:00"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={styles.timeInput}>
            <Typography variant="caption" color="muted">Bis</Typography>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="16:00"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        <Typography variant="overline" color="muted" style={{ ...styles.modalLabel, marginTop: spacing.lg }}>STANDORT</Typography>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          value={location}
          onChangeText={setLocation}
          placeholder="z.B. Büro, Baustelle Nord"
          placeholderTextColor={theme.textMuted}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: selectedEmployeeId ? 1 : 0.5 }]}
          onPress={handleAddShift}
          disabled={!selectedEmployeeId}
        >
          <Typography variant="label" style={{ color: theme.textInverse }}>Schicht hinzufügen</Typography>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  navButton: { padding: spacing.sm, borderRadius: 10 },
  dayContainer: { marginBottom: spacing.lg },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addDayButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shiftCard: { marginBottom: spacing.sm },
  shiftContent: { flexDirection: 'row', alignItems: 'center' },
  shiftInfo: { flex: 1, marginLeft: spacing.md },
  shiftDetails: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.md },
  modalLabel: { marginBottom: spacing.sm },
  employeeOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1, marginBottom: spacing.sm },
  employeeOptionText: { marginLeft: spacing.md },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeInput: { flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.xs,
    fontSize: 16,
  },
  submitButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
