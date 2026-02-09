// app/(employee)/reports.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Clock, Calendar, TrendingUp, Download, FileText, FileSpreadsheet, X } from 'lucide-react-native';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  parseISO,
} from 'date-fns';
import { de } from 'date-fns/locale';

import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAuthStore } from '@/src/store/authStore';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { timeEntriesCollection, TimeEntry } from '@/src/lib/firestore';
import { toast } from '@/src/utils/toast';
import { exportReport, ExportFormat, ExportEmployeeData } from '@/src/utils/exportUtils';

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year';

interface DayEntry {
  date: string;
  entries: TimeEntry[];
  totalMinutes: number;
  breakMinutes: number;
  netMinutes: number;
}

const PERIOD_OPTIONS: { key: PeriodType; label: string }[] = [
  { key: 'day', label: 'Tag' },
  { key: 'week', label: 'Woche' },
  { key: 'month', label: 'Monat' },
  { key: 'quarter', label: 'Quartal' },
  { key: 'halfyear', label: 'Halbjahr' },
  { key: 'year', label: 'Jahr' },
];

const EXPORT_OPTIONS: { key: ExportFormat; label: string; icon: any; description: string }[] = [
  { key: 'pdf', label: 'PDF', icon: FileText, description: 'Formatierter Bericht zum Drucken' },
  { key: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Bearbeitbare Tabelle (.xlsx)' },
  { key: 'csv', label: 'CSV', icon: FileText, description: 'Einfache Textdatei für Import' },
];

export default function EmployeeReportsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range based on period type
  const getDateRange = useCallback((date: Date, type: PeriodType): { start: Date; end: Date } => {
    switch (type) {
      case 'day':
        return { start: startOfDay(date), end: endOfDay(date) };
      case 'week':
        return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(date), end: endOfMonth(date) };
      case 'quarter':
        return { start: startOfQuarter(date), end: endOfQuarter(date) };
      case 'halfyear':
        const month = date.getMonth();
        const year = date.getFullYear();
        if (month < 6) {
          return { start: new Date(year, 0, 1), end: new Date(year, 5, 30) };
        } else {
          return { start: new Date(year, 6, 1), end: new Date(year, 11, 31) };
        }
      case 'year':
        return { start: startOfYear(date), end: endOfYear(date) };
    }
  }, []);

  // Navigate to previous/next period
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const amount = direction === 'prev' ? -1 : 1;
    switch (periodType) {
      case 'day':
        setCurrentDate(prev => addDays(prev, amount));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, amount));
        break;
      case 'month':
        setCurrentDate(prev => addMonths(prev, amount));
        break;
      case 'quarter':
        setCurrentDate(prev => addQuarters(prev, amount));
        break;
      case 'halfyear':
        setCurrentDate(prev => addMonths(prev, amount * 6));
        break;
      case 'year':
        setCurrentDate(prev => addYears(prev, amount));
        break;
    }
  };

  // Format period label
  const getPeriodLabel = useCallback((): string => {
    const { start, end } = getDateRange(currentDate, periodType);
    switch (periodType) {
      case 'day':
        return format(start, 'EEEE, d. MMMM yyyy', { locale: de });
      case 'week':
        return `${format(start, 'd. MMM', { locale: de })} – ${format(end, 'd. MMM yyyy', { locale: de })}`;
      case 'month':
        return format(start, 'MMMM yyyy', { locale: de });
      case 'quarter':
        const q = Math.floor(start.getMonth() / 3) + 1;
        return `Q${q} ${format(start, 'yyyy')}`;
      case 'halfyear':
        const h = start.getMonth() < 6 ? '1' : '2';
        return `${h}. Halbjahr ${format(start, 'yyyy')}`;
      case 'year':
        return format(start, 'yyyy');
    }
  }, [currentDate, periodType, getDateRange]);

  // Calculate hours from time entry
  const calculateHours = (entry: TimeEntry): { grossMinutes: number; breakMinutes: number } => {
    if (!entry.clockOut) return { grossMinutes: 0, breakMinutes: 0 };

    const clockIn = new Date(entry.clockIn);
    const clockOut = new Date(entry.clockOut);
    const grossMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));

    return {
      grossMinutes,
      breakMinutes: entry.breakMinutes || 0,
    };
  };

  // Load data
  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { start, end } = getDateRange(currentDate, periodType);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const entries = await timeEntriesCollection.getForUserInRange(user.id, startStr, endStr);

      // Group entries by day
      const dayMap = new Map<string, TimeEntry[]>();

      entries.forEach(entry => {
        const dateKey = entry.clockIn.split('T')[0];
        if (!dayMap.has(dateKey)) {
          dayMap.set(dateKey, []);
        }
        dayMap.get(dateKey)!.push(entry);
      });

      // Calculate stats per day
      const dayStats: DayEntry[] = Array.from(dayMap.entries())
        .map(([date, dayEntries]) => {
          let totalMinutes = 0;
          let breakMinutes = 0;

          dayEntries.forEach(entry => {
            const hours = calculateHours(entry);
            totalMinutes += hours.grossMinutes;
            breakMinutes += hours.breakMinutes;
          });

          return {
            date,
            entries: dayEntries.sort((a, b) =>
              new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime()
            ),
            totalMinutes,
            breakMinutes,
            netMinutes: totalMinutes - breakMinutes,
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));

      setDayEntries(dayStats);
    } catch (error) {
      toast.loadError('Arbeitsstunden');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, currentDate, periodType, getDateRange]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  // Export handler
  const handleExport = async (formatType: ExportFormat) => {
    setIsExporting(true);
    setShowExportModal(false);

    try {
      const totalGross = dayEntries.reduce((sum, d) => sum + d.totalMinutes, 0);
      const totalBreak = dayEntries.reduce((sum, d) => sum + d.breakMinutes, 0);
      const totalNet = dayEntries.reduce((sum, d) => sum + d.netMinutes, 0);
      const totalEntriesCount = dayEntries.reduce((sum, d) => sum + d.entries.length, 0);

      const employeeName = user ? `${user.firstName} ${user.lastName}` : 'Mitarbeiter';

      const exportData: ExportEmployeeData[] = [{
        name: employeeName,
        totalHours: Math.floor(totalGross / 60),
        totalMinutes: totalGross % 60,
        breakMinutes: totalBreak,
        netHours: Math.floor(totalNet / 60),
        netMinutes: totalNet % 60,
        entriesCount: totalEntriesCount,
      }];

      await exportReport(formatType, {
        title: `Arbeitsstunden — ${employeeName}`,
        periodLabel: getPeriodLabel(),
        employees: exportData,
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

  // Calculate totals
  const totals = dayEntries.reduce(
    (acc, day) => ({
      totalMinutes: acc.totalMinutes + day.netMinutes,
      breakMinutes: acc.breakMinutes + day.breakMinutes,
      daysWorked: acc.daysWorked + 1,
    }),
    { totalMinutes: 0, breakMinutes: 0, daysWorked: 0 }
  );

  const formatHoursMinutes = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const formatTime = (isoString: string): string => {
    return format(parseISO(isoString), 'HH:mm');
  };

  const formatDateLabel = (dateStr: string): string => {
    const date = parseISO(dateStr);
    return format(date, 'EEEE, d. MMMM', { locale: de });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
              <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>AUSWERTUNG</Text>
            </View>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>{t('empReports.subtitle')}</Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>{t('empReports.title')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowExportModal(true)}
            disabled={isExporting || dayEntries.length === 0}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.textInverse} />
            ) : (
              <Download size={20} color={theme.textInverse} />
            )}
          </TouchableOpacity>
        </View>

        {/* Period Type Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelector}>
          {PERIOD_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor: periodType === option.key ? theme.primary : theme.surface,
                  borderColor: periodType === option.key ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setPeriodType(option.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: periodType === option.key ? theme.textInverse : theme.textSecondary },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Period Navigation */}
        <View style={styles.periodNav}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.surface }]}
            onPress={() => navigatePeriod('prev')}
          >
            <ChevronLeft size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.periodLabel, { color: theme.text }]}>{getPeriodLabel()}</Text>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.surface }]}
            onPress={() => navigatePeriod('next')}
          >
            <ChevronRight size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconRow}>
                <Clock size={16} color={theme.primary} />
                <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('empReports.totalHours')}</Text>
              </View>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {formatHoursMinutes(totals.totalMinutes)} h
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconRow}>
                <Calendar size={16} color={theme.textSecondary} />
                <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('empReports.workDays')}</Text>
              </View>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{totals.daysWorked}</Text>
            </View>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryNote, { color: theme.textMuted }]}>
              Pause gesamt: {formatHoursMinutes(totals.breakMinutes)} h
            </Text>
            {totals.daysWorked > 0 && (
              <Text style={[styles.summaryNote, { color: theme.textMuted }]}>
                Ø {formatHoursMinutes(Math.round(totals.totalMinutes / totals.daysWorked))} h/Tag
              </Text>
            )}
          </View>
        </View>

        {/* Day Entries */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('empReports.details')}</Text>

        {dayEntries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Keine Einträge im gewählten Zeitraum</Text>
          </View>
        ) : (
          dayEntries.map((day) => (
            <View
              key={day.date}
              style={[styles.dayCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            >
              <View style={styles.dayHeader}>
                <Text style={[styles.dayDate, { color: theme.text }]}>{formatDateLabel(day.date)}</Text>
                <View style={styles.dayHours}>
                  <Text style={[styles.dayHoursValue, { color: theme.primary }]}>
                    {formatHoursMinutes(day.netMinutes)}
                  </Text>
                  <Text style={[styles.dayHoursLabel, { color: theme.textMuted }]}>Stunden</Text>
                </View>
              </View>

              {/* Individual entries for the day */}
              {day.entries.map((entry, index) => {
                const hours = calculateHours(entry);
                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.entryRow,
                      { borderTopColor: theme.borderLight },
                      index === 0 && { borderTopWidth: 1 },
                    ]}
                  >
                    <View style={styles.entryTimes}>
                      <View style={[styles.timeDot, { backgroundColor: theme.success }]} />
                      <Text style={[styles.entryTime, { color: theme.textSecondary }]}>
                        {formatTime(entry.clockIn)}
                      </Text>
                      <Text style={[styles.entryTimeSeparator, { color: theme.textMuted }]}>–</Text>
                      <Text style={[styles.entryTime, { color: theme.textSecondary }]}>
                        {entry.clockOut ? formatTime(entry.clockOut) : 'läuft'}
                      </Text>
                    </View>
                    <View style={styles.entryStats}>
                      {entry.breakMinutes > 0 && (
                        <Text style={[styles.entryBreak, { color: theme.textMuted }]}>
                          -{entry.breakMinutes} min Pause
                        </Text>
                      )}
                      <Text style={[styles.entryHours, { color: theme.text }]}>
                        {formatHoursMinutes(hours.grossMinutes - hours.breakMinutes)} h
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Day summary */}
              <View style={[styles.daySummary, { backgroundColor: theme.surface }]}>
                <Text style={[styles.daySummaryLabel, { color: theme.textMuted }]}>
                  Brutto: {formatHoursMinutes(day.totalMinutes)} h
                </Text>
                <Text style={[styles.daySummaryLabel, { color: theme.textMuted }]}>
                  Pause: {formatHoursMinutes(day.breakMinutes)} h
                </Text>
                <Text style={[styles.daySummaryValue, { color: theme.primary }]}>
                  Netto: {formatHoursMinutes(day.netMinutes)} h
                </Text>
              </View>
            </View>
          ))
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
          <Pressable style={[styles.modalContent, { backgroundColor: theme.cardBackground }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('adminReports.chooseExportFormat')}</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              {getPeriodLabel()}
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
    </SafeAreaView>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  exportButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerSmall: {
    fontSize: 13,
    marginBottom: 4,
  },
  headerLarge: {
    fontSize: 24,
    fontWeight: '700',
  },
  periodSelector: {
    marginBottom: spacing.md,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navButton: {
    padding: spacing.sm,
    borderRadius: 10,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  summaryCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  summaryNote: {
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
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
  dayCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayHours: {
    alignItems: 'flex-end',
  },
  dayHoursValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  dayHoursLabel: {
    fontSize: 11,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  entryTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  entryTimeSeparator: {
    fontSize: 14,
  },
  entryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  entryBreak: {
    fontSize: 12,
  },
  entryHours: {
    fontSize: 14,
    fontWeight: '600',
  },
  daySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  daySummaryLabel: {
    fontSize: 12,
  },
  daySummaryValue: {
    fontSize: 13,
    fontWeight: '600',
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
