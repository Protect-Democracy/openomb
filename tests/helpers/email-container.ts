import { GenericContainer } from 'testcontainers';
import type { StartedTestContainer } from 'testcontainers';

let globalContainer: StartedTestContainer | undefined;

// Config constants
const mailpitImage = 'axllent/mailpit';

export async function startMailpitContainer() {
  // If container is already running (e.g. in watch mode), just return it
  if (globalContainer) {
    return globalContainer;
  }

  try {
    globalContainer = await new GenericContainer(mailpitImage).withExposedPorts(1025, 8025).start();

    // Pull out some values that will be useful for tests
    process.env.TEST_MAILPIT_UI_PORT = globalContainer.getMappedPort(8025).toString();
    process.env.TEST_MAILPIT_SMTP_PORT = globalContainer.getMappedPort(1025).toString();

    return globalContainer;
  } catch (error: any) {
    if (error.message?.includes('Could not find a working container runtime strategy')) {
      throw new Error('Docker not found. Please ensure Docker is running.');
    }
    throw error;
  }
}

export async function stopMailpitContainer() {
  if (globalContainer) {
    await globalContainer.stop();
    globalContainer = undefined;
  }
}
