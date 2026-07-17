import { Database } from 'bun:sqlite';

import type { SqlExecutor } from '../types';

/**
 * Test-only SqlExecutor backed by bun:sqlite — a real SQLite engine, used to
 * run the same schema/migrations/queries as the expo-sqlite runtime adapter
 * without needing a device or simulator.
 */
export function createBunSqlExecutor(): SqlExecutor {
  const db = new Database(':memory:');

  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, params) {
      const result = db.query(sql).run(...(params as never[]));
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: result.changes };
    },
    async getAllAsync<T>(sql: string, params: unknown[]) {
      return db.query(sql).all(...(params as never[])) as T[];
    },
    async getFirstAsync<T>(sql: string, params: unknown[]) {
      return (db.query(sql).get(...(params as never[])) ?? null) as T | null;
    },
  };
}
