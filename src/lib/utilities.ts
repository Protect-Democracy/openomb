/**
 * Miscellaneous utility functions.
 */

// Dependencies
import { loadEnv } from 'vite';
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';

// Directories (note that __dirname might actually be available globally)
const _dirname = dirname(fileURLToPath(import.meta.url));
const defaultCacheDir = joinPath(_dirname, '..', '..', '.cache', 'collection');

// Expected types from environment variables
type ApportionmentEnvironment = {
  baseUrl: string;
  cacheTtl: number;
  cacheDir: string;
  dbUri: string;
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
    cacheDir: env['APPORTIONMENTS_CACHE_DIR'] || defaultCacheDir,
    dbUri: env['APPORTIONMENTS_DB_URI'] || ''
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
