import { describe, expect, it } from 'bun:test';

import { createLedger } from '@/domain/ledger';
import { createMemoryStorage } from '@/domain/storage/memory-storage';

function makeLedger(now: () => string = () => '2026-07-16T10:00:00.000Z') {
  const storage = createMemoryStorage();
  return { ledger: createLedger(storage, now), storage };
}

describe('Ledger facade — manage categories', () => {
  it('adds a new top-level category', async () => {
    const { ledger } = makeLedger();
    const category = await ledger.addCategory({ name: 'Hobi', direction: 'expense' });

    expect(await ledger.listExpenseCategories()).toContainEqual(category);
  });

  it('adds a subcategory nested under a parent', async () => {
    const { ledger } = makeLedger();
    const food = await ledger.addCategory({ name: 'Makanan', direction: 'expense' });
    const eatOut = await ledger.addCategory({ name: 'Makan luar', direction: 'expense', parentId: food.id });

    const tree = await ledger.listCategoryTree('expense');
    const foodGroup = tree.find((g) => g.parent.id === food.id);
    expect(foodGroup?.children.map((c) => c.id)).toEqual([eatOut.id]);
  });

  it('separates the category tree by direction', async () => {
    const { ledger } = makeLedger();
    await ledger.addCategory({ name: 'Makanan', direction: 'expense' });
    await ledger.addCategory({ name: 'Gaji', direction: 'income' });

    expect((await ledger.listCategoryTree('expense')).map((g) => g.parent.name)).toEqual(['Makanan']);
    expect((await ledger.listCategoryTree('income')).map((g) => g.parent.name)).toEqual(['Gaji']);
  });

  it('renames a category, including a seeded one', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const [seeded] = await ledger.listExpenseCategories();

    const renamed = await ledger.renameCategory(seeded.id, 'Makan & Minum');

    expect(renamed.name).toBe('Makan & Minum');
    expect((await ledger.listExpenseCategories()).find((c) => c.id === seeded.id)?.name).toBe('Makan & Minum');
  });

  it('deactivating a category removes it from the active tree but keeps it on old transactions', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();
    await ledger.recordExpense({ amount: 20_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    await ledger.setCategoryActive(category.id, false);

    expect((await ledger.listExpenseCategories()).map((c) => c.id)).not.toContain(category.id);
    const [group] = await ledger.listDailyGroups(2026, 7);
    expect(group.transactions[0].categoryId).toBe(category.id);
  });

  it('excludes inactive categories from the tree by default but can include them', async () => {
    const { ledger } = makeLedger();
    const food = await ledger.addCategory({ name: 'Makanan', direction: 'expense' });
    await ledger.setCategoryActive(food.id, false);

    expect(await ledger.listCategoryTree('expense')).toEqual([]);
    const withInactive = await ledger.listCategoryTree('expense', { includeInactive: true });
    expect(withInactive.map((g) => g.parent.id)).toEqual([food.id]);
  });

  it('rejects deleting a category that has been used by a transaction', async () => {
    const { ledger } = makeLedger();
    await ledger.seedIfNeeded();
    const cash = await ledger.getDefaultAsset();
    const [category] = await ledger.listExpenseCategories();
    await ledger.recordExpense({ amount: 20_000, assetId: cash.id, categoryId: category.id, date: '2026-07-16' });

    expect(await ledger.isCategoryInUse(category.id)).toBe(true);
    await expect(ledger.deleteCategory(category.id)).rejects.toThrow();
  });

  it('rejects deleting a category that still has subcategories', async () => {
    const { ledger } = makeLedger();
    const food = await ledger.addCategory({ name: 'Makanan', direction: 'expense' });
    await ledger.addCategory({ name: 'Makan luar', direction: 'expense', parentId: food.id });

    await expect(ledger.deleteCategory(food.id)).rejects.toThrow();
  });

  it('permanently deletes a category that has never been used', async () => {
    const { ledger } = makeLedger();
    const hobby = await ledger.addCategory({ name: 'Hobi', direction: 'expense' });

    await ledger.deleteCategory(hobby.id);

    expect((await ledger.listExpenseCategories()).map((c) => c.id)).not.toContain(hobby.id);
  });
});
