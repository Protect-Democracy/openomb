// Dependencies
import { json } from '@sveltejs/kit';
import { mUrlIsReachable } from '../../../../../server/urls';

/**
 * Url Checker endpoint.  Used internally to check if a URL is
 * reachable so that we can only create links to valid URLs.
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  // Any query parameters
  const urlToCheck = url.searchParams.get('url');
  let reachable = false;

  // TODO: It might be good to whitelist things here to help with
  // edge cases where this could get abused.

  // Make sure we have a URL
  if (urlToCheck) {
    reachable = await mUrlIsReachable(urlToCheck);
  }

  return json({
    query: {
      url: urlToCheck
    },
    results: {
      reachable: reachable
    }
  });
}
