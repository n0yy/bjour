import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountKeypad } from '@/components/amount-keypad';
import { SegmentedControl } from '@/components/segmented-control';
import { formatRupiah } from '@/domain/currency';
import type { AssetKind } from '@/domain/types';
import { useAmountInput } from '@/hooks/use-amount-input';
import { useColors } from '@/hooks/use-colors';
import { useLedger } from '@/providers/ledger-provider';

const KIND_OPTIONS: { value: AssetKind; label: string }[] = [
  { value: 'cash', label: 'Tunai' },
  { value: 'bank', label: 'Bank' },
  { value: 'e-wallet', label: 'E-wallet' },
  { value: 'card', label: 'Kartu' },
];

export default function ManageAssetScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = typeof id === 'string';
  const ledger = useLedger();
  const colors = useColors();

  const [name, setName] = useState('');
  const [kind, setKind] = useState<AssetKind>('cash');
  const { amount: openingBalance, setAmount, pressKey } = useAmountInput(0);
  const [active, setActive] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([ledger.listAssets(), ledger.isAssetInUse(id)]).then(([assets, inUse]) => {
      const asset = assets.find((a) => a.id === id);
      if (!asset) return;
      setName(asset.name);
      setKind(asset.kind);
      setAmount(asset.openingBalance);
      setActive(asset.active);
      setCanDelete(!inUse);
    });
  }, [ledger, id, setAmount]);

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    if (id) {
      await ledger.updateAssetDetails(id, { name: name.trim(), kind });
    } else {
      await ledger.addAsset({ name: name.trim(), kind, openingBalance });
    }
    router.back();
  }

  async function toggleActive() {
    if (!id || saving) return;
    setSaving(true);
    await ledger.setAssetActive(id, !active);
    router.back();
  }

  async function remove() {
    if (!id || !canDelete || saving) return;
    setSaving(true);
    await ledger.deleteAsset(id);
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-muted">Batal</Text>
        </Pressable>
        <Text className="font-bold text-ink">{isEditing ? 'Ubah Aset' : 'Tambah Aset'}</Text>
        <View className="w-10" />
      </View>

      <View className="flex-row items-center gap-2 border-b border-fill px-4 py-3">
        <Text className="w-24 text-xs uppercase text-muted">Nama</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="mis. Rekening BCA"
          placeholderTextColor={colors.muted}
          className="flex-1 text-ink"
        />
      </View>

      <View className="border-b border-fill px-4 py-3">
        <Text className="mb-2 text-xs uppercase text-muted">Jenis</Text>
        <SegmentedControl options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </View>

      {isEditing ? (
        <View className="flex-row items-center gap-2 border-b border-fill px-4 py-3">
          <Text className="w-24 text-xs uppercase text-muted">Saldo awal</Text>
          <Text className="font-semibold text-ink tabular-nums">{formatRupiah(openingBalance)}</Text>
        </View>
      ) : (
        <Text className="border-b-2 border-ink px-4 py-3 text-right font-display text-3xl font-bold text-ink tabular-nums">
          {formatRupiah(openingBalance)}
        </Text>
      )}

      {isEditing && (
        <View className="gap-2 px-4 py-3">
          <Pressable onPress={toggleActive} className="items-center rounded-xl border-3 border-line py-3">
            <Text className="font-bold text-ink">{active ? 'Nonaktifkan' : 'Aktifkan'}</Text>
          </Pressable>
          <Pressable
            onPress={remove}
            disabled={!canDelete}
            className={`items-center rounded-xl border-3 py-3 ${canDelete ? 'border-line' : 'border-fill'}`}>
            <Text className={`font-bold ${canDelete ? 'text-muted' : 'text-fill-2'}`}>
              {canDelete ? 'Hapus' : 'Tidak bisa dihapus — sudah dipakai'}
            </Text>
          </Pressable>
        </View>
      )}

      {isEditing ? (
        <Pressable
          onPress={save}
          disabled={!name.trim()}
          className={`mx-4 mb-4 mt-auto items-center rounded-xl py-4 ${name.trim() ? 'bg-frame' : 'bg-fill-2'}`}>
          <Text className={`text-lg font-bold ${name.trim() ? 'text-card' : 'text-muted'}`}>Simpan</Text>
        </Pressable>
      ) : (
        <AmountKeypad onPressKey={pressKey} actionLabel="Simpan" actionDisabled={!name.trim()} onPressAction={save} />
      )}
    </SafeAreaView>
  );
}
