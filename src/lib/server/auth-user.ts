/**
 * Helpers for getting the signed-in user from the Auth.js session.
 */

import { error } from '@sveltejs/kit';
import type { User } from '@auth/sveltekit';

/**
 * A signed-in user. Email is how users are identified throughout the app
 * (subscriptions, searches), so it is guaranteed here.
 */
export type SessionUser = User & { email: string };

/**
 * Get the signed-in user, or null if there is no session or the session has no email.
 */
export async function getSessionUser(
  locals: Pick<App.Locals, 'auth'>
): Promise<SessionUser | null> {
  const user = (await locals.auth())?.user;
  if (!user?.email) {
    return null;
  }

  return { ...user, email: user.email };
}

/**
 * Get the signed-in user, or throw a 401 error if there is none.
 */
export async function requireSessionUser(locals: Pick<App.Locals, 'auth'>): Promise<SessionUser> {
  const user = await getSessionUser(locals);
  if (!user) {
    error(401, 'Must be authenticated to access this page');
  }

  return user;
}
