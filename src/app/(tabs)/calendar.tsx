import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthNav } from '@/components/month-nav';
import { formatRupiah, formatRupiahShort } from '@/domain/currency';
import { buildCalendarGrid } from '@/domain/local-date';
import { formatSignedAmount, transactionLabel } from '@/domain/transaction-presentation';
import type { CalendarDayTotal, DailyGroup } from '@/domain/types';
import { useActiveMonth } from '@/providers/active-month-provider';
import { useLedger } from '@/providers/ledger-provider';

const DOW_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function CalendarScreen() {
  const ledger = useLedger();
  const { year, month } = useActiveMonth();
  const [totalsByDate, setTotalsByDate] = useState<Map<string, CalendarDayTotal>>(new Map());
  const [groupsByDate, setGroupsByDate] = useState<Map<string, DailyGroup>>(new Map());
  const grid = buildCalendarGrid(year, month);
  // The user's explicit pick, if any and still within the active month —
  // otherwise falls back to the 1st, so navigating months never leaves the
  // day panel pointing at a date from a month that's no longer shown.
  const [selectedDateOverride, setSelectedDateOverride] = useState<string | null>(null);
  const selectedDate =
    selectedDateOverride && grid.some((c) => c.date === selectedDateOverride && c.inMonth)
      ? selectedDateOverride
      : grid.find((c) => c.inMonth)!.date;

  const load = useCallback(() => {
    let cancelled = false;
    Promise.all([ledger.getCalendarTotals(year, month), ledger.listDailyGroups(year, month)]).then(
      ([totals, groups]) => {
        if (cancelled) return;
        setTotalsByDate(new Map(totals.map((t) => [t.date, t])));
        setGroupsByDate(new Map(groups.map((g) => [g.date, g])));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [ledger, year, month]);

  useFocusEffect(load);

  const selectedGroup = groupsByDate.get(selectedDate);

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-4 pt-2">
        <MonthNav />

        <View className="flex-row">
          {DOW_LABELS.map((label) => (
            <Text key={label} className="flex-1 text-center text-xs text-muted">
              {label}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {grid.map((cell) => {
            const totals = totalsByDate.get(cell.date);
            const isSelected = cell.date === selectedDate;
            return (
              <Pressable
                key={cell.date}
                onPress={() => setSelectedDateOverride(cell.date)}
                className={`w-[14.28%] border p-1 ${isSelected ? 'border-frame border-2' : 'border-fill'} ${cell.inMonth ? '' : 'opacity-35'}`}
                style={{ minHeight: 52 }}>
                <Text className="text-xs font-semibold text-ink">{cell.day}</Text>
                {totals && totals.income > 0 && (
                  <Text className="text-[10px] text-ink">+{formatRupiahShort(totals.income)}</Text>
                )}
                {totals && totals.expense > 0 && (
                  <Text className="text-[10px] text-muted">-{formatRupiahShort(totals.expense)}</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="mt-3 flex-1 overflow-hidden rounded-t-xl border-3 border-b-0 border-frame">
          <View className="flex-row justify-between bg-fill-2 px-3 py-2">
            <Text className="font-bold text-ink">{selectedDate}</Text>
            <Text className="font-bold text-muted">{formatRupiah(selectedGroup?.subtotal ?? 0)}</Text>
          </View>
          <ScrollView className="bg-card">
            {selectedGroup && selectedGroup.transactions.length > 0 ? (
              selectedGroup.transactions.map((transaction) => (
                <Pressable
                  key={transaction.id}
                  onPress={() => router.push({ pathname: '/quick-entry', params: { id: transaction.id } })}
                  className="flex-row items-center justify-between border-b border-fill px-3 py-2">
                  <Text className="text-ink">{transactionLabel(transaction)}</Text>
                  <Text className={`font-semibold ${transaction.kind === 'transfer' ? 'text-muted' : 'text-ink'}`}>
                    {formatSignedAmount(transaction)}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text className="px-3 py-4 text-center text-sm text-muted">Tidak ada transaksi</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
