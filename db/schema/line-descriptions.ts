/**
 * Line description schema.
 */

// Dependencies
import { pgTable, timestamp, varchar, index } from 'drizzle-orm/pg-core';
import { lineTypes } from './line-types';

// Table schema
export const lineDescriptions = pgTable(
  'line_descriptions',
  {
    // Not all line numbers are actual numbers, and it's an identifier
    lineNumber: varchar('line_number').primaryKey(),
    lineTypeId: varchar('line_type_id')
      .notNull()
      .references(() => lineTypes.lineTypeId),
    description: varchar('description').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (lineDescriptions) => {
    return {
      // Indexes.  We will likely need to search or group on all of these fields
      lineDescription: index('line_description_index').on(lineDescriptions.description)
    };
  }
);

// Types for select/insert operations
export type lineDescriptionsSelect = typeof lineDescriptions.$inferSelect;
export type lineDescriptionsInsert = typeof lineDescriptions.$inferInsert;
