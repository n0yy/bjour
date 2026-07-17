import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
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
      <View className="flex-1 px-4 pt-2">
        <Text className="mb-3 text-center font-display text-lg font-bold text-ink">Aset</Text>

        <View className="mb-3 rounded-xl border-3 border-frame bg-fill-2 px-3 py-3">
          <Text className="text-xs uppercase text-muted">Total kekayaan</Text>
          <Text className="font-display text-2xl font-bold text-ink">{formatRupiah(totalWealth)}</Text>
        </View>

        <FlatList
          data={groups}
          keyExtractor={(group) => group.label}
          renderItem={({ item: group }) => (
            <View className="mb-3">
              <Text className="mb-1 rounded bg-fill-2 px-2 py-1 text-xs font-bold uppercase tracking-wide text-muted">
                {group.label}
              </Text>
              <View className="overflow-hidden rounded-xl border-3 border-frame">
                {group.assets.map((asset) => (
                  <View
                    key={asset.id}
                    className={`flex-row items-center justify-between border-b border-fill bg-card px-3 py-3 ${
                      asset.active ? '' : 'opacity-50'
                    }`}>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-ink">{asset.name}</Text>
                      {!asset.active && (
                        <Text className="rounded-full bg-fill px-2 py-0.5 text-xs text-muted">nonaktif</Text>
                      )}
                    </View>
                    <Text className="font-semibold text-ink">{formatRupiah(asset.balance)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
