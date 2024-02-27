/**
 * Footnotes schema.
 */

// Dependencies
import { pgTable, index, varchar, timestamp, primaryKey, text } from 'drizzle-orm/pg-core';
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
export const footnote = pgTable(
  'footnotes',
  {
    // Id.  Utilize the file ID and footnote Id.
    fileId: varchar('file_id').references(() => file.fileId),
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
      primaryKey: primaryKey({ columns: [footnotes.fileId, footnotes.footnoteNumber] }),

      // Indexes.  We will likely need to search or group on all of these fields
      footnoteText: index('footnote_text_index').on(footnotes.footnoteText)
    };
  }
);
