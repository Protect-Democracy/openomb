import { error, redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { signOut } from '$server/auth';
import {
  addSubscription,
  removeSubscriptions,
  setSubscriptionFrequency,
  userSubscriptionList,
  userSubscriptionListDetails,
  removeUser
} from '$queries/subscriptions';
import { subscriptionTypes } from '$config/subscriptions';
import { parseRequestData } from '$lib/utilities';

/** @satisfies {import('./$types').Actions} */
export const actions = {
  add: async ({ locals, request }) => {
    // Check login
    const user = (await locals.auth())?.user;
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    // Add subscription
    const data = await request.json();
    if (subscriptionTypes.includes(data.type) && data.itemId) {
      return await addSubscription(user.email, data.type, data.itemId);
    }
  },
  remove: async ({ locals, request }) => {
    // Check login
    const user = (await locals.auth())?.user;
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    // Remove subscription
    const data = await parseRequestData(request);
    if (data?.subId) {
      return await removeSubscriptions(user.email, data.subId);
    }
  },
  update: async ({ locals, request }) => {
    // Check login
    const user = (await locals.auth())?.user;
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    // Update subscription frequency
    const data = await parseRequestData(request);
    if (data?.subId && data?.frequency) {
      return await setSubscriptionFrequency(user.email, data.subId, data.frequency);
    }
  },
  manage: async ({ locals, request }) => {
    // Check login
    const user = (await locals.auth())?.user;
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    const data = await request.formData();
    const userSubscriptions = await userSubscriptionList(user.email);

    // Collect our requests so that our updates run async
    const updates = [];
    userSubscriptions.forEach((sub) => {
      if (data.get(`frequency-${sub.id}`)) {
        // Update the frequency in the table
        updates.push(setSubscriptionFrequency(user.email, sub.id, data.get(`frequency-${sub.id}`)));
      }
    });

    // Delete subscriptions marked for removal
    if (data.getAll('remove') && data.getAll('remove').length > 0) {
      updates.push(removeSubscriptions(user.email, data.getAll('remove')));
    }

    // Await all updates
    await Promise.all(updates);
    return { success: true };
  },
  deactivate: async (params) => {
    const { locals } = params;
    // Check login
    const user = (await locals.auth())?.user;
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

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
  const user = (await locals.auth())?.user;

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
