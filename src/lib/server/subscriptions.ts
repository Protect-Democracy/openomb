/**
 * Methods for managing subscriptions and getting data.
 */
import { DateTime } from 'luxon';
import { map } from 'lodash-es';
import { mFileSearchFullCount, mFileSearchPaged } from '$db/queries/search';
import {
  userSubscriptionDetails,
  subscriptionsByUser,
  setSubscriptionAsNotified
} from '$db/queries/subscriptions';
import { maxFilesPerNotificationEntry, runWeeklyEmailsOn } from '$config/subscriptions';
import { renderTemplate } from '$email/render';
import { sendEmail } from '$email/send';
import FileNotificationEmail from '$email/templates/FileNotificationEmail.svelte';

// Types
import type { subscriptionSelect } from '$schema/subscriptions';
import type {
  SubscriptionByUser,
  SubscriptionDetails,
  SubscriptionSelectDetails,
  SubscriptionItemDetails
} from '$db/queries/subscriptions';
import type { filesSelect } from '$schema/files';

export type SubscriptionWithFiles = subscriptionSelect & {
  criterion: any;
  itemDetails: SubscriptionItemDetails;
  fileCount: number;
  files: filesSelect[];
};

/**
 * Send notifications to users based on their subscriptions.
 */
export async function sendNotifications() {
  const userSubscriptions = await subscriptionsByUser();
  const notificationsSent = [];

  for (const email of Object.keys(userSubscriptions)) {
    // For a user, find any relevant new files, then send the notification
    const currentUserSubs = userSubscriptions[email];
    const notifySubs: subscriptionSelect[] = [];
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

      notificationsSent.push({
        email,
        notifySubs,
        subscriptionsNotified: notifySubs.length
      });
    }
  }

  return notificationsSent;
}

/**
 * Send a specific notification email to a user.
 *
 * @param email Email address to send to.
 * @param notifySubs Array of subscription data.
 */
export async function sendNotificationEmail(email: string, notifySubs: any[]) {
  const emailBody = await renderTemplate(FileNotificationEmail, {
    subscriptions: notifySubs
  });

  await sendEmail(email, 'OpenOMB Subscriptions', emailBody);
}

/**
 * Get files for a user and specific subscription.
 *
 * @param email
 * @param sub
 * @param lastNotified - Only use for testing, otherwise, the database entry will be used
 *   which is the last time the user was notified.
 * @returns
 */
export async function getSubscriptionWithFiles(
  email: string,
  sub: SubscriptionSelectDetails,
  lastNotified: Date | undefined = undefined
): Promise<SubscriptionWithFiles | undefined> {
  let criterion;

  if (sub.type === 'search' && 'criterion' in sub.itemDetails) {
    criterion = sub.itemDetails.criterion;
  } else if (sub.type === 'agency' || sub.type === 'bureau' || sub.type === 'account') {
    criterion = {
      agency: sub.itemDetails.agencyId || '',
      bureau: sub.itemDetails.bureauId || '',
      account: sub.itemDetails.account || ''
    };
  } else if (sub.type === 'folder') {
    criterion = { folder: sub.itemId };
  } else if (sub.type === 'tafs') {
    const detailRecord = await userSubscriptionDetails(email, sub.type, sub.itemId);
    criterion = {
      tafs: detailRecord?.itemDetails.tafsId,
      year: `${detailRecord?.itemDetails.fiscalYear}`
    };
  } else {
    // Unrecognized subscription type, throw error
    throw new Error(`Unrecognized subscription type ${sub.type}`);
  }
  else {
    // Unrecognized subscription type, throw error
    throw new Error(`Unrecognized subscription type ${sub.type}`);
  }

  // Use specific last notified if provided which should only be for testing
  criterion['createdStart'] = lastNotified ? lastNotified : sub.lastNotifiedAt;

  const fileCount = await mFileSearchFullCount(criterion);
  const files = await mFileSearchPaged({
    ...criterion,
    limit: maxFilesPerNotificationEntry
  });
  if (files.length) {
    return {
      ...sub,
      criterion,
      fileCount,
      files
    };
  }
}

/**
 * Get all files for all subscriptions for specific user.
 *
 * @param email
 * @param lastNotified - Generally only use for testing as the database value will
 *   be used otherwise.
 */
export async function getSubscriptionsWithFilesByUser(
  email: string,
  lastNotified: Date | undefined = undefined
) {
  // TODO: Make this more efficient
  const userSubscriptions = await subscriptionsByUser();

  // If email has subscriptions
  if (userSubscriptions[email]) {
    const currentUserSubs = userSubscriptions[email];
    const notifySubs = [];
    for (const sub of currentUserSubs) {
      const notification = await getSubscriptionWithFiles(email, sub, lastNotified);
      if (notification) {
        notifySubs.push(notification);
      }
    }

    return notifySubs;
  }
}

/**
 * Should our file be included as a daily notification
 */
export function includeDailyNotification(sub): boolean {
  return (
    sub.frequency === 'daily' &&
    Math.abs(DateTime.fromJSDate(sub.lastNotifiedAt).diffNow(['hours']).as('hours')) > 18
  );
}

/**
 * Should our file be included as a weekly notification
 */
export function includeWeeklyNotification(sub): boolean {
  return (
    sub.frequency === 'weekly' &&
    new Date().getDay() === runWeeklyEmailsOn &&
    Math.abs(DateTime.fromJSDate(sub.lastNotifiedAt).diffNow(['days']).as('days')) > 6.5
  );
}
