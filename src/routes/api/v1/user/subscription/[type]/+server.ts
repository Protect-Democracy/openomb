// Dependencies
import { json } from '@sveltejs/kit';
import { filter } from 'lodash-es';
import { userSubscriptionDetails, userSubscriptionListDetails } from '$queries/subscriptions';
import { userSearch } from '$queries/search';
import { parseUrlSearchParams } from '$lib/searches';

/**
 * Subscription info endpoint
 *
 * IMPORTANT: This route should not be cached by the browser or CDN.
 * See hooks.server.ts for more information.
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, params, url }) {
  const user = (await locals.auth())?.user;

  if (params.type !== 'search' || !url.searchParams.has('term')) {
    // If we aren't searching for a specific subscription based on search terms, return all with the given type
    const subscriptions = user ? await userSubscriptionListDetails(user.email) : [];
    return json({
      query: {},
      results: {
        subscriptions: filter(subscriptions, (sub) => sub.type === params.type)
      }
    });
  }

  // If we have search terms, return a subscription that matches
  const criterion = parseUrlSearchParams(url.searchParams);
  const userSearchResult = user ? await userSearch(user.email || undefined, criterion) : undefined;
  const subscription =
    user && userSearchResult
      ? await userSubscriptionDetails(user.email || '', 'search', userSearchResult.id)
      : undefined;

  return json({
    query: {},
    results: {
      subscription
    }
  });
}
