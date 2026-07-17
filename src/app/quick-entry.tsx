import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatRupiah } from '@/domain/currency';
import { todayLocalDate } from '@/domain/local-date';
import type { Category } from '@/domain/types';
import { useLedger } from '@/providers/ledger-provider';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

export default function QuickEntryScreen() {
  const ledger = useLedger();
  const [amount, setAmount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState('Tunai');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ledger.listExpenseCategories().then(setCategories);
    ledger.getDefaultAsset().then((asset) => setAssetName(asset.name));
  }, [ledger]);

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
    if (amount <= 0 || !categoryId || saving) return;
    setSaving(true);
    const asset = await ledger.getDefaultAsset();
    await ledger.recordExpense({
      amount,
      assetId: asset.id,
      categoryId,
      date: todayLocalDate(),
      note: note.trim() || null,
    });
    router.back();
  }

  const canSave = amount > 0 && categoryId !== null && !saving;

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-muted">Batal</Text>
        </Pressable>
        <Text className="font-bold text-ink">Catat Pengeluaran</Text>
        <View className="w-10" />
      </View>

      <Text className="border-b-2 border-ink px-4 py-3 text-right font-display text-3xl font-bold text-ink">
        {formatRupiah(amount)}
      </Text>

      <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
        <Text className="w-20 text-xs uppercase text-muted">Aset</Text>
        <Text className="font-semibold text-ink">{assetName}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-14 border-b border-fill px-2 py-2">
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setCategoryId(category.id)}
            className={`mx-1 justify-center rounded-full border-3 px-4 ${
              categoryId === category.id ? 'border-frame bg-frame' : 'border-line bg-fill'
            }`}>
            <Text className={categoryId === category.id ? 'font-bold text-card' : 'text-ink'}>{category.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="flex-row items-center gap-2 border-b border-fill px-4 py-2">
        <Text className="w-20 text-xs uppercase text-muted">Catatan</Text>
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
