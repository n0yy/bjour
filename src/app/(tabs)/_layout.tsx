import AppTabs from '@/components/app-tabs';
import { ActiveMonthProvider } from '@/providers/active-month-provider';

export default function TabsLayout() {
  return (
    <ActiveMonthProvider>
      <AppTabs />
    </ActiveMonthProvider>
  );
}
