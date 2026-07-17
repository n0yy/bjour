import { Pressable, Text, View } from 'react-native';

import type { AmbangDataStatus } from '@/domain/types';

import { ProgressRing } from './progress-ring';

export function AmbangDataCard({ status, onPress }: { status: AmbangDataStatus; onPress: () => void }) {
  const daysDone = Math.min(status.daysSinceFirstTransaction, status.requiredDays);
  const daysRemaining = Math.max(0, status.requiredDays - status.daysSinceFirstTransaction);

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-xl border-3 border-line px-3 py-3">
      <ProgressRing
        size={44}
        progress={status.daysSinceFirstTransaction / status.requiredDays}
        label={status.isMet ? '✓' : `${daysDone}/${status.requiredDays}`}
      />
      <View className="flex-1">
        <Text className="font-bold text-ink">
          {status.isMet ? 'Analisismu siap' : 'Analisismu sedang disiapkan'}
        </Text>
        <Text className="text-xs text-muted">
          {status.isMet ? 'Ketuk untuk aktifkan BJour+' : `${daysRemaining} hari lagi menuju BJour+`}
        </Text>
      </View>
    </Pressable>
  );
}
