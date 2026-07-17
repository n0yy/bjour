import type { LocalDate } from './types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Converts a JS Date (read using local getters) to a 'YYYY-MM-DD' LocalDate string. */
export function toLocalDate(date: Date): LocalDate {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Local calendar date, not a UTC timestamp — matches the device's own clock. */
export function todayLocalDate(clock: () => Date = () => new Date()): LocalDate {
  return toLocalDate(clock());
}

/** Parses a 'YYYY-MM-DD' LocalDate string into a JS Date at local midnight. */
export function parseLocalDate(date: LocalDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
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
