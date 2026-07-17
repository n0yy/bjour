import { describe, expect, it } from 'bun:test';

import { createLedger } from '@/domain/ledger';
import { createMemoryStorage } from '@/domain/storage/memory-storage';

function makeLedger(now: () => string = () => '2026-07-16T10:00:00.000Z') {
  return createLedger(createMemoryStorage(), now);
}

describe('Ledger facade — getCalendarTotals', () => {
  it('returns nothing for a month with no transactions', async () => {
    const ledger = makeLedger();
    expect(await ledger.getCalendarTotals(2026, 7)).toEqual([]);
  });

  it('groups income and expense per date, sorted ascending', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();
    const [incomeCategory] = await ledger.listIncomeCategories();

    await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-07-16' });
    await ledger.recordExpense({ amount: 150_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-07-16' });
    await ledger.recordIncome({ amount: 8_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-07-15' });

    expect(await ledger.getCalendarTotals(2026, 7)).toEqual([
      { date: '2026-07-15', income: 8_000_000, expense: 0 },
      { date: '2026-07-16', income: 0, expense: 185_000 },
    ]);
  });

  it('excludes transfers entirely', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 2_000_000 });

    await ledger.recordTransfer({ amount: 500_000, fromAssetId: bca.id, toAssetId: cash.id, date: '2026-07-16' });

    expect(await ledger.getCalendarTotals(2026, 7)).toEqual([]);
  });

  it('handles a month with transactions only on its boundary dates', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();

    await ledger.recordExpense({ amount: 10_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-07-01' });
    await ledger.recordExpense({ amount: 20_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-07-31' });
    await ledger.recordExpense({ amount: 99_999, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-06-30' });
    await ledger.recordExpense({ amount: 99_999, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-08-01' });

    expect(await ledger.getCalendarTotals(2026, 7)).toEqual([
      { date: '2026-07-01', income: 0, expense: 10_000 },
      { date: '2026-07-31', income: 0, expense: 20_000 },
    ]);
  });
});
