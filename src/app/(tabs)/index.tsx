import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthNav } from '@/components/month-nav';
import { formatRupiah } from '@/domain/currency';
import type { DailyGroup, MonthlySummary, Transaction } from '@/domain/types';
import { useActiveMonth } from '@/providers/active-month-provider';
import { useLedger } from '@/providers/ledger-provider';

interface HomeState {
  groups: DailyGroup[];
  summary: MonthlySummary;
  categoryNameById: Map<string, string>;
  assetNameById: Map<string, string>;
}

function formatDayHeader(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(year, month - 1, day),
  );
}

function transactionLabel(transaction: Transaction): string {
  if (transaction.note) return transaction.note;
  if (transaction.kind === 'income') return 'Pemasukan';
  if (transaction.kind === 'transfer') return 'Transfer';
  return 'Pengeluaran';
}

export default function HomeScreen() {
  const ledger = useLedger();
  const { year, month } = useActiveMonth();
  const [state, setState] = useState<HomeState | null>(null);

  const load = useCallback(() => {
    let cancelled = false;

    Promise.all([
      ledger.listDailyGroups(year, month),
      ledger.getMonthlySummary(year, month),
      ledger.listExpenseCategories(),
      ledger.listIncomeCategories(),
      ledger.listAssets(),
    ]).then(([groups, summary, expenseCategories, incomeCategories, assets]) => {
      if (cancelled) return;
      setState({
        groups,
        summary,
        categoryNameById: new Map([...expenseCategories, ...incomeCategories].map((c) => [c.id, c.name])),
        assetNameById: new Map(assets.map((a) => [a.id, a.name])),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [ledger, year, month]);

  useFocusEffect(load);

  const groups = state?.groups ?? null;
  const isEmpty = groups !== null && groups.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-2">
        <MonthNav />

        {state && (
          <View className="mb-3 flex-row overflow-hidden rounded-xl border-3 border-frame">
            <View className="flex-1 items-center border-r border-fill bg-card py-2">
              <Text className="text-xs uppercase text-muted">Masuk</Text>
              <Text className="font-semibold text-ink">{formatRupiah(state.summary.income)}</Text>
            </View>
            <View className="flex-1 items-center border-r border-fill bg-card py-2">
              <Text className="text-xs uppercase text-muted">Keluar</Text>
              <Text className="font-semibold text-ink">{formatRupiah(state.summary.expense)}</Text>
            </View>
            <View className="flex-1 items-center bg-card py-2">
              <Text className="text-xs uppercase text-muted">Selisih</Text>
              <Text className="font-semibold text-ink">{formatRupiah(state.summary.net)}</Text>
            </View>
          </View>
        )}

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
                {group.transactions.map((transaction) => {
                  const assetName = state?.assetNameById.get(transaction.assetId) ?? '—';
                  const subtitle =
                    transaction.kind === 'transfer'
                      ? `${assetName} → ${state?.assetNameById.get(transaction.toAssetId ?? '') ?? '—'}`
                      : `${state?.categoryNameById.get(transaction.categoryId ?? '') ?? '—'} · ${assetName}`;
                  const amountText =
                    transaction.kind === 'income'
                      ? `+${formatRupiah(transaction.amount)}`
                      : transaction.kind === 'expense'
                        ? `-${formatRupiah(transaction.amount)}`
                        : formatRupiah(transaction.amount);

                  return (
                    <Pressable
                      key={transaction.id}
                      onPress={() => router.push({ pathname: '/quick-entry', params: { id: transaction.id } })}
                      className="flex-row items-center gap-3 border-b border-fill bg-card px-3 py-2">
                      <View className="h-7 w-7 rounded-md bg-fill" />
                      <View className="flex-1">
                        <Text className="text-ink">{transactionLabel(transaction)}</Text>
                        <Text className="text-xs text-muted">{subtitle}</Text>
                      </View>
                      <Text className={`font-semibold ${transaction.kind === 'transfer' ? 'text-muted' : 'text-ink'}`}>
                        {amountText}
                      </Text>
                    </Pressable>
                  );
                })}
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
