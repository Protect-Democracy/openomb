/**
 * Functions for transforming and loading a file into the database.
 */

// Dependencies
import { request, urlExists } from './request';
import { file } from '../../db/schema/files';
import { parseIntegerFromString, parseTimestampFromString } from './utilities';
import { db } from '../../db/connection';

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

/**
 * Load an apportionment file into the database.
 */
async function loadFile(jsonUrl: string): Promise<void> {
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
  console.log(expectedExcelUrl);
  const hasExcelUrl = await urlExists(expectedExcelUrl, { expectedType: 'blob' });

  // Check file data
  if (!sourceData.FileId) {
    throw new Error(`FileId is missing | URL: ${jsonUrl}`);
  }

  // Create file record
  const fileRecord = {
    fileId: sourceData.FileId.toString(),
    fileName: sourceData.FileName,
    fiscalYear: parseIntegerFromString(sourceData.FiscalYear),
    approvalTimestamp: parseTimestampFromString(sourceData.ApprovalTimestamp),
    folder: sourceData.Folder,
    approverTitle: sourceData.ApproverTitle,
    fundsProvidedBy: sourceData.FundsProvidedBy,
    excelUrl: hasExcelUrl ? expectedExcelUrl : null,
    sourceUrl: jsonUrl,
    createdAt: new Date(),
    modifiedAt: new Date(),
    removed: false
  };

  console.log(fileRecord);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  console.log((({ createdAt, ...o }) => o)(fileRecord));

  // Upsert file
  const savedFileRecord = await db
    .insert(file)
    .values(fileRecord)
    .onConflictDoUpdate({
      target: file.fileId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: (({ createdAt, ...o }) => o)(fileRecord)
    })
    .returning();

  console.log(savedFileRecord);
}

/**
 * Determine Excel file url from JSON file.
 */
function excelUrl(jsonUrl: string): string {
  return jsonUrl.replace(/\/JSON\//, '/Excel/').replace(/\.json$/, '.xlsx');
}

export { loadFile };
