import { describe, expect, it } from 'bun:test';

import { lastDayOfMonth, monthRange, todayLocalDate } from '@/domain/local-date';

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
