import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatRupiah } from '@/domain/currency';
import type { DailyGroup } from '@/domain/types';
import { useLedger } from '@/providers/ledger-provider';

interface HomeState {
  groups: DailyGroup[];
  categoryNameById: Map<string, string>;
  assetName: string;
}

function formatDayHeader(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(year, month - 1, day),
  );
}

export default function HomeScreen() {
  const ledger = useLedger();
  const [state, setState] = useState<HomeState | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    const now = new Date();

    Promise.all([
      ledger.listDailyGroups(now.getFullYear(), now.getMonth() + 1),
      ledger.listExpenseCategories(),
      ledger.getDefaultAsset(),
    ]).then(([groups, categories, asset]) => {
      if (cancelled) return;
      setState({
        groups,
        categoryNameById: new Map(categories.map((c) => [c.id, c.name])),
        assetName: asset.name,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [ledger]);

  useFocusEffect(load);

  const groups = state?.groups ?? null;
  const isEmpty = groups !== null && groups.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-2">
        <Text className="mb-3 text-center font-display text-lg font-bold text-ink">
          {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())}
        </Text>

        {isEmpty ? (
          <View className="flex-1 items-center justify-center gap-4 pb-20">
            <Text className="text-center text-base text-muted">Belum ada transaksi bulan ini</Text>
            <Pressable
              onPress={() => router.push('/quick-entry')}
              className="rounded-xl border-3 border-frame bg-frame px-5 py-3">
              <Text className="font-bold text-card">Catat transaksi pertamamu</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={groups ?? []}
            keyExtractor={(group) => group.date}
            contentContainerStyle={{ paddingBottom: 96 }}
            renderItem={({ item: group }) => (
              <View className="mb-3 overflow-hidden rounded-xl border-3 border-frame">
                <View className="flex-row justify-between bg-fill-2 px-3 py-2">
                  <Text className="font-bold text-ink">{formatDayHeader(group.date)}</Text>
                  <Text className="font-bold text-muted">{formatRupiah(group.subtotal)}</Text>
                </View>
                {group.transactions.map((transaction) => (
                  <View key={transaction.id} className="flex-row items-center gap-3 border-b border-fill bg-card px-3 py-2">
                    <View className="h-7 w-7 rounded-md bg-fill" />
                    <View className="flex-1">
                      <Text className="text-ink">{transaction.note || 'Pengeluaran'}</Text>
                      <Text className="text-xs text-muted">
                        {state?.categoryNameById.get(transaction.categoryId ?? '') ?? '—'} · {state?.assetName}
                      </Text>
                    </View>
                    <Text className="font-semibold text-ink">-{formatRupiah(transaction.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          />
        )}
      </View>

      <Pressable
        onPress={() => router.push('/quick-entry')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full border-3 border-frame bg-frame">
        <Text className="text-2xl leading-none text-card">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
