// Dependencies
import { json } from '@sveltejs/kit';
import { getSessionUser } from '$server/auth-user';
import { userSubscriptionDetails } from '$queries/subscriptions';

/**
 * Subscription info endpoint
 *
 * IMPORTANT: This route should not be cached by the browser or CDN.
 * See hooks.server.ts for more information.
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, params }) {
  const user = await getSessionUser(locals);
  const subscription = user
    ? await userSubscriptionDetails(user.email, params.type, params.itemId)
    : undefined;

  return json({
    query: {},
    results: {
      subscription
    }
  });
}
