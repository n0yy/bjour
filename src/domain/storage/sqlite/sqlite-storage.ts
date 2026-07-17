import type { Asset, Category, LocalDate, Transaction } from '@/domain/types';

import type { LedgerStorage, SqlExecutor } from '../types';
import { runMigrations } from './migrations';

interface AssetRow {
  id: string;
  name: string;
  kind: string;
  opening_balance: number;
  active: number;
  created_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  direction: string;
  parent_id: string | null;
  active: number;
}

interface TransactionRow {
  id: string;
  kind: string;
  amount: number;
  date: string;
  asset_id: string;
  to_asset_id: string | null;
  category_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function assetFromRow(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as Asset['kind'],
    openingBalance: row.opening_balance,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    direction: row.direction as Category['direction'],
    parentId: row.parent_id,
    active: row.active === 1,
  };
}

function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    kind: row.kind as Transaction['kind'],
    amount: row.amount,
    date: row.date,
    assetId: row.asset_id,
    toAssetId: row.to_asset_id,
    categoryId: row.category_id,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Ready to use once the returned promise resolves — migrations run against
 * the same `executor` used at runtime (expo-sqlite) and in tests (bun:sqlite),
 * so schema/query bugs surface identically in both.
 */
export async function createSqliteStorage(executor: SqlExecutor): Promise<LedgerStorage> {
  await runMigrations(executor);

  return {
    async listAssets() {
      const rows = await executor.getAllAsync<AssetRow>('SELECT * FROM assets', []);
      return rows.map(assetFromRow);
    },

    async insertAsset(asset: Asset) {
      await executor.runAsync(
        `INSERT INTO assets (id, name, kind, opening_balance, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [asset.id, asset.name, asset.kind, asset.openingBalance, asset.active ? 1 : 0, asset.createdAt],
      );
    },

    async updateAsset(asset: Asset) {
      await executor.runAsync(
        `UPDATE assets SET name = ?, kind = ?, opening_balance = ?, active = ?, created_at = ? WHERE id = ?`,
        [asset.name, asset.kind, asset.openingBalance, asset.active ? 1 : 0, asset.createdAt, asset.id],
      );
    },

    async deleteAsset(id: string) {
      await executor.runAsync('DELETE FROM assets WHERE id = ?', [id]);
    },

    async listCategories() {
      const rows = await executor.getAllAsync<CategoryRow>('SELECT * FROM categories', []);
      return rows.map(categoryFromRow);
    },

    async insertCategory(category: Category) {
      await executor.runAsync(
        `INSERT INTO categories (id, name, direction, parent_id, active)
         VALUES (?, ?, ?, ?, ?)`,
        [category.id, category.name, category.direction, category.parentId, category.active ? 1 : 0],
      );
    },

    async updateCategory(category: Category) {
      await executor.runAsync(
        `UPDATE categories SET name = ?, direction = ?, parent_id = ?, active = ? WHERE id = ?`,
        [category.name, category.direction, category.parentId, category.active ? 1 : 0, category.id],
      );
    },

    async deleteCategory(id: string) {
      await executor.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    },

    async insertTransaction(transaction: Transaction) {
      await executor.runAsync(
        `INSERT INTO transactions
           (id, kind, amount, date, asset_id, to_asset_id, category_id, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.kind,
          transaction.amount,
          transaction.date,
          transaction.assetId,
          transaction.toAssetId,
          transaction.categoryId,
          transaction.note,
          transaction.createdAt,
          transaction.updatedAt,
        ],
      );
    },

    async updateTransaction(transaction: Transaction) {
      await executor.runAsync(
        `UPDATE transactions
         SET kind = ?, amount = ?, date = ?, asset_id = ?, to_asset_id = ?, category_id = ?, note = ?, updated_at = ?
         WHERE id = ?`,
        [
          transaction.kind,
          transaction.amount,
          transaction.date,
          transaction.assetId,
          transaction.toAssetId,
          transaction.categoryId,
          transaction.note,
          transaction.updatedAt,
          transaction.id,
        ],
      );
    },

    async deleteTransaction(id: string) {
      await executor.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    },

    async getTransactionById(id: string) {
      const row = await executor.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?', [id]);
      return row ? transactionFromRow(row) : null;
    },

    async listTransactionsByDateRange(start: LocalDate, end: LocalDate) {
      const rows = await executor.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions WHERE date >= ? AND date <= ?',
        [start, end],
      );
      return rows.map(transactionFromRow);
    },

    async listAllTransactions() {
      const rows = await executor.getAllAsync<TransactionRow>('SELECT * FROM transactions', []);
      return rows.map(transactionFromRow);
    },

    async getMostRecentTransaction() {
      const row = await executor.getFirstAsync<TransactionRow>(
        'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1',
        [],
      );
      return row ? transactionFromRow(row) : null;
    },
  };
}
