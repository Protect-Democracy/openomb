/**
 * Functions for transforming and loading a file into the database.
 */

// Dependencies
import { request, urlExists } from './request';
import { file } from '../db/schema/files';
import { schedule } from '../db/schema/schedules';
import { footnote } from '../db/schema/footnotes';
import {
  parseIntegerFromString,
  parseTimestampFromString,
  environment_variables,
  md5hash
} from './utilities';
import { db } from '../db/connection';

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
const env = environment_variables();

/**
 * Load an apportionment file into the database.
 */
async function loadJsonFile(jsonUrl: string): Promise<typeof file.$inferInsert> {
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
    fileId: sourceData.FileId.toString().trim(),
    fileName: sourceData.FileName.trim(),
    fiscalYear: parseIntegerFromString(sourceData.FiscalYear),
    approvalTimestamp: parseTimestampFromString(sourceData.ApprovalTimestamp),
    folder: formatFolder(sourceData.Folder),
    approverTitle: sourceData.ApproverTitle?.trim() || null,
    fundsProvidedBy: sourceData.FundsProvidedBy?.trim() || null,
    excelUrl: hasExcelUrl ? expectedExcelUrl : null,
    sourceUrl: jsonUrl,
    sourceData: JSON.stringify(sourceData),
    createdAt: new Date(),
    modifiedAt: new Date(),
    removed: false
  };

  // Upsert file
  const savedFileRecords = await db
    .insert(file)
    .values(fileRecord)
    .onConflictDoUpdate({
      target: file.fileId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: (({ createdAt, ...o }) => o)(fileRecord)
    })
    .returning();

  // Schedule data
  const scheduleRecords = sourceData.ScheduleData.map((d, di) => {
    return {
      fileId: sourceData.FileId.toString().trim(),
      scheduleIndex: di,
      budgetAgencyTitle: formatBudgetAgency(d.BudgetAgencyTitle),
      budgetBureauTitle: formatBudgetBureau(d.BudgetBureauTitle),
      accountTitle: d.AccountTitle.trim(),
      allocationAgencyCode: d.AllocationAgencyCode?.trim(),
      cgacAgency: d.CgacAgency?.trim() || null,
      beginPoa: parseIntegerFromString(d.BeginPoa),
      endPoa: parseIntegerFromString(d.EndPoa),
      availabilityTypeCode: d.AvailabilityTypeCode?.trim() || null,
      cgacAcct: d.CgacAcct?.trim() || null,
      allocationSubacct: d.AllocationSubacct?.trim() || null,
      iteration: parseIntegerFromString(d.Iteration),
      tafsIterationId: formatTafsIterationId(d.TafsIterationId),
      lineNumber: d.LineNumber?.trim() || null,
      lineSplit: d.LineSplit?.trim() || null,
      lineDescription: d.LineDescription?.trim() || null,
      approvedAmount: d.ApprovedAmount || null,
      createdAt: new Date(),
      modifiedAt: new Date()
    };
  });
  for (const scheduleRecord of scheduleRecords) {
    await db
      .insert(schedule)
      .values(scheduleRecord)
      .onConflictDoUpdate({
        target: [schedule.fileId, schedule.scheduleIndex],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set: (({ createdAt, ...o }) => o)(scheduleRecord)
      })
      .returning();
  }

  // TODO: Need to delete any schedule data are no longer in the file

  // Go through schedule data and add footnotes
  for (const scheduleData of sourceData.ScheduleData) {
    if (scheduleData.FootnoteNumber) {
      // Footnotes can be in format A1,A2 or A1/A2
      const splitChar = scheduleData.FootnoteNumber.includes(',') ? ',' : '/';
      const footnotes = scheduleData.FootnoteNumber.split(splitChar).filter((f) => !!f);
      for (let footnoteNumber of footnotes) {
        footnoteNumber = footnoteNumber.trim();

        // Find footnote text in source data
        const footnoteData = sourceData.FootnoteData.find(
          (f) => f.FootnoteNumber === footnoteNumber
        );

        // If not in data, then that seems odd
        if (!footnoteData) {
          throw new Error(`Footnote ${footnoteNumber} not found in source data | URL: ${jsonUrl}`);
        }

        if (footnoteData) {
          // Make record and save
          const footnoteRecord = {
            fileId: sourceData.FileId.toString().trim(),
            scheduleIndex: sourceData.ScheduleData.indexOf(scheduleData),
            footnoteNumber: footnoteNumber,
            footnoteText: footnoteData.FootnoteText.trim(),
            createdAt: new Date(),
            modifiedAt: new Date()
          };
          await db
            .insert(footnote)
            .values(footnoteRecord)
            .onConflictDoUpdate({
              target: [footnote.fileId, footnote.scheduleIndex, footnote.footnoteNumber],
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              set: (({ createdAt, ...o }) => o)(footnoteRecord)
            })
            .returning();
        }
      }
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
async function loadPdfFile(pdfUrl: string): Promise<typeof file.$inferInsert> {
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
    fileName: fileName,
    fiscalYear: parseIntegerFromString(fiscalYear),
    approvalTimestamp: approvalDate,
    folder: folder,
    sourceUrl: pdfUrl,
    pdfUrl: pdfUrl,
    createdAt: new Date(),
    modifiedAt: new Date(),
    removed: false
  };

  // Upsert file
  const records = await db
    .insert(file)
    .values(fileRecord)
    .onConflictDoUpdate({
      target: file.fileId,
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
 */
function formatFolder(folder: string): string {
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

export { loadJsonFile, loadPdfFile };
