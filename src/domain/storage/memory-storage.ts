import type { Asset, Category, LocalDate, Transaction } from '@/domain/types';

import type { LedgerStorage } from './types';

export function createMemoryStorage(): LedgerStorage {
  let assets: Asset[] = [];
  let categories: Category[] = [];
  let transactions: Transaction[] = [];

  return {
    async listAssets() {
      return [...assets];
    },
    async insertAsset(asset: Asset) {
      assets.push(asset);
    },
    async updateAsset(asset: Asset) {
      assets = assets.map((a) => (a.id === asset.id ? asset : a));
    },
    async deleteAsset(id: string) {
      assets = assets.filter((a) => a.id !== id);
    },

    async listCategories() {
      return [...categories];
    },
    async insertCategory(category: Category) {
      categories.push(category);
    },
    async updateCategory(category: Category) {
      categories = categories.map((c) => (c.id === category.id ? category : c));
    },
    async deleteCategory(id: string) {
      categories = categories.filter((c) => c.id !== id);
    },

    async insertTransaction(transaction: Transaction) {
      transactions.push(transaction);
    },
    async updateTransaction(transaction: Transaction) {
      transactions = transactions.map((t) => (t.id === transaction.id ? transaction : t));
    },
    async deleteTransaction(id: string) {
      transactions = transactions.filter((t) => t.id !== id);
    },
    async getTransactionById(id: string) {
      return transactions.find((t) => t.id === id) ?? null;
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
