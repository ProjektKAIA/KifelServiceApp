// src/utils/exportUtils.ts

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface ExportEmployeeData {
  name: string;
  totalHours: number;
  totalMinutes: number;
  breakMinutes: number;
  netHours: number;
  netMinutes: number;
  entriesCount: number;
}

export interface ExportOptions {
  title: string;
  periodLabel: string;
  employees: ExportEmployeeData[];
  generatedAt: Date;
  companyName?: string;
}

const formatHoursMinutes = (hours: number, minutes: number): string => {
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const formatMinutesToHours = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

// ============================================================================
// CSV EXPORT
// ============================================================================

export const exportToCSV = async (options: ExportOptions): Promise<void> => {
  const { title, periodLabel, employees, generatedAt, companyName } = options;

  // Build CSV content
  const headers = ['Mitarbeiter', 'Brutto (h)', 'Pause (h)', 'Netto (h)', 'Einträge'];
  const rows = employees.map(emp => [
    emp.name,
    formatHoursMinutes(emp.totalHours, emp.totalMinutes),
    formatMinutesToHours(emp.breakMinutes),
    formatHoursMinutes(emp.netHours, emp.netMinutes),
    emp.entriesCount.toString(),
  ]);

  // Calculate totals
  const totalBrutto = employees.reduce((sum, e) => sum + e.totalHours * 60 + e.totalMinutes, 0);
  const totalPause = employees.reduce((sum, e) => sum + e.breakMinutes, 0);
  const totalNetto = employees.reduce((sum, e) => sum + e.netHours * 60 + e.netMinutes, 0);
  const totalEntries = employees.reduce((sum, e) => sum + e.entriesCount, 0);

  rows.push([
    'GESAMT',
    formatMinutesToHours(totalBrutto),
    formatMinutesToHours(totalPause),
    formatMinutesToHours(totalNetto),
    totalEntries.toString(),
  ]);

  // Build CSV string with BOM for Excel compatibility
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    `${companyName || 'Kifel Service'} - ${title}`,
    `Zeitraum: ${periodLabel}`,
    `Erstellt: ${format(generatedAt, 'dd.MM.yyyy HH:mm', { locale: de })}`,
    '',
    headers.join(';'),
    ...rows.map(row => row.join(';')),
  ].join('\n');

  // Save and share
  const fileName = `Arbeitsstunden_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Arbeitsstunden exportieren',
      UTI: 'public.comma-separated-values-text',
    });
  }
};

// ============================================================================
// EXCEL EXPORT
// ============================================================================

export const exportToExcel = async (options: ExportOptions): Promise<void> => {
  const { title, periodLabel, employees, generatedAt, companyName } = options;

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // Prepare data for worksheet
  const wsData = [
    [`${companyName || 'Kifel Service'} - ${title}`],
    [`Zeitraum: ${periodLabel}`],
    [`Erstellt: ${format(generatedAt, 'dd.MM.yyyy HH:mm', { locale: de })}`],
    [],
    ['Mitarbeiter', 'Brutto (h)', 'Pause (h)', 'Netto (h)', 'Einträge'],
  ];

  // Add employee rows
  employees.forEach(emp => {
    wsData.push([
      emp.name,
      formatHoursMinutes(emp.totalHours, emp.totalMinutes),
      formatMinutesToHours(emp.breakMinutes),
      formatHoursMinutes(emp.netHours, emp.netMinutes),
      emp.entriesCount,
    ]);
  });

  // Add totals row
  const totalBrutto = employees.reduce((sum, e) => sum + e.totalHours * 60 + e.totalMinutes, 0);
  const totalPause = employees.reduce((sum, e) => sum + e.breakMinutes, 0);
  const totalNetto = employees.reduce((sum, e) => sum + e.netHours * 60 + e.netMinutes, 0);
  const totalEntries = employees.reduce((sum, e) => sum + e.entriesCount, 0);

  wsData.push([]);
  wsData.push([
    'GESAMT',
    formatMinutesToHours(totalBrutto),
    formatMinutesToHours(totalPause),
    formatMinutesToHours(totalNetto),
    totalEntries,
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Mitarbeiter
    { wch: 12 }, // Brutto
    { wch: 12 }, // Pause
    { wch: 12 }, // Netto
    { wch: 10 }, // Einträge
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Arbeitsstunden');

  // Generate Excel file
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  // Save and share
  const fileName = `Arbeitsstunden_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Arbeitsstunden exportieren',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }
};

// ============================================================================
// PDF EXPORT
// ============================================================================

export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  const { title, periodLabel, employees, generatedAt, companyName } = options;

  // Calculate totals
  const totalBrutto = employees.reduce((sum, e) => sum + e.totalHours * 60 + e.totalMinutes, 0);
  const totalPause = employees.reduce((sum, e) => sum + e.breakMinutes, 0);
  const totalNetto = employees.reduce((sum, e) => sum + e.netHours * 60 + e.netMinutes, 0);
  const totalEntries = employees.reduce((sum, e) => sum + e.entriesCount, 0);

  // Generate HTML for PDF
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #1a1a1a;
            font-size: 12px;
          }
          .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .company {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .title {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
          }
          .meta {
            margin-top: 10px;
            color: #6b7280;
            font-size: 11px;
          }
          .summary {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #eff6ff;
            border-radius: 8px;
          }
          .summary-item {
            flex: 1;
          }
          .summary-label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-value {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
          }
          .summary-value.secondary {
            color: #374151;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #f3f4f6;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            border-bottom: 2px solid #e5e7eb;
          }
          th:not(:first-child) {
            text-align: right;
          }
          td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          td:not(:first-child) {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          tr.total {
            background: #2563eb !important;
            color: white;
            font-weight: 700;
          }
          tr.total td {
            border-bottom: none;
            padding: 14px 10px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">${companyName || 'Kifel Service'}</div>
          <div class="title">${title}</div>
          <div class="meta">
            Zeitraum: ${periodLabel}<br>
            Erstellt: ${format(generatedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
          </div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Netto-Stunden gesamt</div>
            <div class="summary-value">${formatMinutesToHours(totalNetto)} h</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Mitarbeiter</div>
            <div class="summary-value secondary">${employees.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Einträge</div>
            <div class="summary-value secondary">${totalEntries}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Mitarbeiter</th>
              <th>Brutto</th>
              <th>Pause</th>
              <th>Netto</th>
              <th>Einträge</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map(emp => `
              <tr>
                <td>${emp.name}</td>
                <td>${formatHoursMinutes(emp.totalHours, emp.totalMinutes)} h</td>
                <td>${formatMinutesToHours(emp.breakMinutes)} h</td>
                <td>${formatHoursMinutes(emp.netHours, emp.netMinutes)} h</td>
                <td>${emp.entriesCount}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td>GESAMT</td>
              <td>${formatMinutesToHours(totalBrutto)} h</td>
              <td>${formatMinutesToHours(totalPause)} h</td>
              <td>${formatMinutesToHours(totalNetto)} h</td>
              <td>${totalEntries}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          Erstellt mit Kifel Service App
        </div>
      </body>
    </html>
  `;

  // Generate PDF
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Rename and share
  const fileName = `Arbeitsstunden_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const newPath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.moveAsync({
    from: uri,
    to: newPath,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(newPath, {
      mimeType: 'application/pdf',
      dialogTitle: 'Arbeitsstunden exportieren',
      UTI: 'com.adobe.pdf',
    });
  }
};

// ============================================================================
// UNIFIED EXPORT FUNCTION
// ============================================================================

export type ExportFormat = 'pdf' | 'csv' | 'excel';

export const exportReport = async (
  format: ExportFormat,
  options: ExportOptions
): Promise<void> => {
  switch (format) {
    case 'pdf':
      return exportToPDF(options);
    case 'csv':
      return exportToCSV(options);
    case 'excel':
      return exportToExcel(options);
  }
};

// ============================================================================
// SCHEDULE/SHIFT EXPORT
// ============================================================================

export interface ExportShiftData {
  date: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  location: string;
  hours: number;
}

export interface ScheduleExportOptions {
  title: string;
  periodLabel: string;
  shifts: ExportShiftData[];
  generatedAt: Date;
  companyName?: string;
}

// CSV Export for Schedules
export const exportScheduleToCSV = async (options: ScheduleExportOptions): Promise<void> => {
  const { title, periodLabel, shifts, generatedAt, companyName } = options;

  const headers = ['Datum', 'Mitarbeiter', 'Von', 'Bis', 'Stunden', 'Standort'];
  const rows = shifts.map(shift => [
    shift.date,
    shift.employeeName,
    shift.startTime,
    shift.endTime,
    shift.hours.toFixed(1),
    shift.location,
  ]);

  const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
  rows.push(['GESAMT', '', '', '', totalHours.toFixed(1), '']);

  const BOM = '\uFEFF';
  const csvContent = BOM + [
    `${companyName || 'Kifel Service'} - ${title}`,
    `Zeitraum: ${periodLabel}`,
    `Erstellt: ${format(generatedAt, 'dd.MM.yyyy HH:mm', { locale: de })}`,
    '',
    headers.join(';'),
    ...rows.map(row => row.join(';')),
  ].join('\n');

  const fileName = `Dienstplan_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Dienstplan exportieren',
      UTI: 'public.comma-separated-values-text',
    });
  }
};

// Excel Export for Schedules
export const exportScheduleToExcel = async (options: ScheduleExportOptions): Promise<void> => {
  const { title, periodLabel, shifts, generatedAt, companyName } = options;

  const wb = XLSX.utils.book_new();

  const wsData = [
    [`${companyName || 'Kifel Service'} - ${title}`],
    [`Zeitraum: ${periodLabel}`],
    [`Erstellt: ${format(generatedAt, 'dd.MM.yyyy HH:mm', { locale: de })}`],
    [],
    ['Datum', 'Mitarbeiter', 'Von', 'Bis', 'Stunden', 'Standort'],
  ];

  shifts.forEach(shift => {
    wsData.push([
      shift.date,
      shift.employeeName,
      shift.startTime,
      shift.endTime,
      shift.hours,
      shift.location,
    ]);
  });

  const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
  wsData.push([]);
  wsData.push(['GESAMT', '', '', '', totalHours, '']);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 12 }, // Datum
    { wch: 20 }, // Mitarbeiter
    { wch: 8 },  // Von
    { wch: 8 },  // Bis
    { wch: 10 }, // Stunden
    { wch: 25 }, // Standort
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Dienstplan');

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  const fileName = `Dienstplan_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Dienstplan exportieren',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }
};

// PDF Export for Schedules
export const exportScheduleToPDF = async (options: ScheduleExportOptions): Promise<void> => {
  const { title, periodLabel, shifts, generatedAt, companyName } = options;

  const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
  const uniqueEmployees = new Set(shifts.map(s => s.employeeName)).size;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #1a1a1a;
            font-size: 11px;
          }
          .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .company { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 5px; }
          .title { font-size: 18px; font-weight: 600; color: #374151; }
          .meta { margin-top: 10px; color: #6b7280; font-size: 11px; }
          .summary {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #eff6ff;
            border-radius: 8px;
          }
          .summary-item { flex: 1; }
          .summary-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-value { font-size: 24px; font-weight: 700; color: #2563eb; }
          .summary-value.secondary { color: #374151; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th {
            background: #f3f4f6;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            border-bottom: 2px solid #e5e7eb;
          }
          td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          tr:nth-child(even) { background: #f9fafb; }
          tr.total { background: #2563eb !important; color: white; font-weight: 700; }
          tr.total td { border-bottom: none; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">${companyName || 'Kifel Service'}</div>
          <div class="title">${title}</div>
          <div class="meta">
            Zeitraum: ${periodLabel}<br>
            Erstellt: ${format(generatedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
          </div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Schichten gesamt</div>
            <div class="summary-value">${shifts.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Stunden gesamt</div>
            <div class="summary-value secondary">${totalHours.toFixed(1)} h</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Mitarbeiter</div>
            <div class="summary-value secondary">${uniqueEmployees}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Mitarbeiter</th>
              <th>Von</th>
              <th>Bis</th>
              <th>Stunden</th>
              <th>Standort</th>
            </tr>
          </thead>
          <tbody>
            ${shifts.map(shift => `
              <tr>
                <td>${shift.date}</td>
                <td>${shift.employeeName}</td>
                <td>${shift.startTime}</td>
                <td>${shift.endTime}</td>
                <td>${shift.hours.toFixed(1)} h</td>
                <td>${shift.location}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td>GESAMT</td>
              <td>${uniqueEmployees} Mitarbeiter</td>
              <td></td>
              <td></td>
              <td>${totalHours.toFixed(1)} h</td>
              <td>${shifts.length} Schichten</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          Erstellt mit Kifel Service App
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const fileName = `Dienstplan_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const newPath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.moveAsync({ from: uri, to: newPath });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(newPath, {
      mimeType: 'application/pdf',
      dialogTitle: 'Dienstplan exportieren',
      UTI: 'com.adobe.pdf',
    });
  }
};

// Unified Schedule Export
export const exportSchedule = async (
  format: ExportFormat,
  options: ScheduleExportOptions
): Promise<void> => {
  switch (format) {
    case 'pdf':
      return exportScheduleToPDF(options);
    case 'csv':
      return exportScheduleToCSV(options);
    case 'excel':
      return exportScheduleToExcel(options);
  }
};
