import { env as publicEnv } from '$env/dynamic/public';

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
