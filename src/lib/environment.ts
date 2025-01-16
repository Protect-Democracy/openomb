import { BROWSER } from 'esm-env';

/**
 * This avoids an error where scripts referencing this cannot see
 * the svelte library $env import.  @todo - is there a better way to fix this?
 */
let publicEnv;
if (BROWSER) {
  // If we are on the client, use our dynamic public env from svelte
  publicEnv = (await import('$env/dynamic/public')).env;
}
else {
  // If we are on the server, use the process env values
  publicEnv = process.env;
}

/**
 * Environment variables that are specifically used in our sveltekit application
 *  Sveltekit has their own methodology for handling these (static for .env, dynamic for process.env)
 *  https://learn.svelte.dev/tutorial/env-dynamic-public
 */
export default {
  // Public variables - these will be available on the client
  sentrySvelteDsn: publicEnv.PUBLIC_SENTRY_SVELTE_DSN || '',
  environment: publicEnv.PUBLIC_NODE_ENV == 'production' ? 'production' : 'development'
};
