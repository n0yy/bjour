import type { Asset, Category } from '@/domain/types';

import type { LedgerStorage } from './storage/types';

const seedExpenseCategoryNames = ['Makanan', 'Transportasi', 'Tagihan', 'Belanja', 'Kesehatan', 'Hiburan', 'Lainnya'];
const seedIncomeCategoryNames = ['Gaji', 'Lainnya'];

export async function seedIfEmpty(
  storage: LedgerStorage,
  now: () => string = () => new Date().toISOString(),
  generateId: () => string = () => crypto.randomUUID(),
): Promise<void> {
  const assets = await storage.listAssets();
  if (assets.length > 0) {
    return;
  }

  const cash: Asset = {
    id: generateId(),
    name: 'Tunai',
    kind: 'cash',
    openingBalance: 0,
    active: true,
    createdAt: now(),
  };
  await storage.insertAsset(cash);

  const categories: Category[] = [
    ...seedExpenseCategoryNames.map(
      (name): Category => ({ id: generateId(), name, direction: 'expense', parentId: null, active: true }),
    ),
    ...seedIncomeCategoryNames.map(
      (name): Category => ({ id: generateId(), name, direction: 'income', parentId: null, active: true }),
    ),
  ];
  for (const category of categories) {
    await storage.insertCategory(category);
  }
}
