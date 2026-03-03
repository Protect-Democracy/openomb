import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:4173',
    // We don't use the `webServer` config because we want to have more control over the
    // startup process, and we specifically want to make sure that we can start up a database
    // then the web server parts.  Using just globalSetup for the DB and the webServer option
    // did not allow things to talk to each other correctly.  This does seem hacky though.
    //
    // NODE_ENV=production is needed for SvelteKit for some reasons related to this.
    // https://github.com/sveltejs/kit/issues/12771
    //
    // NODE_TEST allows us to have some conditional logic in our code for when we are
    // running tests, which is helpful for things like the email service.
    globalSetupConfig: {
      buildCommand: 'NODE_ENV=production NODE_TEST=1 npm run build:web && npm run build:notify',
      previewCommand: 'NODE_ENV=production NODE_TEST=1 npm run preview:web',
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
