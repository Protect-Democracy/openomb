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
import { relations } from 'drizzle-orm';
import { lines } from './lines';
import { files } from './files';

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

/**
 * Footnote schema.
 *
 * Footnotes come in per file, and schedule lines reference footnotes.  That means
 * that footnotes can be shared across the file.
 *
 * We structure the data so that there is a row for each footnote per schedule line.
 *
 * This means that you can get all the footnote for a specific file if you do
 * a SELECT DISTINCT leaving out the schedule_index column.
 *
 * This also means that you can get the footnotes for a specific schedule line
 * by knowing the line index and file Id.
 *
 * This does imply that you do not have to know the TAFS ID in order to get the
 * footnotes.
 *
 * A more normalized way to do this would be two tables, one with a unique footnote
 * per file, then another table that associates lines to footnotes, but that seems
 * like too much for now.
 */
export const footnotes = pgTable(
  'footnotes',
  {
    // Id.  Utilize the file ID and footnote Id.
    fileId: varchar('file_id').references(() => files.fileId),
    lineIndex: integer('line_index'),
    footnoteNumber: varchar('footnote_number').notNull(),

    // Fields from data
    footnoteText: text('footnote_text').notNull(),

    // Meta
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (footnotes) => {
    return {
      // Combined primary key
      primaryKey: primaryKey({
        columns: [footnotes.fileId, footnotes.lineIndex, footnotes.footnoteNumber]
      }),

      // Multi-column foreign key reference to schedule
      scheduleReference: foreignKey({
        columns: [footnotes.fileId, footnotes.lineIndex],
        foreignColumns: [lines.fileId, lines.lineIndex]
      }),

      // Indexes.
      fileFootnoteIndex: index('fn_file_footnote_index').on(
        footnotes.fileId,
        footnotes.footnoteNumber
      )
      // TODO: It looks like Drizzle doesn't support full-text/GIN indexes
      // which is what is appropriate here.
      // https://github.com/drizzle-team/drizzle-orm/issues/247
      //footnoteText: index('footnote_text_index').on(footnotes.footnoteText)
    };
  }
);

export const footnotesRelations = relations(footnotes, ({ one }) => ({
  file: one(files, {
    fields: [footnotes.fileId],
    references: [files.fileId],
  }),
  line: one(lines, {
    fields: [footnotes.fileId, footnotes.lineIndex],
    references: [lines.fileId, lines.lineIndex],
  }),
}));
