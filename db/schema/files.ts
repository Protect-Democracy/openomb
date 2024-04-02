/**
 * Files schema.
 */

// Dependencies
import { integer, pgTable, index, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

// Table
// {
//   "FileId": 11286701,
//   "FileName": "FY2024_Agency=COE_Bureau=COE_TAFS=096-X-8217_Iteration=1_2023-08-23-10.30",
//   "FiscalYear": "2024",
//   "ApprovalTimestamp": "2023-08-23-10.30.20.100237",
//   "Folder": "Corps of Engineers--Civil Works",
//   "ApproverTitle": "Deputy Associate Director for Energy, Science and Water Programs",
//   "FundsProvidedBy": "Funds Provided by Public Law N/A Carryover",
// ...
// }
export const files = pgTable(
  'files',
  {
    // Fields from data
    fileId: varchar('file_id').primaryKey(),
    fileName: varchar('file_name'),
    fiscalYear: integer('fiscal_year'),
    approvalTimestamp: timestamp('approval_timestamp'),
    folder: varchar('folder'),
    approverTitle: varchar('approver_title'),
    fundsProvidedBy: varchar('funds_provided_by'),

    // Parsed value
    fundsProvidedByParsed: varchar('funds_provided_by_parsed'),

    // Meta data
    excelUrl: varchar('excel_url'),
    pdfUrl: varchar('pdf_url'),
    sourceUrl: varchar('source_url').notNull(),
    sourceData: text('source_data'),
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow(),
    removed: boolean('removed').default(false)
  },
  (files) => {
    // Indexes.  We will likely need to search or group on all of these fields
    return {
      fileNameIndex: index('file_file_name_index').on(files.fileName),
      fiscalYearIndex: index('file_fiscal_year_index').on(files.fiscalYear),
      approvalTimestampIndex: index('file_approval_timestamp_index').on(files.approvalTimestamp),
      folderIndex: index('file_folder_index').on(files.folder),
      approverTitleIndex: index('file_approver_title_index').on(files.approverTitle),
      fundsProvidedByIndex: index('file_funds_provided_by_index').on(files.fundsProvidedBy),
      fundsProvidedByParsedIndex: index('file_funds_provided_by_parsed_index').on(
        files.fundsProvidedByParsed
      ),
      removedIndex: index('file_removed_index').on(files.removed),
      createdAtIndex: index('file_created_at_index').on(files.createdAt),
      modifiedAtIndex: index('file_modified_at_index').on(files.modifiedAt)
    };
  }
);

/**
 * Compute parsed funds value.
 *
 * "The header must provide the fiscal year for the apportionment and a public law (if no public law is available
 * right after the enactment of the bill, the H.R. number is acceptable). The public law reference may be
 * descriptive if there are multiple public laws covered by the apportionment or if the annual appropriations
 * act is not enacted.
 *
 * Some examples are:
 *  • Funds provided by Public Law N/A – Carryover
 *  • Funds provided by Public Law N/A – Multiple "
 *
 * In reality, this is fairly messy, but we can remove the "Funds provided by"
 *
 */
export const computeFundsProvidedByParsed = (
  filesRecord: typeof files.$inferSelect
): string | null => {
  return filesRecord.fundsProvidedBy === null
    ? null
    : (filesRecord.fundsProvidedBy || '').replace(/funds\s+provided\s+by\s+/i, '').trim();
};
