import { redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { signOut } from '$server/auth';
import { getSessionUser, requireSessionUser } from '$server/auth-user';
import {
  addSubscription,
  removeSubscriptions,
  setSubscriptionFrequency,
  userSubscriptionList,
  userSubscriptionListDetails,
  removeUser
} from '$queries/subscriptions';
import { isSubscriptionType } from '$config/subscriptions';
import { parseRequestData } from '$lib/utilities';

/** @satisfies {import('./$types').Actions} */
export const actions = {
  add: async ({ locals, request }) => {
    // Check login
    const user = await requireSessionUser(locals);

    // Add subscription
    const data = await request.json();
    if (isSubscriptionType(data.type) && data.itemId) {
      return await addSubscription(user.email, data.type, data.itemId);
    }
  },
  remove: async ({ locals, request }) => {
    // Check login
    const user = await requireSessionUser(locals);

    // Remove subscription
    const data = await parseRequestData(request);
    const subId = data?.subId;
    if (
      (typeof subId === 'string' && subId) ||
      (Array.isArray(subId) && subId.every((id): id is string => typeof id === 'string'))
    ) {
      return await removeSubscriptions(user.email, subId);
    }
  },
  update: async ({ locals, request }) => {
    // Check login
    const user = await requireSessionUser(locals);

    // Update subscription frequency
    const data = await parseRequestData(request);
    const subId = data?.subId;
    const frequency = data?.frequency;
    if (typeof subId === 'string' && subId && typeof frequency === 'string' && frequency) {
      return await setSubscriptionFrequency(user.email, subId, frequency);
    }
  },
  manage: async ({ locals, request }) => {
    // Check login
    const user = await requireSessionUser(locals);

    const data = await request.formData();
    const userSubscriptions = await userSubscriptionList(user.email);

    // Collect our requests so that our updates run async
    const updates: Promise<unknown>[] = [];
    userSubscriptions.forEach((sub) => {
      const frequency = data.get(`frequency-${sub.id}`);
      if (typeof frequency === 'string' && frequency) {
        // Update the frequency in the table
        updates.push(setSubscriptionFrequency(user.email, sub.id, frequency));
      }
    });

    // Delete subscriptions marked for removal
    const removeIds = data.getAll('remove').filter((id): id is string => typeof id === 'string');
    if (removeIds.length > 0) {
      updates.push(removeSubscriptions(user.email, removeIds));
    }

    // Await all updates
    await Promise.all(updates);
    return { success: true };
  },
  deactivate: async (params) => {
    const { locals } = params;
    // Check login
    const user = await requireSessionUser(locals);

    await removeUser(user.email);
    // Prevent signout redirect
    try {
      await signOut(params);
    } catch (e) {
      if (!isRedirect(e)) {
        // Only surface our error if it is not a redirect attempt
        throw e;
      }
    }

    // Redirecting to confirmation page
    redirect(302, '/subscribe/deactivated');
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  // Get user session
  const user = await getSessionUser(locals);

  // If logged in, get subscription details
  let userSubscriptions;
  if (user) {
    userSubscriptions = await userSubscriptionListDetails(user.email);
  }

  return {
    user,
    userSubscriptions,

    pageMeta: {
      title: 'Subscriptions',
      description:
        'Manage your subscriptions for notifications regarding freshly approved apportionments.'
    }
  };
};
