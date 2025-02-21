// Dependencies
import { json } from '@sveltejs/kit';

/**
 * User info endpoint
 *
 * IMPORTANT: This route should not be cached by the browser or CDN.
 * See hooks.server.ts for more information.
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  const user = (await locals.auth())?.user;

  return json({
    query: {},
    results: {
      loggedIn: !!user,
      user: user || undefined
    }
  });
}
