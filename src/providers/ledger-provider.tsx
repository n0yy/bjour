import * as SQLite from 'expo-sqlite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { createLedger, type Ledger } from '@/domain/ledger';
import { createExpoSqlExecutor } from '@/domain/storage/sqlite/expo-sqlite-executor';
import { createSqliteStorage } from '@/domain/storage/sqlite/sqlite-storage';

const LedgerContext = createContext<Ledger | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [ledger, setLedger] = useState<Ledger | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const db = await SQLite.openDatabaseAsync('bjour.db');
      const storage = await createSqliteStorage(createExpoSqlExecutor(db));
      const instance = createLedger(storage);
      await instance.seedIfNeeded();
      if (!cancelled) {
        setLedger(instance);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ledger) {
    return null;
  }

  return <LedgerContext.Provider value={ledger}>{children}</LedgerContext.Provider>;
}

export function useLedger(): Ledger {
  const ledger = useContext(LedgerContext);
  if (!ledger) {
    throw new Error('useLedger() must be called within a LedgerProvider that has finished loading');
  }
  return ledger;
}
