import { beforeAll, afterAll, vi } from 'vitest';
import type { Mock } from 'vitest';

import { resetEnv } from './helpers/reset-env';
import { startDatabaseContainer, stopDatabaseContainer } from './helpers/db-container';

// Before all tests
beforeAll(async () => {
  // Clear env
  resetEnv();

  // Override global fetch
  global.fetch = vi.fn();

  // Postgres
  await startDatabaseContainer();

  // Teardown function called by Vitest when all tests finish
  return async () => {
    await stopDatabaseContainer();
  };
});

// After all tests
afterAll(() => {
  (fetch as Mock).mockReset();
});
