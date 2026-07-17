import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountKeypad } from '@/components/amount-keypad';
import { Chip } from '@/components/chip';
import { DateField } from '@/components/date-field';
import { SegmentedControl } from '@/components/segmented-control';
import { formatRupiah } from '@/domain/currency';
import { todayLocalDate } from '@/domain/local-date';
import type { AssetWithBalance, Category, LocalDate, TransactionKind } from '@/domain/types';
import { useAmountInput } from '@/hooks/use-amount-input';
import { useLedger } from '@/providers/ledger-provider';

const SEGMENTS: { value: TransactionKind; label: string }[] = [
  { value: 'income', label: 'Masuk' },
  { value: 'expense', label: 'Keluar' },
  { value: 'transfer', label: 'Transfer' },
];

const TITLE_BY_KIND: Record<TransactionKind, string> = {
  income: 'Catat Pemasukan',
  expense: 'Catat Pengeluaran',
  transfer: 'Catat Transfer',
};

export default function QuickEntryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = typeof id === 'string';
  const ledger = useLedger();

  const [kind, setKind] = useState<TransactionKind>('expense');
  const { amount, setAmount, pressKey } = useAmountInput(0);
  const [date, setDate] = useState<LocalDate>(todayLocalDate());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [assets, setAssets] = useState<AssetWithBalance[]>([]);
  // primaryAssetId is "Aset" for masuk/keluar and "Dari" for transfer, so it
  // survives switching kind mid-edit instead of resetting to null.
  const [primaryAssetId, setPrimaryAssetId] = useState<string | null>(null);
  // The user's explicit "Ke" pick, if any and still valid — falls back below
  // to any other asset so it's never null/equal-to-primary after a kind switch.
  const [secondaryAssetIdOverride, setSecondaryAssetIdOverride] = useState<string | null>(null);
  const secondaryAssetId =
    secondaryAssetIdOverride &&
    secondaryAssetIdOverride !== primaryAssetId &&
    assets.some((a) => a.id === secondaryAssetIdOverride)
      ? secondaryAssetIdOverride
      : (assets.find((a) => a.id !== primaryAssetId)?.id ?? null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    ledger.listAssets().then(setAssets);
  }, [ledger]);

  useEffect(() => {
    if (isEditing) return; // edit mode prefills from the existing transaction instead, below
    ledger.getDefaultAsset().then((defaultAsset) => setPrimaryAssetId(defaultAsset.id));
  }, [ledger, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    ledger.getTransaction(id).then((tx) => {
      if (!tx) return;
      setKind(tx.kind);
      setAmount(tx.amount);
      setDate(tx.date);
      setNote(tx.note ?? '');
      setPrimaryAssetId(tx.assetId);
      if (tx.kind === 'transfer') setSecondaryAssetIdOverride(tx.toAssetId);
      else setCategoryId(tx.categoryId);
    });
  }, [ledger, id, isEditing, setAmount]);

  useEffect(() => {
    if (kind === 'transfer') return;
    const load = kind === 'income' ? ledger.listIncomeCategories() : ledger.listExpenseCategories();
    load.then((loaded) => {
      setCategories(loaded);
      setCategoryId((current) => (current && loaded.some((c) => c.id === current) ? current : (loaded[0]?.id ?? null)));
    });
  }, [ledger, kind]);

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    const trimmedNote = note.trim() || null;

    if (kind === 'transfer' && primaryAssetId && secondaryAssetId) {
      const input = { kind, amount, fromAssetId: primaryAssetId, toAssetId: secondaryAssetId, date, note: trimmedNote } as const;
      if (isEditing) await ledger.updateTransaction(id, input);
      else await ledger.recordTransfer(input);
    } else if ((kind === 'expense' || kind === 'income') && primaryAssetId && categoryId) {
      const input = { kind, amount, assetId: primaryAssetId, categoryId, date, note: trimmedNote } as const;
      if (isEditing) await ledger.updateTransaction(id, input);
      else if (kind === 'expense') await ledger.recordExpense(input);
      else await ledger.recordIncome(input);
    }
    router.back();
  }

  async function remove() {
    if (!isEditing || saving) return;
    setSaving(true);
    await ledger.deleteTransaction(id);
    router.back();
  }

  const canSave =
    amount > 0 &&
    (kind === 'transfer'
      ? primaryAssetId !== null && secondaryAssetId !== null && primaryAssetId !== secondaryAssetId
      : primaryAssetId !== null && categoryId !== null);

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-muted">Batal</Text>
        </Pressable>
        <Text className="font-bold text-ink">{TITLE_BY_KIND[kind]}</Text>
        <View className="w-10" />
      </View>

      <SegmentedControl options={SEGMENTS} value={kind} onChange={setKind} className="mx-4" />

      <Text className="border-b-2 border-ink px-4 py-3 text-right font-display text-3xl font-bold text-ink">
        {formatRupiah(amount)}
      </Text>

      {kind === 'transfer' ? (
        <>
          <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
            <Text className="w-16 text-xs uppercase text-muted">Dari</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assets.map((asset) => (
                <Chip
                  key={asset.id}
                  label={asset.name}
                  selected={primaryAssetId === asset.id}
                  onPress={() => setPrimaryAssetId(asset.id)}
                />
              ))}
            </ScrollView>
          </View>
          <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
            <Text className="w-16 text-xs uppercase text-muted">Ke</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assets.map((asset) => (
                <Chip
                  key={asset.id}
                  label={asset.name}
                  selected={secondaryAssetId === asset.id}
                  onPress={() => setSecondaryAssetIdOverride(asset.id)}
                />
              ))}
            </ScrollView>
          </View>
          {primaryAssetId !== null && primaryAssetId === secondaryAssetId ? (
            <Text className="px-4 pt-1 text-xs text-muted">Pilih Aset tujuan yang berbeda dari Aset asal</Text>
          ) : null}
        </>
      ) : (
        <>
          <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
            <Text className="w-16 text-xs uppercase text-muted">Aset</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assets.map((asset) => (
                <Chip
                  key={asset.id}
                  label={asset.name}
                  selected={primaryAssetId === asset.id}
                  onPress={() => setPrimaryAssetId(asset.id)}
                />
              ))}
            </ScrollView>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-14 border-b border-fill px-2 py-2">
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </ScrollView>
        </>
      )}

      <DateField value={date} onChange={setDate} />

      <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
        <Text className="w-16 text-xs uppercase text-muted">Catatan</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="opsional…"
          placeholderTextColor="#6D6E67"
          className="flex-1 text-ink"
        />
      </View>

      {isEditing && (
        <Pressable onPress={remove} className="mx-4 mt-3 items-center rounded-xl border-3 border-line py-3">
          <Text className="font-bold text-muted">Hapus</Text>
        </Pressable>
      )}

      <AmountKeypad onPressKey={pressKey} actionLabel="Simpan" actionDisabled={!canSave} onPressAction={save} />
    </SafeAreaView>
  );
}
