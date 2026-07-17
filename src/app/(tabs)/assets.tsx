import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatRupiah } from '@/domain/currency';
import type { AssetWithBalance } from '@/domain/types';
import { useLedger } from '@/providers/ledger-provider';

type AssetGroupKey = 'cash-bank' | 'e-wallet' | 'card';

const GROUP_KEY_BY_ASSET_KIND: Record<AssetWithBalance['kind'], AssetGroupKey> = {
  cash: 'cash-bank',
  bank: 'cash-bank',
  'e-wallet': 'e-wallet',
  card: 'card',
};

const GROUP_ORDER: AssetGroupKey[] = ['cash-bank', 'e-wallet', 'card'];

const GROUP_LABEL: Record<AssetGroupKey, string> = {
  'cash-bank': 'Tunai & rekening',
  'e-wallet': 'E-wallet',
  card: 'Kartu',
};

interface AssetGroup {
  label: string;
  assets: AssetWithBalance[];
}

function groupByKind(assets: AssetWithBalance[]): AssetGroup[] {
  const groups = new Map<AssetGroupKey, AssetWithBalance[]>();
  for (const asset of assets) {
    const key = GROUP_KEY_BY_ASSET_KIND[asset.kind];
    groups.set(key, [...(groups.get(key) ?? []), asset]);
  }
  return GROUP_ORDER.filter((key) => groups.has(key)).map((key) => ({
    label: GROUP_LABEL[key],
    assets: groups.get(key)!,
  }));
}

export default function AssetsScreen() {
  const ledger = useLedger();
  const [assets, setAssets] = useState<AssetWithBalance[] | null>(null);
  const [totalWealth, setTotalWealth] = useState(0);

  const load = useCallback(() => {
    let cancelled = false;
    Promise.all([ledger.listAssets(), ledger.getTotalWealth()]).then(([loadedAssets, wealth]) => {
      if (cancelled) return;
      setAssets(loadedAssets);
      setTotalWealth(wealth);
    });
    return () => {
      cancelled = true;
    };
  }, [ledger]);

  useFocusEffect(load);

  const groups = groupByKind(assets ?? []);

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-md pt-xs">
        <Text className="mb-sm text-center font-display text-title-lg font-bold text-ink">Aset</Text>

        <View className="mb-sm rounded-lg border-3 border-frame bg-fill-2 px-sm py-sm">
          <Text className="text-caption-uppercase text-muted">Total kekayaan</Text>
          <Text className="font-display text-title-lg font-bold text-ink tabular-nums">{formatRupiah(totalWealth)}</Text>
        </View>

        <FlatList
          data={groups}
          keyExtractor={(group) => group.label}
          renderItem={({ item: group }) => (
            <View className="mb-sm">
              <Text className="mb-xxs rounded-xs bg-fill-2 px-xs py-xxs text-caption-uppercase font-bold tracking-wide text-muted">
                {group.label}
              </Text>
              <View className="overflow-hidden rounded-lg border-3 border-frame">
                {group.assets.map((asset) => (
                  <Pressable
                    key={asset.id}
                    onPress={() => router.push({ pathname: '/manage-asset', params: { id: asset.id } })}
                    className={`flex-row items-center justify-between border-b border-fill bg-card px-sm py-sm ${
                      asset.active ? '' : 'opacity-50'
                    }`}>
                    <View className="flex-row items-center gap-xs">
                      <Text className="text-body-md text-ink">{asset.name}</Text>
                      {!asset.active && (
                        <Text className="rounded-pill bg-fill px-xs py-xxs text-caption text-muted">nonaktif</Text>
                      )}
                    </View>
                    <Text className="text-title-sm font-semibold text-ink tabular-nums">{formatRupiah(asset.balance)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <Pressable
          onPress={() => router.push('/manage-asset')}
          className="mb-lg items-center rounded-lg border-3 border-dashed border-line py-sm">
          <Text className="text-button font-bold text-muted">+ Tambah Aset</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
