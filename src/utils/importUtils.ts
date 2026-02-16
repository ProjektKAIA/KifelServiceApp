// src/utils/importUtils.ts - Dienstplan Excel Import Parser

import * as XLSX from 'xlsx';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { format } from 'date-fns';

export interface ImportedShift {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  hours: number;
  client: string;
  address: string;
}

export interface ImportedEmployee {
  salutation: string;
  name: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
}

export interface ImportedSchedule {
  employee: ImportedEmployee;
  periodStart: string;
  periodEnd: string;
  shifts: ImportedShift[];
  totalHours: number;
  workDays: number;
}

export interface ImportResult {
  success: boolean;
  data?: ImportedSchedule;
  error?: string;
  warnings: string[];
}

/**
 * Tries to parse a cell value as a Date.
 * Supports Excel serial numbers (e.g. 44713), Date objects (from Numbers),
 * and ISO strings (e.g. "2022-06-01T00:00:00.000Z").
 */
function parseCellDate(value: any): Date | null {
  // Date object (Numbers files return native Date objects)
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  // Excel serial number
  if (typeof value === 'number' && value > 40000 && value < 50000) {
    return new Date((value - 25569) * 86400 * 1000);
  }
  // ISO date string
  if (typeof value === 'string') {
    const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}T/);
    if (isoMatch) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

/**
 * Parses time range string "08:30 - 12:30" into start and end times
 */
function parseTimeRange(timeStr: string): { start: string; end: string } | null {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const match = timeStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return null;

  return {
    start: match[1].padStart(5, '0'),
    end: match[2].padStart(5, '0'),
  };
}

/**
 * Parses employee name "Roster, Martina" into first and last name
 */
function parseName(nameStr: string): { firstName: string; lastName: string } {
  if (!nameStr || typeof nameStr !== 'string') {
    return { firstName: '', lastName: '' };
  }

  const parts = nameStr.split(',').map(s => s.trim());
  if (parts.length === 2) {
    return { lastName: parts[0], firstName: parts[1] };
  }

  // Fallback: assume "FirstName LastName" format
  const spaceParts = nameStr.split(' ').map(s => s.trim()).filter(Boolean);
  if (spaceParts.length >= 2) {
    return {
      firstName: spaceParts[0],
      lastName: spaceParts.slice(1).join(' '),
    };
  }

  return { firstName: nameStr, lastName: '' };
}

/**
 * Extracts period dates from title string
 * "Dienstplanauskunft für Roster, Martina [2]" with "01.06.2022 - 30.06.2022"
 */
function parsePeriod(titleRow: any[]): { start: string; end: string } | null {
  // Look for date range pattern in the row
  for (const cell of titleRow) {
    if (typeof cell === 'string') {
      const match = cell.match(/(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/);
      if (match) {
        return {
          start: `${match[3]}-${match[2]}-${match[1]}`,
          end: `${match[6]}-${match[5]}-${match[4]}`,
        };
      }
    }
  }
  return null;
}

/**
 * Checks if a row is a header row
 */
function isHeaderRow(row: any[]): boolean {
  const firstCell = String(row[0] || '').toLowerCase();
  return firstCell === 'datum' || firstCell.includes('dienstplanauskunft');
}

/**
 * Checks if a row is a summary row
 */
function isSummaryRow(row: any[]): boolean {
  const firstCell = String(row[0] || '').toLowerCase();
  return firstCell.includes('gesamtzeit');
}

/**
 * Main parser function for Dienstplan Excel files
 */
export function parseScheduleExcel(workbook: XLSX.WorkBook): ImportResult {
  const warnings: string[] = [];

  try {
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: 'Keine Tabellenblätter gefunden', warnings };
    }

    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (data.length < 10) {
      return { success: false, error: 'Datei enthält zu wenige Zeilen', warnings };
    }

    // Parse employee info from first rows
    const employee: ImportedEmployee = {
      salutation: String(data[0]?.[0] || ''),
      name: String(data[1]?.[0] || ''),
      firstName: '',
      lastName: '',
      address: String(data[2]?.[0] || ''),
      city: String(data[3]?.[0] || ''),
    };

    const nameInfo = parseName(employee.name);
    employee.firstName = nameInfo.firstName;
    employee.lastName = nameInfo.lastName;

    // Find period info
    let periodStart = '';
    let periodEnd = '';
    for (let i = 5; i < 10; i++) {
      const period = parsePeriod(data[i] || []);
      if (period) {
        periodStart = period.start;
        periodEnd = period.end;
        break;
      }
    }

    if (!periodStart || !periodEnd) {
      warnings.push('Zeitraum konnte nicht automatisch erkannt werden');
    }

    // Parse shifts
    const shifts: ImportedShift[] = [];
    let currentDate: Date | null = null;
    let currentDayOfWeek = '';
    let totalHours = 0;
    let workDays = 0;

    for (let i = 8; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Skip header rows (repeated due to page breaks)
      if (isHeaderRow(row)) continue;

      // Check for summary row
      if (isSummaryRow(row)) {
        // Extract totals from summary row: [Gesamtzeit:, _, _, hours, _, _, Arbeitstage, _, days]
        if (typeof row[3] === 'number') {
          totalHours = row[3];
        }
        if (typeof row[8] === 'number') {
          workDays = row[8];
        }
        continue;
      }

      // Check if first cell is a date (Excel serial number or ISO string from Numbers)
      const firstCell = row[0];
      const parsedDate = parseCellDate(firstCell);
      if (parsedDate) {
        currentDate = parsedDate;
        currentDayOfWeek = String(row[1] || '');
      }

      // Parse time, hours, client, address (same columns for date rows and continuation rows)
      const timeRange = parseTimeRange(String(row[2] || ''));
      const hoursCell = typeof row[3] === 'number' ? row[3] : null;
      const clientCell = String(row[4] || '');
      const addressCell = String(row[6] || '').replace(/\r?\n/g, ', ');

      // Only add if we have valid time data
      if (timeRange && currentDate && hoursCell !== null && hoursCell > 0) {
        shifts.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          dayOfWeek: currentDayOfWeek,
          startTime: timeRange.start,
          endTime: timeRange.end,
          hours: hoursCell,
          client: clientCell,
          address: addressCell,
        });
      }
    }

    if (shifts.length === 0) {
      return { success: false, error: 'Keine gültigen Schicht-Einträge gefunden', warnings };
    }

    // Calculate totals if not found in summary
    if (totalHours === 0) {
      totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
    }
    if (workDays === 0) {
      const uniqueDays = new Set(shifts.map(s => s.date));
      workDays = uniqueDays.size;
    }

    return {
      success: true,
      data: {
        employee,
        periodStart,
        periodEnd,
        shifts,
        totalHours,
        workDays,
      },
      warnings,
    };

  } catch (error) {
    return {
      success: false,
      error: `Parser-Fehler: ${error instanceof Error ? error.message : String(error)}`,
      warnings,
    };
  }
}

/**
 * Reads and parses an Excel file from a URI
 */
export async function importScheduleFromUri(uri: string): Promise<ImportResult> {
  try {
    // Read file as base64
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });

    // Parse Excel
    const workbook = XLSX.read(base64, { type: 'base64' });

    return parseScheduleExcel(workbook);

  } catch (error) {
    return {
      success: false,
      error: `Datei konnte nicht gelesen werden: ${error instanceof Error ? error.message : String(error)}`,
      warnings: [],
    };
  }
}

/**
 * Converts imported shifts to time entries format
 */
export function shiftsToTimeEntries(
  schedule: ImportedSchedule,
  userId: string
): Array<{
  userId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: number;
  notes: string;
  location: string;
}> {
  return schedule.shifts.map(shift => ({
    userId,
    date: shift.date,
    clockIn: `${shift.date}T${shift.startTime}:00`,
    clockOut: `${shift.date}T${shift.endTime}:00`,
    breakMinutes: 0, // No break info in source
    notes: `Import: ${shift.client}`,
    location: shift.address,
  }));
}
