/**
 * Collects data from the OMB website.
 */

// Dependencies
import { join as joinPath } from 'node:path';
import { Command } from 'commander';
import { MultiProgressBars } from 'multi-progress-bars';
import { eq, notInArray, sql } from 'drizzle-orm';
import chalk from 'chalk';
import { db } from '$db/connection';
import { collections } from '$schema/collections';
import { files } from '$schema/files';
import type { filesSelect } from '$schema/files';
import {
  apportionmentListFromHomepage,
  loadJsonFile,
  loadJsonSpendPlan,
  loadPdfFile,
  loadPdfSpendPlan,
  isApportionmentJsonUrl,
  isApportionmentPdfUrl,
  isSpendPlanJsonUrl,
  isSpendPlanPdfUrl
} from '$server/load-file';
import { environmentVariables, zipFiles, putS3File, listS3BucketObjects } from '$server/utilities';
import { setupCustomSentry, createTransaction, createSpan } from '$server/sentry-custom';
import { loadDefaultLineTypes } from '$queries/line-types';
import { loadDefaultLineDescriptions } from '$queries/line-descriptions';
import packageJson from '../package.json' assert { type: 'json' };

// Make sure Sentry is setup if DSN is provided
setupCustomSentry();

// Constants
const env = environmentVariables();

// Set up readable stream for testing S3 write access
const testFileStream = Buffer.from('TEST DATA');

// Apportionment types
const apportionmentTypes = ['spreadsheet', 'letter', 'spend-plan', 'spend-plan-json'] as const;

// Runs
const collectionTypes = {
  spreadsheet: {
    collect: undefined as boolean | undefined,
    progressMessage: 'Loading JSON Spreadsheet files',
    color: 'cyan' as 'yellow' | 'cyan' | 'magenta' | 'green'
  },
  letter: {
    collect: undefined as boolean | undefined,
    progressMessage: 'Loading PDF Letter files',
    color: 'magenta' as 'yellow' | 'cyan' | 'magenta' | 'green'
  },
  'spend-plan-json': {
    collect: undefined as boolean | undefined,
    progressMessage: 'Loading JSON Spend Plan files',
    color: 'yellow' as 'yellow' | 'cyan' | 'magenta' | 'green'
  },
  'spend-plan': {
    collect: undefined as boolean | undefined,
    progressMessage: 'Loading PDF Spend Plan files',
    color: 'green' as 'yellow' | 'cyan' | 'magenta' | 'green'
  }
};

// Main
createTransaction('apportionment-collect', cli);

/**
 * Main CLI function
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Collect OMB data')
    .argument('[apportionment_url]', 'Optional URL for specific apportionment to collect')
    .option(
      '--new-records-only',
      'Only collect new records.  This will skip any archiving of the data.'
    )
    .option('--no-collection', 'Do not do collection/scraping of data.')
    .option('--no-archive', 'Do not zip and archive to S3.')
    .option('--no-meta', 'Do not load metadata such as line types and descriptions.')
    .option(
      '--apportionment-type <type>',
      `Only collect specific apportionment type(s).  Can be: ${apportionmentTypes.join(', ')}.`
    )
    .option('--show-progress', 'Show progress of collection.')
    .parse(process.argv);
  const options = program.opts();
  const args = program.args;
  const apportionmentUrl = args[0];

  console.info(`Started data collection - ${new Date()}`);

  // If just a single URL, don't archive
  if (apportionmentUrl) {
    options.archive = false;
  }

  // If new records only, don't archive
  if (options.newRecordsOnly) {
    options.archive = false;
  }

  // If we are going to archive, let's check that we can connect to S3
  if (options.archive) {
    try {
      await listS3BucketObjects();
      console.info('Success listing S3 bucket.');
    } catch (error) {
      throw new Error(`Failed listing S3 bucket: ${error?.message || error}`);
    }

    try {
      await putS3File(testFileStream, `test/test-file-${+new Date()}.txt`);
      console.info('Success testing put to S3.');
    } catch (error) {
      throw new Error(`Failed testing put to S3: ${error?.message || error}`);
    }
  }

  // Mark things for collection
  apportionmentTypes.forEach((type) => {
    collectionTypes[type].collect =
      !options.apportionmentType || options.apportionmentType === type;
  });

  // Create timestamp and id for this run
  const start = new Date();
  const collectionId = `omb-${options.newRecordsOnly ? 'new-records-only' : 'full'}-${start.toISOString()}`;

  // Setup progress bars
  let progress: MultiProgressBars | undefined = undefined;
  if (options.showProgress) {
    // TODO: Move away from MultiProgressBars. It takes over the console object and
    // doesn't give it back until progress.close() is called.  This is bad in general,
    // but specifically means that console.info() is not available and will through an error.
    progress = new MultiProgressBars({
      initMessage: 'Collect OMB data',
      anchor: 'bottom',
      persist: true,
      border: true
    });
  }

  // Collection
  if (options.collection) {
    // Progress for collection parts
    if (options.showProgress && !!progress) {
      apportionmentTypes.forEach((type) => {
        progress.addTask(collectionTypes[type].progressMessage, {
          type: 'percentage',
          barTransformFn: chalk[collectionTypes[type].color]
        });
      });
    }

    // Save start of collection
    const collectionRecord = {
      collectionId,
      start,
      url: apportionmentUrl ? apportionmentUrl : env.baseUrl,
      status: 'started',
      createdAt: start,
      modifiedAt: start
    };
    const collectionRows = await db.insert(collections).values(collectionRecord).returning();
    const collectionRow = collectionRows[0];

    // Load up metadata if needed
    if (options.meta) {
      await loadDefaultLineTypes();
      await loadDefaultLineDescriptions();
    }

    // Keep track of file ids to mark any as removed
    const fileIds: string[] = [];

    // Get list of apportionment URLs
    let apportionmentUrls;
    if (apportionmentUrl) {
      apportionmentUrls = [apportionmentUrl];
    } else {
      try {
        apportionmentUrls = await apportionmentListFromHomepage(env.baseUrl);
      } catch (error) {
        throw new Error(
          `IMPORTANT: Failed getting apportionment list from homepage: ${error?.message || error}`
        );
      }
    }

    // Load JSON files
    const jsonUrls = apportionmentUrls.filter((url: string) => isApportionmentJsonUrl(url));

    // Go through each JSON URL and collect data
    if (collectionTypes.spreadsheet.collect) {
      await createSpan('loadJsonFile[]', async () => {
        for (let urlIndex = 0; urlIndex < jsonUrls.length; urlIndex++) {
          // If new records only, check if file exists
          let existingRecord;
          if (options.newRecordsOnly) {
            existingRecord = await findFileBySourceUrl(jsonUrls[urlIndex]);
            if (existingRecord) {
              fileIds.push(existingRecord.fileId);
            }
          }

          // Add new record
          if (!existingRecord) {
            try {
              const fileRecord = await loadJsonFile(jsonUrls[urlIndex]);
              if (fileRecord) {
                fileIds.push(fileRecord.fileId);
              }
            } catch (error) {
              // Note that a HTTP error will be caught and sent to Sentry but will not bubble up,
              // but everything else will.
              throw new Error(
                `IMPORTANT: Failed loading JSON file from URL "${jsonUrls[urlIndex]}": ${error?.message || error}`
              );
            }
          }

          if (options.showProgress && !!progress) {
            progress.updateTask(collectionTypes.spreadsheet.progressMessage, {
              percentage: (urlIndex + 1) / jsonUrls.length
            });
          }
        }
      });
    }

    if (options.showProgress && !!progress) {
      progress.done(collectionTypes.spreadsheet.progressMessage, {
        message: collectionTypes.spreadsheet.collect
          ? chalk.green('Loaded')
          : chalk.yellow('Skipped')
      });
    }

    // Load JSON spend plans
    const jsonSpendPlanUrls = apportionmentUrls.filter((url: string) => isSpendPlanJsonUrl(url));

    // Go through each JSON URL and collect data
    if (collectionTypes['spend-plan-json'].collect) {
      await createSpan('loadJsonSpendPlan[]', async () => {
        for (let urlIndex = 0; urlIndex < jsonSpendPlanUrls.length; urlIndex++) {
          // If new records only, check if file exists
          let existingRecord;
          if (options.newRecordsOnly) {
            existingRecord = await findFileBySourceUrl(jsonSpendPlanUrls[urlIndex]);
            if (existingRecord) {
              fileIds.push(existingRecord.fileId);
            }
          }

          // Add new record
          if (!existingRecord) {
            try {
              const spendPlanRecord = await loadJsonSpendPlan(jsonSpendPlanUrls[urlIndex]);
              if (spendPlanRecord) {
                fileIds.push(spendPlanRecord.fileId);
              }
            } catch (error) {
              // Note that a HTTP error will be caught and sent to Sentry but will not bubble up,
              // but everything else will.
              throw new Error(
                `IMPORTANT: Failed loading JSON spend plan from URL "${jsonSpendPlanUrls[urlIndex]}": ${error?.message || error}`
              );
            }
          }

          if (options.showProgress && !!progress) {
            progress.updateTask(collectionTypes['spend-plan-json'].progressMessage, {
              percentage: (urlIndex + 1) / jsonSpendPlanUrls.length
            });
          }
        }
      });
    }

    if (options.showProgress && !!progress) {
      progress.done(collectionTypes['spend-plan-json'].progressMessage, {
        message: collectionTypes['spend-plan-json'].collect
          ? chalk.green('Loaded')
          : chalk.yellow('Skipped')
      });
    }

    // Load PDF Apportionment files.  Doesn't have "spend plan" in  the name
    const pdfApportionmentUrls = apportionmentUrls.filter((url: string) =>
      isApportionmentPdfUrl(url)
    );

    // Go through each URL and collect data
    if (collectionTypes.letter.collect) {
      await createSpan('loadPdfFile[]', async () => {
        for (let urlIndex = 0; urlIndex < pdfApportionmentUrls.length; urlIndex++) {
          // If new records only, check if file exists
          let existingRecord;
          if (options.newRecordsOnly) {
            existingRecord = await findFileBySourceUrl(pdfApportionmentUrls[urlIndex]);
            if (existingRecord) {
              fileIds.push(existingRecord.fileId);
            }
          }

          // Add new record
          if (!existingRecord) {
            try {
              const fileRecord = await loadPdfFile(pdfApportionmentUrls[urlIndex]);
              if (fileRecord) {
                fileIds.push(fileRecord.fileId);
              }
            } catch (error) {
              // Note that a HTTP error will be caught and sent to Sentry but will not bubble up,
              // but everything else will.
              throw new Error(
                `IMPORTANT: Failed loading PDF file from URL "${pdfApportionmentUrls[urlIndex]}": ${error?.message || error}`
              );
            }
          }

          if (options.showProgress && !!progress) {
            progress.updateTask(collectionTypes.letter.progressMessage, {
              percentage: (urlIndex + 1) / pdfApportionmentUrls.length
            });
          }
        }
      });
    }

    if (options.showProgress && !!progress) {
      progress.done(collectionTypes.letter.progressMessage, {
        message: collectionTypes.letter.collect ? chalk.green('Loaded') : chalk.yellow('Skipped')
      });
    }

    // Load PDF Spend Plan files.  Has "spend plan" in the name
    const pdfSpendPlanUrls = apportionmentUrls.filter((url) => isSpendPlanPdfUrl(url));

    if (collectionTypes['spend-plan'].collect) {
      await createSpan('loadPdfSpendPlan[]', async () => {
        for (let urlIndex = 0; urlIndex < pdfSpendPlanUrls.length; urlIndex++) {
          // If new records only, check if file exists
          let existingRecord;
          if (options.newRecordsOnly) {
            existingRecord = await findFileBySourceUrl(pdfSpendPlanUrls[urlIndex]);
            if (existingRecord) {
              fileIds.push(existingRecord.fileId);
            }
          }

          // Add new record
          if (!existingRecord) {
            try {
              const spendPlanRecord = await loadPdfSpendPlan(pdfSpendPlanUrls[urlIndex]);
              if (spendPlanRecord) {
                fileIds.push(spendPlanRecord.fileId);
              }
            } catch (error) {
              // Note that a HTTP error will be caught and sent to Sentry but will not bubble up,
              // but everything else will.
              throw new Error(
                `IMPORTANT: Failed loading PDF spend plan from URL "${pdfSpendPlanUrls[urlIndex]}": ${error?.message || error}`
              );
            }
          }

          if (options.showProgress && !!progress) {
            progress.updateTask(collectionTypes['spend-plan'].progressMessage, {
              percentage: (urlIndex + 1) / pdfSpendPlanUrls.length
            });
          }
        }
      });
    }

    if (options.showProgress && !!progress) {
      progress.done(collectionTypes['spend-plan'].progressMessage, {
        message: collectionTypes['spend-plan'].collect
          ? chalk.green('Loaded')
          : chalk.yellow('Skipped')
      });
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

    // Now finally let's make sure everything is as efficient as possible
    for (const table of ['files', 'tafs', 'lines', 'footnotes', 'collections']) {
      await db.execute(sql.raw(`vacuum analyze ${table}`));
    }
  }

  // Don't archive if only getting new records
  if (options.archive) {
    // Archive progress
    const archiveProgressMessage = 'Archiving data';
    if (options.showProgress && !!progress) {
      progress.addTask(archiveProgressMessage, {
        type: 'indefinite',
        barTransformFn: chalk.magenta
      });
    }

    // Zip up the cache data
    const archiveFileName = `omb-${start.toISOString().split('T')[0]}-${+start}.zip`;
    const archiveFilePath = joinPath(env.cacheDir, archiveFileName);
    await zipFiles([env.collectionCacheDir], archiveFilePath);

    // Put to S3
    const s3Path = `collections/${archiveFileName}`;
    await putS3File(archiveFilePath, s3Path);

    if (options.showProgress && !!progress) {
      progress.done(archiveProgressMessage, {
        message: chalk.green(`Archived to s3://${env.archiveS3Bucket}/${s3Path}`)
      });
    }
  }

  // Close any progress bar
  progress?.close();

  console.info('Finished collection');
}

/**
 * Check database for existing record by source URL.
 *
 * @param sourceUrl Source URL to check for
 * @returns Existing record or null
 */
async function findFileBySourceUrl(sourceUrl: string): Promise<filesSelect | null> {
  const existingRecords = await db.query.files.findFirst({
    where: eq(files.sourceUrl, sourceUrl)
  });
  return existingRecords ? existingRecords : null;
}
