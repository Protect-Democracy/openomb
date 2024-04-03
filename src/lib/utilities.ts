/**
 * General utilities that should run fine on server or client.
 */

/**
 * Determine if production using NODE_ENV.
 *
 * @see https://vitejs.dev/guide/env-and-mode.html#env-files
 *
 * @returns True if in production
 */
export const isProduction = (): boolean => import.meta.env.PROD;
