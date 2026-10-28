import { beforeAll, afterAll, vi } from 'vitest';
import type { Mock } from 'vitest';
import CSSMatrix from '@thednp/dommatrix';

import { resetEnv } from './helpers/reset-env';
import { startDatabaseContainer, stopDatabaseContainer } from './helpers/db-container';

// PDFJS seems to need this for testing, specifically in Github Actions.
// The polyfill covers what PDFJS uses, but not every static method on the DOM type
// (e.g. fromFloat32Array), so it is cast to the DOM constructor type.
const DOMMatrixPolyfill = CSSMatrix as unknown as typeof globalThis.DOMMatrix;
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = DOMMatrixPolyfill;
}
if (typeof window !== 'undefined' && typeof window.DOMMatrix === 'undefined') {
  window.DOMMatrix = DOMMatrixPolyfill;
}
if (typeof window !== 'undefined' && typeof window.DOMMatrixReadOnly === 'undefined') {
  window.DOMMatrixReadOnly = DOMMatrixPolyfill;
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
