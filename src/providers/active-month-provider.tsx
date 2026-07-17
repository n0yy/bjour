import { createContext, useContext, useState, type ReactNode } from 'react';

export interface ActiveMonth {
  year: number;
  month: number; // 1-12
  goToPreviousMonth(): void;
  goToNextMonth(): void;
}

const ActiveMonthContext = createContext<ActiveMonth | null>(null);

export function ActiveMonthProvider({ children, now = () => new Date() }: { children: ReactNode; now?: () => Date }) {
  const initial = now();
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth() + 1);

  const value: ActiveMonth = {
    year,
    month,
    goToPreviousMonth() {
      if (month === 1) {
        setYear((y) => y - 1);
        setMonth(12);
      } else {
        setMonth((m) => m - 1);
      }
    },
    goToNextMonth() {
      if (month === 12) {
        setYear((y) => y + 1);
        setMonth(1);
      } else {
        setMonth((m) => m + 1);
      }
    },
  };

  return <ActiveMonthContext.Provider value={value}>{children}</ActiveMonthContext.Provider>;
}

export function useActiveMonth(): ActiveMonth {
  const value = useContext(ActiveMonthContext);
  if (!value) throw new Error('useActiveMonth() must be called within an ActiveMonthProvider');
  return value;
}
