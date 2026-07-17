import { describe, expect, it } from 'bun:test';

import { createLedger } from '@/domain/ledger';
import { createMemoryStorage } from '@/domain/storage/memory-storage';

function makeLedger(now: () => string = () => '2026-07-16T10:00:00.000Z') {
  return createLedger(createMemoryStorage(), now);
}

describe('Ledger facade — getMonthlySummary', () => {
  it('returns zeroes for a month with no transactions', async () => {
    const ledger = makeLedger();
    expect(await ledger.getMonthlySummary(2026, 7)).toEqual({ income: 0, expense: 0, net: 0 });
  });

  it('sums income and expense separately and computes net', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();
    const [incomeCategory] = await ledger.listIncomeCategories();

    await ledger.recordIncome({ amount: 8_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-07-15' });
    await ledger.recordExpense({ amount: 35_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-07-16' });
    await ledger.recordExpense({ amount: 150_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-07-16' });

    expect(await ledger.getMonthlySummary(2026, 7)).toEqual({ income: 8_000_000, expense: 185_000, net: 7_815_000 });
  });

  it('excludes transfers from both income and expense totals', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const bca = await ledger.addAsset({ name: 'Rekening BCA', kind: 'bank', openingBalance: 2_000_000 });

    await ledger.recordTransfer({ amount: 500_000, fromAssetId: bca.id, toAssetId: cash.id, date: '2026-07-16' });

    expect(await ledger.getMonthlySummary(2026, 7)).toEqual({ income: 0, expense: 0, net: 0 });
  });

  it('keeps a transaction dated 31 January out of the February summary', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();

    await ledger.recordExpense({ amount: 10_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-01-31' });
    await ledger.recordExpense({ amount: 20_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-02-01' });

    expect(await ledger.getMonthlySummary(2026, 1)).toEqual({ income: 0, expense: 10_000, net: -10_000 });
    expect(await ledger.getMonthlySummary(2026, 2)).toEqual({ income: 0, expense: 20_000, net: -20_000 });
  });

  it('keeps income dated 31 January out of the February summary', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [incomeCategory] = await ledger.listIncomeCategories();

    await ledger.recordIncome({ amount: 5_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-01-31' });
    await ledger.recordIncome({ amount: 1_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-02-01' });

    expect(await ledger.getMonthlySummary(2026, 1)).toEqual({ income: 5_000_000, expense: 0, net: 5_000_000 });
    expect(await ledger.getMonthlySummary(2026, 2)).toEqual({ income: 1_000_000, expense: 0, net: 1_000_000 });
  });

  it('computes a negative net when expenses exceed income', async () => {
    const ledger = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();
    const [incomeCategory] = await ledger.listIncomeCategories();

    await ledger.recordIncome({ amount: 1_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-07-01' });
    await ledger.recordExpense({ amount: 1_500_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-07-02' });

    expect(await ledger.getMonthlySummary(2026, 7)).toEqual({ income: 1_000_000, expense: 1_500_000, net: -500_000 });
  });
});
