import type { SQLiteDatabase } from 'expo-sqlite';

import type { SqlExecutor } from '../types';

export function createExpoSqlExecutor(db: SQLiteDatabase): SqlExecutor {
  return {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: async (sql, params) => {
      const result = await db.runAsync(sql, params as never);
      return { lastInsertRowId: result.lastInsertRowId, changes: result.changes };
    },
    getAllAsync: (sql, params) => db.getAllAsync(sql, params as never),
    getFirstAsync: async (sql, params) => (await db.getFirstAsync(sql, params as never)) ?? null,
  };
}
