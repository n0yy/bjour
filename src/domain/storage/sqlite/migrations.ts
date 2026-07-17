import type { SqlExecutor } from '../types';

export interface Migration {
  version: number;
  up(executor: SqlExecutor): Promise<void>;
}

export const migrations: Migration[] = [
  {
    version: 1,
    async up(executor) {
      await executor.execAsync(`
        CREATE TABLE assets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          kind TEXT NOT NULL,
          opening_balance INTEGER NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL
        );

        CREATE TABLE categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          direction TEXT NOT NULL,
          parent_id TEXT REFERENCES categories(id),
          active INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE transactions (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          amount INTEGER NOT NULL,
          date TEXT NOT NULL,
          asset_id TEXT NOT NULL REFERENCES assets(id),
          to_asset_id TEXT REFERENCES assets(id),
          category_id TEXT REFERENCES categories(id),
          note TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX idx_transactions_date ON transactions(date);
      `);
    },
  },
];

export async function runMigrations(
  executor: SqlExecutor,
  migrationList: Migration[] = migrations,
): Promise<void> {
  const row = await executor.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const currentVersion = row?.user_version ?? 0;

  const pending = migrationList
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await migration.up(executor);
    await executor.execAsync(`PRAGMA user_version = ${migration.version}`);
  }
}
