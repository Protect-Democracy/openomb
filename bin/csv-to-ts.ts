/**
 * Convert CSV to TS/JS file.
 */

// Dependencies
import { Command } from 'commander';
import { keys } from 'lodash-es';
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import packageJson from '../package.json' assert { type: 'json' };

/**
 * Main CLI handler.
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Convert CSV to TS or JS file.')
    .argument('<string>', 'Input CSV')
    .argument('<string>', 'Output TS')
    .parse(process.argv);

  // Read in CSV
  const csvContent = readFileSync(program.args[0], 'utf-8');

  // Parse CSV content
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  // Write arbitrary CSV content to TS file
  const tsData = records.map((record) => {
    const fields = keys(record).map((key) => {
      return `    ${key}: ${JSON.stringify(record[key])},`;
    });
    return `  { ${fields.join(' ')} },`;
  });
  const tsContent = `/**
 * Generated from CSV file
 */

const csvData = [
  ${tsData.join('\n')}
];

export default csvData;
  `;

  // Write to file
  writeFileSync(program.args[1], tsContent);

  // End
  console.log(`Wrote content to: ${program.args[1]}`);
}

cli();
