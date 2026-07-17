import { monthRange } from './local-date';
import { seedIfEmpty } from './seed';
import type { LedgerStorage } from './storage/types';
import type {
  Asset,
  AssetWithBalance,
  Category,
  DailyGroup,
  NewExpenseInput,
  NewIncomeInput,
  NewTransferInput,
  Transaction,
} from './types';

export interface Ledger {
  seedIfNeeded(): Promise<void>;
  recordExpense(input: NewExpenseInput): Promise<Transaction>;
  recordIncome(input: NewIncomeInput): Promise<Transaction>;
  recordTransfer(input: NewTransferInput): Promise<Transaction>;
  listExpenseCategories(): Promise<Category[]>;
  listIncomeCategories(): Promise<Category[]>;
  getDefaultAsset(): Promise<Asset>;
  listAssets(): Promise<AssetWithBalance[]>;
  getTotalWealth(): Promise<number>;
  listDailyGroups(year: number, month: number): Promise<DailyGroup[]>;
}

function signedAmount(transaction: Transaction): number {
  if (transaction.kind === 'income') return transaction.amount;
  if (transaction.kind === 'expense') return -transaction.amount;
  return 0; // transfers are neutral — they move money between assets, not in/out
}

/** How much a single transaction moves the balance of one specific asset. */
function balanceDelta(transaction: Transaction, assetId: string): number {
  if (transaction.kind === 'income' && transaction.assetId === assetId) return transaction.amount;
  if (transaction.kind === 'expense' && transaction.assetId === assetId) return -transaction.amount;
  if (transaction.kind === 'transfer') {
    if (transaction.assetId === assetId) return -transaction.amount;
    if (transaction.toAssetId === assetId) return transaction.amount;
  }
  return 0;
}

export function createLedger(
  storage: LedgerStorage,
  now: () => string = () => new Date().toISOString(),
  generateId: () => string = () => crypto.randomUUID(),
): Ledger {
  async function insertTransaction(transaction: Transaction): Promise<Transaction> {
    await storage.insertTransaction(transaction);
    return transaction;
  }

  async function categoriesByDirection(direction: Category['direction']): Promise<Category[]> {
    const categories = await storage.listCategories();
    return categories.filter((c) => c.direction === direction && c.active);
  }

  async function assetsWithBalance(): Promise<AssetWithBalance[]> {
    const [assets, transactions] = await Promise.all([storage.listAssets(), storage.listAllTransactions()]);
    return assets.map((asset) => ({
      ...asset,
      balance: asset.openingBalance + transactions.reduce((sum, t) => sum + balanceDelta(t, asset.id), 0),
    }));
  }

  return {
    async seedIfNeeded() {
      await seedIfEmpty(storage, now, generateId);
    },

    async recordExpense(input: NewExpenseInput) {
      const timestamp = now();
      return insertTransaction({
        id: generateId(),
        kind: 'expense',
        amount: input.amount,
        date: input.date,
        assetId: input.assetId,
        toAssetId: null,
        categoryId: input.categoryId,
        note: input.note ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },

    async recordIncome(input: NewIncomeInput) {
      const timestamp = now();
      return insertTransaction({
        id: generateId(),
        kind: 'income',
        amount: input.amount,
        date: input.date,
        assetId: input.assetId,
        toAssetId: null,
        categoryId: input.categoryId,
        note: input.note ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },

    async recordTransfer(input: NewTransferInput) {
      if (input.fromAssetId === input.toAssetId) {
        throw new Error('Transfer requires two different assets');
      }
      const timestamp = now();
      return insertTransaction({
        id: generateId(),
        kind: 'transfer',
        amount: input.amount,
        date: input.date,
        assetId: input.fromAssetId,
        toAssetId: input.toAssetId,
        categoryId: null,
        note: input.note ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },

    async listExpenseCategories() {
      return categoriesByDirection('expense');
    },

    async listIncomeCategories() {
      return categoriesByDirection('income');
    },

    async getDefaultAsset() {
      const assets = await storage.listAssets();
      if (assets.length === 0) {
        throw new Error('No asset available — seedIfNeeded() must run before recording transactions');
      }

      const lastUsed = await storage.getMostRecentTransaction();
      const lastUsedAsset = lastUsed && assets.find((a) => a.id === lastUsed.assetId);

      return lastUsedAsset ?? assets.find((a) => a.name === 'Tunai') ?? assets[0];
    },

    async listAssets() {
      return assetsWithBalance();
    },

    async getTotalWealth() {
      const assets = await assetsWithBalance();
      return assets.reduce((sum, a) => sum + a.balance, 0);
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
