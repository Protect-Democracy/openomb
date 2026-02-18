/**
 * Runs through our subscriptions and notifies users of new files.
 */

// Dependencies
import { Command } from 'commander';
import { sendNotifications } from '$server/subscriptions';
import { setupCustomSentry, createTransaction } from '$server/sentry-custom';
import packageJson from '../package.json' assert { type: 'json' };

// Make sure Sentry is setup if DSN is provided
setupCustomSentry();

// Main
createTransaction('apportionment-notifications', cli);

/**
 * Main CLI function
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Send any subscription notifications.')
    .parse(process.argv);

  console.info(`Started subscription notification - ${new Date()}`);
  await sendNotifications();
  console.info('Finished notification');
}
