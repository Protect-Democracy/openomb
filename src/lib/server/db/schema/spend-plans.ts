/**
 * Files schema.
 */

// Dependencies
import { integer, pgTable, index, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Table
// {
//   "FileId": pdf-#,
//   "FileName": "FY 2025 DHS FLETC OS Spend Plan.pdf",
//   "FiscalYear": "2024",
//   "Folder": "Corps of Engineers--Civil Works",
//   "ApproverTitle": "Deputy Associate Director for Energy, Science and Water Programs",
//   "FundsProvidedBy": "Funds Provided by Public Law N/A Carryover",
// ...
// }
export const spendPlans = pgTable(
  'spend_plans',
  {
    // Fields from data
    fileId: varchar('file_id').primaryKey(),
    fileName: varchar('file_name'),
    folder: varchar('folder'),
    folderId: varchar('folder_id'),

    // Descriptive fields
    fiscalYear: integer('fiscal_year'),
    budgetAgencyTitle: varchar('budget_agency_title'),
    budgetBureauTitle: varchar('budget_bureau_title'),
    budgetAgencyTitleId: varchar('budget_agency_title_id'),
    budgetBureauTitleId: varchar('budget_bureau_title_id'),

    // Meta data
    excelUrl: varchar('excel_url'),
    pdfUrl: varchar('pdf_url'),
    sourceUrl: varchar('source_url').notNull(),
    sourceData: text('source_data'),
    sourceText: text('source_text'),
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow(),
    removed: boolean('removed').default(false)
  },
  (spendPlans) => {
    // Indexes.  We will likely need to search or group on all of these fields
    return {
      fileNameIndex: index('spend_plan_file_name_index').on(spendPlans.fileName),
      folderIndex: index('spend_plan_folder_index').on(spendPlans.folder),
      folderIdIndex: index('spend_plan_folder_id_index').on(spendPlans.folderId),
      fiscalYearIndex: index('spend_plan_fiscal_year_index').on(spendPlans.fiscalYear),
      budgetAgencyTitleIndex: index('spend_plan_budget_agency_title_index').on(
        spendPlans.budgetAgencyTitle
      ),
      budgetBureauTitleIndex: index('spend_plan_budget_bureau_title_index').on(
        spendPlans.budgetBureauTitle
      ),
      budgetAgencyTitleIdIndex: index('spend_plan_budget_agency_title_id_index').on(
        spendPlans.budgetAgencyTitleId
      ),
      budgetBureauTitleIdIndex: index('spend_plan_budget_bureau_title_id_index').on(
        spendPlans.budgetBureauTitleId
      ),
      excelUrlIndex: index('spend_plan_excel_url_index').on(spendPlans.excelUrl),
      pdfUrlIndex: index('spend_plan_pdf_url_index').on(spendPlans.pdfUrl),
      sourceUrlIndex: index('spend_plan_source_url_index').on(spendPlans.sourceUrl),
      removedIndex: index('spend_plan_removed_index').on(spendPlans.removed),
      createdAtIndex: index('spend_plan_created_at_index').on(spendPlans.createdAt),
      modifiedAtIndex: index('spend_plan_modified_at_index').on(spendPlans.modifiedAt),
      sourceTextIndex: index('spend_plan_source_text_index').using(
        'gin',
        sql`source_text gin_trgm_ops`
      )
    };
  }
);

/**
 * Export some types
 */
export type spendPlansSelect = typeof spendPlans.$inferSelect;
export type spendPlansInsert = typeof spendPlans.$inferInsert;
