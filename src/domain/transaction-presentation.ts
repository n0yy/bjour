import { formatRupiah } from './currency';
import type { Transaction } from './types';

export function transactionLabel(transaction: Transaction): string {
  if (transaction.note) return transaction.note;
  if (transaction.kind === 'income') return 'Pemasukan';
  if (transaction.kind === 'transfer') return 'Transfer';
  return 'Pengeluaran';
}

/** Signed, formatted amount text: '+Rp...' for income, '-Rp...' for expense, plain for transfer (neutral). */
export function formatSignedAmount(transaction: Transaction): string {
  if (transaction.kind === 'income') return `+${formatRupiah(transaction.amount)}`;
  if (transaction.kind === 'expense') return `-${formatRupiah(transaction.amount)}`;
  return formatRupiah(transaction.amount);
}
