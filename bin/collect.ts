/**
 * Collects data from the OMB website.
 */

// Dependencies
import { join as joinPath } from 'node:path';
import { parse as htmlParser } from 'node-html-parser';
import { Command } from 'commander';
import { MultiProgressBars } from 'multi-progress-bars';
import { eq, notInArray } from 'drizzle-orm';
import chalk from 'chalk';
import { db, dbConnect, dbDisconnect } from '../db/connection';
import { collections } from '../db/schema/collections';
import { files } from '../db/schema/files';
import { request } from '../server/request';
import { loadJsonFile, loadPdfFile } from '../server/load-file';
import {
  environmentVariables,
  unique,
  zipFiles,
  putS3File,
  listS3BucketObjects
} from '../server/utilities';
import packageJson from '../package.json' assert { type: 'json' };
import { setupNodeSentry } from '../server/sentry';

// Make sure Sentry is setup if DSN is provided
setupNodeSentry();

// Constants
const env = environmentVariables();

// Main
cli();

/**
 * Main CLI function
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Collect OMB data')
    .option('--no-collection', 'Do not do collection/scraping of data.')
    .option('--no-archive', 'Do not zip and archive to S3.')
    .option('--show-progress', 'Show progress of collection.')
    .parse(process.argv);
  const options = program.opts();

  // Connect to db
  console.info(`Started data collection - ${new Date()}`);
  await dbConnect();

  // If we are going to archive, let's check that we can connect to S3
  if (options.archive) {
    try {
      await listS3BucketObjects();
      console.info('Success testing connection to S3.');
    }
    catch (error) {
      console.error('Failed testing connection to S3.');
      throw error;
    }
  }

  // Create timestamp and id for this run
  const start = new Date();
  const collectionId = `omb-${start.toISOString()}`;

  // Setup progress bars
  let progress;
  if (options.showProgress) {
    progress = new MultiProgressBars({
      initMessage: 'Collect OMB data',
      anchor: 'bottom',
      persist: true,
      border: true
    });
  }

  // Collection
  if (options.collection) {
    const jsonProgressMessage = 'Loading JSON files';
    const pdfProgressMessage = 'Loading PDF files';

    // Progress for collection parts
    if (options.showProgress) {
      progress.addTask(jsonProgressMessage, { type: 'percentage', barTransformFn: chalk.cyan });
      progress.addTask(pdfProgressMessage, { type: 'percentage', barTransformFn: chalk.yellow });
    }

    // Save start of collection
    const collectionRecord = {
      collectionId,
      start,
      url: env.baseUrl,
      status: 'started',
      createdAt: start,
      modifiedAt: start
    };
    const collectionRows = await db.insert(collections).values(collectionRecord).returning();
    const collectionRow = collectionRows[0];

    // Keep track of file ids to mark any as removed
    const fileIds: string[] = [];

    // Get list of apportionment URLs
    const apportionmentUrls = await apportionmentList();

    // Load JSON files
    const jsonUrls = apportionmentUrls.filter((url) => url.match(/\.json$/));

    // Go through each URL and collect data
    for (let urlIndex = 0; urlIndex < jsonUrls.length; urlIndex++) {
      const fileRecord = await loadJsonFile(jsonUrls[urlIndex]);
      fileIds.push(fileRecord.fileId);
      if (options.showProgress) {
        progress.updateTask(jsonProgressMessage, { percentage: (urlIndex + 1) / jsonUrls.length });
      }
    }

    if (options.showProgress) {
      progress.done(jsonProgressMessage, { message: chalk.green('Loaded') });
    }

    // Load PDF files
    const pdfUrls = apportionmentUrls.filter((url) => url.match(/\.pdf$/));

    // Go through each URL and collect data
    for (let urlIndex = 0; urlIndex < pdfUrls.length; urlIndex++) {
      const fileRecord = await loadPdfFile(pdfUrls[urlIndex]);
      fileIds.push(fileRecord.fileId);
      if (options.showProgress) {
        progress.updateTask(pdfProgressMessage, { percentage: (urlIndex + 1) / pdfUrls.length });
      }
    }

    if (options.showProgress) {
      progress.done(pdfProgressMessage, { message: chalk.green('Loaded') });
    }

    // Mark any files not in the list as removed
    await db
      .update(files)
      .set({ removed: true, modifiedAt: new Date() })
      .where(notInArray(files.fileId, fileIds));

    // Save end of collection
    const complete = new Date();
    await db
      .update(collections)
      .set({
        complete,
        status: 'completed',
        modifiedAt: complete
      })
      .where(eq(collections.collectionId, collectionRow.collectionId));
  }

  if (options.archive) {
    // Archive progress
    const archiveProgressMessage = 'Archiving data';
    if (options.showProgress) {
      progress.addTask(archiveProgressMessage, {
        type: 'indefinite',
        barTransformFn: chalk.yellow
      });
    }

    // Zip up the cache data
    const archiveFileName = `omb-${start.toISOString().split('T')[0]}-${+start}.zip`;
    const archiveFilePath = joinPath(env.cacheDir, archiveFileName);
    await zipFiles([env.collectionCacheDir], archiveFilePath);

    // Put to S3
    const s3Path = `collections/${archiveFileName}`;
    await putS3File(archiveFilePath, s3Path);

    if (options.showProgress) {
      progress.done(archiveProgressMessage, {
        message: chalk.green(`Archived to s3://${env.archiveS3Bucket}/${s3Path}`)
      });
    }
  }

  // Close progress bar
  progress.close();

  await dbDisconnect();
  console.info('Finished collection');
}

/**
 * Get list of all apportionment URL/files (JSON, Excel, at least one PDF).
 */
async function apportionmentList(): Promise<string[]> {
  // Set ttl to short so that it doesn't use cached version but still creates a
  // file in the cache.
  const homepage = await request(env.baseUrl, {}, { expectedType: 'text', ttl: 1 });

  // Check response
  if (!homepage.meta.response.ok || !homepage.data || homepage.meta.response.status >= 300) {
    throw new Error(
      `Homepage response was not valid | OK: ${homepage.meta.response.ok} | Status: ${homepage.meta.response.status}`
    );
  }

  // Get links in the section
  const parsedHtml = htmlParser(homepage.data.toString());
  let links = parsedHtml.querySelectorAll('#hierarchy a').map((a) => a.getAttribute('href'));

  // Add domain/url to relative links
  links = links.map((link) => (link ? `${env.baseUrl}${link.replace(/^\//, '')}` : ''));
  links = links.filter((link) => !!link);

  return unique(links);
}
