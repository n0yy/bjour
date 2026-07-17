import { describe, expect, it } from 'bun:test';

import { formatRupiah, formatRupiahShort } from '@/domain/currency';

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

describe('formatRupiahShort', () => {
  it('formats sub-thousand amounts plainly', () => {
    expect(formatRupiahShort(500)).toBe('500');
  });

  it('abbreviates thousands as rb', () => {
    expect(formatRupiahShort(210_000)).toBe('210rb');
  });

  it('abbreviates millions as jt with one decimal', () => {
    expect(formatRupiahShort(8_000_000)).toBe('8jt');
    expect(formatRupiahShort(1_250_000)).toBe('1.3jt');
  });

  it('keeps precision up to the hundreds of millions', () => {
    expect(formatRupiahShort(350_000_000)).toBe('350jt');
  });

  it('preserves the sign for negative amounts', () => {
    expect(formatRupiahShort(-210_000)).toBe('-210rb');
  });

  it('stays in rb just under the jt threshold', () => {
    expect(formatRupiahShort(999_000)).toBe('999rb');
  });

  it('keeps precision for a non-round hundreds-of-millions value', () => {
    expect(formatRupiahShort(275_000_000)).toBe('275jt');
  });
});
