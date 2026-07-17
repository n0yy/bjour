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
