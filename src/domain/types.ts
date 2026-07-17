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

export interface DailyGroup {
  date: LocalDate;
  subtotal: number;
  transactions: Transaction[];
}
