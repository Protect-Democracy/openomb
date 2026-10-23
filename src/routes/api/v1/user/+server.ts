// Dependencies
import { json } from '@sveltejs/kit';
import { getSessionUser } from '$server/auth-user';

/**
 * User info endpoint
 *
 * IMPORTANT: This route should not be cached by the browser or CDN.
 * See hooks.server.ts for more information.
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  const user = await getSessionUser(locals);

  return json({
    query: {},
    results: {
      loggedIn: !!user,
      user: user || undefined
    }
  });
}
