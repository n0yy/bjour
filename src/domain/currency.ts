const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  // Different JS engines (Hermes, Bun's JSC, Node's V8) insert a non-breaking
  // space between the "Rp" symbol and the digits inconsistently; normalize it away.
  return formatter.format(amount).replace(/\s/g, '');
}

/** Abbreviated form for tight spaces (calendar cells): 210000 -> "210rb", 8000000 -> "8jt". */
export function formatRupiahShort(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const millions = Math.round((abs / 1_000_000) * 10) / 10;
    return `${sign}${millions}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)}rb`;
  }
  return `${sign}${abs}`;
}
