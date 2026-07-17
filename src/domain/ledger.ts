import { monthRange } from './local-date';
import { seedIfEmpty } from './seed';
import type { LedgerStorage } from './storage/types';
import type { Asset, Category, DailyGroup, NewExpenseInput, Transaction } from './types';

export interface Ledger {
  seedIfNeeded(): Promise<void>;
  recordExpense(input: NewExpenseInput): Promise<Transaction>;
  listExpenseCategories(): Promise<Category[]>;
  getDefaultAsset(): Promise<Asset>;
  listDailyGroups(year: number, month: number): Promise<DailyGroup[]>;
}

function signedAmount(transaction: Transaction): number {
  if (transaction.kind === 'income') return transaction.amount;
  if (transaction.kind === 'expense') return -transaction.amount;
  return 0; // transfers are neutral — they move money between assets, not in/out
}

export function createLedger(storage: LedgerStorage, now: () => string = () => new Date().toISOString()): Ledger {
  return {
    async seedIfNeeded() {
      await seedIfEmpty(storage, now);
    },

    async recordExpense(input: NewExpenseInput): Promise<Transaction> {
      const timestamp = now();
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        kind: 'expense',
        amount: input.amount,
        date: input.date,
        assetId: input.assetId,
        toAssetId: null,
        categoryId: input.categoryId,
        note: input.note ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await storage.insertTransaction(transaction);
      return transaction;
    },

    async listExpenseCategories() {
      const categories = await storage.listCategories();
      return categories.filter((c) => c.direction === 'expense' && c.active);
    },

    async getDefaultAsset() {
      const assets = await storage.listAssets();
      const cash = assets.find((a) => a.name === 'Tunai') ?? assets[0];
      if (!cash) {
        throw new Error('No asset available — seedIfNeeded() must run before recording transactions');
      }
      return cash;
    },

    async listDailyGroups(year: number, month: number) {
      const { start, end } = monthRange(year, month);
      const transactions = await storage.listTransactionsByDateRange(start, end);

      const byDate = new Map<string, Transaction[]>();
      for (const transaction of transactions) {
        const group = byDate.get(transaction.date) ?? [];
        group.push(transaction);
        byDate.set(transaction.date, group);
      }

      const groups: DailyGroup[] = [...byDate.entries()].map(([date, transactionsForDate]) => ({
        date,
        subtotal: transactionsForDate.reduce((sum, t) => sum + signedAmount(t), 0),
        transactions: [...transactionsForDate].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }));

      return groups.sort((a, b) => b.date.localeCompare(a.date));
    },
  };
}
