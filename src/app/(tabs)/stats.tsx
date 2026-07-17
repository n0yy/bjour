import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryDonut, categoryColor } from '@/components/category-donut';
import { MonthNav } from '@/components/month-nav';
import { SegmentedControl } from '@/components/segmented-control';
import { formatRupiah } from '@/domain/currency';
import { formatSignedAmount, transactionLabel } from '@/domain/transaction-presentation';
import type { Category, CategoryStat, Transaction } from '@/domain/types';
import { useCategoryPalette } from '@/hooks/use-colors';
import { useActiveMonth } from '@/providers/active-month-provider';
import { useLedger } from '@/providers/ledger-provider';

const DIRECTION_OPTIONS: { value: Category['direction']; label: string }[] = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
];

export default function StatsScreen() {
  const ledger = useLedger();
  const { year, month } = useActiveMonth();
  const palette = useCategoryPalette();
  const [direction, setDirection] = useState<Category['direction']>('expense');
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [drilldownTransactions, setDrilldownTransactions] = useState<Transaction[]>([]);

  const load = useCallback(() => {
    let cancelled = false;
    // A drill-down expanded for one month/direction must not survive into
    // another — otherwise it'd keep showing stale transactions for a
    // category ID that may not even apply to the newly loaded stats.
    setExpandedCategoryId(null);
    setDrilldownTransactions([]);
    ledger.getCategoryStats(year, month, direction).then((loaded) => {
      if (!cancelled) setStats(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [ledger, year, month, direction]);

  useFocusEffect(load);

  const total = stats.reduce((sum, s) => sum + s.total, 0);

  function toggleDrilldown(categoryId: string) {
    if (expandedCategoryId === categoryId) {
      setExpandedCategoryId(null);
      return;
    }
    setExpandedCategoryId(categoryId);
    ledger.listTransactionsForCategory(year, month, categoryId).then(setDrilldownTransactions);
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-md pt-xs">
        <MonthNav />

        <SegmentedControl options={DIRECTION_OPTIONS} value={direction} onChange={setDirection} />

        <CategoryDonut stats={stats} total={total} />

        <ScrollView className="flex-1">
          {stats.length === 0 ? (
            <Text className="py-lg text-center text-body-sm text-muted">Belum ada data bulan ini</Text>
          ) : (
            stats.map((stat) => (
              <View key={stat.categoryId} className="border-b border-fill">
                <Pressable onPress={() => toggleDrilldown(stat.categoryId)} className="flex-row items-center gap-xs py-xs">
                  <View className="h-3 w-3 rounded-xs" style={{ backgroundColor: categoryColor(stat.categoryId, palette) }} />
                  <Text className="flex-1 text-body-md text-ink">{stat.name}</Text>
                  <Text className="text-caption text-muted">{Math.round(stat.percentage)}%</Text>
                  <Text className="ml-sm text-title-sm font-semibold text-ink tabular-nums">{formatRupiah(stat.total)}</Text>
                </Pressable>

                {expandedCategoryId === stat.categoryId && (
                  <View className="mb-xs rounded-md bg-fill px-xs py-xxs">
                    {drilldownTransactions.length === 0 ? (
                      <Text className="py-sm text-center text-caption text-muted">Memuat…</Text>
                    ) : (
                      drilldownTransactions.map((transaction) => (
                        <Pressable
                          key={transaction.id}
                          onPress={() => router.push({ pathname: '/quick-entry', params: { id: transaction.id } })}
                          className="flex-row items-center justify-between border-b border-fill-2 px-xs py-xs">
                          <Text className="text-body-sm text-ink">{transactionLabel(transaction)}</Text>
                          <Text className="text-body-sm font-semibold text-ink tabular-nums">{formatSignedAmount(transaction)}</Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
