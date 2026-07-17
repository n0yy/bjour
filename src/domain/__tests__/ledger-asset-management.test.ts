import { describe, expect, it } from 'bun:test';

import { createLedger } from '@/domain/ledger';
import { createMemoryStorage } from '@/domain/storage/memory-storage';

function makeLedger(now: () => string = () => '2026-07-16T10:00:00.000Z') {
  const storage = createMemoryStorage();
  return { ledger: createLedger(storage, now), storage };
}

describe('Ledger facade — manage assets', () => {
  it('adds a new asset with an opening balance that counts toward its balance and total wealth', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();

    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 11_870_000 });

    const assets = await ledger.listAssets();
    expect(assets.find((a) => a.id === bca.id)?.balance).toBe(11_870_000);
    expect(await ledger.getTotalWealth()).toBe(11_870_000);
  });

  it('renames and changes the kind of an asset without touching its history', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 1_000_000 });
    const [expenseCategory] = await ledger.listExpenseCategories();
    await ledger.recordExpense({ amount: 50_000, assetId: bca.id, categoryId: expenseCategory.id, date: '2026-07-16' });

    const updated = await ledger.updateAssetDetails(bca.id, { name: 'BCA Tabungan', kind: 'e-wallet' });

    expect(updated.name).toBe('BCA Tabungan');
    expect(updated.kind).toBe('e-wallet');
    const assets = await ledger.listAssets();
    expect(assets.find((a) => a.id === bca.id)?.balance).toBe(950_000);
  });

  it('deactivating an asset removes it from the active picker list but keeps it in listAssets', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 0 });

    await ledger.setAssetActive(bca.id, false);

    const active = await ledger.listActiveAssets();
    expect(active.map((a) => a.id)).toEqual([cash.id]);
    const all = await ledger.listAssets();
    expect(all.map((a) => a.id).sort()).toEqual([bca.id, cash.id].sort());
  });

  it('deactivating an asset does not erase its transaction history or balance', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();
    await ledger.recordExpense({ amount: 20_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    await ledger.setAssetActive(cash.id, false);

    const [asset] = await ledger.listAssets();
    expect(asset.balance).toBe(-20_000);
    expect((await ledger.listDailyGroups(2026, 7))[0].transactions).toHaveLength(1);
  });

  it('excludes deactivated assets from total wealth', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 2_000_000 });

    await ledger.setAssetActive(bca.id, false);

    expect(await ledger.getTotalWealth()).toBe(0);
  });

  it('rejects deleting an asset that has transactions', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();
    await ledger.recordExpense({ amount: 20_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    expect(await ledger.isAssetInUse(cash.id)).toBe(true);
    await expect(ledger.deleteAsset(cash.id)).rejects.toThrow();
  });

  it('permanently deletes an asset that has never been used', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 0 });

    expect(await ledger.isAssetInUse(bca.id)).toBe(false);
    await ledger.deleteAsset(bca.id);

    expect((await ledger.listAssets()).map((a) => a.id)).not.toContain(bca.id);
  });

  it('rejects deleting an asset used only as a transfer destination', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 500_000 });
    await ledger.recordTransfer({ amount: 100_000, fromAssetId: bca.id, toAssetId: cash.id, date: '2026-07-16' });

    await expect(ledger.deleteAsset(cash.id)).rejects.toThrow();
  });
});
