// app/(admin)/settings/export.tsx - Daten exportieren

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  documentDirectory,
  writeAsStringAsync,
  moveAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Clock,
  Calendar,
  Plane,
  Building2,
  CheckCircle,
  File,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { usersCollection, shiftsCollection, timeEntriesCollection, vacationRequestsCollection, companyCollection } from '@/src/lib/firestore';
import { User, Shift, VacationRequest } from '@/src/types';
import { TimeEntry } from '@/src/lib/firestore';

type ExportType = 'employees' | 'timeentries' | 'shifts' | 'vacation' | 'all';
type ExportFormat = 'pdf' | 'excel' | 'csv';

interface ExportOption {
  id: ExportType;
  icon: any;
  title: string;
  description: string;
}

export default function ExportScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [selectedType, setSelectedType] = useState<ExportType | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');

  const exportOptions: ExportOption[] = [
    {
      id: 'employees',
      icon: Users,
      title: 'Mitarbeiterliste',
      description: 'Alle Mitarbeiter mit Kontaktdaten',
    },
    {
      id: 'timeentries',
      icon: Clock,
      title: 'Arbeitsstunden',
      description: 'Zeiterfassung aller Mitarbeiter',
    },
    {
      id: 'shifts',
      icon: Calendar,
      title: 'Schichtpläne',
      description: 'Geplante Schichten und Einsätze',
    },
    {
      id: 'vacation',
      icon: Plane,
      title: 'Urlaubsanträge',
      description: 'Alle Urlaubs- und Abwesenheitsanträge',
    },
    {
      id: 'all',
      icon: Building2,
      title: 'Kompletter Export',
      description: 'Alle Daten in einer Datei',
    },
  ];

  const formatOptions: { id: ExportFormat; label: string; icon: any; ext: string }[] = [
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet, ext: '.xlsx' },
    { id: 'pdf', label: 'PDF', icon: FileText, ext: '.pdf' },
    { id: 'csv', label: 'CSV', icon: File, ext: '.csv' },
  ];

  const dateRangeOptions: { id: typeof dateRange; label: string }[] = [
    { id: 'month', label: 'Dieser Monat' },
    { id: 'quarter', label: 'Dieses Quartal' },
    { id: 'year', label: 'Dieses Jahr' },
    { id: 'all', label: 'Alle Daten' },
  ];

  const getDateRange = (): { start: string; end: string } => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start: string;

    switch (dateRange) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        start = '2020-01-01';
    }

    return { start, end };
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('de-DE');
  };

  // Fetch all data
  const fetchData = async () => {
    const [employees, shifts, vacationRequests, company] = await Promise.all([
      usersCollection.getAll(),
      shiftsCollection.getAll(),
      vacationRequestsCollection.getAll(),
      companyCollection.get(),
    ]);

    const { start, end } = getDateRange();
    const timeEntries = await timeEntriesCollection.getAllInRange(start, end);

    return { employees, shifts, timeEntries, vacationRequests, company };
  };

  // Generate CSV content
  const generateCSV = (data: any[], headers: string[]): string => {
    const csvRows = [headers.join(';')];
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] ?? '';
        // Escape quotes and wrap in quotes if contains separator
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(';') || escaped.includes('\n') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(';'));
    });
    return csvRows.join('\n');
  };

  // Generate HTML for PDF
  const generatePDFHtml = (title: string, tables: { title: string; headers: string[]; rows: any[] }[]): string => {
    const tableHtml = tables.map(table => `
      <h2 style="color: #1a1a1a; margin-top: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 8px;">
        ${table.title}
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            ${table.headers.map(h => `<th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-weight: 600;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${table.rows.map((row, i) => `
            <tr style="background-color: ${i % 2 === 0 ? '#fff' : '#fafafa'};">
              ${table.headers.map(h => `<td style="border: 1px solid #ddd; padding: 8px;">${row[h] ?? '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
            h1 { color: #007AFF; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="subtitle">Erstellt am ${new Date().toLocaleString('de-DE')} • Kifel Service App</p>
          ${tableHtml}
          <div class="footer">
            <p>Dieser Export wurde automatisch von der Kifel Service App erstellt.</p>
            <p>Bei Fragen wenden Sie sich an Ihren Administrator.</p>
          </div>
        </body>
      </html>
    `;
  };

  // Export employees
  const exportEmployees = async (employees: User[]) => {
    const data = employees.map(emp => ({
      'Vorname': emp.firstName,
      'Nachname': emp.lastName,
      'E-Mail': emp.email,
      'Telefon': emp.phone || '-',
      'Rolle': emp.role === 'admin' ? 'Administrator' : 'Mitarbeiter',
      'Status': emp.status === 'active' ? 'Aktiv' : 'Inaktiv',
      'Straße': emp.street || '-',
      'PLZ': emp.zipCode || '-',
      'Stadt': emp.city || '-',
      'Urlaubstage gesamt': emp.vacationDaysTotal || 30,
      'Urlaubstage genutzt': emp.vacationDaysUsed || 0,
      'Erstellt am': formatDate(emp.createdAt),
    }));

    return { title: 'Mitarbeiterliste', headers: Object.keys(data[0] || {}), rows: data };
  };

  // Export time entries
  const exportTimeEntries = async (timeEntries: TimeEntry[], employees: User[]) => {
    const employeeMap = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));

    const data = timeEntries.map(entry => {
      const clockIn = new Date(entry.clockIn);
      const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;
      const hoursWorked = clockOut
        ? ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) - entry.breakMinutes / 60).toFixed(2)
        : '-';

      return {
        'Mitarbeiter': employeeMap.get(entry.userId) || 'Unbekannt',
        'Datum': formatDate(entry.clockIn),
        'Arbeitsbeginn': clockIn.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        'Arbeitsende': clockOut ? clockOut.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '-',
        'Pause (Min)': entry.breakMinutes,
        'Stunden': hoursWorked,
        'Standort Ein': entry.clockInLocation?.address || '-',
        'Standort Aus': entry.clockOutLocation?.address || '-',
      };
    });

    return { title: 'Arbeitsstunden', headers: Object.keys(data[0] || {}), rows: data };
  };

  // Export shifts
  const exportShifts = async (shifts: Shift[], employees: User[]) => {
    const employeeMap = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));

    const data = shifts.map(shift => ({
      'Mitarbeiter': employeeMap.get(shift.userId) || shift.employeeName || 'Unbekannt',
      'Datum': formatDate(shift.date),
      'Beginn': shift.startTime,
      'Ende': shift.endTime,
      'Standort': shift.location,
      'Status': shift.status === 'completed' ? 'Abgeschlossen' :
                shift.status === 'active' ? 'Aktiv' :
                shift.status === 'cancelled' ? 'Storniert' : 'Geplant',
      'Notizen': shift.notes || '-',
    }));

    return { title: 'Schichtpläne', headers: Object.keys(data[0] || {}), rows: data };
  };

  // Export vacation requests
  const exportVacation = async (requests: VacationRequest[], employees: User[]) => {
    const employeeMap = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));

    const data = requests.map(req => ({
      'Mitarbeiter': employeeMap.get(req.userId) || 'Unbekannt',
      'Art': req.type === 'vacation' ? 'Urlaub' : req.type === 'sick' ? 'Krank' : 'Sonstiges',
      'Von': formatDate(req.startDate),
      'Bis': formatDate(req.endDate),
      'Tage': req.days,
      'Status': req.status === 'approved' ? 'Genehmigt' :
                req.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend',
      'Grund': req.reason || '-',
      'Erstellt am': formatDate(req.createdAt),
    }));

    return { title: 'Urlaubsanträge', headers: Object.keys(data[0] || {}), rows: data };
  };

  // Main export function
  const handleExport = async () => {
    if (!selectedType) {
      Alert.alert('Auswahl fehlt', 'Bitte wählen Sie aus, welche Daten exportiert werden sollen.');
      return;
    }

    setIsExporting(true);

    try {
      const { employees, shifts, timeEntries, vacationRequests, company } = await fetchData();
      const companyName = company?.name || 'Kifel Service';
      const timestamp = new Date().toISOString().split('T')[0];

      let tables: { title: string; headers: string[]; rows: any[] }[] = [];

      switch (selectedType) {
        case 'employees':
          tables = [await exportEmployees(employees)];
          break;
        case 'timeentries':
          tables = [await exportTimeEntries(timeEntries, employees)];
          break;
        case 'shifts':
          tables = [await exportShifts(shifts, employees)];
          break;
        case 'vacation':
          tables = [await exportVacation(vacationRequests, employees)];
          break;
        case 'all':
          tables = [
            await exportEmployees(employees),
            await exportTimeEntries(timeEntries, employees),
            await exportShifts(shifts, employees),
            await exportVacation(vacationRequests, employees),
          ];
          break;
      }

      const title = selectedType === 'all' ? 'Kompletter Datenexport' : tables[0].title;
      const fileName = `${companyName.replace(/\s+/g, '_')}_${title.replace(/\s+/g, '_')}_${timestamp}`;

      if (selectedFormat === 'pdf') {
        const html = generatePDFHtml(`${companyName} - ${title}`, tables);
        const { uri } = await Print.printToFileAsync({ html, base64: false });

        const pdfPath = `${documentDirectory}${fileName}.pdf`;
        await moveAsync({ from: uri, to: pdfPath });

        await Sharing.shareAsync(pdfPath, {
          mimeType: 'application/pdf',
          dialogTitle: `${title} exportieren`,
        });

      } else if (selectedFormat === 'excel') {
        const workbook = XLSX.utils.book_new();

        tables.forEach((table, index) => {
          const worksheet = XLSX.utils.json_to_sheet(table.rows);

          // Set column widths
          const colWidths = table.headers.map(h => ({ wch: Math.max(h.length, 15) }));
          worksheet['!cols'] = colWidths;

          const sheetName = table.title.substring(0, 31); // Excel limit
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
        const excelPath = `${documentDirectory}${fileName}.xlsx`;

        await writeAsStringAsync(excelPath, wbout, {
          encoding: EncodingType.Base64,
        });

        await Sharing.shareAsync(excelPath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `${title} exportieren`,
        });

      } else if (selectedFormat === 'csv') {
        // For CSV, only export first table (or combine all)
        const allData = tables.flatMap(t => t.rows);
        const allHeaders = [...new Set(tables.flatMap(t => t.headers))];

        const csvContent = generateCSV(allData, allHeaders);
        const csvPath = `${documentDirectory}${fileName}.csv`;

        await writeAsStringAsync(csvPath, csvContent, {
          encoding: EncodingType.UTF8,
        });

        await Sharing.shareAsync(csvPath, {
          mimeType: 'text/csv',
          dialogTitle: `${title} exportieren`,
        });
      }

      Alert.alert('Export erfolgreich', `${title} wurde erfolgreich exportiert.`);

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Fehler', 'Export konnte nicht erstellt werden. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>System</Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>Daten exportieren</Text>
          </View>
        </View>

        {/* Export Type Selection */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>WAS EXPORTIEREN?</Text>
        <View style={[styles.optionsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {exportOptions.map((option, index) => {
            const isSelected = selectedType === option.id;
            const Icon = option.icon;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  index < exportOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                  isSelected && { backgroundColor: theme.pillInfo },
                ]}
                onPress={() => setSelectedType(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: isSelected ? theme.primary : theme.surface }]}>
                  <Icon size={20} color={isSelected ? theme.textInverse : theme.textSecondary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{option.title}</Text>
                  <Text style={[styles.optionDescription, { color: theme.textMuted }]}>{option.description}</Text>
                </View>
                {isSelected && (
                  <CheckCircle size={22} color={theme.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Range (for time-based exports) */}
        {selectedType && ['timeentries', 'shifts', 'vacation', 'all'].includes(selectedType) && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ZEITRAUM</Text>
            <View style={styles.dateRangeRow}>
              {dateRangeOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dateRangeOption,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                    dateRange === option.id && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setDateRange(option.id)}
                >
                  <Text
                    style={[
                      styles.dateRangeText,
                      { color: dateRange === option.id ? theme.textInverse : theme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Format Selection */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>FORMAT</Text>
        <View style={styles.formatRow}>
          {formatOptions.map(option => {
            const isSelected = selectedFormat === option.id;
            const Icon = option.icon;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.formatOption,
                  { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                  isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setSelectedFormat(option.id)}
              >
                <Icon size={24} color={isSelected ? theme.textInverse : theme.textSecondary} />
                <Text
                  style={[
                    styles.formatLabel,
                    { color: isSelected ? theme.textInverse : theme.text },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.formatExt,
                    { color: isSelected ? theme.textInverse : theme.textMuted },
                  ]}
                >
                  {option.ext}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
          <Download size={18} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            Der Export wird erstellt und kann dann geteilt oder gespeichert werden.
          </Text>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[
            styles.exportButton,
            { backgroundColor: theme.primary },
            (!selectedType || isExporting) && styles.exportButtonDisabled,
          ]}
          onPress={handleExport}
          disabled={!selectedType || isExporting}
          activeOpacity={0.8}
        >
          {isExporting ? (
            <>
              <ActivityIndicator size="small" color={theme.textInverse} />
              <Text style={[styles.exportButtonText, { color: theme.textInverse }]}>
                Export wird erstellt...
              </Text>
            </>
          ) : (
            <>
              <Download size={20} color={theme.textInverse} />
              <Text style={[styles.exportButtonText, { color: theme.textInverse }]}>
                Jetzt exportieren
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Exportierte Daten sind vertraulich.{'\n'}
          Bitte beachten Sie die Datenschutzrichtlinien.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerSmall: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerLarge: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  optionsCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  dateRangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateRangeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.input,
    borderWidth: 1,
  },
  dateRangeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formatOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    gap: spacing.xs,
  },
  formatLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  formatExt: {
    fontSize: 11,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: borderRadius.input,
    marginTop: spacing.lg,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.lg,
  },
});
