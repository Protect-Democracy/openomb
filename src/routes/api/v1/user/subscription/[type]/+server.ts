// Dependencies
import { json } from '@sveltejs/kit';
import { filter } from 'lodash-es';
import { mUserSubscriptionDetails, mUserSubscriptionListDetails } from '$queries/subscriptions';
import { mUserSearch } from '$queries/search';

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
    const subscriptions = user ? await mUserSubscriptionListDetails(user.email) : [];
    return json({
      query: {},
      results: {
        subscriptions: filter(subscriptions, (sub) => sub.type === params.type)
      }
    });
  }

  // If we have search terms, return a subscription that matches
  // Shortcuts
  const u = (p: string) => url.searchParams.get(p);
  const ga = (p: string) => url.searchParams.getAll(p);

  const agencyBureau = url.searchParams.get('agencyBureau')?.split(',');
  const criterion = {
    term: u('term') || '',
    tafs: u('tafs') || '',
    bureau: agencyBureau?.[1] || '',
    agency: agencyBureau?.[0] || '',
    account: u('account') || '',
    approver: ga('approver').join(',') || '',
    year: ga('year').join(','),
    approvedStart: u('approvedStart') ? new Date(`${u('approvedStart')}T00:00:00`) : undefined,
    approvedEnd: u('approvedEnd') ? new Date(`${u('approvedEnd')}T23:59:59`) : undefined,
    lineNum: ga('lineNum').join(','),
    footnoteNum: ga('footnoteNum').join(',')
  };

  const userSearch = user ? await mUserSearch(user.email, criterion) : undefined;
  const subscription =
    user && userSearch
      ? await mUserSubscriptionDetails(user.email, 'search', userSearch.id)
      : undefined;

  return json({
    query: {},
    results: {
      subscription
    }
  });
}
