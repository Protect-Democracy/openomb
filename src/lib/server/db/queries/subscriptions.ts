/**
 * Queries centered around subscriptions.
 */

// Dependencies
import { map } from 'lodash-es';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../connection';
import { files, type filesSelect } from '../schema/files';
import { tafs, type tafsSelect } from '../schema/tafs';
import { searches, descriptionParsed, type searchesSelect } from '../schema/searches';
import { subscriptions, type subscriptionSelect } from '../schema/subscriptions';
import { users } from '../schema/users';
import { formatTafsFormattedId } from '../../../formatters';
import { memoizeDataAsync } from '../../cache';

export type ItemDetails =
  | filesSelect
  | tafsSelect
  | searchesSelect
  | {
      agency?: string;
      agencyId?: string;
      bureau?: string;
      bureauId?: string;
      account?: string;
      accountId?: string;
    };

export type SubscriptionDetails = {
  itemDetails: ItemDetails;
  description: string;
  itemLink: string;
};

/**
 * Gets the item details for each individual subscription
 *  (fetching by type & itemId allows for caching)
 */
async function getSubscriptionDetails(
  type: string,
  itemId: string
): Promise<SubscriptionDetails | undefined> {
  if (!type || !itemId) {
    return;
  }
  if (type === 'folder') {
    const item = await db.query.files.findFirst({
      where: eq(files.folderId, itemId)
    });
    return {
      itemDetails: item || ({} as filesSelect),
      description: item?.folder || '',
      itemLink: `/folder/${itemId}`
    };
  }
  else if (type === 'tafs') {
    // TAFS subscriptions are for a specific TAFS and Fiscal Year
    // which is what we track as far as "iteractions" go.
    const item = await db.query.tafs.findFirst({
      where: eq(tafs.tafsTableId, itemId)
    });
    return {
      itemDetails: item || ({} as tafsSelect),
      description: `TAFS: ${item && formatTafsFormattedId(item)} - ${item?.accountTitle} (FY ${item?.fiscalYear})`,
      itemLink: `/file/${item?.fileId}#tafs_${item?.tafsTableId}`
    };
  }
  else if (type === 'agency') {
    const item = await db.query.tafs.findFirst({
      where: eq(tafs.budgetAgencyTitleId, itemId)
    });
    return {
      itemDetails: {
        agency: item?.budgetAgencyTitle || '',
        agencyId: item?.budgetAgencyTitleId || ''
      },
      description: item?.budgetAgencyTitle || '',
      itemLink: `/agency/${itemId}`
    };
  }
  else if (type === 'bureau') {
    const [agency, bureau] = itemId.split(',');
    const item = await db.query.tafs.findFirst({
      where: and(eq(tafs.budgetAgencyTitleId, agency), eq(tafs.budgetBureauTitleId, bureau))
    });
    return {
      itemDetails: {
        agency: item?.budgetAgencyTitle || '',
        agencyId: item?.budgetAgencyTitleId || '',
        bureau: item?.budgetBureauTitle || '',
        bureauId: item?.budgetBureauTitleId || ''
      },
      description: item?.budgetBureauTitle || '',
      itemLink: `/agency/${agency}/bureau/${bureau}`
    };
  }
  else if (type === 'account') {
    const [agency, bureau, account] = itemId.split(',');
    const item = await db.query.tafs.findFirst({
      where: and(
        eq(tafs.budgetAgencyTitleId, agency),
        eq(tafs.budgetBureauTitleId, bureau),
        eq(tafs.accountTitleId, account)
      )
    });
    return {
      itemDetails: {
        agency: item?.budgetAgencyTitle || '',
        agencyId: item?.budgetAgencyTitleId || '',
        bureau: item?.budgetBureauTitle || '',
        bureauId: item?.budgetBureauTitleId || '',
        account: item?.accountTitle || '',
        accountId: item?.accountId || ''
      },
      description: item?.accountTitle || '',
      itemLink: `/agency/${agency}/bureau/${bureau}/account/${account}`
    };
  }
  else if (type === 'search') {
    const item = await db.query.searches.findFirst({
      where: eq(searches.id, itemId)
    });
    return {
      itemDetails: item || {},
      description: `Saved Search: ${descriptionParsed(item)}`,
      itemLink: `/search?${new URLSearchParams(item?.criterion).toString()}`
    };
  }
}

/**
 * Memoize detail select for caching
 */
const mGetSubscriptionDetails = memoizeDataAsync(getSubscriptionDetails);

/**
 * Gets all subscriptions, with details, grouped by user
 */
export const subscriptionsByUser = async function (): Promise<
  Record<string, Array<subscriptionSelect>>
> {
  const userSubs: Record<string, Array<subscriptionSelect>> = {};
  const subscriptionResults = await db
    .select()
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id));

  for (const result of subscriptionResults) {
    if (result.users?.email) {
      if (!userSubs[result.users.email]) {
        userSubs[result.users.email] = [];
      }
      const subDetails = await mGetSubscriptionDetails(
        result.subscriptions.type,
        result.subscriptions.itemId
      );
      if (subDetails) {
        userSubs[result.users.email].push({ ...result.subscriptions, ...subDetails });
      }
    }
  }
  return userSubs;
};

/**
 * Get a single subscription given the user's email, the type, and the item id
 */
export const userSubscription = async function (
  email: string,
  type: string,
  itemId: string
): Promise<subscriptionSelect | undefined> {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return;
  }
  const subscriptionResults = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userResults[0].id),
        eq(subscriptions.type, type),
        eq(subscriptions.itemId, itemId)
      )
    );

  return subscriptionResults?.[0];
};

/**
 * Get a single subscription given the user's email, the type, and the item id
 * Also provide details for the item that was subscribed to
 */
export const userSubscriptionDetails = async function (
  email: string,
  type: string,
  itemId: string
) {
  const subscriptionResults = await userSubscription(email, type, itemId);

  if (subscriptionResults) {
    const subscriptionDetails = await mGetSubscriptionDetails(
      subscriptionResults.type,
      subscriptionResults.itemId
    );
    return { ...subscriptionResults, ...subscriptionDetails };
  }
};

/**
 * Get all subscriptions associated with the provided email
 */
export const userSubscriptionList = async function (
  email: string
): Promise<Array<subscriptionSelect>> {
  const userResults = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      subscriptions: true,
      searches: true
    }
  });
  return userResults?.subscriptions || [];
};

/**
 * Get all subscriptions associated with the provided email
 * Also provide details for the item(s) that were subscribed to
 */
export const userSubscriptionListDetails = async function (email: string) {
  const subscriptionResults = await userSubscriptionList(email);
  return await Promise.all(
    map(subscriptionResults, async (result) => {
      const details = await mGetSubscriptionDetails(result.type, result.itemId);
      return { ...result, ...details };
    })
  );
};

/**
 * Add a single subscription given the user's email, the type, and the item id
 */
export const addSubscription = async function (email: string, type: string, itemId: string) {
  const existingSub = await userSubscription(email, type, itemId);
  if (existingSub) {
    return existingSub;
  }

  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }
  const newSubscription = {
    userId: userResults[0].id,
    type,
    itemId
  };
  const newRecords = await db.insert(subscriptions).values(newSubscription).returning();
  return newRecords[0];
};

/**
 * Update a subscription's frequency given the subscription id
 * We also provide the current user to verify permission
 */
export const setSubscriptionFrequency = async function (
  email: string,
  subscriptionId: string,
  frequency: string
) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }
  const updatedRecords = await db
    .update(subscriptions)
    .set({ frequency, modifiedAt: new Date() })
    .where(and(eq(subscriptions.userId, userResults[0].id), eq(subscriptions.id, subscriptionId)))
    .returning();
  return updatedRecords[0];
};

/**
 * Update a subscription's notified date to current timestamp to indicate it has been processed
 * We also provide the current user to verify permission
 */
export const setSubscriptionAsNotified = async function (email: string, subscriptionId: string) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }
  const updatedRecords = await db
    .update(subscriptions)
    .set({ lastNotifiedAt: new Date(), modifiedAt: new Date() })
    .where(and(eq(subscriptions.userId, userResults[0].id), eq(subscriptions.id, subscriptionId)))
    .returning();
  return updatedRecords[0];
};

/**
 * Remove a single subscription given the subscription id
 * We also provide the current user to verify permission
 */
export const removeSubscriptions = async function (
  email: string,
  subscriptionId: string | Array<string>
) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }
  await db
    .delete(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userResults[0].id),
        Array.isArray(subscriptionId)
          ? inArray(subscriptions.id, subscriptionId)
          : eq(subscriptions.id, subscriptionId)
      )
    );
};

/**
 * Remove a user and all associated data
 */
export const removeUser = async function (email: string) {
  // Deletion cascades, so when user is removed, all entries that reference user id will be removed
  await db.delete(users).where(eq(users.email, email));
};
