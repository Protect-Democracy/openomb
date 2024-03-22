/**
 * Miscellaneous utility functions.
 */

// Dependencies
import { loadEnv } from 'vite';
import { dirname, join as joinPath, basename, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createWriteStream, createReadStream, statSync } from 'node:fs';
import archiver, { ArchiverError } from 'archiver';
import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import type { PutObjectRequest } from '@aws-sdk/client-s3';
import { fromSSO } from '@aws-sdk/credential-providers';
import moment from 'moment';

// Directories (note that __dirname might actually be available globally)
const _dirname = dirname(fileURLToPath(import.meta.url));
const defaultCacheDir = joinPath(_dirname, '..', '.cache');
const defaultCollectionCacheDir = joinPath(defaultCacheDir, 'collection');
const s3AclOptions = [
  'private',
  'public-read',
  'public-read-write',
  'authenticated-read',
  'aws-exec-read',
  'bucket-owner-read',
  'bucket-owner-full-control'
];

// Expected types from environment variables
type ApportionmentEnvironment = {
  baseUrl: string;
  cacheTtl: number;
  cacheDir: string;
  collectionCacheDir: string;
  dbUri: string;
  archiveS3Bucket: string;
  archiveS3Region: string;
  archiveS3Acl: [
    'private',
    'public-read',
    'public-read-write',
    'authenticated-read',
    'aws-exec-read',
    'bucket-owner-read',
    'bucket-owner-full-control'
  ];
  awsSso: boolean;
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
      : 1000 * 60 * 60 * 24 * 15,
    cacheDir: env['APPORTIONMENTS_CACHE_DIR'] || defaultCacheDir,
    collectionCacheDir: env['APPORTIONMENTS_COLLECTION_CACHE_DIR'] || defaultCollectionCacheDir,
    dbUri: env['APPORTIONMENTS_DB_URI'] || '',
    archiveS3Bucket: env['APPORTIONMENTS_ARCHIVE_S3_BUCKET'] || '',
    archiveS3Region: env['APPORTIONMENTS_ARCHIVE_S3_REGION'] || 'us-east-1',
    archiveS3Acl:
      env['APPORTIONMENTS_ARCHIVE_S3_ACL'] &&
      s3AclOptions.includes(env['APPORTIONMENTS_ARCHIVE_S3_ACL'])
        ? env['APPORTIONMENTS_ARCHIVE_S3_ACL']
        : 'public-read',
    awsSso:
      !!env['APPORTIONMENTS_AWS_SSO'] &&
      env['APPORTIONMENTS_AWS_SSO'].toLocaleLowerCase() !== 'false'
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

/**
 * Zips the specified files and directories into a single archive file.
 * @param sources An array of file and directory paths to be included in the archive.
 * @param outputFilename The path of the output archive file.
 * @returns A Promise that resolves when the zipping process is complete.
 * @throws An error if there is an issue with the zipping process.
 */
async function zipFiles(sources: string[], outputFilename: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const outputStream = createWriteStream(outputFilename);
    const archive = archiver('zip', { zlib: { level: 9 } });

    outputStream.on('close', () => {
      resolve();
    });

    archive.on('error', (error: ArchiverError) => {
      reject(error);
    });

    archive.on('warning', function (error: ArchiverError) {
      if (error.code === 'ENOENT') {
        console.warn(error);
      }
      else {
        reject(error);
      }
    });

    archive.pipe(outputStream);

    sources.forEach((source) => {
      const sourcePath = resolvePath(source);
      if (statSync(sourcePath).isDirectory()) {
        archive.directory(sourcePath, basename(sourcePath));
      }
      else {
        archive.file(sourcePath, { name: basename(sourcePath) });
      }
    });

    archive.finalize();
  });
}

/**
 * Puts a file to S3.
 *
 * @param file The path to the local source file.
 * @param s3Path The path on the bucket to store the file.
 * @param s3Bucket Optional name of bucket
 */
async function putS3File(
  file: string,
  s3Path: string,
  s3Bucket: string | undefined = undefined
): Promise<void> {
  const env = environment_variables();

  // Create client
  const s3 = new S3Client({
    region: env.archiveS3Region,
    credentials: env.awsSso ? fromSSO() : undefined
  });

  // Put file parameters
  const params: PutObjectRequest = {
    Bucket: s3Bucket || env.archiveS3Bucket,
    Key: s3Path,
    Body: createReadStream(file),
    ACL: env.archiveS3Acl
  };
  await s3.send(new PutObjectCommand(params));
}

export {
  environment_variables,
  unique,
  parseIntegerFromString,
  parseTimestampFromString,
  md5hash,
  zipFiles,
  putS3File
};
