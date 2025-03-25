import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { signIn, signOut } from '../../auth';
import {
  addSubscription,
  removeSubscriptions,
  setSubscriptionFrequency,
  userSubscriptionList,
  userSubscriptionListDetails,
  removeUser
} from '$queries/subscriptions';
import { subscriptionTypes } from '$config/subscriptions';

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
    const data = await request.json();
    if (data.subId) {
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
    const data = await request.json();
    if (data.subId && data.frequency) {
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
  deactivate: async ({ locals }) => {
    // Check login
    const user = (await locals.auth())?.user;
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    await removeUser(user.email);

    // We are returning a redirect here so users land on a page confirming
    //  that they've been deactivated (and what that means)
    redirect(303, '/subscribe/deactivated');
  },
  login: async (params) => {
    // This is not broken, but this does have the chance to return the redirect
    // response. So just in case, we also want to explicitly not return it
    // https://github.com/nextauthjs/next-auth/blob/main/packages/frameworks-sveltekit/src/lib/actions.ts#L75
    await signIn(params);
  },
  logout: async (params) => {
    // Because we are redirecting, we do not want to return the response
    // (if we do, we get a json response in production)
    // https://github.com/nextauthjs/next-auth/blob/main/packages/frameworks-sveltekit/src/lib/actions.ts#L105
    await signOut(params);
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
