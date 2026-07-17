export type TransactionKind = 'income' | 'expense' | 'transfer';

export type AssetKind = 'cash' | 'bank' | 'e-wallet' | 'card';

export type LocalDate = string; // 'YYYY-MM-DD', no timezone

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  openingBalance: number;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  direction: 'income' | 'expense';
  parentId: string | null;
  active: boolean;
}

export interface Transaction {
  id: string;
  kind: TransactionKind;
  amount: number;
  date: LocalDate;
  assetId: string;
  toAssetId: string | null;
  categoryId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewExpenseInput = {
  amount: number;
  assetId: string;
  categoryId: string;
  date: LocalDate;
  note?: string | null;
};

export type NewIncomeInput = {
  amount: number;
  assetId: string;
  categoryId: string;
  date: LocalDate;
  note?: string | null;
};

export type NewTransferInput = {
  amount: number;
  fromAssetId: string;
  toAssetId: string;
  date: LocalDate;
  note?: string | null;
};

export type TransactionEditInput =
  | ({ kind: 'expense' } & NewExpenseInput)
  | ({ kind: 'income' } & NewIncomeInput)
  | ({ kind: 'transfer' } & NewTransferInput);

export interface AssetWithBalance extends Asset {
  balance: number;
}

export type NewAssetInput = {
  name: string;
  kind: AssetKind;
  openingBalance: number;
};

export type AssetDetailsPatch = {
  name?: string;
  kind?: AssetKind;
};

export type NewCategoryInput = {
  name: string;
  direction: Category['direction'];
  parentId?: string | null;
};

export interface CategoryGroup {
  parent: Category;
  children: Category[];
}

export interface DailyGroup {
  date: LocalDate;
  subtotal: number;
  transactions: Transaction[];
}

export interface MonthlySummary {
  income: number;
  expense: number;
  net: number;
}
