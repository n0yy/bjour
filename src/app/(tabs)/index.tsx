import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbangDataCard } from '@/components/ambang-data-card';
import { MonthNav } from '@/components/month-nav';
import { formatRupiah } from '@/domain/currency';
import { formatSignedAmount, transactionLabel } from '@/domain/transaction-presentation';
import type { AmbangDataStatus, DailyGroup, MonthlySummary } from '@/domain/types';
import { useActiveMonth } from '@/providers/active-month-provider';
import { useLedger } from '@/providers/ledger-provider';

interface HomeState {
  groups: DailyGroup[];
  summary: MonthlySummary;
  ambangData: AmbangDataStatus;
  categoryNameById: Map<string, string>;
  assetNameById: Map<string, string>;
}

function formatDayHeader(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(year, month - 1, day),
  );
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
      ledger.getAmbangDataStatus(),
      ledger.listExpenseCategories(),
      ledger.listIncomeCategories(),
      ledger.listAssets(),
    ]).then(([groups, summary, ambangData, expenseCategories, incomeCategories, assets]) => {
      if (cancelled) return;
      setState({
        groups,
        summary,
        ambangData,
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
      <View className="flex-1 px-md pt-xs">
        <MonthNav />

        {state && (
          <View className="mb-sm flex-row overflow-hidden rounded-lg border-3 border-frame">
            <View className="flex-1 items-center border-r border-fill bg-card py-xs">
              <Text className="text-caption-uppercase text-muted">Masuk</Text>
              <Text className="text-title-sm font-semibold text-ink tabular-nums">{formatRupiah(state.summary.income)}</Text>
            </View>
            <View className="flex-1 items-center border-r border-fill bg-card py-xs">
              <Text className="text-caption-uppercase text-muted">Keluar</Text>
              <Text className="text-title-sm font-semibold text-ink tabular-nums">{formatRupiah(state.summary.expense)}</Text>
            </View>
            <View className="flex-1 items-center bg-card py-xs">
              <Text className="text-caption-uppercase text-muted">Selisih</Text>
              <Text className="text-title-sm font-semibold text-ink tabular-nums">{formatRupiah(state.summary.net)}</Text>
            </View>
          </View>
        )}

        {state && <AmbangDataCard status={state.ambangData} onPress={() => router.push('/bjour-plus')} />}

        {isEmpty ? (
          <View className="flex-1 items-center justify-center gap-md pb-20">
            <Text className="text-center text-body-md text-muted">Belum ada transaksi bulan ini</Text>
            <Pressable
              onPress={() => router.push('/quick-entry')}
              className="rounded-lg border-3 border-frame bg-frame px-md py-sm">
              <Text className="text-button font-bold text-card">Catat transaksi pertamamu</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={groups ?? []}
            keyExtractor={(group) => group.date}
            contentContainerStyle={{ paddingBottom: 96 }}
            renderItem={({ item: group }) => (
              <View className="mb-sm overflow-hidden rounded-lg border-3 border-frame">
                <View className="flex-row justify-between bg-fill-2 px-sm py-xs">
                  <Text className="text-title-sm font-bold text-ink">{formatDayHeader(group.date)}</Text>
                  <Text className="text-title-sm font-bold text-muted tabular-nums">{formatRupiah(group.subtotal)}</Text>
                </View>
                {group.transactions.map((transaction) => {
                  const assetName = state?.assetNameById.get(transaction.assetId) ?? '—';
                  const subtitle =
                    transaction.kind === 'transfer'
                      ? `${assetName} → ${state?.assetNameById.get(transaction.toAssetId ?? '') ?? '—'}`
                      : `${state?.categoryNameById.get(transaction.categoryId ?? '') ?? '—'} · ${assetName}`;
                  return (
                    <Pressable
                      key={transaction.id}
                      onPress={() => router.push({ pathname: '/quick-entry', params: { id: transaction.id } })}
                      className="flex-row items-center gap-sm border-b border-fill bg-card px-sm py-xs">
                      <View className="h-7 w-7 rounded-sm bg-fill" />
                      <View className="flex-1">
                        <Text className="text-body-md text-ink">{transactionLabel(transaction)}</Text>
                        <Text className="text-body-sm text-muted">{subtitle}</Text>
                      </View>
                      <Text className={`text-title-sm font-semibold tabular-nums ${transaction.kind === 'transfer' ? 'text-muted' : 'text-ink'}`}>
                        {formatSignedAmount(transaction)}
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
        className="absolute bottom-md right-md h-14 w-14 items-center justify-center rounded-pill border-3 border-frame bg-frame">
        <Text className="text-title-lg leading-none text-card">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
