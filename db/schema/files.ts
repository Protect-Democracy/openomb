/**
 * Files schema.
 */

// Dependencies
import { integer, pgTable, index, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

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
export const file = pgTable(
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

    // Custom fields
    excelUrl: varchar('excel_url'),
    pdfUrl: varchar('pdf_url'),
    sourceUrl: varchar('source_url').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow(),
    removed: boolean('removed').default(false)
  },
  (files) => {
    // Indexes.  We will likely need to search or group on all of these fields
    return {
      fileNameIndex: index('file_name_index').on(files.fileName),
      fiscalYearIndex: index('fiscal_year_index').on(files.fiscalYear),
      approvalTimestampIndex: index('approval_timestamp_index').on(files.approvalTimestamp),
      folderIndex: index('folder_index').on(files.folder),
      approverTitleIndex: index('approver_title_index').on(files.approverTitle),
      fundsProvidedByIndex: index('funds_provided_by_index').on(files.fundsProvidedBy),
      removedIndex: index('removed_index').on(files.removed)
    };
  }
);
