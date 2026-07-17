import { describe, expect, it } from 'bun:test';

import type { Asset, Category, Transaction } from '@/domain/types';

import type { LedgerStorage } from '../types';

const now = '2026-07-16T10:00:00.000Z';

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'asset-cash',
    name: 'Tunai',
    kind: 'cash',
    openingBalance: 0,
    active: true,
    createdAt: now,
    ...overrides,
  };
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-food',
    name: 'Makanan',
    direction: 'expense',
    parentId: null,
    active: true,
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    kind: 'expense',
    amount: 35_000,
    date: '2026-07-16',
    assetId: 'asset-cash',
    toAssetId: null,
    categoryId: 'cat-food',
    note: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Runs the same contract against any LedgerStorage implementation — every
 * adapter (in-memory, SQLite) must pass this suite identically.
 */
export function runStorageContractTests(createStorage: () => Promise<LedgerStorage>) {
  describe('assets', () => {
    it('starts empty', async () => {
      const storage = await createStorage();
      expect(await storage.listAssets()).toEqual([]);
    });

    it('round-trips an inserted asset, including the active flag', async () => {
      const storage = await createStorage();
      await storage.insertAsset(makeAsset({ active: false }));

      const assets = await storage.listAssets();
      expect(assets).toEqual([makeAsset({ active: false })]);
    });
  });

  describe('categories', () => {
    it('round-trips an inserted category, including a null parentId', async () => {
      const storage = await createStorage();
      await storage.insertCategory(makeCategory());

      expect(await storage.listCategories()).toEqual([makeCategory()]);
    });

    it('round-trips a subcategory with a non-null parentId', async () => {
      const storage = await createStorage();
      await storage.insertCategory(makeCategory());
      await storage.insertCategory(
        makeCategory({ id: 'cat-food-eatout', name: 'Makan luar', parentId: 'cat-food' }),
      );

      const categories = await storage.listCategories();
      expect(categories).toHaveLength(2);
      expect(categories.find((c) => c.id === 'cat-food-eatout')?.parentId).toBe('cat-food');
    });
  });

  describe('transactions', () => {
    it('round-trips an inserted transaction', async () => {
      const storage = await createStorage();
      await storage.insertAsset(makeAsset());
      await storage.insertCategory(makeCategory());
      await storage.insertTransaction(makeTransaction());

      const transactions = await storage.listTransactionsByDateRange('2026-07-01', '2026-07-31');
      expect(transactions).toEqual([makeTransaction()]);
    });

    it('keeps precision for amounts in the hundreds of millions', async () => {
      const storage = await createStorage();
      await storage.insertAsset(makeAsset());
      await storage.insertCategory(makeCategory());
      await storage.insertTransaction(makeTransaction({ id: 'tx-big', amount: 350_000_000 }));

      const [transaction] = await storage.listTransactionsByDateRange('2026-07-01', '2026-07-31');
      expect(transaction.amount).toBe(350_000_000);
    });

    it('filters by date range inclusively on both ends', async () => {
      const storage = await createStorage();
      await storage.insertAsset(makeAsset());
      await storage.insertCategory(makeCategory());
      await storage.insertTransaction(makeTransaction({ id: 'tx-in-start', date: '2026-07-01' }));
      await storage.insertTransaction(makeTransaction({ id: 'tx-in-end', date: '2026-07-31' }));
      await storage.insertTransaction(makeTransaction({ id: 'tx-before', date: '2026-06-30' }));
      await storage.insertTransaction(makeTransaction({ id: 'tx-after', date: '2026-08-01' }));

      const transactions = await storage.listTransactionsByDateRange('2026-07-01', '2026-07-31');
      const ids = transactions.map((t) => t.id).sort();
      expect(ids).toEqual(['tx-in-end', 'tx-in-start']);
    });

    it('does not leak a transaction dated the last day of a month into the next month', async () => {
      const storage = await createStorage();
      await storage.insertAsset(makeAsset());
      await storage.insertCategory(makeCategory());
      await storage.insertTransaction(makeTransaction({ id: 'tx-jan-31', date: '2026-01-31' }));
      await storage.insertTransaction(makeTransaction({ id: 'tx-feb-01', date: '2026-02-01' }));

      const january = await storage.listTransactionsByDateRange('2026-01-01', '2026-01-31');
      expect(january.map((t) => t.id)).toEqual(['tx-jan-31']);
    });

    it('round-trips a transfer with a toAssetId and no category', async () => {
      const storage = await createStorage();
      await storage.insertAsset(makeAsset({ id: 'asset-bca', name: 'Rekening BCA', kind: 'bank' }));
      await storage.insertAsset(makeAsset());
      await storage.insertTransaction(
        makeTransaction({
          id: 'tx-transfer',
          kind: 'transfer',
          assetId: 'asset-bca',
          toAssetId: 'asset-cash',
          categoryId: null,
          amount: 500_000,
        }),
      );

      const [transaction] = await storage.listTransactionsByDateRange('2026-07-01', '2026-07-31');
      expect(transaction.toAssetId).toBe('asset-cash');
      expect(transaction.categoryId).toBeNull();
    });
  });
}
