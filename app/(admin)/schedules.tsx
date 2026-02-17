// app/(admin)/schedules.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Clock, MapPin, Upload, Download, FileSpreadsheet, FileText, CheckCircle, AlertCircle, X } from 'lucide-react-native';
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  addDays as addDay,
  subDays,
  eachDayOfInterval,
  getDaysInMonth,
} from 'date-fns';
import { de } from 'date-fns/locale';
import * as DocumentPicker from 'expo-document-picker';

import { Typography, Avatar } from '@/src/components/atoms';
import { Card, Modal } from '@/src/components/molecules';
import { ScreenHeader } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing } from '@/src/constants/spacing';
import { shiftsCollection, usersCollection } from '@/src/lib/firestore';
import { Shift, User, Location as AppLocation } from '@/src/types';
import { importScheduleFromUri, ImportedSchedule, ImportedShift } from '@/src/utils/importUtils';
import { exportSchedule, ExportFormat, ExportShiftData } from '@/src/utils/exportUtils';
import { useLocationStore } from '@/src/store/locationStore';

interface DisplayShift extends Shift {
  employeeName: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'custom';

export default function ScheduleManagementScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Constants that need t() - moved inside component
  const viewModeLabels: Record<ViewMode, string> = {
    day: t('adminSchedules.viewDay'),
    week: t('adminSchedules.viewWeek'),
    month: t('adminSchedules.viewMonth'),
    year: t('adminSchedules.viewYear'),
    custom: t('adminSchedules.viewCustom'),
  };

  const EXPORT_OPTIONS: { key: ExportFormat; label: string; icon: any; description: string }[] = [
    { key: 'pdf', label: 'PDF', icon: FileText, description: t('adminSchedules.exportPdfDesc') },
    { key: 'excel', label: 'Excel', icon: FileSpreadsheet, description: t('adminSchedules.exportExcelDesc') },
    { key: 'csv', label: 'CSV', icon: FileText, description: t('adminSchedules.exportCsvDesc') },
  ];

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  // Store date as ISO string to prevent reference comparison issues
  const [currentDateStr, setCurrentDateStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [shifts, setShifts] = useState<DisplayShift[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit shift state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<DisplayShift | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLocationId, setEditLocationId] = useState<string | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);

  // Import state
  const [importData, setImportData] = useState<ImportedSchedule | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedImportUserId, setSelectedImportUserId] = useState<string | null>(null);
  const [editableImportShifts, setEditableImportShifts] = useState<ImportedShift[]>([]);

  // Custom date range state
  const [customFromStr, setCustomFromStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [customToStr, setCustomToStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Locations
  const { locations: savedLocations, fetchLocations } = useLocationStore();

  // New shift form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [location, setLocation] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Parse current date from string
  const currentDate = React.useMemo(() => parseISO(currentDateStr), [currentDateStr]);

  // Helper to update date
  const setCurrentDate = useCallback((date: Date) => {
    setCurrentDateStr(format(date, 'yyyy-MM-dd'));
  }, []);

  // Calculate date range based on view mode
  const dateRange = React.useMemo(() => {
    switch (viewMode) {
      case 'day':
        return {
          startStr: currentDateStr,
          endStr: currentDateStr,
          days: [currentDate],
        };
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return {
          startStr: format(weekStart, 'yyyy-MM-dd'),
          endStr: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
          days: Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        };
      }
      case 'month': {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return {
          startStr: format(monthStart, 'yyyy-MM-dd'),
          endStr: format(monthEnd, 'yyyy-MM-dd'),
          days: eachDayOfInterval({ start: monthStart, end: monthEnd }),
        };
      }
      case 'year': {
        const yearStart = startOfYear(currentDate);
        const yearEnd = endOfYear(currentDate);
        return {
          startStr: format(yearStart, 'yyyy-MM-dd'),
          endStr: format(yearEnd, 'yyyy-MM-dd'),
          days: [], // For year view, we'll group by month
        };
      }
      case 'custom': {
        const cStart = parseISO(customFromStr);
        const cEnd = parseISO(customToStr);
        if (cEnd >= cStart) {
          return {
            startStr: customFromStr,
            endStr: customToStr,
            days: eachDayOfInterval({ start: cStart, end: cEnd }),
          };
        }
        return {
          startStr: customFromStr,
          endStr: customFromStr,
          days: [cStart],
        };
      }
    }
  }, [viewMode, currentDateStr, currentDate, customFromStr, customToStr]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [shiftsData, employeesData] = await Promise.all([
        shiftsCollection.getAll(dateRange.startStr, dateRange.endStr),
        usersCollection.getAll(),
        fetchLocations(),
      ]);

      // Map shifts with employee names
      const shiftsWithNames = shiftsData.map(shift => {
        const employee = employeesData.find(e => e.id === shift.userId);
        return {
          ...shift,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : (shift.employeeName || t('adminSchedules.unknown')),
        };
      });

      setShifts(shiftsWithNames);
      setEmployees(employeesData.filter(e => e.status !== 'inactive' && e.status !== 'deleted'));
    } catch (error) {
      console.error('Error loading schedules:', error);
      Alert.alert(t('common.error'), t('adminSchedules.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startStr, dateRange.endStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigation functions
  const navigatePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(subYears(currentDate, 1));
        break;
      case 'custom':
        break; // No navigation for custom range
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(addYears(currentDate, 1));
        break;
      case 'custom':
        break; // No navigation for custom range
    }
  };

  const getNavigationLabel = (): string => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de });
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd. MMM', { locale: de })} - ${format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}`;
      }
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: de });
      case 'year':
        return format(currentDate, 'yyyy');
      case 'custom':
        return `${format(parseISO(customFromStr), 'd. MMM', { locale: de })} - ${format(parseISO(customToStr), 'd. MMM yyyy', { locale: de })}`;
    }
  };

  // Get shifts grouped by month for year view
  const shiftsByMonth = useMemo(() => {
    const months: { [key: string]: DisplayShift[] } = {};
    shifts.forEach(shift => {
      const monthKey = shift.date.substring(0, 7); // YYYY-MM
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(shift);
    });
    return months;
  }, [shifts]);

  const getShiftsForDay = (day: Date): DisplayShift[] => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return shifts.filter((s) => s.date === dayStr);
  };

  const resetForm = () => {
    setSelectedEmployeeId(null);
    setStartTime('08:00');
    setEndTime('16:00');
    setLocation('');
    setSelectedLocationId(null);
  };

  const handleAddShift = async () => {
    if (!selectedDate || !selectedEmployeeId) {
      Alert.alert(t('common.error'), t('adminSchedules.selectEmployee'));
      return;
    }

    const employee = employees.find((e) => e.id === selectedEmployeeId);
    if (!employee) return;

    try {
      // Determine location name: from selected location or freetext
      const selectedLoc = savedLocations.find(l => l.id === selectedLocationId);
      const locationName = selectedLoc ? selectedLoc.name : (location || t('adminSchedules.defaultLocation'));

      const newShift: Omit<Shift, 'id'> = {
        userId: selectedEmployeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        location: locationName,
        locationId: selectedLocationId || undefined,
        status: 'scheduled',
      };

      await shiftsCollection.create(newShift);
      setShowAddModal(false);
      resetForm();
      loadData();
      Alert.alert(t('adminSchedules.success'), t('adminSchedules.shiftAdded'));
    } catch (error) {
      console.error('Error adding shift:', error);
      Alert.alert(t('common.error'), t('adminSchedules.shiftAddError'));
    }
  };

  const handleDeleteShift = (shiftId: string) => {
    Alert.alert(t('adminSchedules.deleteShift'), t('adminSchedules.deleteShiftConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('adminSchedules.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await shiftsCollection.delete(shiftId);
            loadData();
          } catch (error) {
            console.error('Error deleting shift:', error);
            Alert.alert(t('common.error'), t('adminSchedules.shiftDeleteError'));
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

  // === EDIT SHIFT FUNCTIONS ===

  const openEditModal = (shift: DisplayShift) => {
    setEditingShift(shift);
    setEditDate(shift.date);
    setEditStartTime(shift.startTime);
    setEditEndTime(shift.endTime);
    setEditLocation(shift.location || '');
    setEditLocationId(shift.locationId || null);
    setEditEmployeeId(shift.userId);
    setShowEditModal(true);
  };

  const handleUpdateShift = async () => {
    if (!editingShift || !editEmployeeId) return;

    const employee = employees.find((e) => e.id === editEmployeeId);
    if (!employee) return;

    try {
      const selectedLoc = savedLocations.find(l => l.id === editLocationId);
      const locationName = selectedLoc ? selectedLoc.name : (editLocation || t('adminSchedules.defaultLocation'));

      await shiftsCollection.update(editingShift.id, {
        userId: editEmployeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: editDate,
        startTime: editStartTime,
        endTime: editEndTime,
        location: locationName,
        locationId: editLocationId || undefined,
      });
      setShowEditModal(false);
      setEditingShift(null);
      loadData();
      Alert.alert(t('adminSchedules.success'), t('adminSchedules.shiftUpdated'));
    } catch (error) {
      console.error('Error updating shift:', error);
      Alert.alert(t('common.error'), t('adminSchedules.shiftUpdateError'));
    }
  };

  // === IMPORT FUNCTIONS ===

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];
      setIsImporting(true);
      setImportError(null);
      setImportData(null);
      setImportWarnings([]);
      setSelectedImportUserId(null);

      const importResult = await importScheduleFromUri(file.uri);

      if (importResult.success && importResult.data) {
        setImportData(importResult.data);
        setEditableImportShifts([...importResult.data.shifts]);
        setImportWarnings(importResult.warnings);
        setShowImportModal(true);

        // Auto-select matching employee
        const matchingEmployee = employees.find(
          e => e.firstName.toLowerCase() === importResult.data!.employee.firstName.toLowerCase() &&
               e.lastName.toLowerCase() === importResult.data!.employee.lastName.toLowerCase()
        );
        if (matchingEmployee) {
          setSelectedImportUserId(matchingEmployee.id);
        }
      } else {
        setImportError(importResult.error || t('adminSchedules.importUnknownError'));
        Alert.alert(t('adminSchedules.importError'), importResult.error || t('adminSchedules.importFileError'));
      }
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert(t('common.error'), t('adminSchedules.importOpenError'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importData || !selectedImportUserId || editableImportShifts.length === 0) {
      Alert.alert(t('common.error'), t('adminSchedules.importSelectEmployee'));
      return;
    }

    const employee = employees.find(e => e.id === selectedImportUserId);
    if (!employee) return;

    setIsImporting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const shift of editableImportShifts) {
        try {
          const newShift: Omit<Shift, 'id'> = {
            userId: selectedImportUserId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            location: shift.client ? `${shift.client}${shift.address ? ' - ' + shift.address : ''}` : shift.address || t('adminSchedules.importImported'),
            status: 'scheduled',
          };
          await shiftsCollection.create(newShift);
          successCount++;
        } catch (e) {
          errorCount++;
          console.error('Error importing shift:', e);
        }
      }

      setShowImportModal(false);
      setImportData(null);
      setEditableImportShifts([]);
      loadData();

      if (errorCount === 0) {
        Alert.alert(t('adminSchedules.importSuccess'), t('adminSchedules.importSuccessMessage').replace('{count}', String(successCount)));
      } else {
        Alert.alert(t('adminSchedules.importPartial'), t('adminSchedules.importPartialMessage').replace('{success}', String(successCount)).replace('{errors}', String(errorCount)));
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t('common.error'), t('adminSchedules.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  // === EXPORT FUNCTIONS ===

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setShowExportModal(false);

    try {
      const exportData: ExportShiftData[] = shifts.map(shift => {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        const hours = (endH + endM / 60) - (startH + startM / 60);

        return {
          date: shift.date,
          employeeName: shift.employeeName,
          startTime: shift.startTime,
          endTime: shift.endTime,
          location: shift.location || '',
          hours,
        };
      });

      await exportSchedule(format, {
        title: t('adminSchedules.exportSchedule'),
        periodLabel: getNavigationLabel(),
        shifts: exportData,
        generatedAt: new Date(),
        companyName: 'Kifel Service',
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('common.error'), t('adminSchedules.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <ScreenHeader overline={t('adminSchedules.overline')} title={t('adminSchedules.title')} />
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handlePickFile}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Upload size={16} color={theme.primary} />
                  <Typography variant="caption" style={{ color: theme.primary, marginLeft: 6, fontWeight: '600' }}>
                    Import
                  </Typography>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowExportModal(true)}
              disabled={isExporting || shifts.length === 0}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={theme.textInverse} />
              ) : (
                <>
                  <Download size={16} color={theme.textInverse} />
                  <Typography variant="caption" style={{ color: theme.textInverse, marginLeft: 6, fontWeight: '600' }}>
                    Export
                  </Typography>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* View Mode Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {(['day', 'week', 'month', 'year', 'custom'] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.filterPill,
                {
                  backgroundColor: viewMode === mode ? theme.primary : theme.surface,
                  borderColor: viewMode === mode ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Typography
                variant="caption"
                style={{
                  color: viewMode === mode ? theme.textInverse : theme.textSecondary,
                  fontWeight: viewMode === mode ? '600' : '400',
                }}
              >
                {viewModeLabels[mode]}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Custom Date Range Picker */}
        {viewMode === 'custom' && (
          <View style={styles.customDateRow}>
            <View style={styles.customDateInput}>
              <Typography variant="caption" color="muted">{t('adminSchedules.customFrom')}</Typography>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                value={customFromStr}
                onChangeText={(text) => {
                  setCustomFromStr(text);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={styles.customDateInput}>
              <Typography variant="caption" color="muted">{t('adminSchedules.customTo')}</Typography>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                value={customToStr}
                onChangeText={(text) => {
                  setCustomToStr(text);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>
        )}

        {/* Date Navigation */}
        {viewMode !== 'custom' && <View style={styles.weekNav}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.surface }]}
            onPress={navigatePrevious}
          >
            <ChevronLeft size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentDate(new Date())}>
            <Typography variant="label" style={{ textAlign: 'center' }}>
              {getNavigationLabel()}
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.surface }]}
            onPress={navigateNext}
          >
            <ChevronRight size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>}

        {/* Content based on view mode */}
        {viewMode === 'year' ? (
          // Year View - Group by month
          <>
            {Array.from({ length: 12 }, (_, i) => {
              const monthDate = new Date(currentDate.getFullYear(), i, 1);
              const monthKey = format(monthDate, 'yyyy-MM');
              const monthShifts = shiftsByMonth[monthKey] || [];
              const totalHours = monthShifts.reduce((sum, s) => {
                const [startH, startM] = s.startTime.split(':').map(Number);
                const [endH, endM] = s.endTime.split(':').map(Number);
                return sum + (endH + endM / 60) - (startH + startM / 60);
              }, 0);

              return (
                <TouchableOpacity
                  key={monthKey}
                  style={[styles.monthCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                  onPress={() => {
                    setCurrentDate(monthDate);
                    setViewMode('month');
                  }}
                >
                  <View style={styles.monthHeader}>
                    <Typography variant="label">{format(monthDate, 'MMMM', { locale: de })}</Typography>
                    <ChevronRight size={16} color={theme.textMuted} />
                  </View>
                  <View style={styles.monthStats}>
                    <Typography variant="h3" style={{ color: theme.primary }}>{monthShifts.length}</Typography>
                    <Typography variant="caption" color="muted">{t('adminSchedules.shifts')}</Typography>
                  </View>
                  {totalHours > 0 && (
                    <Typography variant="caption" color="muted">
                      {Math.round(totalHours)} {t('adminSchedules.hours')}
                    </Typography>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          // Day, Week, Month View - Show individual days
          <>
            {dateRange.days.map((day, index) => {
              const dayShifts = getShiftsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <View key={index} style={styles.dayContainer}>
                  <View style={styles.dayHeader}>
                    <View>
                      <Typography variant="label" style={isToday ? { color: theme.primary } : undefined}>
                        {viewMode === 'day'
                          ? format(day, 'EEEE', { locale: de })
                          : format(day, viewMode === 'month' ? 'EEE d.' : 'EEEE', { locale: de })}
                      </Typography>
                      {viewMode !== 'day' && (
                        <Typography variant="caption" color="muted">
                          {format(day, viewMode === 'month' ? 'MMM' : 'd. MMM', { locale: de })}
                        </Typography>
                      )}
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
                                <Typography variant="caption" color="muted" numberOfLines={1}>{shift.location}</Typography>
                              </View>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                            <TouchableOpacity onPress={() => openEditModal(shift)}>
                              <Edit2 size={18} color={theme.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteShift(shift.id)}>
                              <Trash2 size={18} color={theme.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Card>
                    ))
                  ) : (
                    viewMode !== 'month' && (
                      <Card style={styles.emptyCard}>
                        <Typography variant="caption" color="muted">{t('adminSchedules.noShifts')}</Typography>
                      </Card>
                    )
                  )}
                </View>
              );
            })}

            {/* Month summary */}
            {viewMode === 'month' && shifts.length > 0 && (
              <View style={[styles.monthSummary, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <Typography variant="overline" color="muted">{t('adminSchedules.summary')}</Typography>
                <View style={styles.summaryRow}>
                  <Typography variant="body">{shifts.length} {t('adminSchedules.shifts')}</Typography>
                  <Typography variant="body" color="muted">
                    {Math.round(shifts.reduce((sum, s) => {
                      const [startH, startM] = s.startTime.split(':').map(Number);
                      const [endH, endM] = s.endTime.split(':').map(Number);
                      return sum + (endH + endM / 60) - (startH + startM / 60);
                    }, 0))} {t('adminSchedules.hours')}
                  </Typography>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('adminSchedules.addShift')}
        subtitle={selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de }) : ''}
      >
        <Typography variant="overline" color="muted" style={styles.modalLabel}>{t('adminSchedules.selectEmployeeSection')}</Typography>
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
            {t('adminSchedules.noEmployees')}
          </Typography>
        )}

        <Typography variant="overline" color="muted" style={{ ...styles.modalLabel, marginTop: spacing.lg }}>{t('adminSchedules.timeSection')}</Typography>
        <View style={styles.timeRow}>
          <View style={styles.timeInput}>
            <Typography variant="caption" color="muted">{t('adminSchedules.timeFrom')}</Typography>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:00"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={styles.timeInput}>
            <Typography variant="caption" color="muted">{t('adminSchedules.timeTo')}</Typography>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="16:00"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        <Typography variant="overline" color="muted" style={{ ...styles.modalLabel, marginTop: spacing.lg }}>
          {t('adminSchedules.selectLocation')}
        </Typography>
        {savedLocations.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationPickerRow}>
            {savedLocations.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={[
                  styles.locationPill,
                  {
                    backgroundColor: selectedLocationId === loc.id ? theme.primary + '20' : theme.surface,
                    borderColor: selectedLocationId === loc.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => {
                  if (selectedLocationId === loc.id) {
                    setSelectedLocationId(null);
                  } else {
                    setSelectedLocationId(loc.id);
                    setLocation('');
                  }
                }}
              >
                <MapPin size={12} color={selectedLocationId === loc.id ? theme.primary : theme.textMuted} />
                <Typography
                  variant="caption"
                  style={{
                    color: selectedLocationId === loc.id ? theme.primary : theme.textSecondary,
                    fontWeight: selectedLocationId === loc.id ? '600' : '400',
                    marginLeft: 4,
                  }}
                >
                  {loc.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, marginTop: spacing.sm }]}
          value={location}
          onChangeText={(text) => {
            setLocation(text);
            if (text) setSelectedLocationId(null);
          }}
          placeholder={savedLocations.length > 0 ? t('adminSchedules.locationFreetext') : t('adminSchedules.locationPlaceholder')}
          placeholderTextColor={theme.textMuted}
          editable={!selectedLocationId}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: selectedEmployeeId ? 1 : 0.5 }]}
          onPress={handleAddShift}
          disabled={!selectedEmployeeId}
        >
          <Typography variant="label" style={{ color: theme.textInverse }}>{t('adminSchedules.addShift')}</Typography>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingShift(null); }}
        title={t('adminSchedules.editShift')}
        subtitle={editingShift?.employeeName || ''}
      >
        {editingShift && (
          <>
            <Typography variant="overline" color="muted" style={styles.modalLabel}>{t('adminSchedules.editDate')}</Typography>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
            />

            <Typography variant="overline" color="muted" style={styles.modalLabel}>{t('adminSchedules.selectEmployeeSection')}</Typography>
            <ScrollView style={styles.employeeList} nestedScrollEnabled>
              {employees.map((emp) => (
                <TouchableOpacity
                  key={emp.id}
                  style={[
                    styles.employeeOption,
                    {
                      backgroundColor: editEmployeeId === emp.id ? theme.primary + '20' : theme.surface,
                      borderColor: editEmployeeId === emp.id ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setEditEmployeeId(emp.id)}
                >
                  <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
                  <Typography variant="body" style={styles.employeeOptionText}>{emp.firstName} {emp.lastName}</Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Typography variant="overline" color="muted" style={{ ...styles.modalLabel, marginTop: spacing.lg }}>{t('adminSchedules.timeSection')}</Typography>
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Typography variant="caption" color="muted">{t('adminSchedules.timeFrom')}</Typography>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  value={editStartTime}
                  onChangeText={setEditStartTime}
                  placeholder="08:00"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={styles.timeInput}>
                <Typography variant="caption" color="muted">{t('adminSchedules.timeTo')}</Typography>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  value={editEndTime}
                  onChangeText={setEditEndTime}
                  placeholder="16:00"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <Typography variant="overline" color="muted" style={{ ...styles.modalLabel, marginTop: spacing.lg }}>
              {t('adminSchedules.selectLocation')}
            </Typography>
            {savedLocations.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationPickerRow}>
                {savedLocations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.locationPill,
                      {
                        backgroundColor: editLocationId === loc.id ? theme.primary + '20' : theme.surface,
                        borderColor: editLocationId === loc.id ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => {
                      if (editLocationId === loc.id) {
                        setEditLocationId(null);
                      } else {
                        setEditLocationId(loc.id);
                        setEditLocation('');
                      }
                    }}
                  >
                    <MapPin size={12} color={editLocationId === loc.id ? theme.primary : theme.textMuted} />
                    <Typography
                      variant="caption"
                      style={{
                        color: editLocationId === loc.id ? theme.primary : theme.textSecondary,
                        fontWeight: editLocationId === loc.id ? '600' : '400',
                        marginLeft: 4,
                      }}
                    >
                      {loc.name}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, marginTop: spacing.sm }]}
              value={editLocation}
              onChangeText={(text) => {
                setEditLocation(text);
                if (text) setEditLocationId(null);
              }}
              placeholder={savedLocations.length > 0 ? t('adminSchedules.locationFreetext') : t('adminSchedules.locationPlaceholder')}
              placeholderTextColor={theme.textMuted}
              editable={!editLocationId}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleUpdateShift}
            >
              <Typography variant="label" style={{ color: theme.textInverse }}>{t('common.save')}</Typography>
            </TouchableOpacity>
          </>
        )}
      </Modal>

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        onClose={() => { setShowImportModal(false); setImportData(null); setEditableImportShifts([]); }}
        title={t('adminSchedules.importTitle')}
        subtitle={importData ? `${importData.employee.firstName} ${importData.employee.lastName}` : ''}
      >
        {importData && (
          <>
            {/* Summary - computed from editableImportShifts */}
            <View style={[styles.importSummary, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
              <View style={styles.importSummaryRow}>
                <FileSpreadsheet size={20} color={theme.primary} />
                <View style={styles.importSummaryText}>
                  <Typography variant="label">{editableImportShifts.length} {t('adminSchedules.shifts')}</Typography>
                  <Typography variant="caption" color="muted">
                    {Math.round(editableImportShifts.reduce((sum, s) => sum + s.hours, 0) * 10) / 10} {t('adminSchedules.hoursShort')} | {new Set(editableImportShifts.map(s => s.date)).size} {t('adminSchedules.days')}
                  </Typography>
                </View>
              </View>
              <Typography variant="caption" color="muted" style={styles.importPeriod}>
                {editableImportShifts.length > 0
                  ? `${format(parseISO(editableImportShifts[0].date), 'd. MMM', { locale: de })} - ${format(parseISO(editableImportShifts[editableImportShifts.length - 1].date), 'd. MMM yyyy', { locale: de })}`
                  : t('adminSchedules.importPeriodUnknown')}
              </Typography>
            </View>

            {/* Warnings */}
            {importWarnings.length > 0 && (
              <View style={[styles.importWarning, { backgroundColor: theme.pillWarning }]}>
                <AlertCircle size={16} color={theme.warning} />
                <Typography variant="caption" style={{ flex: 1, marginLeft: 8 }}>
                  {importWarnings.join(', ')}
                </Typography>
              </View>
            )}

            {/* Employee Selection */}
            <Typography variant="overline" color="muted" style={styles.modalLabel}>
              {t('adminSchedules.importAssign')}
            </Typography>
            <ScrollView style={styles.employeeList} nestedScrollEnabled>
              {employees.map((emp) => (
                <TouchableOpacity
                  key={emp.id}
                  style={[
                    styles.employeeOption,
                    {
                      backgroundColor: selectedImportUserId === emp.id ? theme.primary + '20' : theme.surface,
                      borderColor: selectedImportUserId === emp.id ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedImportUserId(emp.id)}
                >
                  <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
                  <View style={styles.employeeOptionText}>
                    <Typography variant="body">{emp.firstName} {emp.lastName}</Typography>
                    {importData.employee.firstName.toLowerCase() === emp.firstName.toLowerCase() &&
                     importData.employee.lastName.toLowerCase() === emp.lastName.toLowerCase() && (
                      <View style={[styles.matchBadge, { backgroundColor: theme.pillSuccess }]}>
                        <CheckCircle size={10} color={theme.pillSuccessText} />
                        <Typography variant="caption" style={{ color: theme.pillSuccessText, marginLeft: 4 }}>
                          Match
                        </Typography>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Editable Shifts List */}
            <Typography variant="overline" color="muted" style={{ ...styles.modalLabel, marginTop: spacing.md }}>
              {t('adminSchedules.importShiftsList')}
            </Typography>
            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled>
              {editableImportShifts.map((shift, idx) => (
                <View key={idx} style={[styles.previewShift, { borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        style={[styles.inlineInput, { color: theme.textSecondary, borderColor: theme.border }]}
                        value={shift.date}
                        onChangeText={(text) => {
                          const updated = [...editableImportShifts];
                          updated[idx] = { ...updated[idx], date: text };
                          setEditableImportShifts(updated);
                        }}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.textMuted}
                      />
                      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                        <TextInput
                          style={[styles.inlineInput, { flex: 1, color: theme.text, borderColor: theme.border }]}
                          value={shift.startTime}
                          onChangeText={(text) => {
                            const updated = [...editableImportShifts];
                            updated[idx] = { ...updated[idx], startTime: text };
                            setEditableImportShifts(updated);
                          }}
                          placeholder="08:00"
                          placeholderTextColor={theme.textMuted}
                        />
                        <Typography variant="body" style={{ alignSelf: 'center' }}>-</Typography>
                        <TextInput
                          style={[styles.inlineInput, { flex: 1, color: theme.text, borderColor: theme.border }]}
                          value={shift.endTime}
                          onChangeText={(text) => {
                            const updated = [...editableImportShifts];
                            updated[idx] = { ...updated[idx], endTime: text };
                            setEditableImportShifts(updated);
                          }}
                          placeholder="16:00"
                          placeholderTextColor={theme.textMuted}
                        />
                      </View>
                      <TextInput
                        style={[styles.inlineInput, { color: theme.textSecondary, borderColor: theme.border, marginTop: 4 }]}
                        value={shift.client || ''}
                        onChangeText={(text) => {
                          const updated = [...editableImportShifts];
                          updated[idx] = { ...updated[idx], client: text };
                          setEditableImportShifts(updated);
                        }}
                        placeholder={t('adminSchedules.locationPlaceholder')}
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>
                    <TouchableOpacity
                      style={{ padding: spacing.xs, marginLeft: spacing.sm }}
                      onPress={() => {
                        setEditableImportShifts(editableImportShifts.filter((_, i) => i !== idx));
                      }}
                    >
                      <X size={18} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Import Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: theme.primary,
                  opacity: selectedImportUserId && !isImporting && editableImportShifts.length > 0 ? 1 : 0.5,
                },
              ]}
              onPress={handleConfirmImport}
              disabled={!selectedImportUserId || isImporting || editableImportShifts.length === 0}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color={theme.textInverse} />
              ) : (
                <Typography variant="label" style={{ color: theme.textInverse }}>
                  {t('adminSchedules.importShiftsButton').replace('{count}', String(editableImportShifts.length))}
                </Typography>
              )}
            </TouchableOpacity>
          </>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={t('adminSchedules.exportTitle')}
        subtitle={getNavigationLabel()}
      >
        {EXPORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.exportOption, { borderColor: theme.border }]}
            onPress={() => handleExport(option.key)}
          >
            <View style={[styles.exportIconContainer, { backgroundColor: theme.pillInfo }]}>
              <option.icon size={24} color={theme.primary} />
            </View>
            <View style={styles.exportOptionInfo}>
              <Typography variant="label">{option.label}</Typography>
              <Typography variant="caption" color="muted">{option.description}</Typography>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ))}

        {shifts.length === 0 && (
          <View style={[styles.emptyExport, { backgroundColor: theme.pillWarning }]}>
            <AlertCircle size={16} color={theme.warning} />
            <Typography variant="caption" style={{ flex: 1, marginLeft: 8 }}>
              {t('adminSchedules.noShiftsInPeriod')}
            </Typography>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { paddingHorizontal: spacing.lg, paddingTop: 0, paddingBottom: spacing['3xl'] },
  // Filter
  filterScroll: {
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  customDateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  customDateInput: {
    flex: 1,
  },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  navButton: { padding: spacing.sm, borderRadius: 10 },
  dayContainer: { marginBottom: spacing.md },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addDayButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shiftCard: { marginBottom: spacing.sm },
  shiftContent: { flexDirection: 'row', alignItems: 'center' },
  shiftInfo: { flex: 1, marginLeft: spacing.md },
  shiftDetails: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.md },
  // Month/Year views
  monthCard: {
    padding: spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  monthStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  monthSummary: {
    padding: spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  // Modal
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
  // Header styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  // Export styles
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  exportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  emptyExport: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  // Import styles
  importSummary: {
    padding: spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  importSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importSummaryText: {
    marginLeft: spacing.md,
  },
  importPeriod: {
    marginTop: spacing.sm,
  },
  importWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  employeeList: {
    maxHeight: 180,
    marginBottom: spacing.sm,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  previewShift: {
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  inlineInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 14,
  },
  locationPickerRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
});
