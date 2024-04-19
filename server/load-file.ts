/**
 * Functions for transforming and loading a file into the database.
 */

// Dependencies
import { eq } from 'drizzle-orm';
import { request, urlExists } from './request';
import { files, computeFundsProvidedByParsed } from '../db/schema/files';
import { lines, computeLineType } from '../db/schema/lines';
import { footnotes } from '../db/schema/footnotes';
import { tafs, computeTafsId, computeTafsTableId, computeAccountId } from '../db/schema/tafs';
import { groupBy } from 'lodash-es';
import {
  parseIntegerFromString,
  parseTimestampFromString,
  environmentVariables,
  md5hash,
  parseBoolean,
  cleanString,
  dbId
} from './utilities';
import { db, dbConnect } from '../db/connection';

// Apportionment schedule data from API
export type ApportionmentScheduleApi = {
  BudgetAgencyTitle: string;
  BudgetBureauTitle: string;
  AccountTitle: string;
  AllocationAgencyCode?: string;
  CgacAgency?: string;
  BeginPoa?: string;
  EndPoa?: string;
  AvailabilityTypeCode?: string;
  CgacAcct?: string;
  AllocationSubacct?: string;
  Iteration?: string;
  TafsIterationId?: number;
  LineNumber?: string;
  LineSplit?: string;
  LineDescription?: string;
  ApprovedAmount?: number;
  FootnoteNumber?: string;
};

// Apportionment footnote data from API
export type ApportionmentFootnoteApi = {
  FootnoteNumber: string;
  FootnoteText: string;
};

// Apportionment file type
export type ApportionmentFileJson = {
  FileId: number;
  FileName: string;
  FiscalYear: string;
  ApprovalTimestamp: string;
  Folder: string;
  ApproverTitle?: string;
  FundsProvidedBy?: string;
  ScheduleData: Array<ApportionmentScheduleApi>;
  FootnoteData: Array<ApportionmentFootnoteApi>;
};

// Constants
const env = environmentVariables();

/**
 * Load an apportionment file into the database.
 */
async function loadJsonFile(jsonUrl: string): Promise<typeof files.$inferInsert> {
  await dbConnect();

  // Get the file
  const fileResponse = await request(jsonUrl, {}, { expectedType: 'json' });
  const sourceData = (fileResponse.data || {}) as ApportionmentFileJson;

  // Check response
  if (
    !fileResponse.meta.response.ok ||
    !fileResponse.data ||
    typeof fileResponse !== 'object' ||
    fileResponse.meta.response.status >= 300
  ) {
    throw new Error(
      `File response was not valid | OK: ${fileResponse.meta.response.ok} | Status: ${fileResponse.meta.response.status} | URL: ${jsonUrl}`
    );
  }

  // Check Excel file
  const expectedExcelUrl = excelUrl(jsonUrl);
  const hasExcelUrl = await urlExists(expectedExcelUrl, { expectedType: 'blob' });

  // Check file data
  if (!sourceData.FileId) {
    throw new Error(`FileId is missing | URL: ${jsonUrl}`);
  }

  // Create file record
  const fileRecord = {
    fileId: cleanString(sourceData.FileId.toString()),
    fileName: cleanString(sourceData.FileName),
    fiscalYear: parseIntegerFromString(sourceData.FiscalYear),
    approvalTimestamp: parseTimestampFromString(sourceData.ApprovalTimestamp),
    folder: formatFolder(sourceData.Folder),
    folderId: dbId(formatFolder(sourceData.Folder)),
    approverTitle: cleanString(sourceData.ApproverTitle),
    approverTitleId: dbId(sourceData.ApproverTitle),
    fundsProvidedBy: cleanString(sourceData.FundsProvidedBy),
    excelUrl: hasExcelUrl ? expectedExcelUrl : null,
    sourceUrl: jsonUrl,
    sourceData: JSON.stringify(sourceData),
    createdAt: new Date(),
    modifiedAt: new Date(),
    removed: false
  };
  fileRecord.fundsProvidedByParsed = computeFundsProvidedByParsed(fileRecord);

  // Upsert file
  const savedFileRecords = await db
    .insert(files)
    .values(fileRecord)
    .onConflictDoUpdate({
      target: files.fileId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: (({ createdAt, ...o }) => o)(fileRecord)
    })
    .returning();

  // Remove all data for this file.
  // TODO: Ideallly we could use transactions so that this could be undone
  // if something happened downstream
  await db.delete(footnotes).where(eq(footnotes.fileId, fileRecord.fileId));
  await db.delete(lines).where(eq(lines.fileId, fileRecord.fileId));
  await db.delete(tafs).where(eq(tafs.fileId, fileRecord.fileId));

  // Go through the schedule data
  const scheduleRecords = sourceData.ScheduleData.map((d, di) => {
    const line = {
      fileId: cleanString(sourceData.FileId.toString()),
      fiscalYear: fileRecord.fiscalYear,
      lineIndex: di,
      budgetAgencyTitle: formatBudgetAgency(d.BudgetAgencyTitle),
      budgetBureauTitle: formatBudgetBureau(d.BudgetBureauTitle),
      accountTitle: cleanString(d.AccountTitle),
      budgetAgencyTitleId: dbId(formatBudgetAgency(d.BudgetAgencyTitle)),
      budgetBureauTitleId: dbId(formatBudgetBureau(d.BudgetBureauTitle)),
      accountTitleId: dbId(d.AccountTitle),
      allocationAgencyCode: cleanString(d.AllocationAgencyCode),
      cgacAgency: cleanString(d.CgacAgency),
      beginPoa: parseIntegerFromString(d.BeginPoa),
      endPoa: parseIntegerFromString(d.EndPoa),
      availabilityTypeCode: parseBoolean(d.AvailabilityTypeCode),
      cgacAcct: cleanString(d.CgacAcct),
      allocationSubacct: cleanString(d.AllocationSubacct),
      iteration: parseIntegerFromString(d.Iteration),
      tafsIterationId: formatTafsIterationId(d.TafsIterationId),
      lineNumber: cleanString(d.LineNumber),
      lineSplit: cleanString(d.LineSplit),
      lineDescription: cleanString(d.LineDescription),
      approvedAmount: d.ApprovedAmount || null,
      footnoteNumbers: parseFootnotes(d.FootnoteNumber),
      createdAt: new Date(),
      modifiedAt: new Date()
    };
    line.lineType = computeLineType(line);
    // TafsId is needed for Table ID
    line.tafsId = computeTafsId(line);
    line.tafsTableId = computeTafsTableId(line);
    line.accountId = computeAccountId(line);
    return line;
  });

  // Group by TAFS id
  const tafsGroups = groupBy(scheduleRecords, 'tafsId');
  for (const tafsId in tafsGroups) {
    const schedulesData = tafsGroups[tafsId];

    // Get the rows for TAFS data
    const rptCatLine = schedulesData.find((d) => d.lineNumber === 'RptCat') || {};
    const adjAutLine = schedulesData.find((d) => d.lineNumber === 'AdjAut') || {};
    const iterLine = schedulesData.find((d) => d.lineNumber === 'IterNo') || {};

    // Make TAFS record
    const tafsRecord = {
      fileId: fileRecord.fileId,
      tafsId: schedulesData[0].tafsId,
      iteration: schedulesData[0].iteration,
      fiscalYear: schedulesData[0].fiscalYear,
      tafsTableId: schedulesData[0].tafsTableId,
      cgacAgency: schedulesData[0].cgacAgency,
      cgacAcct: schedulesData[0].cgacAcct,
      allocationAgencyCode: schedulesData[0].allocationAgencyCode,
      allocationSubacct: schedulesData[0].allocationSubacct,
      beginPoa: schedulesData[0].beginPoa,
      endPoa: schedulesData[0].endPoa,
      accountId: schedulesData[0].accountId,
      budgetAgencyTitle: schedulesData[0].budgetAgencyTitle,
      budgetBureauTitle: schedulesData[0].budgetBureauTitle,
      accountTitle: schedulesData[0].accountTitle,
      budgetAgencyTitleId: schedulesData[0].budgetAgencyTitleId,
      budgetBureauTitleId: schedulesData[0].budgetBureauTitleId,
      accountTitleId: schedulesData[0].accountTitleId,
      availabilityTypeCode: schedulesData[0].availabilityTypeCode,
      rptCat: parseBoolean(rptCatLine.lineSplit),
      adjAut: parseBoolean(adjAutLine.lineSplit),
      iterationDescription: iterLine.lineDescription,
      tafsIterationId: schedulesData[0].tafsIterationId,
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    // Upsert tafs
    await db.insert(tafs).values(tafsRecord);

    // Filter out any lines that are just meta data
    const linesData = schedulesData.filter(
      (d) => !['IterNo', 'RptCat', 'AdjAut'].includes(d.lineNumber || '')
    );

    // Make line records
    const lineRecords = linesData.map((d) => {
      return {
        tafsTableId: tafsRecord.tafsTableId,
        lineIndex: d.lineIndex,
        lineNumber: d.lineNumber,
        lineSplit: d.lineSplit,
        lineDescription: d.lineDescription,
        approvedAmount: d.approvedAmount,
        fileId: fileRecord.fileId,
        lineType: d.lineType,
        createdAt: new Date(),
        modifiedAt: new Date()
      };
    });

    // Insert line records
    await db.insert(lines).values(lineRecords);

    // Go through and look for footnotes
    const footnoteRecords = [];
    for (const scheduleData of schedulesData) {
      for (const footnoteNumber of scheduleData.footnoteNumbers || []) {
        // Find the footnote data from the source data
        const footnoteData = sourceData.FootnoteData.find(
          (f) => f.FootnoteNumber === footnoteNumber
        );

        // If not in data, then that seems odd
        if (!footnoteData) {
          throw new Error(`Footnote ${footnoteNumber} not found in source data | URL: ${jsonUrl}`);
        }

        // Make record and save
        footnoteRecords.push({
          fileId: cleanString(fileRecord.fileId?.toString()),
          lineIndex: scheduleData.lineIndex,
          footnoteNumber: footnoteNumber,
          footnoteText: cleanString(footnoteData.FootnoteText),
          createdAt: new Date(),
          modifiedAt: new Date()
        });
      }
    }

    if (footnoteRecords.length > 0) {
      await db.insert(footnotes).values(footnoteRecords);
    }
  }

  // Return file record
  return savedFileRecords[0];
}

/**
 * Load an apportionment PDF file into the database.
 *
 * Note that we don't try to parse the PDF file directly,
 * we simply make a basic entry in the DB using data from
 * the URL.
 */
async function loadPdfFile(pdfUrl: string): Promise<typeof files.$inferInsert> {
  await dbConnect();

  // Get the file
  const fileResponse = await request(pdfUrl, {}, { expectedType: 'blob' });

  // Check response
  if (
    !fileResponse.meta.response.ok ||
    !fileResponse.data ||
    typeof fileResponse !== 'object' ||
    fileResponse.meta.response.status >= 300
  ) {
    throw new Error(
      `File response was not valid | OK: ${fileResponse.meta.response.ok} | Status: ${fileResponse.meta.response.status} | URL: ${pdfUrl}`
    );
  }

  // Parse parts from URL
  //
  // Examples:
  // https://apportionment-public.max.gov/Fiscal%20Year%202024/Department%20of%20Defense/PDF/FY2024_Department%20of%20Defense_Apportionment_2023-09-30.pdf
  // https://apportionment-public.max.gov/Fiscal%20Year%202023/Department%20of%20Defense/PDF/FY2023_Department%20of%20Defense_Apportionment_2022-09-30.pdf
  // https://apportionment-public.max.gov/Fiscal%20Year%202023/Department%20of%20Health%20and%20Human%20Services/PDF/FY2023_Department%20of%20Health%20and%20Human%20Services_Apportionment_2022-09-30.pdf
  // https://apportionment-public.max.gov/Fiscal%20Year%202022/Department%20of%20Education/PDF/FY2022_Department%20of%20Education%202022-07-13.pdf
  const urlPath = decodeURI(pdfUrl)
    .replace(env.baseUrl, '')
    .replace(/\.pdf$/, '');
  const parts = urlPath.split('/');
  const fiscalYear = parts[0].replace('Fiscal Year ', '');
  const fileName = parts[parts.length - 1].replace(/\s+/g, '_').trim();

  const approvalDateMatch = fileName.match(/.*_(\d{4}-\d{2}-\d{2})$/);
  if (!approvalDateMatch) {
    throw new Error(`Approval date not found in file name | URL: ${pdfUrl}`);
  }
  const approvalDate = new Date(approvalDateMatch[1]);

  const folderMatch = fileName.match(/^FY\d{4}_(.*)_\d{4}-\d{2}-\d{2}$/);
  if (!folderMatch) {
    throw new Error(`Folder not found in file name | URL: ${pdfUrl}`);
  }
  const folder = folderMatch[1].replace(/_/g, ' ').trim();

  // Create file record
  const fileRecord = {
    fileId: `pdf-${md5hash(pdfUrl)}`,
    fileName: cleanString(fileName),
    fiscalYear: parseIntegerFromString(fiscalYear),
    approvalTimestamp: approvalDate,
    folder: formatFolder(folder),
    folderId: dbId(formatFolder(folder)),
    sourceUrl: pdfUrl,
    pdfUrl: pdfUrl,
    createdAt: new Date(),
    modifiedAt: new Date(),
    removed: false
  };

  // Upsert file
  const records = await db
    .insert(files)
    .values(fileRecord)
    .onConflictDoUpdate({
      target: files.fileId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: (({ createdAt, ...o }) => o)(fileRecord)
    })
    .returning();
  return records[0];
}

/**
 * Folder formatting
 *
 * Examples:
 *   National Aeronautics and Space Administration
 *   Department of Defense--Military Programs
 *   Department of Homeland Security Apportionment
 */
function formatFolder(folder: string): string {
  folder = folder.replace(/\s+apportionments?$/i, '');
  const parts = folder.split('--');
  return parts.length === 2 ? `${parts[0].trim()} (${parts[1].trim()})` : folder.trim();
}

/**
 * Budget agency formatting (similar to folder)
 *
 * Examples:
 *   National Aeronautics and Space Administration
 *   Department of Defense--Military Programs
 */
function formatBudgetAgency(budgetAgency: string): string {
  const parts = budgetAgency.split('--');
  return parts.length === 2 ? `${parts[0].trim()} (${parts[1].trim()})` : budgetAgency.trim();
}

/**
 * Budget bureau formatting
 *
 * Has some similar formatting as folder:
 *   National Aeronautics and Space Administration
 *   Department of Defense--Military Programs
 *
 * TODO: May need some standardizing
 */
function formatBudgetBureau(budgetBureau: string): string {
  const parts = budgetBureau.split('--');
  return parts.length === 2 ? `${parts[0].trim()} (${parts[1].trim()})` : budgetBureau.trim();
}

/**
 * Format tafsIterationId.
 *
 * This comes in as a number, but should really be an ID.  Specifically
 * there are some that come in as 0
 */
function formatTafsIterationId(tafsIterationId?: number | string | null): string | null {
  return tafsIterationId === 0 ? null : tafsIterationId?.toString().trim() || null;
}

/**
 * Determine Excel file url from JSON file.
 */
function excelUrl(jsonUrl: string): string {
  return jsonUrl.replace(/\/JSON\//, '/Excel/').replace(/\.json$/, '.xlsx');
}

/**
 * Parse footnotes from schedule line
 */
function parseFootnotes(footnoteNumberInput?: string): string[] | null {
  // Footnotes can be in format A1,A2 or A1/A2 or A1;A2 or A1; A3, A16,
  // so we split on any non-alphanumeric character.
  footnoteNumberInput = footnoteNumberInput || '';
  const footnoteNumbers = footnoteNumberInput
    .split(/[^a-z0-9]/gi)
    .filter((f) => !!f)
    .map((f) => f.trim().toUpperCase());
  return footnoteNumbers.length > 0 ? footnoteNumbers : null;
}

export { loadJsonFile, loadPdfFile };
