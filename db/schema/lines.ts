/**
 * Lines schema.
 */

// Dependencies
import {
  integer,
  pgTable,
  index,
  bigint,
  varchar,
  timestamp,
  primaryKey,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { files } from './files';
import { tafs } from './tafs';
import { footnotes } from './footnotes';
import { lineTypes } from './line-types';

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
//
// See footnotes.ts for the how footnote data is stored.

/**
 * Schedule lines schema.
 *
 * Note that the data comes in as just schedule lines, but given how the reports
 * actually work, we group them together by the TAFS ID.  This means that this data
 * is structured such that:
 *
 * File has many TAFS
 * TAFS have many Lines
 *
 * Files have many Footnotes that link to Lines
 */
export const lines = pgTable(
  'lines',
  {
    // Id.  Utilize the File ID, TAFS ID, and the index of the data that comes
    // in; this seems appropriate given the data structure and it
    // is a spreadsheet report.  In theory the File ID, TAFS ID, and
    // line number and line split should be unique, but not 100% sure
    // about this, so defaulting to the index for now.
    //
    // Note that the schedule data from the "api" does not necessarily
    // come in the order that is expected.
    tafsTableId: varchar('tafs_table_id').references(() => tafs.tafsTableId),
    lineIndex: integer('line_index').default(0),

    // Fields from data
    lineNumber: varchar('line_number'),
    lineSplit: varchar('line_split'),
    lineDescription: varchar('line_description'),
    approvedAmount: bigint('approved_amount', { mode: 'number' }),

    // For reference, but not needed for primary key
    fileId: varchar('file_id').references(() => files.fileId),

    // Fields that are stored in the TAFS table
    // budgetAgencyTitle: varchar('budget_agency_title'),
    // budgetBureauTitle: varchar('budget_bureau_title'),
    // accountTitle: varchar('account_title'),
    // cgacAgency: varchar('cgac_agency'),
    // cgacAcct: varchar('cgac_acct'),
    // allocationAgencyCode: varchar('allocation_agency_code'),
    // allocationSubacct: varchar('allocation_subacct'),
    // iteration: integer('iteration'),
    // tafsIterationId: varchar('tafs_iteration_id'),
    // beginPoa: integer('begin_poa'),
    // endPoa: integer('end_poa'),
    // availabilityTypeCode: varchar('availability_type_code'),

    // Line type defined by the line number, which is more of an ID, though
    // as a number has some help in sorting.
    // TODO: Change this to lineTypeId
    lineTypeId: varchar('line_type_id').references(() => lineTypes.lineTypeId),

    // Meta
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (lines) => {
    return {
      // Combined primary key
      primaryKey: primaryKey({
        columns: [tafs.tafsTableId, lines.lineIndex]
      }),

      // For foreign key reference we need a unique on these columns even
      // though they are implied from the primary key
      fileIdLineIndexUnique: unique().on(lines.fileId, lines.lineIndex),

      // Indexes.  We will likely need to search or group on all of these fields
      lineNumberIndex: index('line_line_number_index').on(lines.lineNumber),
      lineSplitIndex: index('line_line_split_index').on(lines.lineSplit),
      lineDescriptionIndex: index('line_line_description_index').on(lines.lineDescription),
      approvedAmountIndex: index('line_approved_amount_index').on(lines.approvedAmount)
    };
  }
);

/**
 * ??
 */
export const linesRelations = relations(lines, ({ one, many }) => ({
  file: one(files, {
    fields: [lines.fileId],
    references: [files.fileId]
  }),
  tafs: one(tafs, {
    fields: [lines.tafsTableId],
    references: [tafs.tafsTableId]
  }),
  footnotes: many(footnotes)
}));

/**
 * Export some types
 */
export type linesSelect = typeof lines.$inferSelect;
export type linesInsert = typeof lines.$inferInsert;
