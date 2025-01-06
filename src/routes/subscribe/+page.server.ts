import {
  error,
  redirect,
} from '@sveltejs/kit';
import { deserialize } from '$app/forms';
import type { PageServerLoad } from "./$types"
import {
  signIn,
  signOut,
} from '../../auth';
import { getAuthUser } from '$lib/auth';
import {
  addSubscription,
  removeSubscriptions,
  setSubscriptionFrequency,
  getUserSubscriptionList,
  getUserSubscriptionListDetails,
  removeUser,
} from '$queries/subscriptions';

/** @satisfies {import('./$types').Actions} */
export const actions = {
  add: async ({ locals, request }) => {
    // Check login
    const user = await getAuthUser({ locals });
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    // Add subscription
    const data = await request.json();
    if (data.type && data.itemId) {
      await addSubscription(user.email, data.type, data.itemId);
    }
  },
  remove: async ({ locals, request }) => {
    // Check login
    const user = await getAuthUser({ locals });
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    // Remove subscription
    const data = await request.json();
    if (data.subId) {
      await removeSubscriptions(user.email, data.subId);
    }
  },
  update: async ({ locals, request }) => {
    // Check login
    const user = await getAuthUser({ locals });
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    // Update subscription frequency
    const data = await request.json();
    if (data.subId && data.frequency) {
      await setSubscriptionFrequency(user.email, data.subId, data.frequency);
    }
  },
  manage: async ({ locals, request}) => {
    // Check login
    const user = await getAuthUser({ locals });
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    const data = await request.formData();
    const userSubscriptions = await getUserSubscriptionList(user.email);

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
  deactivate: async ({ locals, request}) => {
    // Check login
    const user = await getAuthUser({ locals });
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    await removeUser(user.email);

    return redirect(301, '/subscribe/deactivated');
  },
  login: signIn,
  logout: signOut,
};

export const load: PageServerLoad = async ({ locals }) => {
  // Get user session
  const user = await getAuthUser({ locals });

  // If logged in, get subscription details
  let userSubscriptions;
  if (user) {
    userSubscriptions = await getUserSubscriptionListDetails(user.email);
  }

  return {
    user,
    userSubscriptions,
  }
}

