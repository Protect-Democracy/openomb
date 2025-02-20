import { redirect, error } from '@sveltejs/kit';
import { userSubscriptionDetails } from '$queries/subscriptions';
import { subscriptionTypes } from '$config/subscriptions';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  // Get user session
  const user = (await locals.auth())?.user;
  if (!user) {
    // If we don't have a user, we cannot unsubscribe
    error(401, 'Must be authenticated to access this page');
  }

  if (!subscriptionTypes.includes(params.type)) {
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
