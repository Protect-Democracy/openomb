import { stopMailpitContainer } from './helpers/email-container';
import { stopDatabaseContainer } from './helpers/db-container';

async function globalTeardown() {
  // Kill the Web Server
  const server = globalThis.__SERVER_PROCESS__;
  if (server) {
    // We use tree-kill logic effectively here by sending SIGTERM
    // Since we used 'shell: true', we might need to be aggressive if on Windows,
    // but usually .kill() works for simple setups.
    server.kill();
  }

  // Stop the Docker Container
  await stopDatabaseContainer();

  // Stop the mail server container
  await stopMailpitContainer();
}

export default globalTeardown;
