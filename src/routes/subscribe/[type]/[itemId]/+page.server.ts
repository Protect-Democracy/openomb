import { error } from '@sveltejs/kit';
import { getAuthUser } from '$lib/auth';
import {
  getUserSubscriptionDetails,
} from '$queries/subscriptions';

export const load: PageServerLoad = async ({ params, locals, fetch, data }) => {
  // Get user session
  const user = await getAuthUser({ locals });
  if (!user) {
    error(401, 'Must be authenticated to access this page');
  }

  let subscription;
  subscription = await getUserSubscriptionDetails(user.email, params.type, params.itemId);
  if (!subscription) {
    // Call our api endpoint to subscribe on the server.
    // (This prevents us from having to duplicate logic)
    const resp = await fetch('/subscribe?/add', {
      method: 'POST',
      headers: {
        'x-sveltekit-action': 'true',
      },
      body: JSON.stringify(params),
    });
    subscription = await getUserSubscriptionDetails(user.email, params.type, params.itemId);
  }
  return {
    user,
    type: params.type,
    itemId: params.itemId,
    subscription,
  };
}
