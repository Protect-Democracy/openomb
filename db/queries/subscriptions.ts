/**
 * Queries centered around subscriptions.
 */

// Dependencies
import { map } from 'lodash-es'
import { eq, gte, desc, asc, count, countDistinct, and, isNull, inArray } from 'drizzle-orm';
import { db } from '../connection';
import { files } from '../schema/files';
import { tafs } from '../schema/tafs';
import { searches } from '../schema/searches';
import { subscriptions } from '../schema/subscriptions';
import { users } from '../schema/users';
import { formatFileTitle } from '../../src/lib/formatters';

/**
 * Gets the item details for each individual subscription
 */
async function getSubscriptionDetails(sub) {
  if (!sub) {
    return;
  }
  if (sub.type === 'folder') {
    const item = await db.query.files.findFirst({
      where: eq(files.folderId, sub.itemId)
    });
    return {
      ...sub,
      itemDetails: { name: item.folder },
      itemLink: `/folder/${sub.itemId}`,
    };
  } else if (sub.type === 'file') {
    const item = await db.query.files.findFirst({
      where: eq(files.fileId, sub.itemId),
      with: {
        tafs: true
      },
    });
    return {
      ...sub,
      itemDetails: { name: formatFileTitle(item) },
      itemLink: `/file/${sub.itemId}`,
    };
  } else if (sub.type === 'agency') {
    const item = await db.query.tafs.findFirst({
      where: eq(tafs.budgetAgencyTitleId, sub.itemId)
    });
    return {
      ...sub,
      itemDetails: { name: item.budgetAgencyTitle },
      itemLink: `/agency/${sub.itemId}`,
    };
  } else if (sub.type === 'bureau') {
    const [agency,bureau] = sub.itemId.split(',');
    const item = await db.query.tafs.findFirst({
      where: and(
        eq(tafs.budgetAgencyTitleId, agency),
        eq(tafs.budgetBureauTitleId, bureau)
      )
    });
    return {
      ...sub,
      itemDetails: {
        agency: item.budgetAgencyTitle,
        name: item.budgetBureauTitle,
      },
      itemLink: `/agency/${agency}/bureau/${bureau}`,
    };
  } else if (sub.type === 'account') {
    const [agency,bureau,account] = sub.itemId.split(',');
    const item = await db.query.tafs.findFirst({
      where: and(
        eq(tafs.budgetAgencyTitleId, agency),
        eq(tafs.budgetBureauTitleId, bureau),
        eq(tafs.accountTitleId, account)
      )
    });
    return {
      ...sub,
      itemDetails: {
        agency: item.budgetAgencyTitle,
        bureau: item.budgetBureauTitle,
        name: item.accountTitle,
      },
      itemLink: `/agency/${agency}/bureau/${bureau}/account/${account}`,
    };
  } else if (sub.type === 'search') {
    const item = await db.query.searches.findFirst({
      where: eq(searches.id, sub.itemId)
    });
    return {
      ...sub,
      itemDetails: item,
      itemLink: `/search?${new URLSearchParams(item.criterion).toString()}`,
    };
  }
}

/**
 * Gets all subscriptions, with details, grouped by user
 */
export const getSubscriptionsByUser = async function () {
  const userSubs = {};
  const subscriptionResults = await db.select()
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id));
  for (const result of subscriptionResults) {
    if(!userSubs[result.user.email]) {
      userSubs[result.user.email] = [];
    }
    const subDetails = await getSubscriptionDetails(result.subscriptions);
    userSubs[result.user.email].push(subDetails);
  }
  return userSubs;
}

/**
 * Get a single subscription given the user's email, the type, and the item id
 */
export const getUserSubscription = async function (email: string, type: string, itemId: string) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }
  const subscriptionResults = await db.select().from(subscriptions).where(and(
    eq(subscriptions.userId, userResults[0].id),
    eq(subscriptions.type, type),
    eq(subscriptions.itemId, itemId),
  ));

  return subscriptionResults?.[0];
};

/**
 * Get a single subscription given the user's email, the type, and the item id
 * Also provide details for the item that was subscribed to
 */
export const getUserSubscriptionDetails = async function (email: string, type: string, itemId: string) {
  const subscriptionResults = await getUserSubscription(email, type, itemId);

  return await getSubscriptionDetails(subscriptionResults);
};

/**
 * Get all subscriptions associated with the provided email
 */
export const getUserSubscriptionList = async function (email: string) {
  const userResults = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      subscriptions: true,
      searches: true,
    },
  });
  return userResults.subscriptions;
};

/**
 * Get all subscriptions associated with the provided email
 * Also provide details for the item(s) that were subscribed to
 */
export const getUserSubscriptionListDetails = async function (email: string) {
  const subscriptionResults = await getUserSubscriptionList(email);
  return await Promise.all(map(subscriptionResults, getSubscriptionDetails));
};

/**
 * Add a single subscription given the user's email, the type, and the item id
 */
export const addSubscription = async function (email: string, type: string, itemId: string) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }
  const newSubscription = {
    userId: userResults[0].id,
    type,
    itemId,
  };
  const newRecords = await db.insert(subscriptions).values(newSubscription).onConflictDoNothing().returning();
  return newRecords[0];
};

/**
 * Update a subscription's frequency given the subscription id
 * We also provide the current user to verify permission
 */
export const setSubscriptionFrequency = async function (email: string, subscriptionId: string, frequency: string) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }
  const updatedRecords = await db.update(subscriptions).set({ frequency }).where(and(
    eq(subscriptions.userId, userResults[0].id),
    eq(subscriptions.id, subscriptionId),
  )).returning();
  return updatedRecords[0];
};

/**
 * Remove a single subscription given the subscription id
 * We also provide the current user to verify permission
 */
export const removeSubscriptions = async function (email: string, subscriptionId: string | Array<string>) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }

  await db.delete(subscriptions).where(and(
    eq(subscriptions.userId, userResults[0].id),
    Array.isArray(subscriptionId) ? inArray(subscriptions.id, subscriptionId) : eq(subscriptions.id, subscriptionId),
  ));
};

/**
 * Remove a user and all associated data
 */
export const removeUser = async function (email: string) {
  // Deletion cascades, so when user is removed, all entries that reference user id will be removed
  await db.delete(users).where(eq(users.email, email));
}
