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

describe('Ledger facade — edit & delete transactions', () => {
  it('corrects the asset balance when an expense amount is edited', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();
    const tx = await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    await ledger.updateTransaction(tx.id, {
      kind: 'expense',
      amount: 50_000,
      assetId: cash.id,
      categoryId: category.id,
      date: '2026-07-16',
    });

    const [asset] = await ledger.listAssets();
    expect(asset.balance).toBe(-50_000);
  });

  it('moves an expense to a different asset, correcting both balances', async () => {
    const { ledger, storage } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await addAsset(storage, { id: 'bca' });
    const [category] = await ledger.listExpenseCategories();
    const tx = await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    await ledger.updateTransaction(tx.id, {
      kind: 'expense',
      amount: 35_000,
      assetId: bca.id,
      categoryId: category.id,
      date: '2026-07-16',
    });

    const assets = await ledger.listAssets();
    expect(assets.find((a) => a.id === cash.id)?.balance).toBe(0);
    expect(assets.find((a) => a.id === bca.id)?.balance).toBe(-35_000);
  });

  it('edits the category and note of an expense independently of amount/asset/date', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [foodCategory, transportCategory] = await ledger.listExpenseCategories();
    const tx = await ledger.recordExpense({
      amount: 35_000,
      assetId: cash.id,
      categoryId: foodCategory.id,
      date: '2026-07-16',
      note: 'Makan siang',
    });

    const updated = await ledger.updateTransaction(tx.id, {
      kind: 'expense',
      amount: 35_000,
      assetId: cash.id,
      categoryId: transportCategory.id,
      date: '2026-07-16',
      note: 'Naik taksi',
    });

    expect(updated.categoryId).toBe(transportCategory.id);
    expect(updated.note).toBe('Naik taksi');
    const [group] = await ledger.listDailyGroups(2026, 7);
    expect(group.transactions[0].categoryId).toBe(transportCategory.id);
  });

  it('switches an expense into a transfer without deleting and recreating it', async () => {
    const { ledger, storage } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await addAsset(storage, { id: 'bca' });
    const [category] = await ledger.listExpenseCategories();
    const tx = await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    const updated = await ledger.updateTransaction(tx.id, {
      kind: 'transfer',
      amount: 35_000,
      fromAssetId: cash.id,
      toAssetId: bca.id,
      date: '2026-07-16',
    });

    expect(updated.id).toBe(tx.id);
    expect(updated.kind).toBe('transfer');
    expect(updated.categoryId).toBeNull();

    const assets = await ledger.listAssets();
    expect(assets.find((a) => a.id === cash.id)?.balance).toBe(-35_000);
    expect(assets.find((a) => a.id === bca.id)?.balance).toBe(35_000);
  });

  it('corrects both the old and new destination asset balances when editing a transfer', async () => {
    const { ledger, storage } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await addAsset(storage, { id: 'bca' });
    const gopay = await addAsset(storage, { id: 'gopay', name: 'GoPay', kind: 'e-wallet' });
    const tx = await ledger.recordTransfer({ amount: 100_000, fromAssetId: cash.id, toAssetId: bca.id, date: '2026-07-16' });

    await ledger.updateTransaction(tx.id, {
      kind: 'transfer',
      amount: 100_000,
      fromAssetId: cash.id,
      toAssetId: gopay.id,
      date: '2026-07-16',
    });

    const assets = await ledger.listAssets();
    expect(assets.find((a) => a.id === bca.id)?.balance).toBe(0);
    expect(assets.find((a) => a.id === gopay.id)?.balance).toBe(100_000);
    expect(assets.find((a) => a.id === cash.id)?.balance).toBe(-100_000);
  });

  it('rejects editing a transfer to the same source and destination asset', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();
    const tx = await ledger.recordExpense({ amount: 10_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    await expect(
      ledger.updateTransaction(tx.id, {
        kind: 'transfer',
        amount: 10_000,
        fromAssetId: cash.id,
        toAssetId: cash.id,
        date: '2026-07-16',
      }),
    ).rejects.toThrow();
  });

  it('moves a transaction to the correct month group when its date is edited across a month boundary', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();
    const tx = await ledger.recordExpense({ amount: 10_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    await ledger.updateTransaction(tx.id, {
      kind: 'expense',
      amount: 10_000,
      assetId: cash.id,
      categoryId: category.id,
      date: '2026-06-30',
    });

    expect(await ledger.listDailyGroups(2026, 7)).toEqual([]);
    const june = await ledger.listDailyGroups(2026, 6);
    expect(june).toHaveLength(1);
    expect(june[0].date).toBe('2026-06-30');
  });

  it('removes the transaction and reverts its effect on the asset balance when deleted', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();
    const tx = await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    await ledger.deleteTransaction(tx.id);

    const [asset] = await ledger.listAssets();
    expect(asset.balance).toBe(0);
    expect(await ledger.listDailyGroups(2026, 7)).toEqual([]);
    expect(await ledger.getTransaction(tx.id)).toBeNull();
  });

  it('returns null for a transaction that does not exist', async () => {
    const { ledger } = makeLedger();
    expect(await ledger.getTransaction('does-not-exist')).toBeNull();
  });
});
