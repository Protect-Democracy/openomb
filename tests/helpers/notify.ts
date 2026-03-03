// Dependencies
import { join as joinPath } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const _dirname = new URL('.', import.meta.url).pathname;
const execPromise = promisify(exec);

/**
 * Run the notify command, making sure that environment variables are set correctly for testing.
 *
 * This assumes that the notify command is built and available at the expected path, so it should only be used
 * after the build process has been run in the tests.
 */
export async function runNotifyCommand(environmentVariables: Record<string, string> = {}) {
  const notifyPath = joinPath(_dirname, '../../build-notify/notify.js');

  // The env should be set with the playwright setup, but let's make sure the mail values
  // are the test ones
  const mailType = process.env.APPORTIONMENTS_EMAIL_SERVICE_TYPE;
  const mailHost = process.env.APPORTIONMENTS_EMAIL_SMTP_HOST;
  if (!mailType || mailType !== 'smtp' || !mailHost || mailHost !== 'localhost') {
    throw new Error(
      'Environment variables for email service are not set correctly for testing.  This should be happening with the Playwright setup.'
    );
  }

  const { stdout, stderr } = await execPromise(`node ${notifyPath}`, {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ...environmentVariables
    }
  });

  return { stdout, stderr };
}
