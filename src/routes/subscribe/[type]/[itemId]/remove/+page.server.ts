import { redirect } from '@sveltejs/kit';
import { requireSessionUser } from '$server/auth-user';
import { userSubscriptionDetails } from '$queries/subscriptions';
import { isSubscriptionType } from '$config/subscriptions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  // Get user session
  // We cannot unsubscribe without a user
  const user = await requireSessionUser(locals);

  if (!isSubscriptionType(params.type)) {
    // Ensure type parameter is valid or redirect
    redirect(303, '/');
  }

  const subscription = await userSubscriptionDetails(user.email, params.type, params.itemId);
  if (subscription) {
    // Call our api endpoint to subscribe on the server.
    // (This prevents us from having to duplicate logic)
    await fetch('/subscribe?/remove', {
      method: 'POST',
      headers: {
        'x-sveltekit-action': 'true'
      },
      body: JSON.stringify({ subId: subscription.id })
    });
    if (params.type === 'search') {
      await fetch('/search?/remove', {
        method: 'POST',
        headers: {
          'x-sveltekit-action': 'true'
        },
        body: JSON.stringify({ searchId: subscription.itemId })
      });
    }
  }
  return {
    user,
    type: params.type,
    itemId: params.itemId,
    subscription,

    pageMeta: {
      title: `Unsubscribed from ${params.type}`
    }
  };
};
