import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatRupiah } from '@/domain/currency';
import { todayLocalDate } from '@/domain/local-date';
import type { AssetWithBalance, Category, TransactionKind } from '@/domain/types';
import { useLedger } from '@/providers/ledger-provider';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

const SEGMENTS: { kind: TransactionKind; label: string }[] = [
  { kind: 'income', label: 'Masuk' },
  { kind: 'expense', label: 'Keluar' },
  { kind: 'transfer', label: 'Transfer' },
];

const TITLE_BY_KIND: Record<TransactionKind, string> = {
  income: 'Catat Pemasukan',
  expense: 'Catat Pengeluaran',
  transfer: 'Catat Transfer',
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mx-1 justify-center rounded-full border-3 px-4 py-2 ${
        selected ? 'border-frame bg-frame' : 'border-line bg-fill'
      }`}>
      <Text className={selected ? 'font-bold text-card' : 'text-ink'}>{label}</Text>
    </Pressable>
  );
}

export default function QuickEntryScreen() {
  const ledger = useLedger();
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [assets, setAssets] = useState<AssetWithBalance[]>([]);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [fromAssetId, setFromAssetId] = useState<string | null>(null);
  const [toAssetId, setToAssetId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([ledger.listAssets(), ledger.getDefaultAsset()]).then(([allAssets, defaultAsset]) => {
      setAssets(allAssets);
      setAssetId(defaultAsset.id);
      setFromAssetId(defaultAsset.id);
      setToAssetId(allAssets.find((a) => a.id !== defaultAsset.id)?.id ?? null);
    });
  }, [ledger]);

  useEffect(() => {
    if (kind === 'transfer') return;
    const load = kind === 'income' ? ledger.listIncomeCategories() : ledger.listExpenseCategories();
    load.then((loaded) => {
      setCategories(loaded);
      setCategoryId(loaded[0]?.id ?? null);
    });
  }, [ledger, kind]);

  function pressKey(key: string) {
    if (key === '⌫') {
      setAmount((prev) => Math.floor(prev / 10));
      return;
    }
    const digits = key === '000' ? 3 : 1;
    setAmount((prev) => {
      const next = prev * 10 ** digits + Number(key);
      return next > Number.MAX_SAFE_INTEGER ? prev : next;
    });
  }

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    const date = todayLocalDate();
    const trimmedNote = note.trim() || null;

    if (kind === 'expense' && assetId && categoryId) {
      await ledger.recordExpense({ amount, assetId, categoryId, date, note: trimmedNote });
    } else if (kind === 'income' && assetId && categoryId) {
      await ledger.recordIncome({ amount, assetId, categoryId, date, note: trimmedNote });
    } else if (kind === 'transfer' && fromAssetId && toAssetId) {
      await ledger.recordTransfer({ amount, fromAssetId, toAssetId, date, note: trimmedNote });
    }
    router.back();
  }

  const canSave =
    amount > 0 &&
    (kind === 'transfer'
      ? fromAssetId !== null && toAssetId !== null && fromAssetId !== toAssetId
      : assetId !== null && categoryId !== null);

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-muted">Batal</Text>
        </Pressable>
        <Text className="font-bold text-ink">{TITLE_BY_KIND[kind]}</Text>
        <View className="w-10" />
      </View>

      <View className="flex-row overflow-hidden rounded-xl border-3 border-line mx-4">
        {SEGMENTS.map((segment) => (
          <Pressable
            key={segment.kind}
            onPress={() => setKind(segment.kind)}
            className={`flex-1 items-center py-2 ${kind === segment.kind ? 'bg-frame' : 'bg-transparent'}`}>
            <Text className={`font-semibold ${kind === segment.kind ? 'text-card' : 'text-muted'}`}>
              {segment.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="border-b-2 border-ink px-4 py-3 text-right font-display text-3xl font-bold text-ink">
        {formatRupiah(amount)}
      </Text>

      {kind === 'transfer' ? (
        <>
          <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
            <Text className="w-16 text-xs uppercase text-muted">Dari</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assets.map((asset) => (
                <Chip key={asset.id} label={asset.name} selected={fromAssetId === asset.id} onPress={() => setFromAssetId(asset.id)} />
              ))}
            </ScrollView>
          </View>
          <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
            <Text className="w-16 text-xs uppercase text-muted">Ke</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assets.map((asset) => (
                <Chip key={asset.id} label={asset.name} selected={toAssetId === asset.id} onPress={() => setToAssetId(asset.id)} />
              ))}
            </ScrollView>
          </View>
          {fromAssetId !== null && fromAssetId === toAssetId ? (
            <Text className="px-4 pt-1 text-xs text-muted">Pilih Aset tujuan yang berbeda dari Aset asal</Text>
          ) : null}
        </>
      ) : (
        <>
          <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
            <Text className="w-16 text-xs uppercase text-muted">Aset</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assets.map((asset) => (
                <Chip key={asset.id} label={asset.name} selected={assetId === asset.id} onPress={() => setAssetId(asset.id)} />
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

      <View className="mt-auto flex-row flex-wrap gap-2 p-3">
        {KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => pressKey(key)}
            className="basis-[30%] grow items-center rounded-xl bg-fill py-4">
            <Text className="text-lg font-semibold text-ink">{key}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={save}
          disabled={!canSave}
          className={`basis-full items-center rounded-xl py-4 ${canSave ? 'bg-frame' : 'bg-fill-2'}`}>
          <Text className={`text-lg font-bold ${canSave ? 'text-card' : 'text-muted'}`}>Simpan</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
