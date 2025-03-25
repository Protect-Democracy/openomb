import { redirect } from '@sveltejs/kit';
import { userSubscriptionDetails } from '$queries/subscriptions';
import { subscriptionTypes } from '$config/subscriptions';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  // Get user session
  const user = (await locals.auth())?.user;
  if (!user) {
    // If we don't have a user, it will show the login form again
    return {
      user,
      type: params.type,
      itemId: params.itemId
    };
  }

  if (!subscriptionTypes.includes(params.type)) {
    // Ensure type parameter is valid or redirect
    redirect(303, '/');
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
    type: params.type,
    itemId: params.itemId,
    subscription,

    pageMeta: {
      title: `Subscribed to ${params.type}`
    }
  };
};
