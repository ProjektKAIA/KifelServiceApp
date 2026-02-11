// app/(admin)/reports.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  Download,
  FileText,
  FileSpreadsheet,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Coffee,
  Navigation,
  Home,
  Route,
  Target,
  AlertTriangle,
  Check,
  AlertCircle,
} from 'lucide-react-native';
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
} from 'date-fns';
import { de } from 'date-fns/locale';

import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { timeEntriesCollection, usersCollection, TimeEntry } from '@/src/lib/firestore';
import { User } from '@/src/types';
import { useAuthStore } from '@/src/store/authStore';
import { exportReport, exportLocationReport, ExportFormat, ExportEmployeeData, ExportLocationData } from '@/src/utils/exportUtils';
import { isFieldEntry, calculateTotalDistance, formatDistance } from '@/src/utils/locationUtils';
import {
  calculateTargetMinutes,
  calculateDifference,
  formatMinutesAsHours,
  checkBreakCompliance,
  analyzePeriodBreakCompliance,
  type PeriodBreakComplianceResult,
} from '@/src/utils/hoursUtils';
import RouteMap from '@/src/components/organisms/RouteMap';

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year' | 'custom';
type ReportTab = 'stunden' | 'standort';
type LocationFilter = 'alle' | 'aussen' | 'innen';

interface EmployeeStats {
  userId: string;
  userName: string;
  totalHours: number;
  totalMinutes: number;
  breakMinutes: number;
  netHours: number;
  netMinutes: number;
  entriesCount: number;
  entries: TimeEntry[];
  weeklyTargetHours?: number;
  targetMinutes?: number;
  differenceMinutes?: number;
  isOvertime?: boolean;
  formattedDifference?: string;
  breakCompliance?: PeriodBreakComplianceResult;
  pendingCount: number;
}

interface EmployeeLocationStats {
  userId: string;
  userName: string;
  isField: boolean; // mind. 1 Außen-Eintrag im Zeitraum
  fieldEntries: TimeEntry[];
  officeEntries: TimeEntry[];
  totalEntries: number;
  totalDistance: number; // Gesamtdistanz aller Feld-Einträge in Metern
  gpsPointsCount: number;
}

export default function AdminReportsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user: adminUser } = useAuthStore();

  const PERIOD_OPTIONS: { key: PeriodType; label: string }[] = useMemo(() => [
    { key: 'day', label: t('reports.periodDay') },
    { key: 'week', label: t('reports.periodWeek') },
    { key: 'month', label: t('reports.periodMonth') },
    { key: 'custom', label: t('reports.periodCustom') },
    { key: 'quarter', label: t('reports.periodQuarter') },
    { key: 'halfyear', label: t('reports.periodHalfYear') },
    { key: 'year', label: t('reports.periodYear') },
  ], [t]);

  const EXPORT_OPTIONS: { key: ExportFormat; label: string; icon: any; description: string }[] = useMemo(() => [
    { key: 'pdf', label: 'PDF', icon: FileText, description: t('reports.exportPdfDesc') },
    { key: 'excel', label: 'Excel', icon: FileSpreadsheet, description: t('reports.exportExcelDesc') },
    { key: 'csv', label: 'CSV', icon: FileText, description: t('reports.exportCsvDesc') },
  ], [t]);

  const [activeTab, setActiveTab] = useState<ReportTab>('stunden');
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<{ user: User; stats: EmployeeStats } | null>(null);

  // Custom date range state
  const [customStart, setCustomStart] = useState<Date>(() => startOfMonth(new Date()));
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectEntryId, setRejectEntryId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Standort-Tab state
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('alle');
  const [showLocationDetailModal, setShowLocationDetailModal] = useState(false);
  const [locationDetailEmployee, setLocationDetailEmployee] = useState<{
    user: User;
    stats: EmployeeLocationStats;
  } | null>(null);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);

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
      case 'custom':
        return { start: startOfDay(customStart), end: endOfDay(customEnd) };
    }
  }, [customStart, customEnd]);

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
      case 'custom':
        return `${format(customStart, 'd. MMM yyyy', { locale: de })} – ${format(customEnd, 'd. MMM yyyy', { locale: de })}`;
    }
  }, [currentDate, periodType, getDateRange, customStart, customEnd]);

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
    try {
      const { start, end } = getDateRange(currentDate, periodType);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const [entriesData, employeesData] = await Promise.all([
        timeEntriesCollection.getAllInRange(startStr, endStr),
        usersCollection.getAll(),
      ]);

      setEmployees(employeesData);
      setAllEntries(entriesData);

      // Group entries by employee and calculate stats
      const statsMap = new Map<string, EmployeeStats>();

      // Initialize stats for all employees
      employeesData.forEach(emp => {
        statsMap.set(emp.id, {
          userId: emp.id,
          userName: `${emp.firstName} ${emp.lastName}`,
          totalHours: 0,
          totalMinutes: 0,
          breakMinutes: 0,
          netHours: 0,
          netMinutes: 0,
          entriesCount: 0,
          entries: [],
          pendingCount: 0,
        });
      });

      // Calculate stats from entries (rejected entries don't count towards hours)
      entriesData.forEach(entry => {
        const stats = statsMap.get(entry.userId);
        if (!stats) return;

        stats.entries.push(entry);
        stats.entriesCount += 1;

        if (entry.approvalStatus === 'pending') {
          stats.pendingCount += 1;
        }

        // Rejected entries don't contribute to hour calculations
        if (entry.approvalStatus === 'rejected') return;

        const { grossMinutes, breakMinutes } = calculateHours(entry);
        const netMinutes = grossMinutes - breakMinutes;

        stats.totalMinutes += grossMinutes;
        stats.breakMinutes += breakMinutes;
        stats.netMinutes += netMinutes;
      });

      // Convert to hours, compute target/difference and break compliance
      const statsList = Array.from(statsMap.values())
        .map(stats => {
          const totalGrossMinutes = stats.totalMinutes;
          const totalNetMinutes = stats.netMinutes;
          const employee = employeesData.find(e => e.id === stats.userId);
          const weeklyTarget = employee?.weeklyTargetHours;

          // Soll/Ist calculation
          let targetMinutes: number | undefined;
          let differenceMinutes: number | undefined;
          let isOvertime: boolean | undefined;
          let formattedDifference: string | undefined;

          if (weeklyTarget && weeklyTarget > 0) {
            targetMinutes = calculateTargetMinutes(weeklyTarget, start, end);
            const diff = calculateDifference(totalNetMinutes, targetMinutes);
            differenceMinutes = diff.differenceMinutes;
            isOvertime = diff.isOvertime;
            formattedDifference = diff.formattedDifference;
          }

          // Break compliance per day
          const dayMap = new Map<string, { totalMinutes: number; breakMinutes: number }>();
          stats.entries.forEach(entry => {
            const dateKey = entry.clockIn.split('T')[0];
            if (!dayMap.has(dateKey)) {
              dayMap.set(dateKey, { totalMinutes: 0, breakMinutes: 0 });
            }
            const dayData = dayMap.get(dateKey)!;
            const { grossMinutes, breakMinutes: bm } = calculateHours(entry);
            dayData.totalMinutes += grossMinutes;
            dayData.breakMinutes += bm;
          });
          const breakCompliance = analyzePeriodBreakCompliance(Array.from(dayMap.values()));

          return {
            ...stats,
            totalHours: Math.floor(totalGrossMinutes / 60),
            totalMinutes: totalGrossMinutes % 60,
            netHours: Math.floor(totalNetMinutes / 60),
            netMinutes: totalNetMinutes % 60,
            weeklyTargetHours: weeklyTarget,
            targetMinutes,
            differenceMinutes,
            isOvertime,
            formattedDifference,
            breakCompliance,
          };
        })
        .filter(stats => selectedEmployeeId ? stats.userId === selectedEmployeeId : true)
        .sort((a, b) => (b.netHours * 60 + b.netMinutes) - (a.netHours * 60 + a.netMinutes));

      setEmployeeStats(statsList);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentDate, periodType, selectedEmployeeId, getDateRange]);

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
      if (activeTab === 'standort') {
        const locationData: ExportLocationData[] = employeeLocationStats.map(stats => {
          const hasField = stats.fieldEntries.length > 0;
          const hasOffice = stats.officeEntries.length > 0;
          const type: ExportLocationData['type'] = hasField && hasOffice ? 'Beides' : hasField ? 'Außen' : 'Innen';

          // Collect all route points from field entries
          const routePoints: { lat: number; lng: number }[] = [];
          stats.fieldEntries.forEach(entry => {
            (entry.locationHistory || []).forEach(point => {
              routePoints.push({ lat: point.latitude, lng: point.longitude });
            });
          });

          return {
            employeeName: stats.userName,
            type,
            fieldEntries: stats.fieldEntries.length,
            officeEntries: stats.officeEntries.length,
            totalEntries: stats.totalEntries,
            totalDistance: formatDistance(stats.totalDistance),
            gpsPointsCount: stats.gpsPointsCount,
            routePoints: routePoints.length > 0 ? routePoints : undefined,
          };
        });

        await exportLocationReport(formatType, {
          title: 'Standort-Auswertung',
          periodLabel: getPeriodLabel(),
          employees: locationData,
          generatedAt: new Date(),
          companyName: 'Kifel Service',
        });
      } else {
        const exportData: ExportEmployeeData[] = employeeStats.map(stats => ({
          name: stats.userName,
          totalHours: stats.totalHours,
          totalMinutes: stats.totalMinutes,
          breakMinutes: stats.breakMinutes,
          netHours: stats.netHours,
          netMinutes: stats.netMinutes,
          entriesCount: stats.entriesCount,
        }));

        await exportReport(formatType, {
          title: 'Arbeitsstunden-Auswertung',
          periodLabel: getPeriodLabel(),
          employees: exportData,
          generatedAt: new Date(),
          companyName: 'Kifel Service',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('common.error'), t('adminReports.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate totals
  const totals = employeeStats.reduce(
    (acc, stats) => ({
      totalMinutes: acc.totalMinutes + stats.netHours * 60 + stats.netMinutes,
      breakMinutes: acc.breakMinutes + stats.breakMinutes,
      entriesCount: acc.entriesCount + stats.entriesCount,
    }),
    { totalMinutes: 0, breakMinutes: 0, entriesCount: 0 }
  );

  const formatHoursMinutes = (hours: number, minutes: number): string => {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Open employee detail modal (Stunden tab)
  const handleOpenDetail = (stats: EmployeeStats) => {
    const user = employees.find(e => e.id === stats.userId);
    if (user) {
      setDetailEmployee({ user, stats });
      setShowDetailModal(true);
    }
  };

  // Approve time entry
  const handleApproveEntry = async (entryId: string) => {
    if (!adminUser) return;
    try {
      await timeEntriesCollection.updateApprovalStatus(entryId, 'approved', adminUser.id);
      Alert.alert(t('approval.approvedTitle'), t('approval.approvedMessage'));
      loadData();
    } catch (error) {
      Alert.alert(t('common.error'), t('approval.approveError'));
    }
  };

  // Open reject modal
  const handleOpenRejectModal = (entryId: string) => {
    setRejectEntryId(entryId);
    setRejectNote('');
    setShowRejectModal(true);
  };

  // Confirm rejection
  const handleConfirmReject = async () => {
    if (!adminUser || !rejectEntryId) return;
    try {
      await timeEntriesCollection.updateApprovalStatus(rejectEntryId, 'rejected', adminUser.id, rejectNote || undefined);
      setShowRejectModal(false);
      setRejectEntryId(null);
      setRejectNote('');
      Alert.alert(t('approval.rejectedTitle'), t('approval.rejectedMessage'));
      loadData();
    } catch (error) {
      Alert.alert(t('common.error'), t('approval.rejectError'));
    }
  };

  // Format time entry for display
  const formatTimeEntry = (entry: TimeEntry) => {
    const clockIn = new Date(entry.clockIn);
    const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;
    const { grossMinutes, breakMinutes } = calculateHours(entry);
    const netMinutes = grossMinutes - breakMinutes;
    const netHours = Math.floor(netMinutes / 60);
    const netMins = netMinutes % 60;

    return {
      date: format(clockIn, 'EEE, d. MMM', { locale: de }),
      dateShort: format(clockIn, 'dd.MM.', { locale: de }),
      clockIn: format(clockIn, 'HH:mm'),
      clockOut: clockOut ? format(clockOut, 'HH:mm') : '--:--',
      grossHours: Math.floor(grossMinutes / 60),
      grossMins: grossMinutes % 60,
      breakMins: breakMinutes,
      netHours,
      netMins,
      location: entry.clockInLocation?.address || entry.clockOutLocation?.address || null,
    };
  };

  // ============================================================================
  // STANDORT TAB: Computed data
  // ============================================================================

  const employeeLocationStats: EmployeeLocationStats[] = useMemo(() => {
    const statsMap = new Map<string, EmployeeLocationStats>();

    employees.forEach(emp => {
      statsMap.set(emp.id, {
        userId: emp.id,
        userName: `${emp.firstName} ${emp.lastName}`,
        isField: false,
        fieldEntries: [],
        officeEntries: [],
        totalEntries: 0,
        totalDistance: 0,
        gpsPointsCount: 0,
      });
    });

    allEntries.forEach(entry => {
      const stats = statsMap.get(entry.userId);
      if (!stats) return;

      stats.totalEntries += 1;

      if (isFieldEntry(entry)) {
        stats.isField = true;
        stats.fieldEntries.push(entry);
        const points = entry.locationHistory || [];
        stats.totalDistance += calculateTotalDistance(points);
        stats.gpsPointsCount += points.length;
      } else {
        stats.officeEntries.push(entry);
      }
    });

    let result = Array.from(statsMap.values()).filter(s => s.totalEntries > 0);

    if (locationFilter === 'aussen') {
      result = result.filter(s => s.isField);
    } else if (locationFilter === 'innen') {
      result = result.filter(s => !s.isField);
    }

    return result.sort((a, b) => b.totalDistance - a.totalDistance);
  }, [employees, allEntries, locationFilter]);

  const locationSummary = useMemo(() => {
    const allStats = Array.from(
      employees.reduce((map, emp) => {
        if (!map.has(emp.id)) {
          map.set(emp.id, { isField: false, gpsPoints: 0 });
        }
        return map;
      }, new Map<string, { isField: boolean; gpsPoints: number }>())
    );

    let fieldCount = 0;
    let totalGpsPoints = 0;

    allEntries.forEach(entry => {
      if (isFieldEntry(entry)) {
        const empData = allStats.find(([id]) => id === entry.userId);
        if (empData) {
          empData[1].isField = true;
          empData[1].gpsPoints += (entry.locationHistory || []).length;
        }
      }
    });

    allStats.forEach(([, data]) => {
      if (data.isField) fieldCount++;
      totalGpsPoints += data.gpsPoints;
    });

    return { fieldCount, totalGpsPoints };
  }, [employees, allEntries]);

  // Open location detail modal
  const handleOpenLocationDetail = (stats: EmployeeLocationStats) => {
    const user = employees.find(e => e.id === stats.userId);
    if (user) {
      setLocationDetailEmployee({ user, stats });
      setSelectedEntryIndex(0);
      setShowLocationDetailModal(true);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
            <View style={[styles.badge, { backgroundColor: theme.pillSecondary }]}>
              <Text style={[styles.badgeText, { color: theme.pillSecondaryText }]}>{t('reports.evaluation')}</Text>
            </View>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
              {activeTab === 'stunden' ? t('adminReports.workHours') : t('adminReports.gpsTracking')}
            </Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>
              {activeTab === 'stunden' ? t('adminReports.hoursOverview') : t('adminReports.locationAnalysis')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowExportModal(true)}
            disabled={isExporting || (activeTab === 'stunden' ? employeeStats.length === 0 : employeeLocationStats.length === 0)}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.textInverse} />
            ) : (
              <Download size={20} color={theme.textInverse} />
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Toggle */}
        <View style={[styles.tabToggleContainer, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[
              styles.tabToggleButton,
              activeTab === 'stunden' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab('stunden')}
          >
            <Clock size={16} color={activeTab === 'stunden' ? theme.textInverse : theme.textSecondary} />
            <Text
              style={[
                styles.tabToggleText,
                { color: activeTab === 'stunden' ? theme.textInverse : theme.textSecondary },
              ]}
            >
              {t('adminReports.hours')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabToggleButton,
              activeTab === 'standort' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab('standort')}
          >
            <MapPin size={16} color={activeTab === 'standort' ? theme.textInverse : theme.textSecondary} />
            <Text
              style={[
                styles.tabToggleText,
                { color: activeTab === 'standort' ? theme.textInverse : theme.textSecondary },
              ]}
            >
              {t('adminReports.location')}
            </Text>
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
        {periodType === 'custom' ? (
          <View style={styles.customDateContainer}>
            <TouchableOpacity
              style={[styles.datePickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowDatePicker('start')}
            >
              <Calendar size={16} color={theme.primary} />
              <View>
                <Text style={[styles.datePickerLabel, { color: theme.textMuted }]}>{t('reports.customFrom')}</Text>
                <Text style={[styles.datePickerValue, { color: theme.text }]}>
                  {format(customStart, 'dd.MM.yyyy')}
                </Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.datePickerDash, { color: theme.textMuted }]}>–</Text>
            <TouchableOpacity
              style={[styles.datePickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowDatePicker('end')}
            >
              <Calendar size={16} color={theme.primary} />
              <View>
                <Text style={[styles.datePickerLabel, { color: theme.textMuted }]}>{t('reports.customTo')}</Text>
                <Text style={[styles.datePickerValue, { color: theme.text }]}>
                  {format(customEnd, 'dd.MM.yyyy')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
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
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          Platform.OS === 'ios' ? (
            <Modal transparent animationType="fade" onRequestClose={() => setShowDatePicker(null)}>
              <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(null)}>
                <Pressable style={[styles.datePickerModal, { backgroundColor: theme.background }]} onPress={() => {}}>
                  <View style={styles.datePickerModalHeader}>
                    <Text style={[styles.datePickerModalTitle, { color: theme.text }]}>
                      {showDatePicker === 'start' ? t('reports.customFrom') : t('reports.customTo')}
                    </Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                      <Text style={[styles.datePickerDone, { color: theme.primary }]}>{t('common.ok')}</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={showDatePicker === 'start' ? customStart : customEnd}
                    mode="date"
                    display="spinner"
                    maximumDate={showDatePicker === 'start' ? customEnd : new Date()}
                    minimumDate={showDatePicker === 'end' ? customStart : undefined}
                    onChange={(_: DateTimePickerEvent, date?: Date) => {
                      if (date) {
                        if (showDatePicker === 'start') setCustomStart(date);
                        else setCustomEnd(date);
                      }
                    }}
                    locale="de"
                  />
                </Pressable>
              </Pressable>
            </Modal>
          ) : (
            <DateTimePicker
              value={showDatePicker === 'start' ? customStart : customEnd}
              mode="date"
              display="default"
              maximumDate={showDatePicker === 'start' ? customEnd : new Date()}
              minimumDate={showDatePicker === 'end' ? customStart : undefined}
              onChange={(_: DateTimePickerEvent, date?: Date) => {
                setShowDatePicker(null);
                if (date) {
                  if (showDatePicker === 'start') setCustomStart(date);
                  else setCustomEnd(date);
                }
              }}
            />
          )
        )}

        {/* ============================================================ */}
        {/* STUNDEN TAB */}
        {/* ============================================================ */}
        {activeTab === 'stunden' && (
          <>
            {/* Employee Filter */}
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('reports.filter')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.employeeFilter}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: !selectedEmployeeId ? theme.primary : theme.surface,
                    borderColor: !selectedEmployeeId ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedEmployeeId(null)}
              >
                <Users size={14} color={!selectedEmployeeId ? theme.textInverse : theme.textSecondary} />
                <Text
                  style={[
                    styles.filterButtonText,
                    { color: !selectedEmployeeId ? theme.textInverse : theme.textSecondary },
                  ]}
                >
                  {t('reports.all')}
                </Text>
              </TouchableOpacity>
              {employees.map((emp) => (
                <TouchableOpacity
                  key={emp.id}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: selectedEmployeeId === emp.id ? theme.primary : theme.surface,
                      borderColor: selectedEmployeeId === emp.id ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedEmployeeId(emp.id)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: selectedEmployeeId === emp.id ? theme.textInverse : theme.textSecondary },
                    ]}
                  >
                    {emp.firstName} {emp.lastName.charAt(0)}.
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}>
                    <Clock size={16} color={theme.primary} />
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('reports.netHours')}</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: theme.primary }]}>
                    {formatHoursMinutes(Math.floor(totals.totalMinutes / 60), totals.totalMinutes % 60)} h
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}>
                    <TrendingUp size={16} color={theme.textSecondary} />
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('reports.entries')}</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{totals.entriesCount}</Text>
                </View>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryNote, { color: theme.textMuted }]}>
                  {t('reports.totalBreak')}: {Math.floor(totals.breakMinutes / 60)}:{(totals.breakMinutes % 60).toString().padStart(2, '0')} h
                </Text>
              </View>
              {/* Soll/Differenz Summary */}
              {(() => {
                const totalTarget = employeeStats.reduce((sum, s) => sum + (s.targetMinutes || 0), 0);
                const totalDiff = employeeStats.reduce((sum, s) => sum + (s.differenceMinutes || 0), 0);
                const hasAnyTarget = employeeStats.some(s => s.targetMinutes !== undefined);
                if (!hasAnyTarget) return null;
                const isOT = totalDiff >= 0;
                return (
                  <>
                    <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <View style={styles.summaryIconRow}>
                          <Target size={16} color={theme.textSecondary} />
                          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('adminReports.targetHours')}</Text>
                        </View>
                        <Text style={[styles.summaryValue, { color: theme.textSecondary, fontSize: 22 }]}>
                          {formatMinutesAsHours(totalTarget)} h
                        </Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <View style={styles.summaryIconRow}>
                          <TrendingUp size={16} color={isOT ? theme.success : theme.danger} />
                          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('adminReports.difference')}</Text>
                        </View>
                        <Text style={[styles.summaryValue, { color: isOT ? theme.success : theme.danger, fontSize: 22 }]}>
                          {isOT ? '+' : '-'}{formatMinutesAsHours(Math.abs(totalDiff))} h
                        </Text>
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>

            {/* Employee Stats */}
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('reports.employeesSection')}</Text>

            {employeeStats.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('reports.noEntriesInPeriod')}</Text>
              </View>
            ) : (
              employeeStats.map((stats) => (
                <TouchableOpacity
                  key={stats.userId}
                  style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                  onPress={() => handleOpenDetail(stats)}
                  activeOpacity={0.7}
                >
                  <View style={styles.statsHeader}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.avatarText, { color: theme.textInverse }]}>
                        {stats.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.statsInfo}>
                      <Text style={[styles.statsName, { color: theme.text }]}>{stats.userName}</Text>
                      <Text style={[styles.statsSubtext, { color: theme.textMuted }]}>
                        {stats.entriesCount} {stats.entriesCount === 1 ? t('reports.entry') : t('reports.entries')}
                        {stats.pendingCount > 0 && (
                          ` · ${stats.pendingCount} ${t('approval.pending')}`
                        )}
                      </Text>
                    </View>
                    <View style={styles.statsHours}>
                      <Text style={[styles.statsHoursValue, { color: theme.primary }]}>
                        {formatHoursMinutes(stats.netHours, stats.netMinutes)}
                      </Text>
                      <Text style={[styles.statsHoursLabel, { color: theme.textMuted }]}>Stunden</Text>
                    </View>
                    <ChevronRight size={20} color={theme.textMuted} style={{ marginLeft: 8 }} />
                  </View>
                  <View style={[styles.statsDetails, { borderTopColor: theme.borderLight }]}>
                    <View style={styles.statsDetailItem}>
                      <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>{t('reports.gross')}</Text>
                      <Text style={[styles.statsDetailValue, { color: theme.textSecondary }]}>
                        {formatHoursMinutes(stats.totalHours, stats.totalMinutes)} h
                      </Text>
                    </View>
                    <View style={styles.statsDetailItem}>
                      <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>{t('reports.break')}</Text>
                      <Text style={[styles.statsDetailValue, { color: theme.textSecondary }]}>
                        {Math.floor(stats.breakMinutes / 60)}:{(stats.breakMinutes % 60).toString().padStart(2, '0')} h
                      </Text>
                    </View>
                    <View style={styles.statsDetailItem}>
                      <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>{t('reports.net')}</Text>
                      <Text style={[styles.statsDetailValue, { color: theme.primary, fontWeight: '700' }]}>
                        {formatHoursMinutes(stats.netHours, stats.netMinutes)} h
                      </Text>
                    </View>
                    {stats.targetMinutes !== undefined && (
                      <>
                        <View style={styles.statsDetailItem}>
                          <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>{t('adminReports.target')}</Text>
                          <Text style={[styles.statsDetailValue, { color: theme.textSecondary }]}>
                            {formatMinutesAsHours(stats.targetMinutes)} h
                          </Text>
                        </View>
                        <View style={styles.statsDetailItem}>
                          <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>+/-</Text>
                          <Text style={[styles.statsDetailValue, { color: stats.isOvertime ? theme.success : theme.danger, fontWeight: '700' }]}>
                            {stats.formattedDifference}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                  {stats.breakCompliance && stats.breakCompliance.nonCompliantDays > 0 && (
                    <View style={[styles.complianceWarning, { backgroundColor: theme.warning + '15', borderTopColor: theme.borderLight }]}>
                      <AlertTriangle size={14} color={theme.warning} />
                      <Text style={[styles.complianceWarningText, { color: theme.warning }]}>
                        {stats.breakCompliance.nonCompliantDays} {t('adminReports.nonCompliantDays')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* STANDORT TAB */}
        {/* ============================================================ */}
        {activeTab === 'standort' && (
          <>
            {/* Location Filter */}
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('reports.filter')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.employeeFilter}>
              {([
                { key: 'alle' as const, label: t('reports.all'), icon: Users },
                { key: 'aussen' as const, label: t('adminReports.outside'), icon: Navigation },
                { key: 'innen' as const, label: t('adminReports.inside'), icon: Home },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: locationFilter === opt.key ? theme.primary : theme.surface,
                      borderColor: locationFilter === opt.key ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setLocationFilter(opt.key)}
                >
                  <opt.icon size={14} color={locationFilter === opt.key ? theme.textInverse : theme.textSecondary} />
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: locationFilter === opt.key ? theme.textInverse : theme.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Location Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}>
                    <Navigation size={16} color={theme.primary} />
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('adminReports.fieldEmployees')}</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: theme.primary }]}>
                    {locationSummary.fieldCount}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}>
                    <Route size={16} color={theme.textSecondary} />
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('adminReports.gpsPoints')}</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {locationSummary.totalGpsPoints}
                  </Text>
                </View>
              </View>
            </View>

            {/* Employee Location List */}
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('reports.employeesSection')}</Text>

            {employeeLocationStats.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  {t('reports.noEntriesInPeriod')}
                </Text>
              </View>
            ) : (
              employeeLocationStats.map((stats) => (
                <TouchableOpacity
                  key={stats.userId}
                  style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                  onPress={() => stats.isField ? handleOpenLocationDetail(stats) : undefined}
                  activeOpacity={stats.isField ? 0.7 : 1}
                >
                  <View style={styles.statsHeader}>
                    <View style={[styles.avatar, { backgroundColor: stats.isField ? theme.success : theme.primary }]}>
                      <Text style={[styles.avatarText, { color: theme.textInverse }]}>
                        {stats.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.statsInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.statsName, { color: theme.text }]}>{stats.userName}</Text>
                        <View
                          style={[
                            styles.locationBadge,
                            {
                              backgroundColor: stats.isField ? theme.pillSuccess : theme.pillInfo,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.locationBadgeText,
                              { color: stats.isField ? theme.pillSuccessText : theme.pillInfoText },
                            ]}
                          >
                            {stats.isField ? t('adminReports.outside') : t('adminReports.inside')}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.statsSubtext, { color: theme.textMuted }]}>
                        {stats.totalEntries} {stats.totalEntries === 1 ? t('reports.entry') : t('reports.entries')}
                        {stats.isField ? ` · ${formatDistance(stats.totalDistance)}` : ''}
                      </Text>
                    </View>
                    {stats.isField && (
                      <ChevronRight size={20} color={theme.textMuted} style={{ marginLeft: 8 }} />
                    )}
                  </View>
                  {stats.isField && (
                    <View style={[styles.statsDetails, { borderTopColor: theme.borderLight }]}>
                      <View style={styles.statsDetailItem}>
                        <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>{t('adminReports.outside')}</Text>
                        <Text style={[styles.statsDetailValue, { color: theme.success }]}>
                          {stats.fieldEntries.length}
                        </Text>
                      </View>
                      <View style={styles.statsDetailItem}>
                        <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>Innen</Text>
                        <Text style={[styles.statsDetailValue, { color: theme.textSecondary }]}>
                          {stats.officeEntries.length}
                        </Text>
                      </View>
                      <View style={styles.statsDetailItem}>
                        <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>GPS-Punkte</Text>
                        <Text style={[styles.statsDetailValue, { color: theme.textSecondary }]}>
                          {stats.gpsPointsCount}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

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

      {/* Employee Detail Modal (Stunden) */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={[styles.detailModalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.detailHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.detailCloseButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.detailHeaderTitle, { color: theme.text }]}>{t('adminReports.employeeDetails')}</Text>
            <View style={{ width: 40 }} />
          </View>

          {detailEmployee && (
            <ScrollView contentContainerStyle={styles.detailContent}>
              {/* Employee Info Card */}
              <View style={[styles.detailInfoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <View style={styles.detailInfoHeader}>
                  <View style={[styles.detailAvatar, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.detailAvatarText, { color: theme.textInverse }]}>
                      {detailEmployee.user.firstName[0]}{detailEmployee.user.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.detailInfoMain}>
                    <Text style={[styles.detailName, { color: theme.text }]}>
                      {detailEmployee.user.firstName} {detailEmployee.user.lastName}
                    </Text>
                    <View style={[styles.detailRoleBadge, { backgroundColor: detailEmployee.user.role === 'admin' ? theme.pillInfo : theme.pillSecondary }]}>
                      <Text style={[styles.detailRoleText, { color: detailEmployee.user.role === 'admin' ? theme.primary : theme.pillSecondaryText }]}>
                        {detailEmployee.user.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contact Info */}
                <View style={[styles.detailContactSection, { borderTopColor: theme.border }]}>
                  {detailEmployee.user.email && (
                    <View style={styles.detailContactRow}>
                      <Mail size={16} color={theme.textMuted} />
                      <Text style={[styles.detailContactText, { color: theme.text }]}>{detailEmployee.user.email}</Text>
                    </View>
                  )}
                  {detailEmployee.user.phone && (
                    <View style={styles.detailContactRow}>
                      <Phone size={16} color={theme.textMuted} />
                      <Text style={[styles.detailContactText, { color: theme.text }]}>{detailEmployee.user.phone}</Text>
                    </View>
                  )}
                  {detailEmployee.user.location && (
                    <View style={styles.detailContactRow}>
                      <MapPin size={16} color={theme.textMuted} />
                      <Text style={[styles.detailContactText, { color: theme.text }]}>{detailEmployee.user.location}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Stats Summary */}
              <Text style={[styles.detailSectionTitle, { color: theme.textMuted }]}>
                ZEITRAUM: {getPeriodLabel().toUpperCase()}
              </Text>
              <View style={[styles.detailStatsCard, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
                <View style={styles.detailStatsRow}>
                  <View style={styles.detailStatItem}>
                    <Clock size={18} color={theme.primary} />
                    <Text style={[styles.detailStatValue, { color: theme.primary }]}>
                      {formatHoursMinutes(detailEmployee.stats.netHours, detailEmployee.stats.netMinutes)}h
                    </Text>
                    <Text style={[styles.detailStatLabel, { color: theme.textMuted }]}>{t('reports.net')}</Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Calendar size={18} color={theme.textSecondary} />
                    <Text style={[styles.detailStatValue, { color: theme.text }]}>
                      {detailEmployee.stats.entriesCount}
                    </Text>
                    <Text style={[styles.detailStatLabel, { color: theme.textMuted }]}>Einträge</Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Coffee size={18} color={theme.textSecondary} />
                    <Text style={[styles.detailStatValue, { color: theme.text }]}>
                      {Math.floor(detailEmployee.stats.breakMinutes / 60)}:{(detailEmployee.stats.breakMinutes % 60).toString().padStart(2, '0')}h
                    </Text>
                    <Text style={[styles.detailStatLabel, { color: theme.textMuted }]}>{t('reports.break')}</Text>
                  </View>
                </View>
              </View>

              {/* Soll/Ist + Break Compliance */}
              {detailEmployee.stats.targetMinutes !== undefined && (
                <View style={[styles.detailStatsCard, { backgroundColor: detailEmployee.stats.isOvertime ? theme.success + '12' : theme.danger + '12', borderColor: detailEmployee.stats.isOvertime ? theme.success : theme.danger }]}>
                  <View style={styles.detailStatsRow}>
                    <View style={styles.detailStatItem}>
                      <Target size={18} color={theme.textSecondary} />
                      <Text style={[styles.detailStatValue, { color: theme.textSecondary }]}>
                        {formatMinutesAsHours(detailEmployee.stats.targetMinutes)}h
                      </Text>
                      <Text style={[styles.detailStatLabel, { color: theme.textMuted }]}>{t('adminReports.targetHours')}</Text>
                    </View>
                    <View style={styles.detailStatItem}>
                      <TrendingUp size={18} color={detailEmployee.stats.isOvertime ? theme.success : theme.danger} />
                      <Text style={[styles.detailStatValue, { color: detailEmployee.stats.isOvertime ? theme.success : theme.danger }]}>
                        {detailEmployee.stats.formattedDifference}h
                      </Text>
                      <Text style={[styles.detailStatLabel, { color: theme.textMuted }]}>{t('adminReports.difference')}</Text>
                    </View>
                  </View>
                </View>
              )}
              {detailEmployee.stats.breakCompliance && detailEmployee.stats.breakCompliance.nonCompliantDays > 0 && (
                <View style={[styles.complianceBox, { backgroundColor: theme.warning + '15', borderColor: theme.warning + '40' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} color={theme.warning} />
                    <Text style={[styles.complianceBoxTitle, { color: theme.warning }]}>{t('adminReports.breakWarning')}</Text>
                  </View>
                  <Text style={[styles.complianceBoxText, { color: theme.textSecondary }]}>
                    {detailEmployee.stats.breakCompliance.nonCompliantDays} {t('adminReports.nonCompliantDays')} (ArbZG)
                  </Text>
                </View>
              )}

              {/* Time Entries List */}
              <Text style={[styles.detailSectionTitle, { color: theme.textMuted }]}>ZEITEINTRÄGE</Text>

              {detailEmployee.stats.entries.length === 0 ? (
                <View style={[styles.detailEmptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.detailEmptyText, { color: theme.textMuted }]}>
                    Keine Einträge in diesem Zeitraum
                  </Text>
                </View>
              ) : (
                detailEmployee.stats.entries
                  .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
                  .map((entry, index) => {
                    const formatted = formatTimeEntry(entry);
                    const status = entry.approvalStatus || 'approved';
                    const isRejected = status === 'rejected';
                    const isPending = status === 'pending';
                    return (
                      <View
                        key={entry.id || index}
                        style={[
                          styles.detailEntryCard,
                          {
                            backgroundColor: theme.cardBackground,
                            borderColor: isPending ? theme.warning : isRejected ? theme.danger + '60' : theme.cardBorder,
                            opacity: isRejected ? 0.6 : 1,
                          },
                        ]}
                      >
                        <View style={styles.detailEntryHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <Text style={[styles.detailEntryDate, { color: theme.text }]}>{formatted.date}</Text>
                            {/* Approval Status Badge */}
                            {isPending && (
                              <View style={[styles.approvalBadge, { backgroundColor: theme.warning + '20' }]}>
                                <AlertCircle size={10} color={theme.warning} />
                                <Text style={[styles.approvalBadgeText, { color: theme.warning }]}>{t('approval.pending')}</Text>
                              </View>
                            )}
                            {isRejected && (
                              <View style={[styles.approvalBadge, { backgroundColor: theme.danger + '20' }]}>
                                <X size={10} color={theme.danger} />
                                <Text style={[styles.approvalBadgeText, { color: theme.danger }]}>{t('approval.rejected')}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.detailEntryHours, { color: isRejected ? theme.textMuted : theme.primary }]}>
                            {formatHoursMinutes(formatted.netHours, formatted.netMins)}h
                          </Text>
                        </View>
                        <View style={styles.detailEntryTimes}>
                          <View style={styles.detailEntryTimeItem}>
                            <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>Kommen</Text>
                            <Text style={[styles.detailEntryTimeValue, { color: theme.text }]}>{formatted.clockIn}</Text>
                          </View>
                          <View style={styles.detailEntryTimeItem}>
                            <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>Gehen</Text>
                            <Text style={[styles.detailEntryTimeValue, { color: theme.text }]}>{formatted.clockOut}</Text>
                          </View>
                          <View style={styles.detailEntryTimeItem}>
                            <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>{t('reports.break')}</Text>
                            <Text style={[styles.detailEntryTimeValue, { color: theme.text }]}>{formatted.breakMins} min</Text>
                          </View>
                          <View style={styles.detailEntryTimeItem}>
                            <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>{t('reports.gross')}</Text>
                            <Text style={[styles.detailEntryTimeValue, { color: theme.textSecondary }]}>
                              {formatHoursMinutes(formatted.grossHours, formatted.grossMins)}h
                            </Text>
                          </View>
                        </View>
                        {(() => {
                          const comp = checkBreakCompliance(formatted.grossHours * 60 + formatted.grossMins, formatted.breakMins);
                          if (!comp.isCompliant) {
                            return (
                              <View style={[styles.detailEntryLocation, { borderTopColor: theme.warning + '40', backgroundColor: theme.warning + '10' }]}>
                                <AlertTriangle size={12} color={theme.warning} />
                                <Text style={[styles.detailEntryLocationText, { color: theme.warning }]}>
                                  {t('adminReports.breakWarning')}: {comp.actualBreakMinutes} min / {comp.requiredBreakMinutes} min
                                </Text>
                              </View>
                            );
                          }
                          return null;
                        })()}
                        {formatted.location && (
                          <View style={[styles.detailEntryLocation, { borderTopColor: theme.border }]}>
                            <MapPin size={12} color={theme.textMuted} />
                            <Text style={[styles.detailEntryLocationText, { color: theme.textMuted }]} numberOfLines={1}>
                              {formatted.location}
                            </Text>
                          </View>
                        )}
                        {/* Rejection note */}
                        {isRejected && entry.approvalNote && (
                          <View style={[styles.detailEntryLocation, { borderTopColor: theme.danger + '30', backgroundColor: theme.danger + '08' }]}>
                            <AlertCircle size={12} color={theme.danger} />
                            <Text style={[styles.detailEntryLocationText, { color: theme.danger }]} numberOfLines={2}>
                              {entry.approvalNote}
                            </Text>
                          </View>
                        )}
                        {/* Approve / Reject Buttons */}
                        {isPending && (
                          <View style={[styles.approvalActions, { borderTopColor: theme.borderLight }]}>
                            <TouchableOpacity
                              style={[styles.approvalButton, { backgroundColor: theme.success + '15' }]}
                              onPress={() => handleApproveEntry(entry.id)}
                            >
                              <Check size={14} color={theme.success} />
                              <Text style={[styles.approvalButtonText, { color: theme.success }]}>{t('approval.approve')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.approvalButton, { backgroundColor: theme.danger + '15' }]}
                              onPress={() => handleOpenRejectModal(entry.id)}
                            >
                              <X size={14} color={theme.danger} />
                              <Text style={[styles.approvalButtonText, { color: theme.danger }]}>{t('approval.reject')}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Rejection Note Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRejectModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.background }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('approval.rejectTitle')}</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <X size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              {t('approval.rejectMessage')}
            </Text>
            <TextInput
              style={[styles.rejectInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder={t('approval.notePlaceholder')}
              placeholderTextColor={theme.textMuted}
              value={rejectNote}
              onChangeText={setRejectNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.rejectActions}>
              <TouchableOpacity
                style={[styles.rejectCancelButton, { borderColor: theme.border }]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={[styles.rejectCancelText, { color: theme.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectConfirmButton, { backgroundColor: theme.danger }]}
                onPress={handleConfirmReject}
              >
                <Text style={[styles.rejectConfirmText, { color: theme.textInverse }]}>{t('approval.reject')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Location Detail Modal (Standort) */}
      <Modal
        visible={showLocationDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationDetailModal(false)}
      >
        <View style={[styles.detailModalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.detailHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowLocationDetailModal(false)} style={styles.detailCloseButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.detailHeaderTitle, { color: theme.text }]}>{t('adminReports.locationDetails')}</Text>
            <View style={{ width: 40 }} />
          </View>

          {locationDetailEmployee && (
            <ScrollView contentContainerStyle={styles.detailContent}>
              {/* Employee Info */}
              <View style={[styles.detailInfoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <View style={styles.detailInfoHeader}>
                  <View style={[styles.detailAvatar, { backgroundColor: theme.success }]}>
                    <Text style={[styles.detailAvatarText, { color: theme.textInverse }]}>
                      {locationDetailEmployee.user.firstName[0]}{locationDetailEmployee.user.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.detailInfoMain}>
                    <Text style={[styles.detailName, { color: theme.text }]}>
                      {locationDetailEmployee.user.firstName} {locationDetailEmployee.user.lastName}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <View style={[styles.detailRoleBadge, { backgroundColor: theme.pillSuccess }]}>
                        <Text style={[styles.detailRoleText, { color: theme.pillSuccessText }]}>Außen</Text>
                      </View>
                      <View style={[styles.detailRoleBadge, { backgroundColor: locationDetailEmployee.user.role === 'admin' ? theme.pillInfo : theme.pillSecondary }]}>
                        <Text style={[styles.detailRoleText, { color: locationDetailEmployee.user.role === 'admin' ? theme.primary : theme.pillSecondaryText }]}>
                          {locationDetailEmployee.user.role === 'admin' ? 'Admin' : 'Mitarbeiter'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Route Map */}
              {locationDetailEmployee.stats.fieldEntries.length > 0 && (
                <>
                  <Text style={[styles.detailSectionTitle, { color: theme.textMuted }]}>ROUTE</Text>
                  <RouteMap
                    locationPoints={
                      locationDetailEmployee.stats.fieldEntries[selectedEntryIndex]?.locationHistory || []
                    }
                    height={250}
                  />
                  <View style={{ height: spacing.md }} />
                </>
              )}

              {/* Entry Selector */}
              <Text style={[styles.detailSectionTitle, { color: theme.textMuted }]}>
                AUßEN-EINTRÄGE ({locationDetailEmployee.stats.fieldEntries.length})
              </Text>

              {locationDetailEmployee.stats.fieldEntries
                .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
                .map((entry, index) => {
                  const clockIn = new Date(entry.clockIn);
                  const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;
                  const points = entry.locationHistory || [];
                  const distance = calculateTotalDistance(points);
                  const isSelected = index === selectedEntryIndex;

                  return (
                    <TouchableOpacity
                      key={entry.id || index}
                      style={[
                        styles.detailEntryCard,
                        {
                          backgroundColor: isSelected ? theme.pillInfo : theme.cardBackground,
                          borderColor: isSelected ? theme.primary : theme.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedEntryIndex(index)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.detailEntryHeader}>
                        <Text style={[styles.detailEntryDate, { color: theme.text }]}>
                          {format(clockIn, 'EEE, d. MMM', { locale: de })}
                        </Text>
                        <View style={[styles.locationBadge, { backgroundColor: theme.pillSuccess }]}>
                          <Text style={[styles.locationBadgeText, { color: theme.pillSuccessText }]}>
                            {formatDistance(distance)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailEntryTimes}>
                        <View style={styles.detailEntryTimeItem}>
                          <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>Kommen</Text>
                          <Text style={[styles.detailEntryTimeValue, { color: theme.text }]}>
                            {format(clockIn, 'HH:mm')}
                          </Text>
                        </View>
                        <View style={styles.detailEntryTimeItem}>
                          <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>Gehen</Text>
                          <Text style={[styles.detailEntryTimeValue, { color: theme.text }]}>
                            {clockOut ? format(clockOut, 'HH:mm') : '--:--'}
                          </Text>
                        </View>
                        <View style={styles.detailEntryTimeItem}>
                          <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>Distanz</Text>
                          <Text style={[styles.detailEntryTimeValue, { color: theme.primary }]}>
                            {formatDistance(distance)}
                          </Text>
                        </View>
                        <View style={styles.detailEntryTimeItem}>
                          <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>GPS</Text>
                          <Text style={[styles.detailEntryTimeValue, { color: theme.textSecondary }]}>
                            {points.length} Pkt.
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          )}
        </View>
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
  exportButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  // Tab Toggle
  tabToggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabToggleText: {
    fontSize: 14,
    fontWeight: '600',
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
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    borderWidth: 1,
  },
  datePickerLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  datePickerValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  datePickerDash: {
    fontSize: 18,
    fontWeight: '600',
  },
  datePickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  employeeFilter: {
    marginBottom: spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
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
  emptyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  statsName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  statsHours: {
    alignItems: 'flex-end',
  },
  statsHoursValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsHoursLabel: {
    fontSize: 11,
  },
  statsDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  statsDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsDetailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  statsDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Location Badge
  locationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationBadgeText: {
    fontSize: 11,
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
  // Detail Modal Styles
  detailModalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  detailCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailContent: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  detailInfoCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  detailInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  detailAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  detailInfoMain: {
    flex: 1,
    marginLeft: spacing.md,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailRoleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailContactSection: {
    padding: spacing.base,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  detailContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailContactText: {
    fontSize: 14,
    flex: 1,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  detailStatsCard: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  detailStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailStatLabel: {
    fontSize: 11,
  },
  detailEmptyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  detailEmptyText: {
    fontSize: 14,
  },
  detailEntryCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  detailEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    paddingBottom: spacing.sm,
  },
  detailEntryDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailEntryHours: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailEntryTimes: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  detailEntryTimeItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailEntryTimeLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  detailEntryTimeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailEntryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
  },
  detailEntryLocationText: {
    fontSize: 12,
    flex: 1,
  },
  complianceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
  },
  complianceWarningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  complianceBox: {
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: 6,
  },
  complianceBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  complianceBoxText: {
    fontSize: 13,
    marginLeft: 26,
  },
  // Approval styles
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
  },
  approvalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approvalButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 80,
    marginBottom: spacing.lg,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectCancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.card,
    borderWidth: 1,
  },
  rejectCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rejectConfirmButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.card,
  },
  rejectConfirmText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
