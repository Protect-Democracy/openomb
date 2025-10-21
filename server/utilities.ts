/**
 * Miscellaneous utility functions.
 */

// Dependencies
import { dirname, join as joinPath, basename, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createWriteStream, createReadStream, statSync } from 'node:fs';
import archiver from 'archiver';
import { S3Client, PutObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import type { PutObjectRequest, ListObjectsRequest } from '@aws-sdk/client-s3';
import { fromSSO, fromContainerMetadata } from '@aws-sdk/credential-providers';
import { DateTime } from 'luxon';
import Mailgun from 'mailgun.js';
import type { Interfaces } from 'mailgun.js/definitions';
import packageJson from '../package.json' assert { type: 'json' };
import {
  notifierEmailName,
  notifierEmail,
  replyEmailName,
  replyEmail
} from '../src/config/subscriptions';

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

// Instantiate mailgun library with native FormData
const mailgun = new Mailgun(FormData);
// Store mailgun client so process uses same connection
//  (only really relevant with notification job task)
let mg: undefined | Interfaces.IMailgunClient;

// Expected types from environment variables
type ApportionmentEnvironment = {
  baseUrl: string;
  cacheTtl: number;
  cacheDir: string;
  collectionCacheDir: string;
  dbUri: string;
  dbHost: string;
  dbPort: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  dbAuth: { username: string; password: string } | null;
  archiveS3Bucket: string;
  archiveS3Region: string;
  archiveS3Acl?:
    | 'private'
    | 'public-read'
    | 'public-read-write'
    | 'authenticated-read'
    | 'aws-exec-read'
    | 'bucket-owner-read'
    | 'bucket-owner-full-control';
  awsSso: boolean;
  awsSsoProfile: string;
  awsSsoFilepath: string;
  awsSsoConfigFilepath: string;
  awsSsoStartUrl: string;
  awsSsoAccountId: string;
  awsSsoRegion: string;
  awsSsoRoleName: string;
  awsContainerMetadata: boolean;
  sentryNodeDsn: string;
  environment: string;
  mailgunDomain: string;
  mailgunSendKey: string;
};

// Export package.json
export { packageJson };

/**
 * Get APPORTIONMENT_* variables from the environment.  These are variables
 * to use on the server-side node processes only.
 *
 * Our sveltekit application environment variables belong in /src/lib/environment.ts
 *
 * TODO: At some point, look into moving our server logic into /lib/server/* to prevent accidental
 *  client side usage.  We could then move this to /lib/server/environment and utilize sveltekit
 *  patterns across all files (would require building our scripts as sveltekit library modules)
 */
function environmentVariables(): ApportionmentEnvironment {
  // We use dotenvx to get our .env variables into the process
  return {
    baseUrl: process.env['APPORTIONMENTS_BASE_URL'] || 'https://apportionment-public.max.gov/',
    cacheTtl: process.env['APPORTIONMENTS_CACHE_TTL']
      ? parseInt(process.env['APPORTIONMENTS_CACHE_TTL'])
      : 1000 * 60 * 60 * 24 * 1,
    cacheDir: process.env['APPORTIONMENTS_CACHE_DIR'] || defaultCacheDir,
    collectionCacheDir:
      process.env['APPORTIONMENTS_COLLECTION_CACHE_DIR'] || defaultCollectionCacheDir,
    dbUri: process.env['APPORTIONMENTS_DB_URI'] || '',
    // DB parts will be used if URI is not provided.
    dbHost: process.env['APPORTIONMENTS_DB_HOST'] || '',
    dbPort: process.env['APPORTIONMENTS_DB_PORT'] || '5436',
    dbUser: process.env['APPORTIONMENTS_DB_USER'] || '',
    dbPassword: process.env['APPORTIONMENTS_DB_PASSWORD'] || '',
    dbName: process.env['APPORTIONMENTS_DB_NAME'] || '',
    dbAuth: process.env['APPORTIONMENTS_DB_AUTHENTICATION']
      ? JSON.parse(process.env['APPORTIONMENTS_DB_AUTHENTICATION'])
      : null,
    archiveS3Bucket: process.env['APPORTIONMENTS_ARCHIVE_S3_BUCKET'] || '',
    archiveS3Region: process.env['APPORTIONMENTS_ARCHIVE_S3_REGION'] || 'us-east-1',
    archiveS3Acl:
      process.env['APPORTIONMENTS_ARCHIVE_S3_ACL'] &&
      s3AclOptions.includes(process.env['APPORTIONMENTS_ARCHIVE_S3_ACL'])
        ? (process.env['APPORTIONMENTS_ARCHIVE_S3_ACL'] as ApportionmentEnvironment['archiveS3Acl'])
        : undefined,
    sentryNodeDsn: process.env['APPORTIONMENTS_SENTRY_NODE_DSN'] || '',
    environment: process.env['NODE_ENV'] === 'production' ? 'production' : 'development',
    awsSso:
      !!process.env['APPORTIONMENTS_AWS_SSO'] &&
      process.env['APPORTIONMENTS_AWS_SSO'].toLocaleLowerCase() !== 'false',
    awsSsoProfile: process.env['APPORTIONMENTS_AWS_SSO_PROFILE'] || '',
    awsSsoFilepath: process.env['APPORTIONMENTS_AWS_SSO_FILEPATH'] || '',
    awsSsoConfigFilepath: process.env['APPORTIONMENTS_AWS_SSO_CONFIG_FILEPATH'] || '',
    awsSsoStartUrl: process.env['APPORTIONMENTS_AWS_SSO_START_URL'] || '',
    awsSsoAccountId: process.env['APPORTIONMENTS_AWS_SSO_ACCOUNT_ID'] || '',
    awsSsoRegion: process.env['APPORTIONMENTS_AWS_SSO_REGION'] || '',
    awsSsoRoleName: process.env['APPORTIONMENTS_AWS_SSO_ROLE_NAME'] || '',
    awsContainerMetadata:
      !!process.env['APPORTIONMENTS_AWS_CONTAINER_METADATA'] &&
      process.env['APPORTIONMENTS_AWS_CONTAINER_METADATA'].toLocaleLowerCase() !== 'false',
    mailgunDomain: process.env['MAILGUN_DOMAIN'] || 'mg.openomb.org',
    mailgunSendKey: process.env['MAILGUN_SEND_KEY'] || ''
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
 * Parse OMB timestamp from file data.
 *
 * Example: 2024-02-14-09.53.46.372578
 *          2024-01-01-00.01.01.000001
 */
function parseTimestampFromString(timestamp?: string, utc: boolean = true): Date | null {
  if (!timestamp) {
    return null;
  }

  // First check if it is generally a timestamp we expect
  if (!timestamp.match(/[0-9.-:]+/)) {
    return null;
  }

  // Luxon doesn't have a way to parse the seconds that are a decimal and not a
  // millisecond so we have to remove it.  Make sure there are 3 decimal points.
  timestamp =
    (timestamp.match(/\./g) || []).length === 3 ? timestamp.replace(/\.[0-9]+$/, '') : timestamp;

  const dateOptions = utc ? { zone: 'utc' } : {};
  const parsed = DateTime.fromFormat(timestamp, 'yyyy-LL-dd-HH.mm.ss', dateOptions);
  return parsed && parsed.isValid ? parsed.toJSDate() : null;
}

/**
 * Parse boolean from a string
 */
function parseBoolean(input?: string): boolean | null {
  if (!input) {
    return null;
  }

  if (input.trim().match(/^true|yes|1|y|x|on$/i)) {
    return true;
  }
  else if (input.trim().match(/^false|no|0|n|off$/i)) {
    return false;
  }

  return null;
}

/**
 * Clean string
 */
function cleanString(input?: string): string | null {
  if (!input) {
    return null;
  }

  return input.trim() || null;
}

/**
 * Create database id from a string.
 *
 * For example: Account Title to account-title
 */
function dbId(input?: string | null): string | null {
  if (!input || !input.trim()) {
    return null;
  }

  const parsed = input
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
    .trim();

  return !parsed || parsed === '-' ? null : parsed;
}

/**
 * Make and MD5 hash from a string.
 */
function md5hash(input: string): string {
  return createHash('md5').update(input).digest('hex');
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

    archive.on('error', (error: archiver.ArchiverError) => {
      reject(error);
    });

    archive.on('warning', function (error: archiver.ArchiverError) {
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
 * Get an S3 client.
 */
function getS3Client() {
  const env = environmentVariables();

  // Sso credentials options if needed
  const ssoOptions = {
    profile: env.awsSsoProfile || undefined,
    filepath: env.awsSsoFilepath || undefined,
    configFilepath: env.awsSsoConfigFilepath || undefined,
    ssoStartUrl: env.awsSsoStartUrl || undefined,
    ssoAccountId: env.awsSsoAccountId || undefined,
    ssoRegion: env.awsSsoRegion || undefined,
    ssoRoleName: env.awsSsoRoleName || undefined
  };

  // Credential mechanism
  const credentials = env.awsSso
    ? fromSSO(ssoOptions)
    : env.awsContainerMetadata
      ? fromContainerMetadata()
      : undefined;

  // For debugging
  // console.log(
  //   env.awsSso
  //     ? 'Utilizing AWS fromSSO credentials method'
  //     : env.awsContainerMetadata
  //       ? 'Utilizing AWS fromContainerMetadata credentials method'
  //       : 'Utilizing AWS default credentials method'
  // );

  // Create client
  const s3 = new S3Client({
    region: env.archiveS3Region,
    credentials
  });

  return s3;
}

/**
 * Get all top-level objects in a bucket.
 *
 * @param bucket Bucket name, defaults to configuration value
 */
async function listS3BucketObjects(s3Bucket: string | undefined = undefined) {
  const env = environmentVariables();
  const s3 = getS3Client();

  // Put file parameters
  try {
    const params: ListObjectsRequest = {
      Bucket: s3Bucket || env.archiveS3Bucket
    };
    return await s3.send(new ListObjectsCommand(params));
  }
  catch (error) {
    // Catch errors because the stack trace for these don't
    // reference back to these lines
    throw new Error(
      `Unable to list objects on S3 bucket "${s3Bucket || env.archiveS3Bucket}": ${error?.message || error}`
    );
  }
}

/**
 * Puts a file to S3.
 *
 * @param file The path to the local source file.
 * @param s3Path The path on the bucket to store the file.
 * @param s3Bucket Optional name of bucket
 */
async function putS3File(
  file: string | ReadableStream | Buffer,
  s3Path: string,
  s3Bucket: string | undefined = undefined
): Promise<void> {
  const env = environmentVariables();
  const s3 = getS3Client();

  // Put file parameters
  try {
    const params: PutObjectRequest = {
      Bucket: s3Bucket || env.archiveS3Bucket,
      Key: s3Path,
      Body: typeof file === 'string' ? createReadStream(file) : file,
      ACL: env.archiveS3Acl
    };
    await s3.send(new PutObjectCommand(params));
  }
  catch (error) {
    // Catch errors because the stack trace for these don't
    // reference back to these lines
    throw new Error(
      `Unable to put object to S3 path "${s3Bucket || env.archiveS3Bucket}/${s3Path}": ${error?.message || error}`
    );
  }
}

/**
 * Sends an email via our configured service
 *
 * @param to The recepient email address.
 * @param subject The email subject.
 * @param html The email body html (as string).
 */
async function sendEmail(to: string, subject: string, html: string) {
  const env = environmentVariables();
  if (!mg) {
    // if we do not already have a client instance, create one
    mg = mailgun.client({
      username: 'api',
      key: env.mailgunSendKey,
      useFetch: true
    });
  }

  await mg.messages.create(env.mailgunDomain, {
    to: to,
    from: notifierEmailName ? `${notifierEmailName} <${notifierEmail}>` : notifierEmail,
    subject: subject,
    html: html,
    'h:Reply-To': replyEmailName ? `${replyEmailName} <${replyEmail}>` : replyEmail
  });
}

export {
  environmentVariables,
  unique,
  parseIntegerFromString,
  parseTimestampFromString,
  md5hash,
  zipFiles,
  getS3Client,
  putS3File,
  listS3BucketObjects,
  parseBoolean,
  cleanString,
  dbId,
  sendEmail
};
