import { describe, expect, it } from 'bun:test';

import { createMemoryStorage } from '@/domain/storage/memory-storage';

import { seedIfEmpty } from '../seed';

describe('seedIfEmpty', () => {
  it('creates a default Tunai asset and common Indonesian categories on first run', async () => {
    const storage = createMemoryStorage();

    await seedIfEmpty(storage);

    const assets = await storage.listAssets();
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({ name: 'Tunai', kind: 'cash', openingBalance: 0, active: true });

    const categories = await storage.listCategories();
    expect(categories.some((c) => c.name === 'Makanan' && c.direction === 'expense')).toBe(true);
    expect(categories.some((c) => c.name === 'Gaji' && c.direction === 'income')).toBe(true);
  });

  it('does not seed again if an asset already exists', async () => {
    const storage = createMemoryStorage();

    await seedIfEmpty(storage);
    await seedIfEmpty(storage);

    expect(await storage.listAssets()).toHaveLength(1);
  });
});
