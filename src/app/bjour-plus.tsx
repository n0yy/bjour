import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '@/components/progress-ring';
import type { AmbangDataStatus } from '@/domain/types';
import { useLedger } from '@/providers/ledger-provider';

function ChecklistRow({ done, label, status }: { done: boolean; label: string; status: string }) {
  return (
    <View className="flex-row items-center gap-xs py-xs">
      <View className={`h-5 w-5 items-center justify-center rounded-xs ${done ? 'bg-frame' : 'border-2 border-line'}`}>
        {done && <Text className="text-caption text-card">✓</Text>}
      </View>
      <Text className="flex-1 text-body-md text-ink">{label}</Text>
      <Text className="text-caption text-muted">{status}</Text>
    </View>
  );
}

export default function BjourPlusScreen() {
  const ledger = useLedger();
  const [status, setStatus] = useState<AmbangDataStatus | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    ledger.getAmbangDataStatus().then((loaded) => {
      if (!cancelled) setStatus(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [ledger]);

  useFocusEffect(load);

  if (!status) return null;

  const daysDone = Math.min(status.daysSinceFirstTransaction, status.requiredDays);

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-row items-center justify-between px-md py-xs">
        <Pressable onPress={() => router.back()}>
          <Text className="text-body-sm text-muted">‹ Kembali</Text>
        </Pressable>
        <Text className="text-title-sm font-bold text-ink">BJour+</Text>
        <View className="w-16" />
      </View>

      <View className="items-center px-lg py-md">
        <ProgressRing
          size={110}
          progress={status.daysSinceFirstTransaction / status.requiredDays}
          label={status.isMet ? '✓' : `${daysDone}/${status.requiredDays}`}
        />
        <Text className="mt-sm text-center font-display text-title-lg font-bold text-ink">
          {status.isMet
            ? 'Analisismu siap'
            : `${Math.max(0, status.requiredDays - status.daysSinceFirstTransaction)} hari lagi analisismu siap`}
        </Text>
        <Text className="mt-xxs max-w-xs text-center text-body-sm text-muted">
          BJour+ membaca cash flow-mu dan menyusun rencana keuangan — tanpa form, tanpa tebakan.
        </Text>
      </View>

      <View className="px-md">
        <ChecklistRow
          done={status.daysSinceFirstTransaction >= status.requiredDays}
          label={`${status.requiredDays} hari pencatatan`}
          status={`${daysDone}/${status.requiredDays}`}
        />
        <ChecklistRow done={status.hasMinIncome} label="Minimal 1 pemasukan tercatat" status={status.hasMinIncome ? '✓' : '·'} />
        <ChecklistRow
          done={status.hasRegularActivity}
          label="Catat rutin tiap pekan"
          status={`${status.weeksWithActivity}/${status.totalWeeksElapsed} pekan`}
        />
      </View>

      <View className="mt-auto p-md">
        {status.isMet ? (
          <Pressable
            onPress={() => Alert.alert('Segera hadir', 'Aktivasi BJour+ belum tersedia di fase ini.')}
            className="items-center rounded-md bg-frame py-sm">
            <Text className="text-button font-bold text-card">Aktifkan BJour+</Text>
          </Pressable>
        ) : (
          <View className="items-center rounded-md border-3 border-dashed border-line py-sm">
            <Text className="text-button font-bold text-muted">🔒 BJour+ — terbuka setelah syarat terpenuhi</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
