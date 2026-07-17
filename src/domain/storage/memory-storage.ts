import type { Asset, Category, LocalDate, Transaction } from '@/domain/types';

import type { LedgerStorage } from './types';

export function createMemoryStorage(): LedgerStorage {
  const assets: Asset[] = [];
  const categories: Category[] = [];
  const transactions: Transaction[] = [];

  return {
    async listAssets() {
      return [...assets];
    },
    async insertAsset(asset: Asset) {
      assets.push(asset);
    },
    async listCategories() {
      return [...categories];
    },
    async insertCategory(category: Category) {
      categories.push(category);
    },
    async insertTransaction(transaction: Transaction) {
      transactions.push(transaction);
    },
    async listTransactionsByDateRange(start: LocalDate, end: LocalDate) {
      return transactions.filter((t) => t.date >= start && t.date <= end);
    },
    async listAllTransactions() {
      return [...transactions];
    },
    async getMostRecentTransaction() {
      if (transactions.length === 0) return null;
      return transactions.reduce((latest, t) => (t.createdAt > latest.createdAt ? t : latest));
    },
  };
}
