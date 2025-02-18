// Dependencies
import { json } from '@sveltejs/kit';
import { mUserSubscriptionDetails } from '$queries/subscriptions';

/**
 * Subscription info endpoint
 *
 * IMPORTANT: This route should not be cached by the browser or CDN.
 * See hooks.server.ts for more information.
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, params }) {
  const user = (await locals.auth())?.user;
  const subscription = user
    ? await mUserSubscriptionDetails(user.email, params.type, params.itemId)
    : undefined;

  return json({
    query: {},
    results: {
      subscription
    }
  });
}
