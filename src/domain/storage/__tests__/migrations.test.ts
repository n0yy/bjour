import { describe, expect, it } from 'bun:test';

import type { Migration } from '../sqlite/migrations';
import { runMigrations } from '../sqlite/migrations';
import { createBunSqlExecutor } from './bun-sqlite-executor';

describe('runMigrations', () => {
  it('applies only migrations newer than the current user_version, in order', async () => {
    const executor = createBunSqlExecutor();
    const applied: number[] = [];
    const migrationList: Migration[] = [
      { version: 1, async up() { applied.push(1); } },
      { version: 2, async up() { applied.push(2); } },
    ];

    await runMigrations(executor, migrationList);
    expect(applied).toEqual([1, 2]);

    const row = await executor.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    expect(row?.user_version).toBe(2);
  });

  it('preserves existing data when migrating from version n to n+1', async () => {
    const executor = createBunSqlExecutor();
    const v1: Migration = {
      version: 1,
      async up(ex) {
        await ex.execAsync('CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL)');
      },
    };
    await runMigrations(executor, [v1]);
    await executor.runAsync('INSERT INTO notes (body) VALUES (?)', ['hello']);

    const v2: Migration = {
      version: 2,
      async up(ex) {
        await ex.execAsync('ALTER TABLE notes ADD COLUMN archived INTEGER NOT NULL DEFAULT 0');
      },
    };
    await runMigrations(executor, [v1, v2]);

    const rows = await executor.getAllAsync<{ id: number; body: string; archived: number }>(
      'SELECT * FROM notes',
      [],
    );
    expect(rows).toEqual([{ id: 1, body: 'hello', archived: 0 }]);
  });

  it('does not re-apply already-applied migrations', async () => {
    const executor = createBunSqlExecutor();
    let runs = 0;
    const migration: Migration = { version: 1, async up() { runs += 1; } };

    await runMigrations(executor, [migration]);
    await runMigrations(executor, [migration]);

    expect(runs).toBe(1);
  });
});
