/**
 * Footnotes schema.
 */

// Dependencies
import {
  pgTable,
  index,
  varchar,
  timestamp,
  primaryKey,
  text,
  integer,
  foreignKey
} from 'drizzle-orm/pg-core';
import { schedule } from './schedules';
import { file } from './files';

// Table
// {
//   "FileId": 11286701,
//   ...
//   "ScheduleData": [
//     ...
//   ],
//   "FootnoteData": [
//     {
//       "FootnoteNumber": "A1",
//       "FootnoteText": "The amount on line 1232 (line split \"SEQ\") is the required sequestration amount assuming the trust fund appropriation is equal to the amount shown on line 1250 and 1201.  If the appropriation is different from the amount shown on line 1250 and 1201, the amount currently reflected on line 1232 (line split \"SEQ\") is automatically apportioned so as to reflect 5.7 percent of the actual 2024 appropriation.  Because of the indefinite nature of this BA, the sequestered amount may not be equal to the amount reflected in the OMB Report to the Congress on the Joint Committee Sequestration for Fiscal Year 2024."
//     }
//   ]
// }
//
// Note that the ideal would be to have a row for each footnote, but since
// a schedule line could have more than one footnote, we layout it so that each
// schedule line with footnotes is a row in the database.
export const footnote = pgTable(
  'footnotes',
  {
    // Id.  Utilize the file ID and footnote Id.
    fileId: varchar('file_id').references(() => file.fileId),
    scheduleIndex: integer('schedule_index'),
    footnoteNumber: varchar('footnote_number').notNull(),

    // Fields from data
    footnoteText: text('footnote_text').notNull(),

    // Custom fields
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (footnotes) => {
    return {
      // Combined primary key
      primaryKey: primaryKey({
        columns: [footnotes.fileId, footnotes.scheduleIndex, footnotes.footnoteNumber]
      }),

      // Foreign key reference to schedule
      scheduleReference: foreignKey({
        columns: [footnotes.fileId, footnotes.scheduleIndex],
        foreignColumns: [schedule.fileId, schedule.scheduleIndex]
      }),

      // Indexes.
      fileFootnoteIndex: index('file_footnote_index').on(footnotes.fileId, footnotes.footnoteNumber)
      // TODO: It looks like Drizzle doesn't support full-text/GIN indexes
      // which is what is appropriate here.
      // https://github.com/drizzle-team/drizzle-orm/issues/247
      //footnoteText: index('footnote_text_index').on(footnotes.footnoteText)
    };
  }
);
