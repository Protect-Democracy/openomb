/**
 * Collects data from the OMB website.
 */

// Dependencies
import { parse as htmlParser } from 'node-html-parser';
import { Command } from 'commander';
import { MultiProgressBars } from 'multi-progress-bars';
import { eq, notInArray } from 'drizzle-orm';
import chalk from 'chalk';
import { client, db } from '../db/connection';
import { collection } from '../db/schema/collections';
import { file } from '../db/schema/files';
import { request } from '../server/request';
import { loadJsonFile, loadPdfFile } from '../server/load-file';
import { environment_variables, unique } from '../server/utilities';
import packageJson from '../package.json' assert { type: 'json' };

// Constants
const env = environment_variables();

// Main
cli();

/**
 * Main CLI function
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program.version(packageJson.version).description('Collect OMB data').parse(process.argv);

  // Create timestamp and id for this run
  const start = new Date();
  const collectionId = `omb-${start.toISOString()}`;

  // Setup progress bars
  const progress = new MultiProgressBars({
    initMessage: 'Collect OMB data',
    anchor: 'bottom',
    persist: true,
    border: true
  });
  const jsonProgressMessage = 'Loading JSON files';
  progress.addTask(jsonProgressMessage, { type: 'percentage', barTransformFn: chalk.cyan });
  const pdfProgressMessage = 'Loading PDF files';
  progress.addTask(pdfProgressMessage, { type: 'percentage', barTransformFn: chalk.yellow });

  // Save start of collection
  const collectionRecord = {
    collectionId,
    start,
    url: env.baseUrl,
    status: 'started',
    createdAt: start,
    modifiedAt: start
  };
  const collectionRows = await db.insert(collection).values(collectionRecord).returning();
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
    progress.updateTask(jsonProgressMessage, { percentage: (urlIndex + 1) / jsonUrls.length });
  }
  progress.done(jsonProgressMessage, { message: chalk.green('Loaded') });

  // Load PDF files
  const pdfUrls = apportionmentUrls.filter((url) => url.match(/\.pdf$/));

  // Go through each URL and collect data
  for (let urlIndex = 0; urlIndex < pdfUrls.length; urlIndex++) {
    const fileRecord = await loadPdfFile(pdfUrls[urlIndex]);
    fileIds.push(fileRecord.fileId);
    progress.updateTask(pdfProgressMessage, { percentage: (urlIndex + 1) / pdfUrls.length });
  }
  progress.done(pdfProgressMessage, { message: chalk.green('Loaded') });

  // Mark any files not in the list as removed
  await db
    .update(file)
    .set({ removed: true, modifiedAt: new Date() })
    .where(notInArray(file.fileId, fileIds));

  // Save end of collection
  const complete = new Date();
  await db
    .update(collection)
    .set({
      complete,
      status: 'completed',
      modifiedAt: complete
    })
    .where(eq(collection.collectionId, collectionRow.collectionId));

  client.end();
}

/**
 * Get list of all apportionment URL/files (JSON, Excel, at least one PDF).
 */
async function apportionmentList(): Promise<string[]> {
  const homepage = await request(env.baseUrl, {}, { expectedType: 'text' });

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
