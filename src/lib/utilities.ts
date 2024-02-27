/**
 * Miscellaneous utility functions.
 */

// Dependencies
import { loadEnv } from 'vite';
import { join as joinPath } from 'path';

// Dirname
const __dirname = import.meta.dirname;
const defaultCacheDir = joinPath(__dirname, '..', '..', '.cache', 'collection');

// Expected types from environment variables
type ApportionmentEnvironment = {
  baseUrl: string;
  cacheTtl: number;
  cacheDir: string;
};

/**
 * Get APPORTIONMENT_* variables from the environment.
 *
 * TODO: This might not be good since Vite uses VITE_ without some
 * specific code/config.
 */
function environment_variables(): ApportionmentEnvironment {
  const env = loadEnv('dev', process.cwd(), 'APPORTIONMENTS_');

  return {
    baseUrl: env['APPORTIONMENTS_BASE_URL'] || 'https://apportionment-public.max.gov/',
    cacheTtl: env['APPORTIONMENTS_CACHE_TTL']
      ? parseInt(env['APPORTIONMENTS_CACHE_TTL'])
      : 1000 * 60 * 60 * 24 * 7,
    cacheDir: env['APPORTIONMENTS_CACHE_DIR'] || defaultCacheDir
  };
}

/**
 * Make an array unique.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unique(array: any[] | undefined = undefined): any[] {
  return [...new Set(array)];
}

export { environment_variables, unique };
