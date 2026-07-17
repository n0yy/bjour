import { describe, expect, it } from 'bun:test';

import { createLedger } from '@/domain/ledger';
import { createMemoryStorage } from '@/domain/storage/memory-storage';
import type { Asset } from '@/domain/types';

function makeLedger(now: () => string = () => '2026-07-16T10:00:00.000Z') {
  const storage = createMemoryStorage();
  return { ledger: createLedger(storage, now), storage };
}

async function addAsset(storage: ReturnType<typeof createMemoryStorage>, overrides: Partial<Asset>): Promise<Asset> {
  const asset: Asset = {
    id: overrides.id ?? crypto.randomUUID(),
    name: 'Rekening BCA',
    kind: 'bank',
    openingBalance: 0,
    active: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
  await storage.insertAsset(asset);
  return asset;
}

describe('Ledger facade — income, transfer, balances', () => {
  it('increases the asset balance when recording income', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listIncomeCategories();

    await ledger.recordIncome({ amount: 8_000_000, assetId: cash.id, categoryId: category.id, date: '2026-07-15' });

    const [asset] = await ledger.listAssets();
    expect(asset.balance).toBe(8_000_000);
  });

  it('decreases the asset balance when recording an expense', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();

    await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    const [asset] = await ledger.listAssets();
    expect(asset.balance).toBe(-35_000);
  });

  it('folds each asset opening balance into its computed balance', async () => {
    const { ledger, storage } = makeLedger();
    await addAsset(storage, { id: 'bca', openingBalance: 1_000_000 });

    const [asset] = await ledger.listAssets();
    expect(asset.balance).toBe(1_000_000);
  });

  it('moves the balance from one asset to another on transfer, leaving total wealth unchanged', async () => {
    const { ledger, storage } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await addAsset(storage, { id: 'bca', openingBalance: 2_000_000 });

    const wealthBefore = await ledger.getTotalWealth();

    await ledger.recordTransfer({ amount: 500_000, fromAssetId: bca.id, toAssetId: cash.id, date: '2026-07-16' });

    const assets = await ledger.listAssets();
    expect(assets.find((a) => a.id === bca.id)?.balance).toBe(1_500_000);
    expect(assets.find((a) => a.id === cash.id)?.balance).toBe(500_000);
    expect(await ledger.getTotalWealth()).toBe(wealthBefore);
  });

  it('rejects a transfer to the same asset', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();

    await expect(
      ledger.recordTransfer({ amount: 10_000, fromAssetId: cash.id, toAssetId: cash.id, date: '2026-07-16' }),
    ).rejects.toThrow();
  });

  it('excludes transfers from the daily subtotal (shown neutral)', async () => {
    const { ledger, storage } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await addAsset(storage, { id: 'bca', openingBalance: 2_000_000 });

    await ledger.recordTransfer({ amount: 500_000, fromAssetId: bca.id, toAssetId: cash.id, date: '2026-07-16' });

    const [group] = await ledger.listDailyGroups(2026, 7);
    expect(group.subtotal).toBe(0);
    expect(group.transactions).toHaveLength(1);
  });

  it('sums every asset balance into total wealth', async () => {
    const { ledger, storage } = makeLedger();
    await ledger.seedIfNeeded();
    await addAsset(storage, { id: 'bca', openingBalance: 11_870_000 });
    await addAsset(storage, { id: 'gopay', name: 'GoPay', kind: 'e-wallet', openingBalance: 450_000 });

    expect(await ledger.getTotalWealth()).toBe(11_870_000 + 450_000);
  });

  it('defaults the next quick-entry to the most recently used asset', async () => {
    const { ledger, storage } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await addAsset(storage, { id: 'bca', openingBalance: 0 });
    const [category] = await ledger.listExpenseCategories();

    await ledger.recordExpense({ amount: 20_000, assetId: bca.id, categoryId: category.id, date: '2026-07-10' });

    const nextDefault = await ledger.getDefaultAsset();
    expect(nextDefault.id).toBe(bca.id);
    expect(nextDefault.id).not.toBe(cash.id);
  });
});
