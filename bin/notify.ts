/**
 * Runs through our subscriptions and notifies users of new files.
 */

// Dependencies
import { map } from 'lodash-es';
import { Command } from 'commander';
import { subscriptionsByUser, setSubscriptionAsNotified } from '../db/queries/subscriptions';
import { request } from '../server/request';
import { environmentVariables } from '../server/utilities';
import {
  includeDailyNotification,
  includeWeeklyNotification,
  getSubscriptionWithFiles
} from '../server/subscriptions';
import { setupCustomSentry, createTransaction } from '../server/sentry-custom';
import {
  notifierEmailName,
  notifierEmail,
  replyEmailName,
  replyEmail
} from '../src/config/subscriptions';
import packageJson from '../package.json' assert { type: 'json' };
import { renderTemplate } from '../email/render';
import FileNotificationEmail from '../email/templates/FileNotificationEmail.svelte';

// Make sure Sentry is setup if DSN is provided
setupCustomSentry();

// Constants
const env = environmentVariables();

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

  // Render the email templates for use in the notifications
  // const emailTemplates = await compileTemplates();

  const userSubscriptions = await subscriptionsByUser();

  for (const email of Object.keys(userSubscriptions)) {
    // For a user, find any relevant new files, then send the notification
    const currentUserSubs = userSubscriptions[email];
    const notifySubs = [];
    for (const sub of currentUserSubs) {
      // Check if our subscription is weekly or daily and, based on that, if it needs to run again
      if (includeDailyNotification(sub) || includeWeeklyNotification(sub)) {
        const notification = await getSubscriptionWithFiles(email, sub);
        notification && notifySubs.push(notification);
      }
    }

    if (notifySubs.length) {
      // Send our notification email to the user
      await sendNotificationEmail(email, notifySubs);
      // Update our subscriptions to indicate notifications were sent
      await Promise.all(map(notifySubs, (sub) => setSubscriptionAsNotified(email, sub.id)));
    }
  }
  console.info('Finished notification');
}

async function sendNotificationEmail(email, notifySubs) {
  const emailBody = await renderTemplate(FileNotificationEmail, {
    subscriptions: notifySubs
  });

  await request(
    `${env.notificationsServiceUri}/email/queue`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: notifierEmail,
        from_name: notifierEmailName,
        reply: replyEmail,
        reply_name: replyEmailName,
        to: email,
        title: `OpenOMB Subscriptions`,
        html: emailBody
      })
    },
    { expectedType: 'json', ttl: 1, retries: 5 }
  );
}
