/**
 * Methods for managing subscriptions and getting data.
 */

import { mFileSearchFullCount, mFileSearchPaged } from '../db/queries/search';
import { getUserSubscriptionDetails, getSubscriptionsByUser } from '../db/queries/subscriptions';

import { maxFilesPerNotificationEntry } from '../src/config/subscriptions';

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
  sub,
  lastNotified: Date | undefined = undefined
) {
  let criterion;
  if (sub.type === 'search') {
    criterion = sub.itemDetails.criterion;
  }
  else if (sub.type === 'agency' || sub.type === 'bureau' || sub.type === 'account') {
    criterion = {
      agency: sub.itemDetails.agencyId || '',
      bureau: sub.itemDetails.bureauId || '',
      account: sub.itemDetails.account || ''
    };
  }
  else if (sub.type === 'folder') {
    criterion = { folder: sub.itemId };
  }
  else if (sub.type === 'tafs') {
    const detailRecord = await getUserSubscriptionDetails(email, sub.type, sub.itemId);
    criterion = {
      tafs: detailRecord?.itemDetails.tafsId,
      year: `${detailRecord?.itemDetails.fiscalYear}`
    };
  }

  // Use specific last notified if provided which should only be for testing
  criterion['approvedStart'] = lastNotified ? lastNotified : sub.lastNotifiedAt;

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
  const userSubscriptions = await getSubscriptionsByUser();

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
