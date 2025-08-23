import { inArray, gte } from 'drizzle-orm';
import { writeFileSync } from 'node:fs';
import path from 'path';
import { db } from '../db/connection';
import { files } from '../db/schema/files';
import { footnotes } from '../db/schema/footnotes';

import XLSX from './xlsx.mjs';

async function main() {
  console.log('Fetching data');

  const fileResults = await db
    .select({
      fileId: files.fileId,
      fileName: files.fileName,
      fiscalYear: files.fiscalYear,
      approvalTimestamp: files.approvalTimestamp
    })
    .from(files)
    .where(gte(files.approvalTimestamp, new Date('2024-01-01T00:00:00')));

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
  const date = new Date();
  writeFileSync(
    path.resolve(import.meta.dirname, 'output', `footnotes_${date.toISOString()}.xlsx`),
    buffer
  );

  console.log('File created!');
  return;
}

main();
