/**
 * Schedules schema.
 */

// Dependencies
import {
  integer,
  pgTable,
  index,
  bigint,
  varchar,
  timestamp,
  primaryKey
} from 'drizzle-orm/pg-core';
import { file } from './files';

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
export const schedule = pgTable(
  'schedules',
  {
    // Id.  Utilize the file ID and the index of the data that comes
    // in; this seems appropriate given the data structure and it
    // is a spreadsheet report.
    fileId: varchar('file_id').references(() => file.fileId),
    scheduleIndex: integer('schedule_index').default(0),

    // Fields from data
    budgetAgencyTitle: varchar('budget_agency_title'),
    budgetBureauTitle: varchar('budget_bureau_title'),
    accountTitle: varchar('account_title'),
    allocationAgencyCode: varchar('allocation_agency_code'),
    cgacAgency: varchar('cgac_agency'),
    beginPoa: integer('begin_poa'),
    endPoa: integer('end_poa'),
    availabilityTypeCode: varchar('availability_type_code'),
    cgacAcct: varchar('cgac_acct'),
    allocationSubacct: varchar('allocation_subacct'),
    iteration: integer('iteration'),
    tafsIterationId: varchar('tafs_iteration_id'),
    lineNumber: varchar('line_number'),
    lineSplit: varchar('line_split'),
    lineDescription: varchar('line_description'),
    approvedAmount: bigint('approved_amount', { mode: 'number' }),

    // Custom fields
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (schedules) => {
    return {
      // Combined primary key
      primaryKey: primaryKey({ columns: [schedules.fileId, schedules.scheduleIndex] }),

      // Indexes.  We will likely need to search or group on all of these fields
      budgetAgencyTitleIndex: index('budget_agency_title_index').on(schedules.budgetAgencyTitle),
      budgetBureauTitleIndex: index('budget_bureau_title_index').on(schedules.budgetBureauTitle),
      accountTitleIndex: index('account_title_index').on(schedules.accountTitle),
      allocationAgencyCodeIndex: index('allocation_agency_code_index').on(
        schedules.allocationAgencyCode
      ),
      cgacAgencyIndex: index('cgac_agency_index').on(schedules.cgacAgency),
      apporvedAmountIndex: index('approved_amount_index').on(schedules.approvedAmount)
    };
  }
);
