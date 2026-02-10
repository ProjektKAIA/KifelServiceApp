// src/utils/hoursUtils.ts

export interface DifferenceResult {
  differenceMinutes: number;
  isOvertime: boolean;
  formattedDifference: string;
}

export interface BreakComplianceResult {
  isCompliant: boolean;
  requiredBreakMinutes: number;
  actualBreakMinutes: number;
  grossMinutes: number;
}

export interface PeriodBreakComplianceResult {
  totalDays: number;
  compliantDays: number;
  nonCompliantDays: number;
  details: BreakComplianceResult[];
}

/**
 * Count weekdays (Mon-Fri) in a date range (inclusive).
 */
export function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calculate target minutes from weekly target hours and a date range.
 * Formula: (weeklyTarget / 5) * weekdays * 60
 */
export function calculateTargetMinutes(weeklyTargetHours: number, start: Date, end: Date): number {
  const weekdays = countWeekdays(start, end);
  const dailyHours = weeklyTargetHours / 5;
  return Math.round(dailyHours * weekdays * 60);
}

/**
 * Calculate the difference between actual and target minutes.
 * Positive = overtime, negative = deficit.
 */
export function calculateDifference(istMinutes: number, sollMinutes: number): DifferenceResult {
  const differenceMinutes = istMinutes - sollMinutes;
  const isOvertime = differenceMinutes >= 0;
  const absDiff = Math.abs(differenceMinutes);
  const hours = Math.floor(absDiff / 60);
  const mins = absDiff % 60;
  const sign = isOvertime ? '+' : '-';
  const formattedDifference = `${sign}${hours}:${mins.toString().padStart(2, '0')}`;

  return { differenceMinutes, isOvertime, formattedDifference };
}

/**
 * Format minutes as "H:MM".
 */
export function formatMinutesAsHours(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

/**
 * Check break compliance for a single day according to ArbZG (German Working Time Act).
 * - >6h gross work: at least 30 min break required
 * - >9h gross work: at least 45 min break required
 */
export function checkBreakCompliance(grossMinutes: number, breakMinutes: number): BreakComplianceResult {
  let requiredBreakMinutes = 0;

  if (grossMinutes > 9 * 60) {
    requiredBreakMinutes = 45;
  } else if (grossMinutes > 6 * 60) {
    requiredBreakMinutes = 30;
  }

  return {
    isCompliant: breakMinutes >= requiredBreakMinutes,
    requiredBreakMinutes,
    actualBreakMinutes: breakMinutes,
    grossMinutes,
  };
}

/**
 * Analyze break compliance across multiple day entries.
 * Each entry should have { totalMinutes (gross), breakMinutes }.
 */
export function analyzePeriodBreakCompliance(
  dayEntries: { totalMinutes: number; breakMinutes: number }[]
): PeriodBreakComplianceResult {
  const details: BreakComplianceResult[] = [];
  let compliantDays = 0;
  let nonCompliantDays = 0;

  dayEntries.forEach(day => {
    const result = checkBreakCompliance(day.totalMinutes, day.breakMinutes);
    details.push(result);
    if (result.requiredBreakMinutes > 0) {
      if (result.isCompliant) {
        compliantDays++;
      } else {
        nonCompliantDays++;
      }
    }
  });

  return {
    totalDays: dayEntries.length,
    compliantDays,
    nonCompliantDays,
    details,
  };
}
