import type { LocalDate } from './types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar date, not a UTC timestamp — matches the device's own clock. */
export function todayLocalDate(clock: () => Date = () => new Date()): LocalDate {
  const d = clock();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthRange(year: number, month: number): { start: LocalDate; end: LocalDate } {
  return {
    start: `${year}-${pad2(month)}-01`,
    end: `${year}-${pad2(month)}-${pad2(lastDayOfMonth(year, month))}`,
  };
}
