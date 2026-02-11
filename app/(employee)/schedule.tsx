// app/(employee)/schedule.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, MapPin, Download, FileText, FileSpreadsheet, X } from 'lucide-react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAuthStore } from '@/src/store/authStore';
import { shiftsCollection } from '@/src/lib/firestore';
import { Shift } from '@/src/types';
import { exportSchedule, ExportFormat, ExportShiftData } from '@/src/utils/exportUtils';

const EXPORT_OPTIONS: { key: ExportFormat; label: string; icon: any; description: string }[] = [
  { key: 'pdf', label: 'PDF', icon: FileText, description: 'Formatierter Bericht zum Drucken' },
  { key: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Bearbeitbare Tabelle (.xlsx)' },
  { key: 'csv', label: 'CSV', icon: FileText, description: 'Einfache Textdatei für Import' },
];

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const WEEKDAYS = [
    t('empSchedule.weekdays.mo'),
    t('empSchedule.weekdays.tu'),
    t('empSchedule.weekdays.we'),
    t('empSchedule.weekdays.th'),
    t('empSchedule.weekdays.fr'),
    t('empSchedule.weekdays.sa'),
    t('empSchedule.weekdays.su'),
  ];
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for first day (Monday = 0, Sunday = 6)
  const firstDayOfWeek = getDay(monthStart);
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const loadShifts = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load shifts for current month and next month
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(addMonths(monthEnd, 1), 'yyyy-MM-dd');

      const userShifts = await shiftsCollection.getForUser(user.id, startDate, endDate);
      setShifts(userShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, monthStart, monthEnd]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadShifts();
  }, [loadShifts]);

  // Export handler
  const handleExport = async (formatType: ExportFormat) => {
    setIsExporting(true);
    setShowExportModal(false);

    try {
      const employeeName = user ? `${user.firstName} ${user.lastName}` : 'Mitarbeiter';
      const periodLabel = format(currentMonth, 'MMMM yyyy', { locale: de });

      const shiftData: ExportShiftData[] = shifts
        .filter(s => s.status !== 'cancelled')
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(shift => {
          const [startH, startM] = shift.startTime.split(':').map(Number);
          const [endH, endM] = shift.endTime.split(':').map(Number);
          const hours = (endH * 60 + endM - startH * 60 - startM) / 60;

          return {
            date: format(new Date(shift.date), 'dd.MM.yyyy'),
            employeeName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            location: shift.location || '',
            hours: Math.max(0, hours),
          };
        });

      await exportSchedule(formatType, {
        title: `Dienstplan — ${employeeName}`,
        periodLabel,
        shifts: shiftData,
        generatedAt: new Date(),
        companyName: 'Kifel Service',
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('common.error'), t('adminReports.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const hasShift = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.some((s) => s.date === dateStr);
  };

  const getShiftForDate = (date: Date): Shift | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.find((s) => s.date === dateStr);
  };

  const isShiftActive = (shift: Shift) => {
    const today = new Date();
    const shiftDate = new Date(shift.date);
    return isSameDay(shiftDate, today) && shift.status !== 'completed' && shift.status !== 'cancelled';
  };

  const upcomingShifts = shifts
    .filter((s) => {
      const shiftDate = new Date(s.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return shiftDate >= today && s.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header with Export Button */}
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
            <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>{t('empSchedule.title')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowExportModal(true)}
            disabled={isExporting || shifts.length === 0}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.textInverse} />
            ) : (
              <Download size={20} color={theme.textInverse} />
            )}
          </TouchableOpacity>
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

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('empSchedule.title')}</Text>

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
              const isCurrentDay = isToday(day);

              return (
                <View key={day.toISOString()} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayNumber,
                      hasShiftOnDay && styles.dayWithShift,
                      hasShiftOnDay && { backgroundColor: theme.primary },
                      isCurrentDay && !hasShiftOnDay && { borderColor: theme.primary, borderWidth: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.text },
                        hasShiftOnDay && { color: theme.textInverse },
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
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('empSchedule.upcomingShifts')}</Text>

        {upcomingShifts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('empSchedule.noUpcoming')}</Text>
          </View>
        ) : (
          upcomingShifts.map((shift) => {
            const shiftDate = new Date(shift.date);
            const shiftIsToday = isToday(shiftDate);
            const active = isShiftActive(shift);

            return (
              <View
                key={shift.id}
                style={[styles.shiftCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              >
                <View style={styles.shiftInfo}>
                  <Text style={[styles.shiftDate, { color: theme.text }]}>
                    {shiftIsToday ? t('common.today') : format(shiftDate, 'EEE, d. MMM', { locale: de })}
                  </Text>
                  <Text style={[styles.shiftTime, { color: theme.textMuted }]}>
                    {shift.startTime} – {shift.endTime} Uhr
                  </Text>
                  {shift.location && (
                    <View style={styles.shiftLocationRow}>
                      <MapPin size={12} color={theme.primary} />
                      <Text style={[styles.shiftLocation, { color: theme.primary }]}>{shift.location}</Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.shiftStatusPill,
                    { backgroundColor: active ? theme.pillSuccess : theme.pillInfo },
                  ]}
                >
                  <View
                    style={[
                      styles.shiftStatusDot,
                      { backgroundColor: active ? theme.pillSuccessText : theme.pillInfoText },
                    ]}
                  />
                  <Text style={{ color: active ? theme.pillSuccessText : theme.pillInfoText, fontSize: 11, fontWeight: '600' }}>
                    {active ? t('empSchedule.active') : t('empSchedule.planned')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowExportModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.background }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('adminReports.chooseExportFormat')}</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </Text>

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
                  <Text style={[styles.exportOptionLabel, { color: theme.text }]}>{option.label}</Text>
                  <Text style={[styles.exportOptionDesc, { color: theme.textMuted }]}>{option.description}</Text>
                </View>
                <ChevronRight size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.base,
    paddingTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
  emptyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderWidth: 1,
    borderRadius: borderRadius.card,
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
  exportOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  exportOptionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
});
