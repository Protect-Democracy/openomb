import { error } from '@sveltejs/kit';
import { environmentVariables } from '$server/utilities';
import type { LayoutServerLoad } from './$types';

/**
 * Guard for the entire /admin route group.  Every route under src/routes/admin/**
 * inherits this automatically.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const { adminEmails } = environmentVariables();

  // auth() can reject (e.g. a malformed callback-url cookie from a bot/scanner
  // triggers Auth.js's internal config validation) - see the same handling in
  // hooks.server.ts's addHeaders. Treat that as logged out rather than a 500.
  const user = (await locals.auth().catch(() => null))?.user;

  const isAdmin = !!user?.email && adminEmails.includes(user.email.toLowerCase());
  if (!isAdmin) {
    // 404 rather than 401/403: unlike /subscribe's inline checks (which gate an
    // action the user just triggered), a non-admin or bot hitting /admin should
    // not learn the section exists at all.
    error(404, 'Not found');
  }

  return { user };
};
