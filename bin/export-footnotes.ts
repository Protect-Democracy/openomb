import { Command } from 'commander';
import { inArray, gte, and } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';
import { db } from '../db/connection';
import { files } from '../db/schema/files';
import { footnotes } from '../db/schema/footnotes';
import { putS3File, listS3BucketObjects } from '../server/utilities';
import packageJson from '../package.json' assert { type: 'json' };

async function main() {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Generate a list of footnotes')
    .option('--years <numbers...>', 'A list of years to filter apportionments on')
    .option('--since <string>', 'Date to pull apportionments since')
    .option('--no-archive', 'Do not zip and archive to S3.')
    .option('--out <string>', 'Directory for file to save locally')
    .parse(process.argv);
  const options = program.opts();

  if (!options.archive && !options.out) {
    throw new Error('You must provide a destination (--out <dir>) if using --no-archive');
  }

  // If we are going to archive, let's check that we can connect to S3
  if (options.archive) {
    console.log('Testing S3 connection');
    try {
      await listS3BucketObjects();
      console.info('Success listing S3 bucket.');
    }
    catch (error) {
      throw new Error(`Failed listing S3 bucket: ${error?.message || error}`);
    }

    try {
      await putS3File(testFileStream, `test/test-file-${+new Date()}.txt`);
      console.info('Success testing put to S3.');
    }
    catch (error) {
      throw new Error(`Failed testing put to S3: ${error?.message || error}`);
    }
  }

  console.log('Fetching data');

  const fileFilter = [];
  if (options.years) {
    const parsedYears = options.years.map((y) => parseInt(y)).filter((y) => !!y);
    fileFilter.push(inArray(files.fiscalYear, parsedYears));
  }
  if (options.since) {
    fileFilter.push(gte(files.approvalTimestamp, new Date(options.since)));
  }

  const fileResults = await db
    .select({
      fileId: files.fileId,
      fileName: files.fileName,
      fiscalYear: files.fiscalYear,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(files)
    .where(fileFilter.length > 1 ? and(...fileFilter) : fileFilter);

  const fileReference = fileResults.reduce((accum, entry) => {
    return {
      ...accum,
      [entry.fileId]: {
        name: entry.fileName,
        approved: entry.approvalTimestamp,
        fiscalYear: entry.fiscalYear
      }
    };
  }, {});

  const footnoteResults = await db
    .select()
    .from(footnotes)
    .where(inArray(footnotes.fileId, Object.keys(fileReference)));

  console.log('Building results');
  const combinedData = footnoteResults
    .map((entry) => ({
      number: entry.footnoteNumber,
      contents: entry.footnoteText,
      lineIndex: entry.lineIndex,
      fileName: fileReference[entry.fileId].name,
      fileFiscalYear: fileReference[entry.fileId].fiscalYear,
      fileApproved: fileReference[entry.fileId].approved
    }))
    .sort((entryA, entryB) => new Date(entryB.fileApproved) - new Date(entryA.fileApproved));

  console.log('Writing results to xlsx file');
  // Create our sheet
  const dataSheet = XLSX.utils.json_to_sheet(combinedData);

  // Set column widths for better legibility
  dataSheet['!cols'] = [
    { wch: 15 },
    { wch: 110 },
    { wch: 15 },
    { wch: 60 },
    { wch: 15 },
    { wch: 15 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Footnotes');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true });

  if (options.archive) {
    await putS3File(buffer, 'generated/2024_2025_footnotes.xlsx');
  }
  writeFileSync(`${options.out}/2024_2025_footnotes.xlsx`, buffer);

  console.log('File created!');
  return;
}

main();
