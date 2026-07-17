import type { Asset, Category, LocalDate, Transaction } from '@/domain/types';

export interface LedgerStorage {
  listAssets(): Promise<Asset[]>;
  insertAsset(asset: Asset): Promise<void>;
  updateAsset(asset: Asset): Promise<void>;
  deleteAsset(id: string): Promise<void>;

  listCategories(): Promise<Category[]>;
  insertCategory(category: Category): Promise<void>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  insertTransaction(transaction: Transaction): Promise<void>;
  updateTransaction(transaction: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  getTransactionById(id: string): Promise<Transaction | null>;
  /** Inclusive on both ends. */
  listTransactionsByDateRange(start: LocalDate, end: LocalDate): Promise<Transaction[]>;
  /** All transactions ever recorded — used to compute asset balances and total wealth. */
  listAllTransactions(): Promise<Transaction[]>;
  /** Most recently created transaction, or null if none exist yet. */
  getMostRecentTransaction(): Promise<Transaction | null>;
}

/**
 * Minimal query surface shared by the runtime SQLite driver (expo-sqlite)
 * and the driver used in tests (bun:sqlite), so the SQLite adapter's
 * schema/migrations/queries run against a real SQLite engine either way.
 */
export interface SqlExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, params: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: unknown[]): Promise<T | null>;
}
