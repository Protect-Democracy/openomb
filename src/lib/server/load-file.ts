/**
 * Functions for transforming and loading a file into the database.
 */

// Dependencies
import { captureException } from '@sentry/node';
import { groupBy, uniqBy } from 'lodash-es';
import { parse as htmlParser } from 'node-html-parser';
import { eq } from 'drizzle-orm';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { DateTime } from 'luxon';
import { request, urlExists } from './request';
import { files, computeFundsProvidedByParsed } from './db/schema/files';
import { lines } from './db/schema/lines';
import { mLineTypeFromLineNumber } from './db/queries/line-types';
import { footnotes } from './db/schema/footnotes';
import { mAgencyDetails } from '$queries/agencies';
import { tafs, computeTafsId, computeTafsTableId, computeAccountId } from '$schema/tafs';
import {
  parseIntegerFromString,
  parseTimestampFromString,
  environmentVariables,
  md5hash,
  parseBoolean,
  cleanString,
  dbId,
  unique
} from './utilities';
import { db } from '$db/connection';
import pdfFixes from '$data/fixes/pdf-files';
import spendPlanAgencyMatchFixes from '$data/fixes/spend-plan-agency-match';
import agencyMatches from '$data/agency-reference';
import { createSpan } from './sentry-custom';
import { apportionmentTypeSpendPlan, unknownFolderName } from '$config/files';

// Types
import type { filesSelect, filesInsert } from '$schema/files';
import type { linesInsert } from '$schema/lines';
import type { tafsInsert } from '$schema/tafs';
import type { RequestOptions } from './request';

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

// Apportionment file type
export type SpendPlanJson = {
  FileId: number;
  FileName: string;
  FiscalYear: string;
};

// Intermediate schedule record type used for processing data before inserting into DB
type ScheduleRecord = linesInsert | tafsInsert;

// Constants
const env = environmentVariables();
const collectionTimezone = 'America/New_York';

/**
 * Load an apportionment file into the database.
 */
// @todo - figure out how to get around sentry data limits to profile this (separate into transactions?)
async function loadJsonFile(
  jsonUrl: string,
  retries: number = 5
): Promise<filesInsert | undefined> {
  // Get the file.  An occasional error is ok, but we want to make sure it is seen, but doesn't
  // completely stop the process.
  let fileResponse;
  let sourceData;
  try {
    fileResponse = await request(jsonUrl, {}, { expectedType: 'json', retries });
    sourceData = (fileResponse.data || {}) as ApportionmentFileJson;
  } catch (error) {
    const e = new Error(
      `JSON File could not be loaded from URL "${jsonUrl}" with error: ${error instanceof Error ? error.message : error}`
    );
    e.name = 'LoadJsonFileError';
    console.error(e);
    captureException(e);
    return;
  }

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
  // TODO: I think
  const fileRecord: filesInsert = {
    fileId: cleanString(sourceData.FileId.toString()) || `json-${md5hash(jsonUrl)}`,
    fileName: cleanString(sourceData.FileName),
    fiscalYear: parseIntegerFromString(sourceData.FiscalYear),
    approvalTimestamp: parseTimestampFromString(sourceData.ApprovalTimestamp),
    folder: formatFolder(sourceData.Folder),
    folderId: dbId(formatFolder(sourceData.Folder)),
    approverTitle: formatApproverTitle(sourceData.ApproverTitle),
    approverTitleId: dbId(formatApproverTitle(sourceData.ApproverTitle)),
    fundsProvidedBy: cleanString(sourceData.FundsProvidedBy),
    fundsProvidedByParsed: null,
    excelUrl: hasExcelUrl ? expectedExcelUrl : null,
    sourceUrl: jsonUrl,
    pdfUrl: null,
    sourceText: null,
    sourceData: JSON.stringify(sourceData),
    createdAt: new Date(),
    modifiedAt: new Date(),
    removed: false
  };
  fileRecord.fundsProvidedByParsed = computeFundsProvidedByParsed(fileRecord as filesSelect);

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
  // TODO: Ideally we could use transactions so that this could be undone
  // if something happened downstream
  await db.delete(footnotes).where(eq(footnotes.fileId, fileRecord.fileId));
  await db.delete(lines).where(eq(lines.fileId, fileRecord.fileId));
  await db.delete(tafs).where(eq(tafs.fileId, fileRecord.fileId));

  // Go through the schedule data
  const scheduleRecords: ScheduleRecord[] = [];
  for (const [di, d] of sourceData.ScheduleData.entries()) {
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
      modifiedAt: new Date(),
      // Add these properties to match downstream usage
      lineTypeId: undefined as string | undefined,
      tafsId: undefined as string | undefined,
      tafsTableId: undefined as string | undefined,
      accountId: undefined as string | undefined
    };
    line.lineTypeId =
      (await mLineTypeFromLineNumber(cleanString(d.LineNumber)))?.lineTypeId || 'other';
    // TafsId is needed for Table ID
    line.tafsId = computeTafsId(line);
    line.tafsTableId = computeTafsTableId(line);
    line.accountId = computeAccountId(line);
    scheduleRecords.push(line);
  }

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
        lineTypeId: d.lineTypeId,
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

    // There's at least one case where a duplicate footnote number is designated
    // twice, so we need to make sure the records are unique by file, line, and
    // footnote number
    const uniqueFootnoteRecords = uniqBy(
      footnoteRecords,
      (r) => `${r.fileId}-${r.lineIndex}-${r.footnoteNumber}`
    );

    if (uniqueFootnoteRecords.length > 0) {
      await db.insert(footnotes).values(uniqueFootnoteRecords);
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
async function loadPdfFile(
  pdfUrl: string,
  retries: number = 5
): Promise<typeof files.$inferInsert | undefined> {
  // Get the file.  An occasional error is ok, but we want to make sure it is seen, but doesn't
  // completely stop the process.
  let fileResponse;
  try {
    fileResponse = await request(pdfUrl, {}, { expectedType: 'blob', retries });
  } catch (error) {
    const e = new Error(
      `PDF File could not be loaded from URL "${pdfUrl}" with error: ${error?.message || error}`
    );
    e.name = 'LoadPdfFileError';
    console.error(e);
    captureException(e);
    return;
  }

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
  // https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Health%20and%20Human%20Services/PDF/FY2025_Department%20of%20Health%20and%20Human%20Services_Apportionment_2024_09_27.pdf
  // https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Agriculture/PDF/FY2025_Department%20of%20Agriculture_12.19.2024.pdf
  // https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20Defense--Military%20Programs/PDF/FY2026_Department_of_War_Apportionment_2025_11_13.pdf.pdf
  const urlPath = decodeURI(pdfUrl)
    .replace(env.baseUrl, '')
    .replace(/(\.pdf)+$/, '');
  const parts = urlPath.split('/');
  const fiscalYear = parts[0].replace('Fiscal Year ', '');
  const fileName = parts[parts.length - 1];
  const approvalDate = approvalDateFromPdfFileName(fileName);

  // Throw error if we do not have an approval date in the title or fixes
  if (!approvalDate && !pdfFixes[pdfUrl]?.approvalTimestamp) {
    throw new Error(`Approval date not found in file name or file fixes | URL: ${pdfUrl}`);
  }

  const folder = parts[1].replace(/_/g, ' ').trim();

  // Create file record
  const fileRecord: filesInsert = {
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

  // Read text from PDF
  try {
    fileRecord.sourceText = await readPdfText(pdfUrl);
  } catch (error) {
    const e = new Error(
      `PDF File could not be parsed from URL "${pdfUrl}" with error: ${(<Error>error)?.message || error}`
    );
    e.name = 'ParsePdfFileError';
    console.error(e);
    captureException(e);

    // It's ok if we don't get the PDF text ??
  }

  // Handle any fixes
  if (pdfFixes[pdfUrl]) {
    Object.assign(fileRecord, pdfFixes[pdfUrl]);
  }

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
 * Load a spend plan into the database.
 */
// @todo - we do not have any of these yet to test with! but just in case
async function loadJsonSpendPlan(
  jsonUrl: string,
  retries: number = 5
): Promise<filesInsert | undefined> {
  // Get the file.  An occasional error is ok, but we want to make sure it is seen, but doesn't
  // completely stop the process.
  let fileResponse;
  let sourceData;
  try {
    fileResponse = await request(jsonUrl, {}, { expectedType: 'json', retries });
    sourceData = (fileResponse.data || {}) as SpendPlanJson;
  } catch (error) {
    const e = new Error(
      `JSON File could not be loaded from URL "${jsonUrl}" with error: ${error instanceof Error ? error.message : error}`
    );
    e.name = 'LoadJsonFileError';
    console.error(e);
    captureException(e);
    return;
  }

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

  const folder = unknownFolderName;

  // Parse out the file name
  const { fiscalYear, agency, bureau } = parseSpendPlanFilename(sourceData.FileName);

  // TODO: Get folder from parsed agency.

  // Create file record
  // TODO: I think
  const spendPlanRecord: filesInsert = {
    fileId: cleanString(sourceData.FileId.toString()) || `json-${md5hash(jsonUrl)}`,
    fileName: cleanString(sourceData.FileName),
    fileType: apportionmentTypeSpendPlan,
    fiscalYear: sourceData.FiscalYear
      ? parseIntegerFromString(sourceData.FiscalYear)
      : parseIntegerFromString(fiscalYear),
    folder: formatFolder(folder),
    folderId: dbId(formatFolder(folder)),
    budgetAgencyTitle: agency ? formatBudgetAgency(agency) : undefined,
    budgetAgencyTitleId: agency ? dbId(formatBudgetAgency(agency)) : undefined,
    budgetBureauTitle: bureau ? formatBudgetBureau(bureau) : undefined,
    budgetBureauTitleId: bureau ? dbId(formatBudgetBureau(bureau)) : undefined,
    excelUrl: hasExcelUrl ? expectedExcelUrl : null,
    sourceUrl: jsonUrl,
    pdfUrl: null,
    sourceText: null,
    sourceData: JSON.stringify(sourceData),
    createdAt: new Date(),
    modifiedAt: new Date(),
    removed: false
  };

  // Upsert file
  const savedSpendPlanRecords = await db
    .insert(files)
    .values(spendPlanRecord)
    .onConflictDoUpdate({
      target: files.fileId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: (({ createdAt, ...o }) => o)(spendPlanRecord)
    })
    .returning();

  // Return file record
  return savedSpendPlanRecords[0];
}

/**
 * Load a PDF spend plan into the database.
 *
 * Note that we don't try to parse the PDF file directly,
 * we simply make a basic entry in the DB using data from
 * the URL.
 */
async function loadPdfSpendPlan(
  pdfUrl: string,
  retries: number = 5
): Promise<filesInsert | undefined> {
  // Get the file.  An occasional error is ok, but we want to make sure it is seen, but doesn't
  // completely stop the process.
  let fileResponse;
  try {
    fileResponse = await request(pdfUrl, {}, { expectedType: 'blob', retries });
  } catch (error) {
    const e = new Error(
      `PDF File could not be loaded from URL "${pdfUrl}" with error: ${(<Error>error)?.message || error}`
    );
    e.name = 'LoadPdfFileError';
    console.error(e);
    captureException(e);
    return;
  }

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
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20DHS%20FLETC%20OS%20Spend%20Plan.pdf
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20CDC%20Chronic%20Diseases%20Spend%20Plan.pdf
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20CDC%20PHPR%20Spend%20Plan.pdf
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20SAMHSA%20Spend%20Plan.pdf
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20HRSA%20Operating%20Spend%20Plan.pdf
  // https://apportionment-public.max.gov/Spend%20Plans/PY%202024%20DOL%20OJC%20CRA%20Spend%20Plan.pdf
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202026%20VA%20RETF%20Spend%20Plan.pdf
  const urlPath = decodeURIComponent(pdfUrl)
    .replace(env.baseUrl, '')
    .replace(/(\.pdf)+$/, '');
  const parts = urlPath.split('/');
  const fileName = parts[parts.length - 1];

  // Parse out the file name
  const { fiscalYear, agency, bureau } = parseSpendPlanFilename(fileName);

  // Throw error if we do not have an approval date in the title or fixes
  const budgetAgencyTitleId = dbId(formatBudgetAgency(agency || ''));
  if (
    (!agency || !budgetAgencyTitleId) &&
    (!(<filesInsert>pdfFixes[pdfUrl])?.budgetAgencyTitle ||
      !(<filesInsert>pdfFixes[pdfUrl])?.budgetAgencyTitleId)
  ) {
    throw new Error(`Agency not able to be parsed for spend plan | URL: ${pdfUrl}`);
  }

  // Determine Folder from agency
  // IMPORTANT: This depends on data being in the system to query for folder.  So, it is important
  // that regular/spreadsheet apportionments get loaded into the database before spend plans.
  const agencyDetails = await mAgencyDetails(budgetAgencyTitleId || '');
  let folder = agencyDetails?.folder?.folder;
  let folderId = agencyDetails?.folder?.folderId;
  if (!agencyDetails || !agencyDetails.folder.folderId) {
    // Question: Do we want to throw an error if we can't determine the folder?  Or just put in unknown?
    const e = new Error(
      `Folder could not be determined from agency for spend plan | URL: ${pdfUrl} | Agency: ${agency} | Budget Agency Title ID: ${budgetAgencyTitleId}`
    );
    e.name = 'ParseSpendPlanFolderError';
    console.error(e);
    captureException(e);

    folder = unknownFolderName;
    folderId = dbId(folder);
  }

  // Create spend plan record
  const spendPlanRecord: filesInsert = {
    fileId: `pdf-${md5hash(pdfUrl)}`,
    fileName: cleanString(fileName),
    fileType: apportionmentTypeSpendPlan,
    fiscalYear: parseIntegerFromString(fiscalYear),
    folder: folder,
    folderId: folderId,
    budgetAgencyTitle: agency ? formatBudgetAgency(agency) : undefined,
    budgetAgencyTitleId: agency ? dbId(formatBudgetAgency(agency)) : undefined,
    budgetBureauTitle: bureau ? formatBudgetBureau(bureau) : undefined,
    budgetBureauTitleId: bureau ? dbId(formatBudgetBureau(bureau)) : undefined,
    sourceUrl: pdfUrl,
    pdfUrl: pdfUrl,
    createdAt: new Date(),
    modifiedAt: new Date(),
    removed: false
  };

  // Read text from PDF
  try {
    spendPlanRecord.sourceText = await readPdfText(pdfUrl);
  } catch (error) {
    const e = new Error(
      `PDF File could not be parsed from URL "${pdfUrl}" with error: ${(<Error>error)?.message || error}`
    );
    e.name = 'ParsePdfFileError';
    console.error(e);
    captureException(e);

    // It's ok if we don't get the PDF text ??
  }

  // Handle any fixes
  if (pdfFixes[pdfUrl]) {
    Object.assign(spendPlanRecord, pdfFixes[pdfUrl]);
  }

  // Upsert file
  const records = await db
    .insert(files)
    .values(spendPlanRecord)
    .onConflictDoUpdate({
      target: files.fileId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: (({ createdAt, ...o }) => o)(spendPlanRecord)
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
 * Folder approver title
 *
 * Examples:
 *   Acting Deputy Asso Director for National Security Programs
 *   Acting Deputy Associate Director for National Security Programs
 *   Acting Deputy Asso Director for Transportation, Homeland, Justice and Service Programs
 *   Deputy Asso Director for Transportation, Homeland, Justice and Service Programs
 *   for Deputy Asso Director for Transportation, Homeland, Justice and Service Programs
 */
function formatApproverTitle(approverTitle: string | null | undefined): string | null {
  if (!approverTitle) {
    return null;
  }

  approverTitle = approverTitle.replace(/\s+asso\s+/i, ' Associate ').trim();
  return approverTitle.trim();
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

/**
 * Parse information from spend plan file name
 */
export function parseSpendPlanFilename(fileName: string): {
  fiscalYear: string | undefined;
  agency: string | undefined;
  bureau: string | undefined;
} {
  const yearParts = fileName.match(/^.Y[_| ]{0,1}([\d]{2,4})[_| ]{1}(.*)/);
  const results = {
    fiscalYear: yearParts ? yearParts[1].padStart(4, '20') : undefined,
    agency: <string | undefined>undefined,
    bureau: <string | undefined>undefined
  };
  const fileNameRest = yearParts ? yearParts[2] : fileName;

  // Check for acronyms
  const acronymParts = fileNameRest.match(/[A-Z]{2,6}/g);
  if (acronymParts) {
    acronymParts.forEach((acronym) => {
      if (!results['agency']) {
        const agencyResult = agencyMatches.agencies.find((a) =>
          a.short_name?.split('/').some((p) => p === acronym)
        );
        if (agencyResult) {
          results['agency'] = agencyResult.budgetAgencyTitle;
        }
      } else if (!results['bureau']) {
        const bureauResult = agencyMatches.bureaus.find((a) =>
          a.short_name?.split('/').some((p) => p === acronym)
        );
        if (bureauResult && results['agency'] === bureauResult.budgetAgencyTitle) {
          // Make sure our hierarchy aligns before we set this
          results['bureau'] = bureauResult.budgetBureauTitle;
        }
      }
    });

    // If we didn't get an agency, check the orphaned ones for results
    //  (This will add a new agency/bureau that has no apportionments
    //    within it, only spend plans)
    if (!results['agency']) {
      let agencyId: number;
      acronymParts.forEach((acronym) => {
        if (!results['agency']) {
          const agencyResult = agencyMatches.leftoverAgencies.find((a) =>
            a.short_name?.split('/').some((p) => p === acronym)
          );
          if (agencyResult) {
            results['agency'] = agencyResult.name;
            agencyId = agencyResult.id;
          }
        } else if (!results['bureau']) {
          const bureauResult = agencyMatches.leftoverBureaus.find((a) =>
            a.short_name?.split('/').some((p) => p === acronym)
          );
          if (bureauResult && agencyId === bureauResult.parent_id) {
            // Make sure our hierarchy aligns before we set this
            results['bureau'] = bureauResult.name;
          }
        }
      });
    }
  }

  // If we didn't find an agency yet, check against filename patterns we know
  if (!results['agency']) {
    // Department of state
    const match = spendPlanAgencyMatchFixes.find((fix) => fix.pattern.test(fileName));
    if (match) {
      results['agency'] = match.agency;
      results['bureau'] = match.bureau;
    }
  }

  return results;
}

/**
 * Determine approval date from PDF file name.
 *
 * The current assumption is that the date is at the end of the file name,
 * but it can come in a few different formats.
 *
 * YYYY-MM-DD
 * https://apportionment-public.max.gov/Fiscal%20Year%202024/Department%20of%20Defense/PDF/FY2024_Department%20of%20Defense_Apportionment_2023-09-30.pdf
 * YYYY_MM_DD
 * https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Health%20and%20Human%20Services/PDF/FY2025_Department%20of%20Health%20and%20Human%20Services_Apportionment_2024_09_27.pdf
 * MM.DD.YYYY
 * https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Agriculture/PDF/FY2025_Department%20of%20Agriculture_12.19.2024.pdf
 * https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20War/PDF/FY2026_Department%20of%20War_Apportionment_2026-2-3.pdf.pdf.pdf
 * https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20Health%20and%20Human%20Services/PDF/FY2026_Department_of_Health_and_Human_Services_2026-03-04_2.pdf.pdf
 *
 * Approvals actually come in at specific times, so we default to noon.
 *
 * @param fileName File name without the extension at the end.
 * @returns Approval date or null
 */
function approvalDateFromPdfFileName(fileName: string): Date | null {
  const formats = ['yyyy-MM-dd', 'yyyy_MM_dd', 'MM.dd.yyyy', 'yyyy-M-d'];
  const assumedTime = '--12:00:00';
  const assumedFormat = '--HH:mm:ss';

  // Remove any number of .pdf extensions at the end of the file name
  fileName = fileName.replace(/(\.pdf)+$/, '');

  // Get date part
  const datePart = fileName.match(/.*[_| ](\d{2,4}[-_.]\d{1,4}[-_.]\d{1,4})(_[0-9]+)?$/);
  if (!datePart || !datePart[1]) {
    return null;
  }

  for (const format of formats) {
    const parsedDate = DateTime.fromFormat(
      `${datePart[1]}${assumedTime}`,
      `${format}${assumedFormat}`,
      {
        zone: collectionTimezone
      }
    );
    if (parsedDate.isValid) {
      return parsedDate.toJSDate();
    }
  }

  return null;
}

/**
 * Get text from PDF file.
 *
 * @param url URL to read from
 * @returns
 */
async function readPdfText(url: string): Promise<string> {
  // Download the file
  const data = await fetch(url).then(async (response) => await response.arrayBuffer());

  // Load doc
  const doc = await pdfjsLib.getDocument({ data }).promise;

  // Get text from all pages
  const pageTexts = Array.from({ length: doc.numPages }, async (v, i) => {
    return (
      (await (await doc.getPage(i + 1)).getTextContent()).items
        // @ts-expect-error Unsure about this typing issue
        .map((token) => token.str)
        .join(' ')
    );
  });

  // Put together
  let fullText = (await Promise.all(pageTexts)).join(' \n ');

  // TODO: Some additional processing to clean up text
  fullText = fullText.replace(/[^\S\r\n]+/g, ' ').trim();

  return fullText;
}

/**
 * Parse Apportionment list page and get list of all apportionment URL/files
 * (JSON, Excel, at least one PDF).
 */
async function apportionmentListFromHomepage(
  homepageUrl: string,
  requestOptions: RequestOptions = {}
): Promise<string[]> {
  return await createSpan('apportionmentList', async () => {
    // Ideally we want the cache for this to be short so that our data is fresh, but the
    // apportionment homepage can very slow, so we'll default to something that is a bit longer
    requestOptions = requestOptions || {};
    requestOptions.expectedType = requestOptions.expectedType || 'text';
    requestOptions.ttl = requestOptions.ttl || 1000 * 60 * 60;
    requestOptions.retries = requestOptions.retries || 10;
    const homepage = await request(homepageUrl, {}, requestOptions);

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
    links = links.map((link) => (link ? `${homepageUrl}${link.replace(/^\//, '')}` : ''));
    links = links.filter((link) => !!link);

    return unique(links);
  });
}

// Is an apportionment json url.
// (Not from the /spend plans folder and no spend plan in the name)
function isApportionmentJsonUrl(url: string): boolean {
  url = decodeURI(url);
  return !!url.match(/\.json$/i) && !url.match(/spend\s+plan(s)?/i);
}

// Is an apportionment PDF url.
// (Not from the /spend plans folder and no spend plan in the name)
function isApportionmentPdfUrl(url: string): boolean {
  url = decodeURI(url);
  return !!url.match(/\.pdf$/i) && !url.match(/spend\s+plan(s)?/i);
}

// Is a spend plan json url.
// (From the /spend plans folder or with spend plan in the name)
function isSpendPlanJsonUrl(url: string): boolean {
  url = decodeURI(url);
  return !!url.match(/\.json/i) && !!url.match(/spend\s+plan(s)?/i);
}

// Is a spend plan PDF url.
// (From the /spend plans folder or with spend plan in the name)
function isSpendPlanPdfUrl(url: string): boolean {
  url = decodeURI(url);
  return !!url.match(/\.pdf$/i) && !!url.match(/spend\s+plan(s)?/i);
}

// Extra exports for testing
export {
  loadJsonFile,
  loadPdfFile,
  loadJsonSpendPlan,
  loadPdfSpendPlan,
  approvalDateFromPdfFileName,
  readPdfText,
  apportionmentListFromHomepage,
  isApportionmentJsonUrl,
  isApportionmentPdfUrl,
  isSpendPlanJsonUrl,
  isSpendPlanPdfUrl
};
