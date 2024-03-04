/**
 * Collects data from the OMB website.
 */

// Dependencies
import { parse as htmlParser } from 'node-html-parser';
import { Command } from 'commander';
import { MultiProgressBars } from 'multi-progress-bars';
import chalk from 'chalk';
import { client } from '../db/connection';
import { request } from '../src/lib/request';
import { loadJsonFile, loadPdfFile } from '../src/lib/load-file';
import { environment_variables, unique } from '../src/lib/utilities';
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

  // Get list of apportionment URLs
  const apportionmentUrls = await apportionmentList();

  // Load JSON files
  const jsonUrls = apportionmentUrls.filter((url) => url.match(/\.json$/));

  // Go through each URL and collect data
  for (let urlIndex = 0; urlIndex < jsonUrls.length; urlIndex++) {
    await loadJsonFile(jsonUrls[urlIndex]);
    progress.updateTask(jsonProgressMessage, { percentage: (urlIndex + 1) / jsonUrls.length });
  }
  progress.done(jsonProgressMessage, { message: chalk.green('Loaded') });

  // Load PDF files
  const pdfUrls = apportionmentUrls.filter((url) => url.match(/\.pdf$/));

  // Go through each URL and collect data
  for (let urlIndex = 0; urlIndex < pdfUrls.length; urlIndex++) {
    await loadPdfFile(pdfUrls[urlIndex]);
    progress.updateTask(pdfProgressMessage, { percentage: (urlIndex + 1) / pdfUrls.length });
  }
  progress.done(pdfProgressMessage, { message: chalk.green('Loaded') });

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
