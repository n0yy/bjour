import { Pressable, Text, View } from 'react-native';

import { useActiveMonth } from '@/providers/active-month-provider';

export function MonthNav() {
  const { year, month, goToPreviousMonth, goToNextMonth } = useActiveMonth();
  const label = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));

  return (
    <View className="mb-3 flex-row items-center justify-center gap-4">
      <Pressable onPress={goToPreviousMonth} hitSlop={12}>
        <Text className="text-lg text-muted">‹</Text>
      </Pressable>
      <Text className="font-display text-lg font-bold text-ink">{label}</Text>
      <Pressable onPress={goToNextMonth} hitSlop={12}>
        <Text className="text-lg text-muted">›</Text>
      </Pressable>
    </View>
  );
}
