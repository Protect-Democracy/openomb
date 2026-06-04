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
import { parseCriterion } from '$lib/searches';
import {
  maxFilesPerNotificationEntry,
  runWeeklyEmailsOn,
  notificationDelayMs,
  notificationRetryCount
} from '$config/subscriptions';
import { formatDate } from '$lib/formatters';
import { renderTemplate } from '$email/render';
import { sendEmail, isRateLimitError } from '$email/send';
import FileNotificationEmail from '$email/templates/FileNotificationEmail.svelte';

// Types
import type { subscriptionSelect } from '$schema/subscriptions';
import type {
  SubscriptionSelectDetails,
  CustomSubscriptionItemDetails,
  SubscriptionDetails
} from '$db/queries/subscriptions';
import type { filesSelectNoSourceData } from '$schema/files';
import type { tafsSelect } from '$schema/tafs';
import type { SavedSearchCriterion } from '$schema/searches';

export type SubscriptionWithFiles = subscriptionSelect &
  SubscriptionDetails & {
    criterion: SavedSearchCriterion;
    fileCount: number;
    files?: filesSelectNoSourceData[];
  };

export type NotificationFailure = { email: string; error: unknown };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send notifications to users based on their subscriptions.
 *
 * Waits between each send to avoid hitting MailGun rate limits. All errors are
 * retried up to notificationRetryCount times. On a 420/429 the inter-email delay
 * is permanently doubled each retry so the rest of the run slows down too. Other
 * errors use a temporary exponential backoff (notificationDelayMs * 2^attempt)
 * that doesn't affect subsequent sends. One user's exhausted retries don't stop
 * the rest of the job.
 */
export async function sendNotifications(): Promise<{
  notificationsSent: {
    email: string;
    notifySubs: SubscriptionWithFiles[];
    subscriptionsNotified: number;
  }[];
  notificationsFailed: NotificationFailure[];
}> {
  const userSubscriptions = await subscriptionsByUser();
  const notificationsSent: {
    email: string;
    notifySubs: SubscriptionWithFiles[];
    subscriptionsNotified: number;
  }[] = [];
  const notificationsFailed: NotificationFailure[] = [];
  let currentDelay = notificationDelayMs;
  let first = true;

  for (const email of Object.keys(userSubscriptions)) {
    // Space out sends; skip the pause before the very first one
    if (!first) {
      await sleep(currentDelay);
    }
    first = false;

    const currentUserSubs = userSubscriptions[email];
    const notifySubs: SubscriptionWithFiles[] = [];
    for (const sub of currentUserSubs) {
      if (includeDailyNotification(sub) || includeWeeklyNotification(sub)) {
        const notification = await getSubscriptionWithFiles(email, sub);
        if (notification) {
          notifySubs.push(notification);
        }
      }
    }

    if (!notifySubs.length) {
      continue;
    }

    const doSend = async () => {
      await sendNotificationEmail(email, notifySubs);
      await Promise.all(map(notifySubs, (sub) => setSubscriptionAsNotified(email, sub.id)));
      notificationsSent.push({ email, notifySubs, subscriptionsNotified: notifySubs.length });
    };

    let attempt = 0;
    while (true) {
      try {
        await doSend();
        break;
      } catch (err) {
        attempt++;
        if (attempt > notificationRetryCount) {
          console.error(`Send failed for ${email} after ${notificationRetryCount} retries:`, err);
          notificationsFailed.push({ email, error: err });
          break;
        }

        let retryDelay: number;
        if (isRateLimitError(err)) {
          // Permanently double the inter-email delay so the rest of the run slows down too
          currentDelay = currentDelay * 2;
          retryDelay = currentDelay;
          console.warn(
            `Rate limit hit for ${email}, retry ${attempt}/${notificationRetryCount} after ${retryDelay}ms`
          );
        } else {
          // Temporary exponential backoff for this retry; doesn't affect the base delay
          retryDelay = notificationDelayMs * Math.pow(2, attempt);
          console.warn(
            `Send failed for ${email}, retry ${attempt}/${notificationRetryCount} after ${retryDelay}ms:`,
            err
          );
        }
        await sleep(retryDelay);
      }
    }
  }

  return { notificationsSent, notificationsFailed };
}

/**
 * Send a specific notification email to a user.
 *
 * @param email Email address to send to.
 * @param notifySubs Array of subscription data.
 */
export async function sendNotificationEmail(email: string, notifySubs: SubscriptionWithFiles[]) {
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
  let criterion = {} as SavedSearchCriterion;

  // Make sure we have itemDetails
  if (!sub.itemDetails) {
    return;
  }

  if (sub.type === 'search' && 'criterion' in sub.itemDetails) {
    criterion = parseCriterion(sub.itemDetails.criterion || undefined);
  } else if (sub.type === 'agency' || sub.type === 'bureau' || sub.type === 'account') {
    const details = sub.itemDetails as CustomSubscriptionItemDetails;
    criterion = {
      agencyBureau: [details.agencyId || '', details.bureauId || ''].filter(Boolean).join(','),
      accountId: details.accountId || undefined
    };
  } else if (sub.type === 'folder') {
    criterion = { folder: sub.itemId };
  } else if (sub.type === 'tafs') {
    const detailRecord = await userSubscriptionDetails(email, sub.type, sub.itemId);
    if (detailRecord?.itemDetails) {
      const details = sub.itemDetails as tafsSelect;
      // Tafs uses the TafsId through the Tafs keyword search, and the specific
      // fiscal year.
      criterion = {
        tafs: details.tafsId,
        year: [details.fiscalYear]
      };
    }
  } else {
    // Unrecognized subscription type, throw error
    throw new Error(`Unrecognized subscription type ${sub.type}`);
  }

  // If criterion is still empty and not a search, then ignore
  if (Object.keys(criterion).length === 0 && sub.type !== 'search') {
    return;
  }

  // Use specific last notified if provided which should only be for testing
  criterion['createdStart'] = lastNotified
    ? formatDate(lastNotified, 'iso-date')
    : sub.lastNotifiedAt
      ? formatDate(sub.lastNotifiedAt, 'iso-date')
      : undefined;

  const fileCount = await mFileSearchFullCount(criterion);
  const files = await mFileSearchPaged({
    ...criterion,
    limit: maxFilesPerNotificationEntry
  });
  const validFiles = files.filter((file) => !!file);

  if (files.length) {
    return {
      ...sub,
      criterion,
      fileCount,
      files: validFiles
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
export function includeDailyNotification(sub: SubscriptionSelectDetails): boolean {
  return !!(
    sub.frequency === 'daily' &&
    sub.lastNotifiedAt &&
    Math.abs(DateTime.fromJSDate(sub.lastNotifiedAt).diffNow(['hours']).as('hours')) > 18
  );
}

/**
 * Should our file be included as a weekly notification
 */
export function includeWeeklyNotification(sub: SubscriptionSelectDetails): boolean {
  return !!(
    sub.frequency === 'weekly' &&
    sub.lastNotifiedAt &&
    new Date().getDay() === runWeeklyEmailsOn &&
    Math.abs(DateTime.fromJSDate(sub.lastNotifiedAt).diffNow(['days']).as('days')) > 6.5
  );
}
