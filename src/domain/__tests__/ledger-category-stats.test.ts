import { describe, expect, it } from 'bun:test';

import { createLedger } from '@/domain/ledger';
import { createMemoryStorage } from '@/domain/storage/memory-storage';

function makeLedger(now: () => string = () => '2026-07-16T10:00:00.000Z') {
  return createLedger(createMemoryStorage(), now);
}

describe('Ledger facade — getCategoryStats', () => {
  it('returns nothing for an empty month', async () => {
    const ledger = makeLedger();
    expect(await ledger.getCategoryStats(2026, 7, 'expense')).toEqual([]);
  });

  it('sums per top-level category with correct percentages', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const categories = await ledger.listExpenseCategories();
    const food = categories.find((c) => c.name === 'Makanan')!;
    const transport = categories.find((c) => c.name === 'Transportasi')!;

    await ledger.recordExpense({ amount: 3_000_000, assetId: cash.id, categoryId: food.id, date: '2026-07-10' });
    await ledger.recordExpense({ amount: 1_000_000, assetId: cash.id, categoryId: transport.id, date: '2026-07-11' });

    const stats = await ledger.getCategoryStats(2026, 7, 'expense');
    expect(stats).toEqual([
      { categoryId: food.id, name: 'Makanan', total: 3_000_000, percentage: 75 },
      { categoryId: transport.id, name: 'Transportasi', total: 1_000_000, percentage: 25 },
    ]);
  });

  it('rolls up subcategory spending into its parent', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const categories = await ledger.listExpenseCategories();
    const food = categories.find((c) => c.name === 'Makanan')!;
    const eatOut = await ledger.addCategory({ name: 'Makan luar', direction: 'expense', parentId: food.id });

    await ledger.recordExpense({ amount: 100_000, assetId: cash.id, categoryId: food.id, date: '2026-07-10' });
    await ledger.recordExpense({ amount: 50_000, assetId: cash.id, categoryId: eatOut.id, date: '2026-07-11' });

    const stats = await ledger.getCategoryStats(2026, 7, 'expense');
    expect(stats).toEqual([{ categoryId: food.id, name: 'Makanan', total: 150_000, percentage: 100 }]);
  });

  it('keeps expense and income statistics separate', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();
    const [incomeCategory] = await ledger.listIncomeCategories();

    await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-07-10' });
    await ledger.recordIncome({ amount: 8_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-07-11' });

    expect(await ledger.getCategoryStats(2026, 7, 'expense')).toEqual([
      { categoryId: expenseCategory.id, name: expenseCategory.name, total: 35_000, percentage: 100 },
    ]);
    expect(await ledger.getCategoryStats(2026, 7, 'income')).toEqual([
      { categoryId: incomeCategory.id, name: incomeCategory.name, total: 8_000_000, percentage: 100 },
    ]);
  });

  it('never includes transfers', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 2_000_000 });

    await ledger.recordTransfer({ amount: 500_000, fromAssetId: bca.id, toAssetId: cash.id, date: '2026-07-16' });

    expect(await ledger.getCategoryStats(2026, 7, 'expense')).toEqual([]);
    expect(await ledger.getCategoryStats(2026, 7, 'income')).toEqual([]);
  });
});

describe('Ledger facade — listTransactionsForCategory', () => {
  it('includes both a category and its subcategory transactions', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const categories = await ledger.listExpenseCategories();
    const food = categories.find((c) => c.name === 'Makanan')!;
    const eatOut = await ledger.addCategory({ name: 'Makan luar', direction: 'expense', parentId: food.id });

    const parentTx = await ledger.recordExpense({ amount: 100_000, assetId: cash.id, categoryId: food.id, date: '2026-07-10' });
    const childTx = await ledger.recordExpense({ amount: 50_000, assetId: cash.id, categoryId: eatOut.id, date: '2026-07-11' });

    const results = await ledger.listTransactionsForCategory(2026, 7, food.id);
    expect(results.map((t) => t.id).sort()).toEqual([childTx.id, parentTx.id].sort());
  });

  it('excludes transactions from unrelated categories', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const categories = await ledger.listExpenseCategories();
    const food = categories.find((c) => c.name === 'Makanan')!;
    const transport = categories.find((c) => c.name === 'Transportasi')!;

    await ledger.recordExpense({ amount: 100_000, assetId: cash.id, categoryId: transport.id, date: '2026-07-10' });

    expect(await ledger.listTransactionsForCategory(2026, 7, food.id)).toEqual([]);
  });
});
