import { monthRange } from './local-date';
import { seedIfEmpty } from './seed';
import type { LedgerStorage } from './storage/types';
import type {
  Asset,
  AssetDetailsPatch,
  AssetWithBalance,
  Category,
  CategoryGroup,
  DailyGroup,
  NewAssetInput,
  NewCategoryInput,
  NewExpenseInput,
  NewIncomeInput,
  NewTransferInput,
  Transaction,
  TransactionEditInput,
} from './types';

export interface Ledger {
  seedIfNeeded(): Promise<void>;

  recordExpense(input: NewExpenseInput): Promise<Transaction>;
  recordIncome(input: NewIncomeInput): Promise<Transaction>;
  recordTransfer(input: NewTransferInput): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | null>;
  updateTransaction(id: string, input: TransactionEditInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  listDailyGroups(year: number, month: number): Promise<DailyGroup[]>;

  listExpenseCategories(): Promise<Category[]>;
  listIncomeCategories(): Promise<Category[]>;
  listCategoryTree(direction: Category['direction'], options?: { includeInactive?: boolean }): Promise<CategoryGroup[]>;
  addCategory(input: NewCategoryInput): Promise<Category>;
  renameCategory(id: string, name: string): Promise<Category>;
  setCategoryActive(id: string, active: boolean): Promise<void>;
  isCategoryInUse(id: string): Promise<boolean>;
  deleteCategory(id: string): Promise<void>;

  getDefaultAsset(): Promise<Asset>;
  listAssets(): Promise<AssetWithBalance[]>;
  listActiveAssets(): Promise<AssetWithBalance[]>;
  getTotalWealth(): Promise<number>;
  addAsset(input: NewAssetInput): Promise<Asset>;
  updateAssetDetails(id: string, patch: AssetDetailsPatch): Promise<Asset>;
  setAssetActive(id: string, active: boolean): Promise<void>;
  isAssetInUse(id: string): Promise<boolean>;
  deleteAsset(id: string): Promise<void>;
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

function fieldsFromEditInput(input: TransactionEditInput): Pick<
  Transaction,
  'kind' | 'amount' | 'date' | 'assetId' | 'toAssetId' | 'categoryId' | 'note'
> {
  if (input.kind === 'transfer') {
    if (input.fromAssetId === input.toAssetId) {
      throw new Error('Transfer requires two different assets');
    }
    return {
      kind: 'transfer',
      amount: input.amount,
      date: input.date,
      assetId: input.fromAssetId,
      toAssetId: input.toAssetId,
      categoryId: null,
      note: input.note ?? null,
    };
  }
  return {
    kind: input.kind,
    amount: input.amount,
    date: input.date,
    assetId: input.assetId,
    toAssetId: null,
    categoryId: input.categoryId,
    note: input.note ?? null,
  };
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

  async function requireAsset(id: string): Promise<Asset> {
    const asset = (await storage.listAssets()).find((a) => a.id === id);
    if (!asset) throw new Error(`Asset not found: ${id}`);
    return asset;
  }

  async function requireCategory(id: string): Promise<Category> {
    const category = (await storage.listCategories()).find((c) => c.id === id);
    if (!category) throw new Error(`Category not found: ${id}`);
    return category;
  }

  async function categoryInUse(id: string): Promise<boolean> {
    const [transactions, categories] = await Promise.all([storage.listAllTransactions(), storage.listCategories()]);
    const usedByTransaction = transactions.some((t) => t.categoryId === id);
    const hasChildren = categories.some((c) => c.parentId === id);
    return usedByTransaction || hasChildren;
  }

  async function assetInUse(id: string): Promise<boolean> {
    const transactions = await storage.listAllTransactions();
    return transactions.some((t) => t.assetId === id || t.toAssetId === id);
  }

  return {
    async seedIfNeeded() {
      await seedIfEmpty(storage, now, generateId);
    },

    // ---- Transactions ----

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

    async getTransaction(id: string) {
      return storage.getTransactionById(id);
    },

    async updateTransaction(id: string, input: TransactionEditInput) {
      const existing = await storage.getTransactionById(id);
      if (!existing) throw new Error(`Transaction not found: ${id}`);

      const updated: Transaction = {
        ...existing,
        ...fieldsFromEditInput(input),
        updatedAt: now(),
      };
      await storage.updateTransaction(updated);
      return updated;
    },

    async deleteTransaction(id: string) {
      await storage.deleteTransaction(id);
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

    // ---- Categories ----

    async listExpenseCategories() {
      return categoriesByDirection('expense');
    },

    async listIncomeCategories() {
      return categoriesByDirection('income');
    },

    async listCategoryTree(direction, options = {}) {
      const categories = (await storage.listCategories()).filter(
        (c) => c.direction === direction && (options.includeInactive || c.active),
      );
      const parents = categories.filter((c) => c.parentId === null);
      return parents.map((parent) => ({
        parent,
        children: categories.filter((c) => c.parentId === parent.id),
      }));
    },

    async addCategory(input: NewCategoryInput) {
      const category: Category = {
        id: generateId(),
        name: input.name,
        direction: input.direction,
        parentId: input.parentId ?? null,
        active: true,
      };
      await storage.insertCategory(category);
      return category;
    },

    async renameCategory(id: string, name: string) {
      const category = await requireCategory(id);
      const updated: Category = { ...category, name };
      await storage.updateCategory(updated);
      return updated;
    },

    async setCategoryActive(id: string, active: boolean) {
      const category = await requireCategory(id);
      await storage.updateCategory({ ...category, active });
    },

    async isCategoryInUse(id: string) {
      return categoryInUse(id);
    },

    async deleteCategory(id: string) {
      if (await categoryInUse(id)) {
        throw new Error('Cannot delete a category that has been used or has subcategories');
      }
      await storage.deleteCategory(id);
    },

    // ---- Assets ----

    async getDefaultAsset() {
      const assets = await storage.listAssets();
      if (assets.length === 0) {
        throw new Error('No asset available — seedIfNeeded() must run before recording transactions');
      }

      const lastUsed = await storage.getMostRecentTransaction();
      const lastUsedAsset = lastUsed && assets.find((a) => a.id === lastUsed.assetId && a.active);

      return lastUsedAsset ?? assets.find((a) => a.name === 'Tunai' && a.active) ?? assets.find((a) => a.active) ?? assets[0];
    },

    async listAssets() {
      return assetsWithBalance();
    },

    async listActiveAssets() {
      return (await assetsWithBalance()).filter((a) => a.active);
    },

    async getTotalWealth() {
      const assets = await assetsWithBalance();
      return assets.filter((a) => a.active).reduce((sum, a) => sum + a.balance, 0);
    },

    async addAsset(input: NewAssetInput) {
      const asset: Asset = {
        id: generateId(),
        name: input.name,
        kind: input.kind,
        openingBalance: input.openingBalance,
        active: true,
        createdAt: now(),
      };
      await storage.insertAsset(asset);
      return asset;
    },

    async updateAssetDetails(id: string, patch: AssetDetailsPatch) {
      const asset = await requireAsset(id);
      const updated: Asset = { ...asset, ...patch };
      await storage.updateAsset(updated);
      return updated;
    },

    async setAssetActive(id: string, active: boolean) {
      const asset = await requireAsset(id);
      await storage.updateAsset({ ...asset, active });
    },

    async isAssetInUse(id: string) {
      return assetInUse(id);
    },

    async deleteAsset(id: string) {
      if (await assetInUse(id)) {
        throw new Error('Cannot delete an asset that has transactions');
      }
      await storage.deleteAsset(id);
    },
  };
}
