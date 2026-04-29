import { env } from '$env/dynamic/public';

/**
 * NOTE: This caused an error in Safari.
 * This avoids an error where scripts referencing this cannot see
 * the svelte library $env import.  @todo - is there a better way to fix this?
 */
// let publicEnv;
// if (BROWSER) {
//   // If we are on the client, use our dynamic public env from svelte
//   publicEnv = (await import('$env/dynamic/public')).env;
// } else {
//   // If we are on the server, use the process env values
//   publicEnv = process.env;
// }

/**
 * Environment variables that are specifically used in our sveltekit application.
 * SvelteKit handles these via $env/dynamic/public on both client and server.
 * https://learn.svelte.dev/tutorial/env-dynamic-public
 */
export default {
  sentrySvelteDsn: env.PUBLIC_SENTRY_SVELTE_DSN || '',
  environment: env.PUBLIC_NODE_ENV == 'production' ? 'production' : 'development'
};
