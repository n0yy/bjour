import { describe, expect, it } from 'bun:test';

import { formatSignedAmount, transactionLabel } from '@/domain/transaction-presentation';
import type { Transaction } from '@/domain/types';

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    kind: 'expense',
    amount: 35_000,
    date: '2026-07-16',
    assetId: 'asset-cash',
    toAssetId: null,
    categoryId: 'cat-food',
    note: null,
    createdAt: '2026-07-16T10:00:00.000Z',
    updatedAt: '2026-07-16T10:00:00.000Z',
    ...overrides,
  };
}

describe('transactionLabel', () => {
  it('prefers the note when present', () => {
    expect(transactionLabel(makeTransaction({ note: 'Makan siang' }))).toBe('Makan siang');
  });

  it('falls back to a kind-based label when there is no note', () => {
    expect(transactionLabel(makeTransaction({ kind: 'expense' }))).toBe('Pengeluaran');
    expect(transactionLabel(makeTransaction({ kind: 'income' }))).toBe('Pemasukan');
    expect(transactionLabel(makeTransaction({ kind: 'transfer' }))).toBe('Transfer');
  });
});

describe('formatSignedAmount', () => {
  it('prefixes income with +', () => {
    expect(formatSignedAmount(makeTransaction({ kind: 'income', amount: 8_000_000 }))).toBe('+Rp8.000.000');
  });

  it('prefixes expense with -', () => {
    expect(formatSignedAmount(makeTransaction({ kind: 'expense', amount: 35_000 }))).toBe('-Rp35.000');
  });

  it('shows transfer amount neutrally, with no sign', () => {
    expect(formatSignedAmount(makeTransaction({ kind: 'transfer', amount: 500_000 }))).toBe('Rp500.000');
  });
});
