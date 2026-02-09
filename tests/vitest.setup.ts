import { beforeAll, afterAll, vi } from 'vitest';
import type { Mock } from 'vitest';

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

// Container for all tests; we create new databases for each test.
let globalContainer: StartedPostgreSqlContainer;
const postgresVersion = 'postgres:15';
const defaultDbName = 'test_____db';
const defaultPassword = 'test____password';

// Before all tests
beforeAll(async () => {
  // Clear env
  resetEnv();

  // Override global fetch
  global.fetch = vi.fn();

  // Postgres
  const postgresTeardown = await startPostgresContainer();

  // Teardown function called by Vitest when all tests finish
  return async () => {
    await postgresTeardown();
  };
});

// After all tests
afterAll(() => {
  (fetch as Mock).mockReset();
});

/**
 * Start the Postgres test container.
 */
async function startPostgresContainer() {
  let globalContainer;

  try {
    // Start the PG container
    globalContainer = await new PostgreSqlContainer(postgresVersion)
      // Not meant to be strong or unique, just helpful to make the connection
      // string parsing work correctly
      .withPassword(defaultPassword)
      .withDatabase(defaultDbName)
      .start();

    // All individual tests will use this to connect and create their own sub-databases
    process.env.TEST_CONTAINER_URI = globalContainer.getConnectionUri();
    process.env.TEST_DEFAULT_DB_NAME = defaultDbName;
  }
  catch (error: any) {
    // Check if the error is specifically about finding the runtime
    if (
      error.message &&
      error.message.includes('Could not find a working container runtime strategy')
    ) {
      console.error('\nCRITICAL ERROR: Docker is not detected.');
      console.error('\nPossible fixes:');
      console.error('1. Is **Docker Desktop** (or OrbStack/Colima) running?');
      console.error('2. Run `docker ps` in your terminal to verify connection.');
      console.error('3. If using a custom socket, check your DOCKER_HOST env var.\n');

      // Throw a cleaner error to stop Vitest immediately
      throw new Error('Test run aborted: Docker is required but not found.');
    }

    // Re-throw other unexpected errors
    throw error;
  }

  // Teardown
  return async () => {
    await globalContainer.stop();
  };
}

/**
 * Reset environment variables for all tests to help ensure no pollution between tests,
 * as well as to ensure that no real credentials are accidentally used in tests.
 */
function resetEnv() {
  const prefixesToReset = ['APPORTIONMENTS_', 'SENTRY_', 'MAILGUN_'];
  for (const key in process.env) {
    if (prefixesToReset.some((prefix) => key.startsWith(prefix))) {
      delete process.env[key];
    }
  }

  // Manually reset any specific variables if needed
  // const valuesToReset = [];
  // for (const key of valuesToReset) {
  //   delete process.env[key];
  // }
}
