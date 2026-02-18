/**
 * Make some test data
 */

// Dependencies
import { Command } from 'commander';
import packageJson from '../package.json' assert { type: 'json' };
import { generateTestData } from '$db/test-data';

/**
 * Main CLI handler.
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Create test data by sampling from the actual database.')
    .option('--sample <number>', 'Percentage of data to sample (default: 50)', '50')
    .option(
      '--output <string>',
      'Path to output SQL file (default: db/test-data/sample-test-data.sql)'
    )
    .parse(process.argv);

  const options = program.opts();

  // Start
  console.log('Generating test data...');

  await generateTestData(options.sample ? parseInt(options.sample) : undefined, options.output);

  // End
  console.log(`Generated test data.`);
}

cli();
