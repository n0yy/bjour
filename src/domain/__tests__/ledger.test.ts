import { describe, expect, it } from 'bun:test';

import { createLedger } from '@/domain/ledger';
import { createMemoryStorage } from '@/domain/storage/memory-storage';

function makeLedger(now: () => string = () => '2026-07-16T10:00:00.000Z') {
  return createLedger(createMemoryStorage(), now);
}

describe('Ledger facade', () => {
  it('has nothing to show before seeding', async () => {
    const ledger = makeLedger();
    expect(await ledger.listDailyGroups(2026, 7)).toEqual([]);
  });

  it('seeds a default Tunai asset and Indonesian expense categories on first use', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();

    const asset = await ledger.getDefaultAsset();
    expect(asset.name).toBe('Tunai');

    const categories = await ledger.listExpenseCategories();
    expect(categories.some((c) => c.name === 'Makanan')).toBe(true);
  });

  it('is idempotent — seeding twice does not duplicate the default asset', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    await ledger.seedIfNeeded();

    const asset = await ledger.getDefaultAsset();
    expect(asset.name).toBe('Tunai');
  });

  it('records an expense and surfaces it in that day-s group with a negative subtotal', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();

    await ledger.recordExpense({
      amount: 35_000,
      assetId: cash.id,
      categoryId: category.id,
      date: '2026-07-16',
    });

    const groups = await ledger.listDailyGroups(2026, 7);
    expect(groups).toHaveLength(1);
    expect(groups[0].date).toBe('2026-07-16');
    expect(groups[0].subtotal).toBe(-35_000);
    expect(groups[0].transactions).toHaveLength(1);
    expect(groups[0].transactions[0].amount).toBe(35_000);
  });

  it('groups multiple expenses on the same day under one subtotal', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();

    await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });
    await ledger.recordExpense({ amount: 150_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    const groups = await ledger.listDailyGroups(2026, 7);
    expect(groups).toHaveLength(1);
    expect(groups[0].subtotal).toBe(-185_000);
    expect(groups[0].transactions).toHaveLength(2);
  });

  it('orders groups by date descending, most recent day first', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();

    await ledger.recordExpense({ amount: 10_000, assetId: cash.id, categoryId: category.id, date: '2026-07-03' });
    await ledger.recordExpense({ amount: 20_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    const groups = await ledger.listDailyGroups(2026, 7);
    expect(groups.map((g) => g.date)).toEqual(['2026-07-16', '2026-07-03']);
  });

  it('keeps a transaction dated 31 January out of the February groups', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();

    await ledger.recordExpense({ amount: 10_000, assetId: cash.id, categoryId: category.id, date: '2026-01-31' });
    await ledger.recordExpense({ amount: 20_000, assetId: cash.id, categoryId: category.id, date: '2026-02-01' });

    expect(await ledger.listDailyGroups(2026, 1)).toHaveLength(1);
    expect((await ledger.listDailyGroups(2026, 1))[0].date).toBe('2026-01-31');
    expect(await ledger.listDailyGroups(2026, 2)).toHaveLength(1);
    expect((await ledger.listDailyGroups(2026, 2))[0].date).toBe('2026-02-01');
  });

  it('keeps full precision for an expense in the hundreds of millions', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();

    await ledger.recordExpense({ amount: 350_000_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    const groups = await ledger.listDailyGroups(2026, 7);
    expect(groups[0].transactions[0].amount).toBe(350_000_000);
    expect(groups[0].subtotal).toBe(-350_000_000);
  });
});
