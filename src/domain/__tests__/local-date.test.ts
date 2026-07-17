import { describe, expect, it } from 'bun:test';

import {
  buildCalendarGrid,
  daysBetweenInclusive,
  lastDayOfMonth,
  monthRange,
  parseLocalDate,
  toLocalDate,
  todayLocalDate,
} from '@/domain/local-date';

describe('todayLocalDate', () => {
  it('formats using the local calendar date, zero-padded', () => {
    const clock = () => new Date(2026, 6, 5); // 5 July 2026, local time
    expect(todayLocalDate(clock)).toBe('2026-07-05');
  });
});

describe('lastDayOfMonth', () => {
  it('returns 31 for January', () => {
    expect(lastDayOfMonth(2026, 1)).toBe(31);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(lastDayOfMonth(2026, 2)).toBe(28);
  });

  it('returns 29 for February in a leap year', () => {
    expect(lastDayOfMonth(2028, 2)).toBe(29);
  });
});

describe('monthRange', () => {
  it('spans the whole month, inclusive', () => {
    expect(monthRange(2026, 7)).toEqual({ start: '2026-07-01', end: '2026-07-31' });
  });
});

describe('toLocalDate / parseLocalDate', () => {
  it('round-trips a date without shifting due to timezone', () => {
    const date = new Date(2026, 0, 31); // 31 January, local time
    expect(toLocalDate(date)).toBe('2026-01-31');
    expect(parseLocalDate('2026-01-31')).toEqual(date);
  });
});

describe('daysBetweenInclusive', () => {
  it('counts the same date as 1 day', () => {
    expect(daysBetweenInclusive('2026-07-16', '2026-07-16')).toBe(1);
  });

  it('counts consecutive days correctly', () => {
    expect(daysBetweenInclusive('2026-07-01', '2026-07-31')).toBe(31);
  });

  it('spans a month boundary correctly', () => {
    expect(daysBetweenInclusive('2026-01-31', '2026-02-01')).toBe(2);
  });
});

describe('buildCalendarGrid', () => {
  it('produces a 42-cell Monday-first grid with correct in-month flags', () => {
    // July 2026 starts on a Wednesday.
    const grid = buildCalendarGrid(2026, 7);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ date: '2026-06-29', day: 29, inMonth: false });
    expect(grid[2]).toEqual({ date: '2026-07-01', day: 1, inMonth: true });
    expect(grid[32]).toEqual({ date: '2026-07-31', day: 31, inMonth: true });
    expect(grid[33]).toEqual({ date: '2026-08-01', day: 1, inMonth: false });
  });

  it('starts the grid on Monday even when the month begins on Monday', () => {
    // June 2026 starts on a Monday.
    const grid = buildCalendarGrid(2026, 6);
    expect(grid[0]).toEqual({ date: '2026-06-01', day: 1, inMonth: true });
  });
});
