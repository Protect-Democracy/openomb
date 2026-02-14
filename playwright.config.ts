import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:4173',
    // We don't use the `webServer` config because we want to have more control over the
    // startup process, and we specifically want to make sure that we can start up a database
    // then the web server parts.  Using just globalSetup for the DB and the webServer option
    // did not allow things to talk to each other correctly.  This does seem hacky though.
    globalSetupConfig: {
      buildCommand: 'npm run build:web',
      previewCommand: 'npm run preview:web',
      port: 4173
    }
  },

  // Setup and teardown scripts
  globalSetup: path.resolve('./tests/playwright.setup.ts'),
  globalTeardown: path.resolve('./tests/playwright.teardown.ts'),

  // Test location
  testDir: 'tests',
  testMatch: /(.+\.)?(integration-test|spec)\.[jt]s/
});
