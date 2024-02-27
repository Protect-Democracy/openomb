/**
 * Collects data from the OMB website.
 */

// Dependencies
import { parse as htmlParser } from 'node-html-parser';
import { Command } from 'commander';
import { request } from '../src/lib/request';
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

  // Get list of apportionment URLs
  const apportionmentUrls = await apportionmentList();

  // Go through each URL and collect data
  console.log(apportionmentUrls);
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
