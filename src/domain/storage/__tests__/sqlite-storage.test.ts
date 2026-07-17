import { createSqliteStorage } from '../sqlite/sqlite-storage';
import { createBunSqlExecutor } from './bun-sqlite-executor';
import { runStorageContractTests } from './storage-contract';

runStorageContractTests(() => createSqliteStorage(createBunSqlExecutor()));
