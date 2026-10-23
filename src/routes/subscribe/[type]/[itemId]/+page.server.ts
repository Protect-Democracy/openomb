import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '$server/auth-user';
import { userSubscriptionDetails } from '$queries/subscriptions';
import { isSubscriptionType } from '$config/subscriptions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  // Ensure type parameter is valid or redirect
  const type = params.type;
  if (!isSubscriptionType(type)) {
    redirect(303, '/');
  }

  // Get user session
  const user = await getSessionUser(locals);
  if (!user) {
    // If we don't have a user, it will show the login form again
    return {
      user,
      type,
      itemId: params.itemId
    };
  }

  let subscription;
  subscription = await userSubscriptionDetails(user.email, params.type, params.itemId);
  if (!subscription) {
    // Call our api endpoint to subscribe on the server.
    // (This prevents us from having to duplicate logic)
    await fetch('/subscribe?/add', {
      method: 'POST',
      headers: {
        'x-sveltekit-action': 'true'
      },
      body: JSON.stringify(params)
    });
    subscription = await userSubscriptionDetails(user.email, params.type, params.itemId);
  }
  return {
    user,
    type,
    itemId: params.itemId,
    subscription,

    pageMeta: {
      title: `Subscribed to ${type}`
    }
  };
};
