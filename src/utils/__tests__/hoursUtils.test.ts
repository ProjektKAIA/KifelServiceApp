import {
  countWeekdays,
  calculateTargetMinutes,
  calculateDifference,
  formatMinutesAsHours,
  checkBreakCompliance,
  analyzePeriodBreakCompliance,
} from '../hoursUtils';

describe('countWeekdays', () => {
  it('counts weekdays in a full week (Mon-Sun)', () => {
    // Mon 2025-01-06 to Sun 2025-01-12
    expect(countWeekdays(new Date(2025, 0, 6), new Date(2025, 0, 12))).toBe(5);
  });

  it('counts weekdays for a single weekday', () => {
    // Wednesday
    expect(countWeekdays(new Date(2025, 0, 8), new Date(2025, 0, 8))).toBe(1);
  });

  it('counts 0 for a weekend-only range', () => {
    // Sat to Sun
    expect(countWeekdays(new Date(2025, 0, 11), new Date(2025, 0, 12))).toBe(0);
  });

  it('counts weekdays for a full month', () => {
    // January 2025 has 23 weekdays
    expect(countWeekdays(new Date(2025, 0, 1), new Date(2025, 0, 31))).toBe(23);
  });
});

describe('calculateTargetMinutes', () => {
  it('calculates target for 40h/week over 5 weekdays = 2400 min', () => {
    // Mon-Fri
    const result = calculateTargetMinutes(40, new Date(2025, 0, 6), new Date(2025, 0, 10));
    expect(result).toBe(2400);
  });

  it('calculates target for 20h/week over 5 weekdays = 1200 min', () => {
    const result = calculateTargetMinutes(20, new Date(2025, 0, 6), new Date(2025, 0, 10));
    expect(result).toBe(1200);
  });

  it('handles partial weeks', () => {
    // Mon-Wed = 3 weekdays, 40h/week = 8h/day = 3*8*60 = 1440
    const result = calculateTargetMinutes(40, new Date(2025, 0, 6), new Date(2025, 0, 8));
    expect(result).toBe(1440);
  });
});

describe('calculateDifference', () => {
  it('positive overtime', () => {
    const result = calculateDifference(2500, 2400);
    expect(result.isOvertime).toBe(true);
    expect(result.differenceMinutes).toBe(100);
    expect(result.formattedDifference).toBe('+1:40');
  });

  it('deficit', () => {
    const result = calculateDifference(2000, 2400);
    expect(result.isOvertime).toBe(false);
    expect(result.differenceMinutes).toBe(-400);
    expect(result.formattedDifference).toBe('-6:40');
  });

  it('exact match', () => {
    const result = calculateDifference(2400, 2400);
    expect(result.isOvertime).toBe(true);
    expect(result.differenceMinutes).toBe(0);
    expect(result.formattedDifference).toBe('+0:00');
  });
});

describe('formatMinutesAsHours', () => {
  it('formats 90 minutes as 1:30', () => {
    expect(formatMinutesAsHours(90)).toBe('1:30');
  });

  it('formats 0 minutes as 0:00', () => {
    expect(formatMinutesAsHours(0)).toBe('0:00');
  });

  it('formats 480 minutes as 8:00', () => {
    expect(formatMinutesAsHours(480)).toBe('8:00');
  });

  it('formats 65 minutes as 1:05', () => {
    expect(formatMinutesAsHours(65)).toBe('1:05');
  });
});

describe('checkBreakCompliance (ArbZG)', () => {
  it('no break required for <= 6h', () => {
    const result = checkBreakCompliance(360, 0);
    expect(result.isCompliant).toBe(true);
    expect(result.requiredBreakMinutes).toBe(0);
  });

  it('30 min break required for >6h', () => {
    const result = checkBreakCompliance(361, 30);
    expect(result.isCompliant).toBe(true);
    expect(result.requiredBreakMinutes).toBe(30);
  });

  it('non-compliant when >6h but only 15 min break', () => {
    const result = checkBreakCompliance(420, 15);
    expect(result.isCompliant).toBe(false);
    expect(result.requiredBreakMinutes).toBe(30);
  });

  it('45 min break required for >9h', () => {
    const result = checkBreakCompliance(541, 45);
    expect(result.isCompliant).toBe(true);
    expect(result.requiredBreakMinutes).toBe(45);
  });

  it('non-compliant when >9h but only 30 min break', () => {
    const result = checkBreakCompliance(600, 30);
    expect(result.isCompliant).toBe(false);
    expect(result.requiredBreakMinutes).toBe(45);
  });
});

describe('analyzePeriodBreakCompliance', () => {
  it('counts compliant and non-compliant days', () => {
    const result = analyzePeriodBreakCompliance([
      { totalMinutes: 480, breakMinutes: 30 }, // >6h, 30 min -> compliant
      { totalMinutes: 600, breakMinutes: 30 }, // >9h, 30 min -> non-compliant
      { totalMinutes: 300, breakMinutes: 0 },  // <=6h, no break needed
    ]);
    expect(result.totalDays).toBe(3);
    expect(result.compliantDays).toBe(1);
    expect(result.nonCompliantDays).toBe(1);
  });

  it('handles empty input', () => {
    const result = analyzePeriodBreakCompliance([]);
    expect(result.totalDays).toBe(0);
    expect(result.compliantDays).toBe(0);
    expect(result.nonCompliantDays).toBe(0);
  });
});
