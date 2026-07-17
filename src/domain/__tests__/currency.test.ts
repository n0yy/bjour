import { describe, expect, it } from 'bun:test';

import { formatRupiah } from '@/domain/currency';

describe('formatRupiah', () => {
  it('formats a whole rupiah amount with thousands separators', () => {
    expect(formatRupiah(1_500_000)).toBe('Rp1.500.000');
  });

  it('formats zero', () => {
    expect(formatRupiah(0)).toBe('Rp0');
  });

  it('keeps precision for amounts in the hundreds of millions', () => {
    expect(formatRupiah(350_000_000)).toBe('Rp350.000.000');
  });

  it('formats negative amounts with a leading minus sign', () => {
    expect(formatRupiah(-35_000)).toBe('-Rp35.000');
  });
});
