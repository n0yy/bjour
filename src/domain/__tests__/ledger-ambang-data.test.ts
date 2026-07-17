import { describe, expect, it } from 'bun:test';

import { createLedger, DEFAULT_AMBANG_DATA_CONFIG } from '@/domain/ledger';
import { createMemoryStorage } from '@/domain/storage/memory-storage';

function makeLedger(now: () => string) {
  return createLedger(createMemoryStorage(), now);
}

describe('Ledger facade — getAmbangDataStatus', () => {
  it('is unmet with zero progress when the Ledger is empty', async () => {
    const ledger = makeLedger(() => '2026-07-16T10:00:00.000Z');
    expect(await ledger.getAmbangDataStatus()).toEqual({
      daysSinceFirstTransaction: 0,
      requiredDays: 30,
      hasMinIncome: false,
      weeksWithActivity: 0,
      totalWeeksElapsed: 0,
      hasRegularActivity: false,
      isMet: false,
    });
  });

  it('counts days since the first transaction using the current clock, not the transaction date', async () => {
    const storage = createMemoryStorage();
    const seedLedger = createLedger(storage, () => '2026-07-01T00:00:00.000Z');
    await seedLedger.seedIfNeeded();
    const cash = await seedLedger.getDefaultAsset();
    const [category] = await seedLedger.listExpenseCategories();
    await seedLedger.recordExpense({ amount: 10_000, assetId: cash.id, categoryId: category.id, date: '2026-07-01' });

    const laterLedger = createLedger(storage, () => '2026-07-15T00:00:00.000Z');
    const status = await laterLedger.getAmbangDataStatus();
    expect(status.daysSinceFirstTransaction).toBe(15);
  });

  it('is not met before 30 days have elapsed, even with income and weekly activity', async () => {
    const ledger = makeLedger(() => '2026-07-15T00:00:00.000Z');
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [incomeCategory] = await ledger.listIncomeCategories();
    await ledger.recordIncome({ amount: 8_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-07-01' });

    const status = await ledger.getAmbangDataStatus();
    expect(status.daysSinceFirstTransaction).toBe(15);
    expect(status.hasMinIncome).toBe(true);
    expect(status.isMet).toBe(false);
  });

  it('requires at least the configured minimum income transactions', async () => {
    const ledger = makeLedger(() => '2026-08-05T00:00:00.000Z');
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();
    for (let day = 1; day <= 31; day++) {
      await ledger.recordExpense({
        amount: 10_000,
        assetId: cash.id,
        categoryId: expenseCategory.id,
        date: `2026-07-${String(day).padStart(2, '0')}`,
      });
    }

    const status = await ledger.getAmbangDataStatus();
    expect(status.daysSinceFirstTransaction).toBeGreaterThanOrEqual(30);
    expect(status.hasMinIncome).toBe(false);
    expect(status.isMet).toBe(false);
  });

  it('is met once days, income, and weekly regularity are all satisfied', async () => {
    const ledger = makeLedger(() => '2026-08-05T00:00:00.000Z');
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();
    const [incomeCategory] = await ledger.listIncomeCategories();

    // Records at least once a week for the whole span, plus one income.
    for (let day = 1; day <= 31; day += 5) {
      await ledger.recordExpense({
        amount: 10_000,
        assetId: cash.id,
        categoryId: expenseCategory.id,
        date: `2026-07-${String(day).padStart(2, '0')}`,
      });
    }
    await ledger.recordIncome({ amount: 8_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-07-01' });

    const status = await ledger.getAmbangDataStatus();
    expect(status.hasRegularActivity).toBe(true);
    expect(status.isMet).toBe(true);
  });

  it('fails the weekly-regularity requirement when activity is too sparse', async () => {
    const ledger = makeLedger(() => '2026-09-10T00:00:00.000Z');
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [expenseCategory] = await ledger.listExpenseCategories();
    const [incomeCategory] = await ledger.listIncomeCategories();

    // Only two entries across a ~10-week span since the first transaction.
    await ledger.recordIncome({ amount: 8_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-07-01' });
    await ledger.recordExpense({ amount: 10_000, assetId: cash.id, categoryId: expenseCategory.id, date: '2026-09-01' });

    const status = await ledger.getAmbangDataStatus();
    expect(status.daysSinceFirstTransaction).toBeGreaterThanOrEqual(DEFAULT_AMBANG_DATA_CONFIG.requiredDays);
    expect(status.hasMinIncome).toBe(true);
    expect(status.hasRegularActivity).toBe(false);
    expect(status.isMet).toBe(false);
  });

  it('honors a custom config instead of hardcoded thresholds', async () => {
    const ledger = makeLedger(() => '2026-07-05T00:00:00.000Z');
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [incomeCategory] = await ledger.listIncomeCategories();
    await ledger.recordIncome({ amount: 1_000_000, assetId: cash.id, categoryId: incomeCategory.id, date: '2026-07-01' });

    const status = await ledger.getAmbangDataStatus({ requiredDays: 5, minIncomeCount: 1, minActiveWeekRatio: 0.5 });
    expect(status.daysSinceFirstTransaction).toBe(5);
    expect(status.isMet).toBe(true);
  });
});
