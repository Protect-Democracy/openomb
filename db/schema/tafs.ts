/**
 * TAFS (Treasury Appropriation Fund Symbol) schema.
 */

// Dependencies
import {
  integer,
  pgTable,
  index,
  varchar,
  timestamp,
  boolean,
  text,
  primaryKey
} from 'drizzle-orm/pg-core';
import { files } from './files';

// Table
// {
//   "FileId": 11286701,
//   ...
//   "ScheduleData": [
//     {
//       "BudgetAgencyTitle": "Corps of Engineers--Civil Works",
//       "BudgetBureauTitle": "Corps of Engineers--Civil Works",
//       "AccountTitle": "Inland Waterways Trust Fund",
//       "AllocationAgencyCode": "096",
//       "CgacAgency": "096",
//       "BeginPoa": "",
//       "EndPoa": "",
//       "AvailabilityTypeCode": "X",
//       "CgacAcct": "8861",
//       "AllocationSubacct": "",
//       "Iteration": "1",
//       "TafsIterationId": 12001686,
//       "LineNumber": "1060",
//       "LineSplit": "1",
//       "LineDescription": "Unob Bal: Antic nonexpenditure transfers (net) (Construction Pre-FY18)",
//       "ApprovedAmount": 240723,
//       "FootnoteNumber": ""
//     },
//     ...
// }

/**
 * TAFS schema
 *
 * Note that the data comes in as just schedule lines, but given how the reports
 * actually work, we group them together by the TAFS ID.  This means that this data
 * is structured such that:
 *
 * File has many TAFS
 * TAFS have many Schedules
 *
 * Files have many Footnotes that link to Schedules
 *
 * --
 *
 * TAFS Accounts are a level of data structure that is not found
 * in the JSON files, but can be seen in the data and in the
 * Excel files as well as described in the apportionments
 * documentation.
 *
 * TAFS are a combination of:
 *
 *   - Treasury agency code - CgacAgency
 *   - Treasury account code - CgacAcct
 *   - Allocation account code - AllocationAgencyCode
 *   - Allocation sub-account code - AllocationSubacct
 *   - POA (period of availability) - BeginPoa and EndPoa.
 *     Note that these can both be null ("no year"), one year, or "multi-year"
 *     and are not necessarily the same as fiscal year.
 *     When is is "no year" it is often noted as a "X"
 *
 * TAFS have iterations that apply across a single Fiscal Year.  This means that
 * we should store the Fiscal Year here (as well as in the file) to help make it
 * easier to query.  We make a row for each iteration.
 *
 * There are also Line Numbers and Line Splits that seem to apply to the TAFS
 * and are not really line items, so we pull them out into this table.
 *
 *   - IterNo (Iteration Number) - "line shows the number of times OMB has approved
 *     (apportioned) an apportionment for a given TAFS in a fiscal year."
 *   - RptCat (Reporting Category) - "The RptCat line indicates whether the TAFS uses
 *     Program Reporting Categories (section 120.67).  Use "YES" or "NO", as appropriate,
 *     for the line split column.
 *   - AdjAut (Adjustment Authority?) - "The AdjAut line indicates whether OMB has
 *     approved a footnote in the Application of Budgetary Resources section
 *     (footnote indicator that starts with A) on the apportionment that allows
 *     specific types of adjustments to be made without submitting a reapportionment
 *     request. Use "YES" or "NO", as appropriate, for the line split column. (See section 120.50)
 *
 * @see https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=408
 */
export const tafs = pgTable(
  'tafs',
  {
    // Id.  Utilize the file ID and utilize an a created ID
    // using the relevant fields.
    fileId: varchar('file_id').references(() => files.fileId),
    tafsId: varchar('tafs_id').notNull(),
    iteration: integer('iteration').notNull(),
    // Note that fiscal year comes from the File data
    fiscalYear: integer('fiscal_year').notNull(),

    // Unique TAFS identifier
    tafsTableId: varchar('tafs_table_id').unique(),

    // TAFS fields that make up the ID
    cgacAgency: varchar('cgac_agency').notNull(),
    cgacAcct: varchar('cgac_acct').notNull(),
    allocationAgencyCode: varchar('allocation_agency_code'),
    allocationSubacct: varchar('allocation_subacct'),
    beginPoa: integer('begin_poa'),
    endPoa: integer('end_poa'),

    // Computed account identifier (cgacAgency, cgacAcct, allocationAgencyCode, allocationSubacct)
    accountId: varchar('account_id').notNull(),

    // Descriptive fields
    budgetAgencyTitle: varchar('budget_agency_title'),
    budgetBureauTitle: varchar('budget_bureau_title'),
    accountTitle: varchar('account_title'),

    // Ids for URLs and lookups.
    budgetAgencyTitleId: varchar('budget_agency_title_id'),
    budgetBureauTitleId: varchar('budget_bureau_title_id'),
    // Note that we generally should use the tafsId to align
    // with accounts, but just in case
    accountTitleId: varchar('account_title_id'),

    // This notes when there is no period of availability
    availabilityTypeCode: boolean('availability_type_code'),

    // Reporting category
    rptCat: boolean('rpt_cat'),

    // Adjustment authority
    adjAut: boolean('adj_aut'),

    // Iteration description.  The iteration number comes in
    // as a specific value, but this is the descriptive text
    // from the line item that usually describes when the last
    // iteration was.
    iterationDescription: text('iteration_description'),

    // Unsure about this ID but it seems to be consistent
    // with the iteration number
    tafsIterationId: varchar('tafs_iteration_id'),

    // Meta data
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (tafs) => {
    return {
      // Combined primary key
      primaryKey: primaryKey({
        columns: [tafs.fileId, tafs.tafsId, tafs.iteration, tafs.fiscalYear]
      }),

      // Indexes.  We will likely need to search or group on all of these fields
      cgacAgencyIndex: index('tafs_cgac_agency_index').on(tafs.cgacAgency),
      cgacAcctIndex: index('tafs_cgac_acct_index').on(tafs.cgacAcct),
      allocationAgencyCodeIndex: index('tafs_allocation_agency_code_index').on(
        tafs.allocationAgencyCode
      ),
      allocationSubacctIndex: index('tafs_allocation_subacct_index').on(tafs.allocationSubacct),
      accountIdIndex: index('tafs_account_id_index').on(tafs.accountId),
      budgetAgencyTitleIndex: index('tafs_budget_agency_title_index').on(tafs.budgetAgencyTitle),
      budgetBureauTitleIndex: index('tafs_budget_bureau_title_index').on(tafs.budgetBureauTitle),
      accountTitleIndex: index('tafs_account_title_index').on(tafs.accountTitle),
      iterationDescriptionIndex: index('tafs_iteration_description_index').on(
        tafs.iterationDescription
      ),
      budgetAgencyTitleIdIndex: index('tafs_budget_agency_title_id_index').on(
        tafs.budgetAgencyTitleId
      ),
      budgetBureauTitleIdIndex: index('tafs_budget_bureau_title_id_index').on(
        tafs.budgetBureauTitleId
      ),
      accountTitleIdIndex: index('tafs_account_title_id_index').on(tafs.accountTitleId),
      rptCatIndex: index('tafs_rpt_cat_index').on(tafs.rptCat),
      adjAutIndex: index('tafs_adj_aut_index').on(tafs.adjAut),
      createdAtIndex: index('tafs_created_at_index').on(tafs.createdAt),
      modifiedAtIndex: index('tafs_modified_at_index').on(tafs.modifiedAt)
    };
  }
);

/**
 * From the values in the TAFS record, compute TAFS ID.
 *
 * IMPORTANT: Note that this is  used to populate the `tafs_id`
 * field and should not be altered without a specific need and will
 * likely require a migration and may end up breaking existing links.
 *
 * @param tafsRecord
 * @returns The computed TAFS ID
 */
export const computeTafsId = (tafsRecord: typeof tafs.$inferSelect): string => {
  return [
    tafsRecord.cgacAgency,
    tafsRecord.cgacAcct,
    tafsRecord.allocationAgencyCode,
    tafsRecord.allocationSubacct,
    tafsRecord.beginPoa,
    tafsRecord.endPoa
  ]
    .filter(Boolean)
    .join('-');
};

/**
 * Compute the TAFS Table ID which is easier for referencing.
 *
 * @param tafsRecord
 * @returns The computed TAFS Table ID
 */
export const computeTafsTableId = (tafsRecord: typeof tafs.$inferSelect): string => {
  return [tafsRecord.fileId, tafsRecord.tafsId, tafsRecord.iteration, tafsRecord.fiscalYear]
    .filter(Boolean)
    .join('--');
};

/**
 * From the values in the TAFS record, compute Account ID.
 *
 * IMPORTANT: Note that this is  used to populate the `tafs_id`
 * field and should not be altered without a specific need and will
 * likely require a migration and may end up breaking existing links.
 *
 * @param tafsRecord
 * @returns The computed Account ID
 */
export const computeAccountId = (tafsRecord: typeof tafs.$inferSelect): string => {
  return [
    tafsRecord.cgacAgency,
    tafsRecord.cgacAcct,
    tafsRecord.allocationAgencyCode,
    tafsRecord.allocationSubacct
  ]
    .filter(Boolean)
    .join('-');
};

/**
 * Consistent formatting of the TAFS ID.
 *
 * Examples:
 *  - 12-3510 2023/2024
 *  - 60-60-002-8051 /X
 *  - 69-0130 /2022
 *
 * Note that this not seem consistent in the Excel files and unsure what
 * this should be exactly.
 *
 * Have seen no years with the X in the middle and at the end
 *    - 080-X-1200
 *    - 60-60-002-8051 /X
 *
 * @param tafsRecord
 * @returns Formatted TAFS ID
 */
export const computeTafsFormattedId = (tafsRecord: typeof tafs.$inferSelect): string => {
  const account = [
    tafsRecord.cgacAgency,
    tafsRecord.cgacAcct,
    tafsRecord.allocationAgencyCode,
    tafsRecord.allocationSubacct
  ]
    .filter(Boolean)
    .join('-');

  const years =
    tafs.beginPoa && tafs.endPoa && +tafs.beginPoa !== +tafs.endPoa
      ? `${tafs.beginPoa}/${tafs.endPoa}`
      : tafs.beginPoa
        ? `/${tafs.beginPoa}`
        : '/X';

  return `${account} ${years}`;
};

export type ComputedTafs = {
  tafsFormattedId: string;
} & typeof tafs.$inferSelect;

/**
 * To use with data queried from the database.
 *
 * @param tafsRecord
 * @returns Record with extra computed fields
 */
export const computeTafs = (tafsRecord: typeof tafs.$inferSelect): ComputedTafs => {
  return {
    ...tafsRecord,
    tafsFormattedId: computeTafsFormattedId(tafsRecord)
  };
};
