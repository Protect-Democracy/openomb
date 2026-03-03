import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let globalContainer: StartedPostgreSqlContainer | undefined;

// Config constants
const postgresVersion = 'postgres:15';
const defaultDbName = 'test_____db';
const defaultDbPassword = 'test____password';

export async function startDatabaseContainer() {
  // If container is already running (e.g. in watch mode), just return it
  if (globalContainer) {
    return globalContainer;
  }

  try {
    globalContainer = await new PostgreSqlContainer(postgresVersion)
      .withPassword(defaultDbPassword)
      .withDatabase(defaultDbName)
      .start();

    // Set the env vars required by your `createIsolatedDb` helper
    process.env.TEST_POSTGRES_CONTAINER_URI = globalContainer.getConnectionUri();
    process.env.TEST_POSTGRES_DEFAULT_DB_NAME = defaultDbName;

    return globalContainer;
  } catch (error: any) {
    if (error.message?.includes('Could not find a working container runtime strategy')) {
      throw new Error('Docker not found. Please ensure Docker is running.');
    }
    throw error;
  }
}

export async function stopDatabaseContainer() {
  if (globalContainer) {
    await globalContainer.stop();
    globalContainer = undefined;
  }
}
