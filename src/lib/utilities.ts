/**
 * Miscellaneous utility functions.
 */

// Dependencies
import { loadEnv } from 'vite';
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import moment from 'moment';

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

/**
 * Parse integer from string
 */
function parseIntegerFromString(value?: string): number | null {
  value = value ? value.replace(/[^0-9.]+/g, '') : undefined;
  return value && value.match(/[0-9]+/) ? parseInt(value, 10) : null;
}

/**
 * Parse timestamp from file API.
 *
 * Example: 2024-02-14-09.53.46.372578
 *          2024-01-01-00.01.01.000001
 */
function parseTimestampFromString(timestamp?: string, utc: boolean = true): Date | null {
  if (!timestamp) {
    return null;
  }

  const dateParse = utc ? moment.utc : moment;
  const parsed =
    timestamp && timestamp.match(/[0-9.-:]+/)
      ? dateParse(timestamp, 'YYYY-MM-DD-HH.mm.ss.SSSSSS')
      : null;
  return parsed && parsed.isValid() ? parsed.toDate() : null;
}

/**
 * Make and MD5 hash from a string.
 */
function md5hash(string: string): string {
  return createHash('md5').update(string).digest('hex');
}

export { environment_variables, unique, parseIntegerFromString, parseTimestampFromString, md5hash };
