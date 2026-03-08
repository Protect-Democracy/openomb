import { exec } from 'node:child_process';
import util from 'node:util';
import type { FullConfig } from '@playwright/test';
import stringArgv from 'string-argv';
import { startMailpitContainer } from './helpers/email-container';
import { startDatabaseContainer } from './helpers/db-container';
import { resetEnv } from './helpers/reset-env';
import { createIsolatedDb } from './helpers/db';
import { spawn, execSync } from 'node:child_process';

const execAsync = util.promisify(exec);

async function globalSetup(config: FullConfig) {
  // Reset any environment variables.
  resetEnv();

  // Get custom config
  const { buildCommand, previewCommand, port } = config.projects[0].use.globalSetupConfig as any;

  // Make sure port is open
  await forceKillPort(port);

  // Start Postgres server
  await startDatabaseContainer();

  // Create a new isolated database for tests.  This will be for all tests in this run.
  const { uri } = await createIsolatedDb({
    runMigrations: true,
    loadDefaultSampleData: true
  });

  // Start mail server
  console.log('Starting mail server container...');
  await startMailpitContainer();
  console.log('Mailpit UI', `http://localhost:${process.env.TEST_MAILPIT_UI_PORT}`);

  // Set up the environment variables
  process.env.APPORTIONMENTS_DB_URI = uri;
  process.env.AUTH_SECRET = 'test-secret';
  process.env.APPORTIONMENTS_EMAIL_SERVICE_TYPE = 'smtp';
  process.env.APPORTIONMENTS_EMAIL_SMTP_HOST = 'localhost';
  process.env.APPORTIONMENTS_EMAIL_SMTP_PORT = process.env.TEST_MAILPIT_SMTP_PORT;
  process.env.APPORTIONMENTS_EMAIL_SMTP_USER = 'test';
  process.env.APPORTIONMENTS_EMAIL_SMTP_PASSWORD = 'test';

  // Build the application
  try {
    console.log('Building Web Server...');
    execSync(buildCommand);
  } catch (e) {
    throw e;
  }

  // Start the web server as a spawned child process
  console.log('Running Web Server...');
  const previewArgs = stringArgv(previewCommand);
  const server = spawn(previewArgs[0], previewArgs.slice(1), {
    shell: true,
    stdio: 'pipe',
    env: process.env
  });

  // Pipe server output to console so you can debug startup errors
  server.stdout?.on('data', (data) => console.log(`[Server]: ${data}`));
  server.stderr?.on('data', (data) => console.error(`[Server Error]: ${data}`));

  // Store the server process in globalThis so teardown can find it
  (globalThis as any).__SERVER_PROCESS__ = server;

  // TODO: Ideally wait until the server is ready before processing
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

/**
 * Force kills any process listening on the given port.
 * Works on Linux/Mac (lsof) and Windows (netstat).
 */
export async function forceKillPort(port: number) {
  const isWin = process.platform === 'win32';

  try {
    if (isWin) {
      // Windows: Find PID and kill it
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (!stdout) return; // No process found

      // Parse the PID from the last column of the output
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          await execAsync(`taskkill /PID ${pid} /F`);
        }
      }
    } else {
      // Mac/Linux: Use lsof to find PID and kill -9
      // -t returns only the PID
      // -i :port selects the port
      const { stdout } = await execAsync(`lsof -t -i:${port}`);
      if (stdout) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          if (pid) await execAsync(`kill -9 ${pid}`);
        }
      }
    }
  } catch (e: any) {
    // Ignore errors where no process was found (exit code 1)
    if (e.code !== 1 && !e.message.includes('No such process')) {
      console.warn(`[Process Utils] Warning: Failed to kill process on port ${port}`, e.message);
    }
  }
}

export default globalSetup;
