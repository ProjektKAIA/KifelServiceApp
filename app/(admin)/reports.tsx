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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { exportReport, ExportFormat, ExportEmployeeData } from '@/src/utils/exportUtils';
import { isFieldEntry, calculateTotalDistance, formatDistance } from '@/src/utils/locationUtils';
import RouteMap from '@/src/components/organisms/RouteMap';

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year';
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

export default function AdminReportsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

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
        });
      });

      // Calculate stats from entries
      entriesData.forEach(entry => {
        const stats = statsMap.get(entry.userId);
        if (!stats) return;

        const { grossMinutes, breakMinutes } = calculateHours(entry);
        const netMinutes = grossMinutes - breakMinutes;

        stats.totalMinutes += grossMinutes;
        stats.breakMinutes += breakMinutes;
        stats.netMinutes += netMinutes;
        stats.entriesCount += 1;
        stats.entries.push(entry);
      });

      // Convert to hours and sort
      const statsList = Array.from(statsMap.values())
        .map(stats => ({
          ...stats,
          totalHours: Math.floor(stats.totalMinutes / 60),
          totalMinutes: stats.totalMinutes % 60,
          netHours: Math.floor(stats.netMinutes / 60),
          netMinutes: stats.netMinutes % 60,
        }))
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
              <Text style={[styles.badgeText, { color: theme.pillSecondaryText }]}>AUSWERTUNG</Text>
            </View>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
              {activeTab === 'stunden' ? t('adminReports.workHours') : t('adminReports.gpsTracking')}
            </Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>
              {activeTab === 'stunden' ? t('adminReports.hoursOverview') : t('adminReports.locationAnalysis')}
            </Text>
          </View>
          {activeTab === 'stunden' && (
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowExportModal(true)}
              disabled={isExporting || employeeStats.length === 0}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={theme.textInverse} />
              ) : (
                <Download size={20} color={theme.textInverse} />
              )}
            </TouchableOpacity>
          )}
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

        {/* ============================================================ */}
        {/* STUNDEN TAB */}
        {/* ============================================================ */}
        {activeTab === 'stunden' && (
          <>
            {/* Employee Filter */}
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>FILTER</Text>
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
                  Alle
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
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Netto-Stunden</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: theme.primary }]}>
                    {formatHoursMinutes(Math.floor(totals.totalMinutes / 60), totals.totalMinutes % 60)} h
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}>
                    <TrendingUp size={16} color={theme.textSecondary} />
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Einträge</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{totals.entriesCount}</Text>
                </View>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryNote, { color: theme.textMuted }]}>
                  Pause gesamt: {Math.floor(totals.breakMinutes / 60)}:{(totals.breakMinutes % 60).toString().padStart(2, '0')} h
                </Text>
              </View>
            </View>

            {/* Employee Stats */}
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>MITARBEITER</Text>

            {employeeStats.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Keine Einträge im gewählten Zeitraum</Text>
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
                        {stats.entriesCount} {stats.entriesCount === 1 ? 'Eintrag' : 'Einträge'}
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
                      <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>Brutto</Text>
                      <Text style={[styles.statsDetailValue, { color: theme.textSecondary }]}>
                        {formatHoursMinutes(stats.totalHours, stats.totalMinutes)} h
                      </Text>
                    </View>
                    <View style={styles.statsDetailItem}>
                      <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>Pause</Text>
                      <Text style={[styles.statsDetailValue, { color: theme.textSecondary }]}>
                        {Math.floor(stats.breakMinutes / 60)}:{(stats.breakMinutes % 60).toString().padStart(2, '0')} h
                      </Text>
                    </View>
                    <View style={styles.statsDetailItem}>
                      <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>Netto</Text>
                      <Text style={[styles.statsDetailValue, { color: theme.primary, fontWeight: '700' }]}>
                        {formatHoursMinutes(stats.netHours, stats.netMinutes)} h
                      </Text>
                    </View>
                  </View>
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
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>FILTER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.employeeFilter}>
              {([
                { key: 'alle' as const, label: 'Alle', icon: Users },
                { key: 'aussen' as const, label: 'Außen', icon: Navigation },
                { key: 'innen' as const, label: 'Innen', icon: Home },
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
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Außen-MA</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: theme.primary }]}>
                    {locationSummary.fieldCount}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconRow}>
                    <Route size={16} color={theme.textSecondary} />
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>GPS-Punkte</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {locationSummary.totalGpsPoints}
                  </Text>
                </View>
              </View>
            </View>

            {/* Employee Location List */}
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>MITARBEITER</Text>

            {employeeLocationStats.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Keine Mitarbeiter mit{' '}
                  {locationFilter === 'aussen' ? 'Außen-' : locationFilter === 'innen' ? 'Innen-' : ''}
                  Einträgen im gewählten Zeitraum
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
                            {stats.isField ? 'Außen' : 'Innen'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.statsSubtext, { color: theme.textMuted }]}>
                        {stats.totalEntries} {stats.totalEntries === 1 ? 'Eintrag' : 'Einträge'}
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
                        <Text style={[styles.statsDetailLabel, { color: theme.textMuted }]}>Außen</Text>
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
                    <Text style={[styles.detailStatLabel, { color: theme.textMuted }]}>Netto</Text>
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
                    <Text style={[styles.detailStatLabel, { color: theme.textMuted }]}>Pause</Text>
                  </View>
                </View>
              </View>

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
                    return (
                      <View
                        key={entry.id || index}
                        style={[styles.detailEntryCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                      >
                        <View style={styles.detailEntryHeader}>
                          <Text style={[styles.detailEntryDate, { color: theme.text }]}>{formatted.date}</Text>
                          <Text style={[styles.detailEntryHours, { color: theme.primary }]}>
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
                            <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>Pause</Text>
                            <Text style={[styles.detailEntryTimeValue, { color: theme.text }]}>{formatted.breakMins} min</Text>
                          </View>
                          <View style={styles.detailEntryTimeItem}>
                            <Text style={[styles.detailEntryTimeLabel, { color: theme.textMuted }]}>Brutto</Text>
                            <Text style={[styles.detailEntryTimeValue, { color: theme.textSecondary }]}>
                              {formatHoursMinutes(formatted.grossHours, formatted.grossMins)}h
                            </Text>
                          </View>
                        </View>
                        {formatted.location && (
                          <View style={[styles.detailEntryLocation, { borderTopColor: theme.border }]}>
                            <MapPin size={12} color={theme.textMuted} />
                            <Text style={[styles.detailEntryLocationText, { color: theme.textMuted }]} numberOfLines={1}>
                              {formatted.location}
                            </Text>
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
    paddingTop: spacing.lg,
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
});
