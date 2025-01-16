/**
 * Runs through our subscriptions and notifies users of new files.
 */

// Dependencies
import { differenceInDays, differenceInHours } from 'date-fns';
import { map } from 'lodash-es';
import {
  getSubscriptionsByUser,
  getUserSubscriptionDetails,
  setSubscriptionAsNotified
} from '../db/queries/subscriptions';
import { fileSearchFullCount, fileSearchPaged } from '../db/queries/search';
import { request } from '../server/request';
//import { environmentVariables } from '../server/utilities';
import { setupCustomSentry, createTransaction } from '../server/sentry-custom';
import {
  maxFilesPerNotificationEntry,
  notifierEmailName,
  notifierEmail,
  replyEmailName,
  replyEmail
} from '../src/config/subscriptions';

// Make sure Sentry is setup if DSN is provided
setupCustomSentry();

// Constants
//const env = environmentVariables();

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
      // Check if our subscription is weekly or daily and, based on that, if it needs to run again
      if (
        (sub.frequency === 'weekly' &&
          new Date().getDay() === 1 &&
          differenceInDays(new Date(), sub.lastNotifiedAt) > 6) ||
        (sub.frequency === 'daily' && differenceInHours(new Date(), sub.lastNotifiedAt) > 18)
      ) {
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

async function getSubscriptionWithFiles(email, sub) {
  let criterion;
  if (sub.type === 'search') {
    criterion = sub.itemDetails.criterion;
  }
  else if (sub.type === 'agency' || sub.type === 'bureau' || sub.type === 'account') {
    criterion = {
      agency: sub.itemDetails.agencyId,
      bureau: sub.itemDetails.bureauId,
      account: sub.itemDetails.accountId
    };
  }
  else if (sub.type === 'folder') {
    criterion = { folder: sub.itemId };
  }
  else if (sub.type === 'tafs') {
    const detailRecord = await getUserSubscriptionDetails(email, sub.type, sub.itemId);
    criterion = {
      tafs: detailRecord.itemDetails.tafsId,
      year: `${detailRecord.itemDetails.fiscalYear}`
    };
  }
  const fileCount = await fileSearchFullCount({ ...criterion, approvedStart: sub.lastNotifiedAt });
  const files = await fileSearchPaged({
    ...criterion,
    approvedStart: sub.lastNotifiedAt,
    limit: maxFilesPerNotificationEntry
  });
  if (files.length) {
    return {
      ...sub,
      fileCount,
      files
    };
  }
}

async function sendNotificationEmail(email, notifySubs) {
  const emailBody = `<div><h2>Subscriptions</h2>
    <ul>
      ${notifySubs.map((sub) => `<li><a href="${sub.itemLink}">${sub.description}</a></li>`)}
    </ul>
  </div>
  `;
  await request(
    //`${env.notificationsServiceUri}/email/queue`,
    'http://localhost:8080/email/queue',
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
