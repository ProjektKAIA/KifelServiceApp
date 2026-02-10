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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Clock, Calendar, TrendingUp, Download, FileText, FileSpreadsheet, X, Target, AlertTriangle } from 'lucide-react-native';
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
import { timeEntriesCollection, usersCollection, TimeEntry } from '@/src/lib/firestore';
import { User } from '@/src/types';
import { toast } from '@/src/utils/toast';
import { exportReport, ExportFormat, ExportEmployeeData } from '@/src/utils/exportUtils';
import {
  calculateTargetMinutes,
  calculateDifference,
  formatMinutesAsHours,
  checkBreakCompliance,
  analyzePeriodBreakCompliance,
  type PeriodBreakComplianceResult,
  type DifferenceResult,
} from '@/src/utils/hoursUtils';

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year';

interface DayEntry {
  date: string;
  entries: TimeEntry[];
  totalMinutes: number;
  breakMinutes: number;
  netMinutes: number;
}

export default function EmployeeReportsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const PERIOD_OPTIONS: { key: PeriodType; label: string }[] = [
    { key: 'day', label: t('reports.periodDay') },
    { key: 'week', label: t('reports.periodWeek') },
    { key: 'month', label: t('reports.periodMonth') },
    { key: 'quarter', label: t('reports.periodQuarter') },
    { key: 'halfyear', label: t('reports.periodHalfYear') },
    { key: 'year', label: t('reports.periodYear') },
  ];

  const EXPORT_OPTIONS: { key: ExportFormat; label: string; icon: any; description: string }[] = [
    { key: 'pdf', label: 'PDF', icon: FileText, description: t('reports.exportPdfDesc') },
    { key: 'excel', label: 'Excel', icon: FileSpreadsheet, description: t('reports.exportExcelDesc') },
    { key: 'csv', label: 'CSV', icon: FileText, description: t('reports.exportCsvDesc') },
  ];

  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);

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
        return `${h}. ${t('reports.halfYearLabel')} ${format(start, 'yyyy')}`;
      case 'year':
        return format(start, 'yyyy');
    }
  }, [currentDate, periodType, getDateRange, t]);

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

      const [entries, profile] = await Promise.all([
        timeEntriesCollection.getForUserInRange(user.id, startStr, endStr),
        usersCollection.get(user.id),
      ]);
      if (profile) setUserProfile(profile);

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
      toast.loadError(t('adminReports.hoursReportTitle'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, currentDate, periodType, getDateRange, t]);

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

      const employeeName = user ? `${user.firstName} ${user.lastName}` : t('adminReports.employee');

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
        title: `${t('adminReports.hoursReportTitle')} — ${employeeName}`,
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

  // Soll/Ist computed values
  const weeklyTarget = userProfile?.weeklyTargetHours;
  const { start: rangeStart, end: rangeEnd } = getDateRange(currentDate, periodType);
  const targetMinutes = weeklyTarget && weeklyTarget > 0
    ? calculateTargetMinutes(weeklyTarget, rangeStart, rangeEnd)
    : undefined;
  const diffResult: DifferenceResult | undefined = targetMinutes !== undefined
    ? calculateDifference(totals.totalMinutes, targetMinutes)
    : undefined;

  // Break compliance
  const breakCompliance: PeriodBreakComplianceResult = analyzePeriodBreakCompliance(
    dayEntries.map(d => ({ totalMinutes: d.totalMinutes, breakMinutes: d.breakMinutes }))
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
              {t('reports.break')} gesamt: {formatHoursMinutes(totals.breakMinutes)} h
            </Text>
            {totals.daysWorked > 0 && (
              <Text style={[styles.summaryNote, { color: theme.textMuted }]}>
                Ø {formatHoursMinutes(Math.round(totals.totalMinutes / totals.daysWorked))} h/Tag
              </Text>
            )}
          </View>
        </View>

        {/* Soll/Ist Card */}
        {targetMinutes !== undefined && diffResult && (
          <View style={[styles.targetCard, { backgroundColor: diffResult.isOvertime ? theme.success + '12' : theme.danger + '12', borderColor: diffResult.isOvertime ? theme.success : theme.danger }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconRow}>
                  <Target size={16} color={theme.textSecondary} />
                  <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('empReports.targetHours')}</Text>
                </View>
                <Text style={[styles.summaryValue, { color: theme.textSecondary, fontSize: 22 }]}>
                  {formatMinutesAsHours(targetMinutes)} h
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconRow}>
                  <TrendingUp size={16} color={diffResult.isOvertime ? theme.success : theme.danger} />
                  <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('empReports.difference')}</Text>
                </View>
                <Text style={[styles.summaryValue, { color: diffResult.isOvertime ? theme.success : theme.danger, fontSize: 22 }]}>
                  {diffResult.formattedDifference} h
                </Text>
              </View>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <Text style={[styles.summaryNote, { color: theme.textMuted }]}>
              {t('empReports.basedOnWeekly')}: {weeklyTarget} {t('empReports.hoursPerWeek')}
            </Text>
          </View>
        )}

        {/* Break Compliance Warning */}
        {breakCompliance.nonCompliantDays > 0 && (
          <View style={[styles.complianceWarning, { backgroundColor: theme.warning + '15', borderColor: theme.warning + '40' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color={theme.warning} />
              <Text style={[styles.complianceWarningTitle, { color: theme.warning }]}>{t('empReports.breakWarning')}</Text>
            </View>
            <Text style={[styles.complianceWarningText, { color: theme.textSecondary }]}>
              {breakCompliance.nonCompliantDays} {t('empReports.nonCompliantDays')} (ArbZG)
            </Text>
          </View>
        )}

        {/* Day Entries */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('empReports.details')}</Text>

        {dayEntries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('reports.noEntriesInPeriod')}</Text>
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
                  <Text style={[styles.dayHoursLabel, { color: theme.textMuted }]}>{t('tabs.hours')}</Text>
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
                        {entry.clockOut ? formatTime(entry.clockOut) : t('reports.running')}
                      </Text>
                    </View>
                    <View style={styles.entryStats}>
                      {entry.breakMinutes > 0 && (
                        <Text style={[styles.entryBreak, { color: theme.textMuted }]}>
                          -{entry.breakMinutes} {t('reports.minBreak')}
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
                  {t('reports.gross')}: {formatHoursMinutes(day.totalMinutes)} h
                </Text>
                <Text style={[styles.daySummaryLabel, { color: theme.textMuted }]}>
                  {t('reports.break')}: {formatHoursMinutes(day.breakMinutes)} h
                </Text>
                <Text style={[styles.daySummaryValue, { color: theme.primary }]}>
                  {t('reports.net')}: {formatHoursMinutes(day.netMinutes)} h
                </Text>
                {!checkBreakCompliance(day.totalMinutes, day.breakMinutes).isCompliant && (
                  <View style={[styles.breakWarningBadge, { backgroundColor: theme.warning + '20' }]}>
                    <AlertTriangle size={10} color={theme.warning} />
                  </View>
                )}
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
  targetCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  complianceWarning: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: 6,
  },
  complianceWarningTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  complianceWarningText: {
    fontSize: 13,
    marginLeft: 26,
  },
  breakWarningBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
