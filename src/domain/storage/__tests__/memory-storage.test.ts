import { createMemoryStorage } from '../memory-storage';
import { runStorageContractTests } from './storage-contract';

runStorageContractTests(async () => createMemoryStorage());
