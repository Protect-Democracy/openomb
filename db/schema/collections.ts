/**
 * Meta data about file collection runs.
 */

// Dependencies
import { pgTable, index, varchar, timestamp, text } from 'drizzle-orm/pg-core';

// Table
export const collection = pgTable(
  'collections',
  {
    collectionId: varchar('collection_id').primaryKey(),
    start: timestamp('start').notNull().unique(),
    complete: timestamp('complete').unique(),
    url: varchar('url').notNull(),
    status: varchar('status').notNull(),
    notes: text('notes'),
    errors: text('errors'),
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (collections) => {
    // Indexes.
    return {
      startIndex: index('start_index').on(collections.start),
      completeIndex: index('complete_index').on(collections.complete),
      statusIndex: index('status_index').on(collections.status)
    };
  }
);
