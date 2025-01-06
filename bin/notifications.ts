/**
 * Runs through our subscriptions and notifies users of new files.
 */

// Dependencies
import { getSubscriptionsByUser } from '../db/queries/subscriptions';
import { fileSearchRecentlyApproved } from '../db/queries/search';
import { request } from '../server/request';
import {
  environmentVariables,
} from '../server/utilities';
import { setupCustomSentry, createTransaction, createSpan } from '../server/sentry-custom';

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
  console.info(`Started subscription notification - ${new Date()}`);

  const userSubscriptions = await getSubscriptionsByUser();

  for (const email of Object.keys(userSubscriptions)) {
    // For a user, find any relevant new files, then send the notification
    const currentUserSubs = userSubscriptions[email];
    const notifySubs = [];
    for (const sub of currentUserSubs) {
      let criterion;
      if (sub.type === 'search') {
        criterion = sub.itemDetails.criterion
      } else if (sub.type === 'agency') {
        criterion = { agency: sub.itemDetails.name }
      } else if (sub.type === 'bureau') {
        criterion = { agency: sub.itemDetails.agency , bureau: sub.itemDetails.name }
      } else if (sub.type === 'account') {
        criterion = { agency: sub.itemDetails.agency , bureau: sub.itemDetails.bureau , account: sub.itemDetails.name }
      }
      console.log(criterion);
      const files = await fileSearchRecentlyApproved('daily', criterion);
      if (files.length) {
        notifySubs.push({
          ...sub,
          files,
        });
      }
      console.log(notifySubs);
    }
  }

  console.info('Finished notification');
}

async function sendNotificationRequest() {
  await request(`${env.notificationsServiceUri}/email/queue`, { method: 'POST' }, { expectedType: 'json', ttl: 1, retries: 5 });
}

