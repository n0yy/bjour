import { Pressable, Text, View } from 'react-native';

import type { AmbangDataStatus } from '@/domain/types';

import { ProgressRing } from './progress-ring';

export function AmbangDataCard({ status, onPress }: { status: AmbangDataStatus; onPress: () => void }) {
  const daysDone = Math.min(status.daysSinceFirstTransaction, status.requiredDays);
  const daysRemaining = Math.max(0, status.requiredDays - status.daysSinceFirstTransaction);

  return (
    <Pressable
      onPress={onPress}
      className="mb-sm flex-row items-center gap-sm rounded-lg border-3 border-line px-sm py-sm">
      <ProgressRing
        size={44}
        progress={status.daysSinceFirstTransaction / status.requiredDays}
        label={status.isMet ? '✓' : `${daysDone}/${status.requiredDays}`}
      />
      <View className="flex-1">
        <Text className="text-title-sm font-semibold text-ink">
          {status.isMet ? 'Analisismu siap' : 'Analisismu sedang disiapkan'}
        </Text>
        <Text className="text-body-sm text-muted">
          {status.isMet ? 'Ketuk untuk aktifkan BJour+' : `${daysRemaining} hari lagi menuju BJour+`}
        </Text>
      </View>
    </Pressable>
  );
}
