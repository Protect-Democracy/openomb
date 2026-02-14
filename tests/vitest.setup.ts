import { beforeAll, afterAll, vi } from 'vitest';
import type { Mock } from 'vitest';
import DOMMatrix from '@thednp/dommatrix';

import { resetEnv } from './helpers/reset-env';
import { startDatabaseContainer, stopDatabaseContainer } from './helpers/db-container';

// PDFJS seems to need this for testing, specifically in Github Actions.
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = DOMMatrix;
}
if (typeof window !== 'undefined' && typeof window.DOMMatrix === 'undefined') {
  window.DOMMatrix = DOMMatrix;
}
if (typeof window !== 'undefined' && typeof window.DOMMatrixReadOnly === 'undefined') {
  window.DOMMatrixReadOnly = DOMMatrix;
}

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
